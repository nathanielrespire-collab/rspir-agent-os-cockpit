#!/usr/bin/env node
// tools/watchdog.mjs — chien de garde 100% déterministe, zéro LLM.
//
// Gardes évaluées dans l'ordre; sortie au premier qui s'applique. Chaque décision est
// loggée en une ligne datée sur stdout ET dans $GITHUB_STEP_SUMMARY (si présent).
// DRY_RUN=1: logge la décision, n'exécute AUCUN dispatch/commit/issue.
//
// L'API GitHub n'expose pas les inputs d'un workflow_dispatch une fois le run lancé —
// impossible de relire "quel attempt" un run visait depuis /actions/runs/{id}. Le watchdog
// dérive donc l'attempt attendu des verdicts JSON signés postés en commentaire de PR
// (chaque verdict gates/review porte son propre champ "attempt"), jamais des logs de run.

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const DRY = process.env.DRY_RUN === "1";
const MAX_ATTEMPTS = 3;
const MAX_RELAUNCH = 3;

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}
function shJson(cmd) {
  return JSON.parse(sh(cmd));
}

const REPO =
  process.env.GITHUB_REPOSITORY ||
  sh(`gh repo view --json nameWithOwner --jq .nameWithOwner`).trim();

const summaryLines = [];
function log(line) {
  const stamped = `${new Date().toISOString()} ${line}`;
  summaryLines.push(stamped);
  console.log(stamped);
}
function flushSummary() {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file) return;
  writeFileSync(file, summaryLines.map((l) => `- ${l}`).join("\n") + "\n", { flag: "a" });
}
function decide(reason) {
  log(`DÉCISION: ${reason}`);
  flushSummary();
  process.exit(0);
}

function workflowState(filename) {
  const list = shJson(`gh api repos/${REPO}/actions/workflows --paginate`);
  const wf = list.workflows.find((w) => w.path === `.github/workflows/${filename}`);
  return wf ? wf.state : "missing";
}

function runsFor(workflow) {
  const runs = shJson(
    `gh run list --workflow=${workflow} --json status,conclusion,createdAt,databaseId,url --limit 20`,
  );
  return runs.map((r) => ({ ...r, workflow }));
}

function fetchVerdicts(prNumber) {
  const comments = shJson(
    `gh pr view ${prNumber} --json comments --jq "[.comments[] | {body: .body, createdAt: .createdAt}]"`,
  );
  const gates = [];
  const reviews = [];
  for (const c of comments) {
    const m = c.body.match(/```json\r?\n([\s\S]*?)\r?\n```/);
    if (!m) continue;
    let obj;
    try {
      obj = JSON.parse(m[1]);
    } catch {
      continue;
    }
    if (c.body.startsWith("### GATES")) gates.push({ ...obj, createdAt: c.createdAt });
    else if (c.body.startsWith("### REVIEW")) reviews.push({ ...obj, createdAt: c.createdAt });
  }
  gates.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return { gates, reviews };
}

function findPR(unitId) {
  const prs = shJson(
    `gh pr list --head unit/${unitId} --state all --json number,state,mergedAt,url,createdAt --limit 5`,
  );
  // le plus récent d'abord (pipeline single-writer: au plus une PR active par unité)
  prs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return prs[0];
}

function latestCommitDate(branch) {
  try {
    const commits = shJson(
      `gh api "repos/${REPO}/commits?sha=${encodeURIComponent(branch)}&per_page=1"`,
    );
    return commits[0]?.commit?.committer?.date || null;
  } catch {
    return null;
  }
}

function dispatchUnit(unitId, attempt) {
  const cmd = `gh workflow run unit-pipeline.yml -f unit_id="${unitId}" -f attempt="${attempt}"`;
  if (DRY) {
    log(`[DRY_RUN] ${cmd}`);
    return;
  }
  sh(cmd);
  log(`dispatch: unit-pipeline attempt ${attempt} pour ${unitId}`);
}

function dispatchReview(unitId, prNumber, attempt) {
  const cmd = `gh workflow run review-pipeline.yml -f unit_id="${unitId}" -f pr="${prNumber}" -f attempt="${attempt}"`;
  if (DRY) {
    log(`[DRY_RUN] ${cmd}`);
    return;
  }
  sh(cmd);
  log(`dispatch: review-pipeline attempt ${attempt} pour ${unitId} PR#${prNumber}`);
}

function escalate(unitId, attempt, reason, runId) {
  const cmd = `node tools/queue.mjs escalate "${unitId}" "${attempt}" "${reason}" "${runId || ""}"`;
  if (DRY) {
    log(`[DRY_RUN] ${cmd}`);
    return;
  }
  sh(cmd);
  log(`escalade créée pour ${unitId} (attempt ${attempt}): ${reason}`);
}

function handleMergedNotUpdated(unit, pr) {
  log(`PR #${pr.number} mergée pour ${unit.id} mais .build/queue.json pas à jour — rattrapage.`);
  if (DRY) {
    log(`[DRY_RUN] queue.mjs done "${unit.id}" + commit + push + dispatch suivante`);
    return;
  }
  sh(`git pull origin main`);
  sh(`node tools/queue.mjs done "${unit.id}"`);
  sh(`git config user.name "watchdog-bot"`);
  sh(`git config user.email "actions@github.com"`);
  sh(`git commit -am "chore(queue): ${unit.id} done (rattrapage watchdog)"`);
  sh(`git push origin main`);
  const next = sh(`node tools/queue.mjs next`).trim();
  if (next) {
    dispatchUnit(next, "1");
  } else {
    sh(
      `gh issue create --title "File de build terminée" --body "Toutes les unités sont done. Prototype complet — voir les PRs mergées et leurs preuves." || true`,
    );
    log("file de build terminée — issue de clôture créée.");
  }
}

function openStallIssue(unit, pending, context) {
  const dedup = shJson(
    `gh issue list --label watchdog-stall --state open --json number,title`,
  );
  if (dedup.length > 0) {
    log(
      `disjoncteur: issue de stall déjà ouverte (#${dedup.map((i) => i.number).join(", #")}) — pas de doublon.`,
    );
    return;
  }
  try {
    sh(
      `gh label create watchdog-stall --color 5319E7 --description "Watchdog: relances épuisées sans progrès" 2>/dev/null || true`,
    );
  } catch {
    /* label déjà existant */
  }
  const body = [
    `## watchdog: stall persistant — ${unit.id}`,
    "",
    `Le watchdog a détecté ${MAX_RELAUNCH} relances de \`${pending.type}\` attempt ${pending.attempt}`,
    `sans nouveau verdict ni nouveau commit sur \`unit/${unit.id}\` depuis ${context.referenceTime}.`,
    "",
    `Raison du palier atteint: ${pending.why}`,
    "",
    "### Runs concernés",
    ...context.runsAfter.map((r) => `- ${r.url} — ${r.conclusion || r.status}`),
    "",
    "### Quoi faire",
    "1. Lire les derniers commentaires de la PR de l'unité pour le dernier verdict réel.",
    "2. Diagnostiquer pourquoi les relances automatiques n'ont pas progressé (infra, quota, bug).",
    "3. Corriger puis relancer manuellement (Actions → unit-pipeline ou review-pipeline → Run workflow),",
    "   ou donner une consigne `@claude` sur la PR.",
  ].join("\n");
  if (DRY) {
    log(`[DRY_RUN] gh issue create --title "watchdog: stall persistant — ${unit.id}" --label watchdog-stall,escalation`);
    return;
  }
  writeFileSync("/tmp/watchdog-stall.md", body);
  sh(
    `gh issue create --title "watchdog: stall persistant — ${unit.id}" --body-file /tmp/watchdog-stall.md --label watchdog-stall --label escalation`,
  );
  log(`issue "watchdog: stall persistant — ${unit.id}" créée (label escalation — la porte humaine s'arme).`);
}

function analyzePending(lastGate, lastReview) {
  if (lastReview && lastReview.verdict === "CHANGES") {
    const nextAttempt = lastReview.attempt + 1;
    return nextAttempt <= MAX_ATTEMPTS
      ? {
          type: "unit",
          attempt: nextAttempt,
          why: `review CHANGES à l'attempt ${lastReview.attempt} (route morte si aucun run n'a suivi)`,
        }
      : {
          type: "escalate",
          attempt: lastReview.attempt,
          why: `review CHANGES après ${lastReview.attempt} tentatives`,
        };
  }
  if (lastGate && lastGate.result === "fail" && (!lastReview || lastReview.attempt < lastGate.attempt)) {
    const nextAttempt = lastGate.attempt + 1;
    return nextAttempt <= MAX_ATTEMPTS
      ? {
          type: "unit",
          attempt: nextAttempt,
          why: `gates fail à l'attempt ${lastGate.attempt} (route morte si aucun run n'a suivi)`,
        }
      : {
          type: "escalate",
          attempt: lastGate.attempt,
          why: `gates fail après ${lastGate.attempt} tentatives`,
        };
  }
  if (lastGate && lastGate.result === "pass" && (!lastReview || lastReview.attempt < lastGate.attempt)) {
    return {
      type: "review",
      attempt: lastGate.attempt,
      why: `gates pass à l'attempt ${lastGate.attempt}, review jamais dispatchée`,
    };
  }
  if (!lastGate && !lastReview) {
    return { type: "unit", attempt: 1, why: "PR ouverte sans aucun verdict" };
  }
  return null; // ex: dernier verdict = APPROVE mais PR encore ouverte — hors table, on ne touche pas
}

function handleOpenPR(unit, pr) {
  const { gates, reviews } = fetchVerdicts(pr.number);
  const lastGate = gates.at(-1) || null;
  const lastReview = reviews.at(-1) || null;
  const pending = analyzePending(lastGate, lastReview);

  if (!pending) {
    log(
      `PR #${pr.number} ouverte, dernier verdict inattendu (review=${lastReview?.verdict}, gates=${lastGate?.result}) hors table d'états — aucune action, laisser un humain regarder.`,
    );
    return;
  }

  if (pending.type === "escalate") {
    escalate(unit.id, pending.attempt, pending.why, "");
    return;
  }

  const relevantWorkflow = pending.type === "review" ? "review-pipeline.yml" : "unit-pipeline.yml";
  const referenceTime = lastReview?.createdAt || lastGate?.createdAt || pr.createdAt;
  const allRuns = [...runsFor("unit-pipeline.yml"), ...runsFor("review-pipeline.yml")].filter(
    (r) => r.status === "completed",
  );
  const runsAfter = allRuns
    .filter((r) => r.workflow === relevantWorkflow && new Date(r.createdAt) > new Date(referenceTime))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const failedRunsAfter = runsAfter.filter((r) => r.conclusion !== "success");
  const commitDate = latestCommitDate(`unit/${unit.id}`);
  const hasProgress = commitDate && new Date(commitDate) > new Date(referenceTime);

  log(
    `PR #${pr.number}: pending=${pending.type}(attempt ${pending.attempt}) — ${pending.why}. ` +
      `${runsAfter.length} run(s) de ${relevantWorkflow} depuis ${referenceTime}, ${failedRunsAfter.length} en échec, progrès=${hasProgress}.`,
  );

  if (failedRunsAfter.length >= MAX_RELAUNCH && !hasProgress) {
    openStallIssue(unit, pending, { referenceTime, runsAfter });
    return;
  }

  const latest = runsAfter.at(-1);
  if (latest && latest.conclusion === "success") {
    log(
      `dernier run de ${relevantWorkflow} réussi mais verdict pas encore visible en commentaire — pas d'action, prochaine passe résoudra.`,
    );
    return;
  }

  // runsAfter vide (rien n'a jamais été dispatché pour ce pending) OU dernier run en échec
  // sans nouveau verdict depuis referenceTime: dans les deux cas on (re)dispatche EXACTEMENT
  // pending.attempt — un essai ne se brûle que sur un verdict réel.
  if (pending.type === "review") dispatchReview(unit.id, pr.number, pending.attempt);
  else dispatchUnit(unit.id, pending.attempt);
}

function main() {
  if (existsSync(".build/watchdog.off")) {
    decide("kill switch .build/watchdog.off présent — un humain opère, watchdog inactif.");
  }

  const unitState = workflowState("unit-pipeline.yml");
  const reviewState = workflowState("review-pipeline.yml");
  if (unitState !== "active" || reviewState !== "active") {
    decide(
      `maintenance: unit-pipeline=${unitState} review-pipeline=${reviewState} — un humain opère, watchdog ne touche à rien.`,
    );
  }

  const escalations = shJson(`gh issue list --label escalation --state open --json number,title`);
  if (escalations.length > 0) {
    decide(
      `porte humaine: ${escalations.length} issue(s) escalation ouverte(s) (#${escalations
        .map((e) => e.number)
        .join(", #")}) — attente humaine.`,
    );
  }

  const inFlight = [...runsFor("unit-pipeline.yml"), ...runsFor("review-pipeline.yml")].filter(
    (r) => r.status === "in_progress" || r.status === "queued",
  );
  if (inFlight.length > 0) {
    decide(`en vol: ${inFlight.length} run(s) actif(s) (${inFlight.map((r) => r.url).join(", ")}) — rien à faire.`);
  }

  const queue = JSON.parse(readFileSync(".build/queue.json", "utf8"));
  if (queue.units.every((u) => u.status === "done")) {
    decide("file vide: toutes les unités sont done.");
  }

  const byId = Object.fromEntries(queue.units.map((u) => [u.id, u]));
  const depsDone = (u) => (u.deps || []).every((d) => byId[d]?.status === "done");
  const current = queue.units.find((u) => u.status === "todo" && depsDone(u));
  if (!current) {
    decide("aucune unité admissible (todo avec dépendances done) — file bloquée par les dépendances, hors scope watchdog.");
  }

  const pr = findPR(current.id);

  if (!pr) {
    log(`${current.id}: aucune PR trouvée — rien n'existe.`);
    dispatchUnit(current.id, "1");
    flushSummary();
    return;
  }

  if (pr.state === "MERGED" && current.status !== "done") {
    handleMergedNotUpdated(current, pr);
    flushSummary();
    return;
  }

  if (pr.state === "OPEN") {
    handleOpenPR(current, pr);
    flushSummary();
    return;
  }

  log(`${current.id}: PR #${pr.number} état ${pr.state} inattendu (ni OPEN ni MERGED) — aucune action.`);
  flushSummary();
}

main();

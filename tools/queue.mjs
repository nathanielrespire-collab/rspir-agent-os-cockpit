#!/usr/bin/env node
// File d'unités — zéro dépendance. Commandes: validate <id> <attempt> | done <id> | next | escalate <id> <attempt> <raison> <run_id>
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const Q = ".build/queue.json";
const load = () => JSON.parse(readFileSync(Q, "utf8"));
const save = (q) => writeFileSync(Q, JSON.stringify(q, null, 2) + "\n");
const sh = (c) => execSync(c, { stdio: ["ignore", "inherit", "inherit"] });

const [, , cmd, id, attempt, reason, runId] = process.argv;
const q = load();
const byId = Object.fromEntries(q.units.map((u) => [u.id, u]));
const depsDone = (u) => (u.deps || []).every((d) => byId[d]?.status === "done");

if (cmd === "validate") {
  const u = byId[id];
  const a = Number(attempt || 1);
  if (!u) {
    console.error(`Unité inconnue: ${id}`);
    process.exit(1);
  }
  if (u.status === "done") {
    console.error(`${id} déjà done`);
    process.exit(1);
  }
  if (!depsDone(u)) {
    console.error(`${id}: dépendances non terminées`);
    process.exit(1);
  }
  if (!(a >= 1 && a <= 3)) {
    console.error(`attempt invalide: ${attempt}`);
    process.exit(1);
  }
  const model = a >= 3 ? "claude-opus-4-8" : "claude-sonnet-4-6";
  console.log(`contract=${u.contract}`);
  console.log(`title=${u.title}`);
  console.log(`model=${model}`);
} else if (cmd === "done") {
  const u = byId[id];
  if (!u) process.exit(1);
  u.status = "done";
  save(q);
} else if (cmd === "next") {
  const n = q.units.find((u) => u.status === "todo" && depsDone(u));
  if (n) console.log(n.id);
} else if (cmd === "escalate") {
  const u = byId[id] || { title: "?" };
  try {
    sh(
      `gh label create escalation --color B60205 --description "Décision humaine requise" 2>/dev/null || true`,
    );
  } catch {
    /* label déjà existant */
  }
  const body = [
    `## Escalade — ${id} (${u.title})`,
    "",
    `Tentatives: ${attempt}/3 — la machine s'arrête sur cette unité.`,
    "",
    `Raison: ${reason}`,
    "",
    `Run: ${process.env.GITHUB_SERVER_URL || "https://github.com"}/${process.env.GITHUB_REPOSITORY || ""}/actions/runs/${runId}`,
    "",
    "### Quoi faire",
    "1. Lire le dernier verdict (commentaires de la PR de l'unité).",
    "2. Donner la consigne ici avec `@claude` (il peut exécuter la correction), ou corriger toi-même.",
    "3. Relancer: Actions → unit-pipeline → Run workflow → unit_id ci-dessus, attempt 1.",
  ].join("\n");
  writeFileSync("/tmp/esc.md", body);
  sh(
    `gh issue create --title "ESCALADE ${id}: ${reason.slice(0, 60)}" --body-file /tmp/esc.md --label escalation --assignee ${process.env.GITHUB_REPOSITORY_OWNER || ""} || gh issue create --title "ESCALADE ${id}" --body-file /tmp/esc.md`,
  );
} else {
  console.error("commande inconnue");
  process.exit(1);
}

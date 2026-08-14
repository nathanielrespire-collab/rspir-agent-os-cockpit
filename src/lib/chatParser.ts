import type { Lang } from "./i18n";

export type ParsedCommand =
  | { kind: "navigate"; path: string }
  | { kind: "search"; query: string }
  | { kind: "create_work_item"; title: string; projectRef?: string }
  | { kind: "assign"; workItemRef: string; actorRef: string }
  | { kind: "approve"; approvalRef: string }
  | { kind: "reject"; approvalRef: string }
  | { kind: "create_blocker"; description: string; workItemRef?: string }
  | { kind: "resolve_blocker"; blockerRef: string }
  | { kind: "toggle_feature"; featureRef: string; clientRef: string; enabled: boolean }
  | { kind: "meeting_brief"; meetingRef: string }
  | { kind: "why_blocked"; workItemRef: string }
  | { kind: "what_evidence"; targetRef: string }
  | { kind: "unknown" };

// Route keyword → path (FR + EN variants)
const ROUTE_MAP: Record<string, string> = {
  accueil: "/",
  home: "/",
  travail: "/work",
  work: "/work",
  projets: "/projects",
  projet: "/projects",
  projects: "/projects",
  project: "/projects",
  clients: "/clients",
  client: "/clients",
  équipe: "/team",
  equipe: "/team",
  team: "/team",
  agents: "/agents",
  agent: "/agents",
  approbations: "/approvals",
  approbation: "/approvals",
  approvals: "/approvals",
  approval: "/approvals",
  bloquants: "/blockers",
  bloquant: "/blockers",
  blockers: "/blockers",
  blocker: "/blockers",
  réunions: "/meetings",
  réunion: "/meetings",
  reunions: "/meetings",
  reunion: "/meetings",
  meetings: "/meetings",
  meeting: "/meetings",
  crm: "/crm",
  automatisations: "/automations",
  automatisation: "/automations",
  automations: "/automations",
  automation: "/automations",
  "sites web": "/websites",
  "site web": "/websites",
  sites: "/websites",
  site: "/websites",
  websites: "/websites",
  website: "/websites",
  connaissances: "/knowledge",
  connaissance: "/knowledge",
  knowledge: "/knowledge",
  intégrations: "/integrations",
  intégration: "/integrations",
  integrations: "/integrations",
  integration: "/integrations",
  preuves: "/evidence",
  preuve: "/evidence",
  evidence: "/evidence",
  analytiques: "/analytics",
  analytics: "/analytics",
  paramètres: "/settings",
  parametre: "/settings",
  settings: "/settings",
  fonctionnalités: "/features",
  fonctionnalite: "/features",
  features: "/features",
};

function tryRoute(target: string): string | null {
  const t = target.trim().toLowerCase();
  if (t in ROUTE_MAP) return ROUTE_MAP[t];
  if (t.startsWith("/")) {
    const key = t.slice(1);
    return key in ROUTE_MAP ? ROUTE_MAP[key] : t;
  }
  return null;
}

// Exported for testing
export function parseCommand(input: string, lang: Lang = "fr"): ParsedCommand {
  const raw = input.trim();
  if (!raw) return { kind: "unknown" };
  // lang is currently used only for type safety; patterns cover both FR and EN
  void lang;

  // 1. Navigate — "naviguer vers X", "aller à X", "go to X", "navigate to X"
  const navRe =
    /^(?:naviguer?\s+(?:vers?\s+)?|aller\s+(?:à|a|sur\s+|vers?\s+)?|ouvrir\s+|va\s+(?:sur\s+|à\s+|a\s+)?|navigate\s+(?:to\s+)?|go\s+(?:to\s+)?|open\s+)(.+)$/i;
  const navM = navRe.exec(raw);
  if (navM) {
    const path = tryRoute(navM[1]);
    if (path) return { kind: "navigate", path };
  }

  // 2. Search — "chercher X", "rechercher X", "trouver X", "search X", "find X"
  const searchRe = /^(?:chercher?\s+|rechercher?\s+|trouver\s+|search(?:\s+for)?\s+|find\s+)(.+)$/i;
  const searchM = searchRe.exec(raw);
  if (searchM) {
    return { kind: "search", query: searchM[1].trim() };
  }

  // 3. Create work item
  const createWiRe =
    /^(?:créer?\s+(?:un\s+)?work[\s-]item\s+|nouveau\s+work[\s-]item\s+|ajouter?\s+(?:un\s+)?work[\s-]item\s+|create\s+(?:a\s+)?work[\s-]?item\s+|new\s+work[\s-]?item\s+|add\s+(?:a\s+)?work[\s-]?item\s+)(.+)$/i;
  const createWiM = createWiRe.exec(raw);
  if (createWiM) {
    const rest = createWiM[1].trim();
    const forM = /^(.+?)\s+(?:pour\s+le\s+projet\s+|for\s+project\s+)(.+)$/i.exec(rest);
    if (forM) return { kind: "create_work_item", title: forM[1].trim(), projectRef: forM[2].trim() };
    return { kind: "create_work_item", title: rest };
  }

  // 4. Assign — "assigner X à Y" / "assign X to Y"
  const assignFrM = /^assigner?\s+(.+?)\s+[àa]\s+(.+)$/i.exec(raw);
  if (assignFrM) {
    return { kind: "assign", workItemRef: assignFrM[1].trim(), actorRef: assignFrM[2].trim() };
  }
  const assignEnM = /^assign\s+(.+?)\s+to\s+(.+)$/i.exec(raw);
  if (assignEnM) {
    return { kind: "assign", workItemRef: assignEnM[1].trim(), actorRef: assignEnM[2].trim() };
  }

  // 5. Approve — "approuver X" / "approve X"
  const approveM = /^(?:approuver?\s+|approve\s+)(.+)$/i.exec(raw);
  if (approveM) {
    return { kind: "approve", approvalRef: approveM[1].trim() };
  }

  // 6. Reject — "rejeter X" / "reject X"
  const rejectM = /^(?:rejeter?\s+|reject\s+)(.+)$/i.exec(raw);
  if (rejectM) {
    return { kind: "reject", approvalRef: rejectM[1].trim() };
  }

  // 7. Create blocker — "créer un blocker X [pour Y]" / "create blocker X [for Y]"
  const createBlkRe =
    /^(?:créer?\s+(?:un\s+)?bloquant\s+|créer?\s+(?:un\s+)?blocker?\s+|ajouter?\s+(?:un\s+)?bloquant\s+|create\s+(?:a\s+)?blocker?\s+|add\s+(?:a\s+)?blocker?\s+)(.+)$/i;
  const createBlkM = createBlkRe.exec(raw);
  if (createBlkM) {
    const rest = createBlkM[1].trim();
    const forM = /^(.+?)\s+(?:pour\s+|for\s+)(.+)$/i.exec(rest);
    if (forM)
      return { kind: "create_blocker", description: forM[1].trim(), workItemRef: forM[2].trim() };
    return { kind: "create_blocker", description: rest };
  }

  // 8. Resolve blocker — "résoudre [le] blocker X" / "resolve blocker X"
  const resolveBlkRe =
    /^(?:résoudre?\s+(?:le\s+)?(?:bloquant|blocker?)\s+|lever\s+(?:le\s+)?(?:bloquant|blocker?)\s+|resolve\s+(?:blocker?\s+)?|fix\s+(?:blocker?\s+)?)(.+)$/i;
  const resolveBlkM = resolveBlkRe.exec(raw);
  if (resolveBlkM) {
    return { kind: "resolve_blocker", blockerRef: resolveBlkM[1].trim() };
  }

  // 9. Toggle feature — "(activer|désactiver|toggle|enable|disable) feature X pour client Y"
  const featureRe =
    /^(?:(activer?|désactiver?|desactiver?|toggle|enable|disable)\s+)?(?:(?:la\s+)?(?:feature|fonctionnalit[ée])\s+)(.+?)\s+(?:pour\s+(?:(?:le\s+)?client\s+)?|for\s+(?:client\s+)?)(.+)$/i;
  const featureM = featureRe.exec(raw);
  if (featureM) {
    const verb = (featureM[1] ?? "toggle").toLowerCase();
    const enabled = !/d[ée]sactiver|desactiver|disable/.test(verb);
    return {
      kind: "toggle_feature",
      featureRef: featureM[2].trim(),
      clientRef: featureM[3].trim(),
      enabled,
    };
  }

  // 10. Meeting brief — "préparer (un) brief (pour la réunion) X" / "prepare (meeting) brief X"
  const briefRe =
    /^(?:préparer?\s+(?:un\s+)?brief\s+(?:(?:de\s+|pour\s+)?(?:la\s+)?r[ée]union\s+)?|prepare\s+(?:a\s+)?(?:meeting\s+)?brief\s+(?:for\s+)?(?:(?:the\s+)?meeting\s+)?)(.+)$/i;
  const briefM = briefRe.exec(raw);
  if (briefM) {
    return { kind: "meeting_brief", meetingRef: briefM[1].trim() };
  }

  // 11. Why blocked — "pourquoi X est bloqué" / "why is X blocked"
  const whyBlockedFrM = /^pourquoi\s+(.+?)\s+(?:est[\s-]?bloqué|est\s+bloc)/i.exec(raw);
  if (whyBlockedFrM) {
    return { kind: "why_blocked", workItemRef: whyBlockedFrM[1].trim() };
  }
  const whyBlockedEnM =
    /^(?:why\s+(?:is\s+)?(.+?)\s+blocked|what\s+blocks?\s+(.+))$/i.exec(raw);
  if (whyBlockedEnM) {
    return { kind: "why_blocked", workItemRef: (whyBlockedEnM[1] ?? whyBlockedEnM[2]).trim() };
  }

  // 12. What evidence — "quelle(s) evidence/preuve(s) (prouve(nt)/pour) X"
  const evidenceFrM =
    /^(?:quelle(?:s)?\s+)?(?:evidence|preuves?)\s+(?:prouve(?:nt)?\s+|pour\s+|de\s+)(.+)$/i.exec(
      raw,
    );
  if (evidenceFrM) {
    return { kind: "what_evidence", targetRef: evidenceFrM[1].trim() };
  }
  const evidenceEnM =
    /^(?:(?:what\s+)?(?:evidence|proof)\s+(?:proves?\s+|for\s+|of\s+)(.+)|show\s+evidence\s+(?:for\s+)?(.+))$/i.exec(
      raw,
    );
  if (evidenceEnM) {
    return { kind: "what_evidence", targetRef: (evidenceEnM[1] ?? evidenceEnM[2]).trim() };
  }

  return { kind: "unknown" };
}

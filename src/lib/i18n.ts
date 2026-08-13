export type Lang = "fr" | "en";

const dict = {
  fr: {
    app_title: "RSPIR Agent OS",
    bootstrap_marker: "Amorce du pipeline — en attente de BUILD-000",
    build_000_marker: "BUILD-000 ✓ — Pipeline opérationnel",

    // Navigation
    nav_home: "Accueil",
    nav_work: "Travail",
    nav_projects: "Projets",
    nav_clients: "Clients",
    nav_team: "Équipe",
    nav_agents: "Agents",
    nav_approvals: "Approbations",
    nav_blockers: "Bloquants",
    nav_meetings: "Réunions",
    nav_crm: "CRM",
    nav_automations: "Automatisations",
    nav_websites: "Sites web",
    nav_knowledge: "Connaissance",
    nav_integrations: "Intégrations",
    nav_evidence: "Preuves",
    nav_analytics: "Analytiques",
    nav_agent_builder: "Créateur d'agents",
    nav_settings: "Paramètres",

    // Topbar
    role_label: "Rôle",
    workspace_label: "Espace",
    theme_dark: "Sombre",
    theme_light: "Clair",
    lang_fr: "FR",
    lang_en: "EN",

    // Roles
    role_nathaniel: "Nathaniel",
    role_manny: "Manny",
    role_antoine: "Antoine",
    role_agent: "Agent",

    // Command palette
    cmd_placeholder: "Naviguer vers…",
    cmd_no_results: "Aucun résultat.",
    cmd_label: "Commandes",
    cmd_hint: "Cmd+K",

    // Empty states
    empty_home: "Aucune activité en cours. Le système attend.",
    empty_work: "Aucune tâche. Ajoutez du travail pour démarrer.",
    empty_projects: "Aucun projet actif. Créez un projet pour commencer.",
    empty_clients: "Aucun client. Ajoutez un espace client pour démarrer.",
    empty_team: "Aucun membre d'équipe configuré.",
    empty_agents: "Aucun agent actif. Configurez un agent pour démarrer.",
    empty_approvals: "Aucune approbation en attente.",
    empty_blockers: "Aucun bloquant actif. Le système avance.",
    empty_meetings: "Aucune réunion planifiée.",
    empty_crm: "Aucune donnée CRM. Connectez un fournisseur pour démarrer.",
    empty_automations: "Aucune automatisation configurée.",
    empty_websites: "Aucun site web suivi.",
    empty_knowledge: "Base de connaissance vide.",
    empty_integrations: "Aucune intégration configurée.",
    empty_evidence: "Aucune preuve enregistrée.",
    empty_analytics: "Aucune donnée analytique disponible.",
    empty_agent_builder: "Aucun agent en construction.",
    empty_settings: "Paramètres du système.",

    // Empty action prompts
    action_home: "Consultez le statut des agents et les décisions en attente.",
    action_work: "Créez ou importez des tâches pour les confier aux agents.",
    action_projects: "Regroupez le travail en projets pour suivre la progression.",
    action_clients: "Isolez chaque client dans son propre espace.",
    action_team: "Invitez des collaborateurs et définissez leurs capacités.",
    action_agents: "Configurez des agents pour automatiser le travail récurrent.",
    action_approvals: "Les approbations apparaissent ici quand l'agent attend une décision humaine.",
    action_blockers: "Les bloquants s'affichent ici quand un agent ne peut pas avancer.",
    action_meetings: "Planifiez des réunions et laissez les agents préparer le contexte.",
    action_crm: "Connectez votre CRM pour que les agents accèdent aux données clients.",
    action_automations: "Construisez des automatisations vérifiées et déployez-les.",
    action_websites: "Suivez les déploiements et l'état des sites clients.",
    action_knowledge: "Publiez des faits, décisions et contexte que les agents peuvent consulter.",
    action_integrations: "Connectez les fournisseurs pour activer les capacités des agents.",
    action_evidence: "Toute action externe produit une preuve vérifiable ici.",
    action_analytics: "Visualisez l'activité, les performances et la progression du système.",
    action_agent_builder: "Créez et testez de nouveaux agents avant de les déployer.",
    action_settings: "Configurez le workspace, les politiques et les préférences système.",
  },
  en: {
    app_title: "RSPIR Agent OS",
    bootstrap_marker: "Pipeline bootstrap — waiting for BUILD-000",
    build_000_marker: "BUILD-000 ✓ — Pipeline operational",

    // Navigation
    nav_home: "Home",
    nav_work: "Work",
    nav_projects: "Projects",
    nav_clients: "Clients",
    nav_team: "Team",
    nav_agents: "Agents",
    nav_approvals: "Approvals",
    nav_blockers: "Blockers",
    nav_meetings: "Meetings",
    nav_crm: "CRM",
    nav_automations: "Automations",
    nav_websites: "Websites",
    nav_knowledge: "Knowledge",
    nav_integrations: "Integrations",
    nav_evidence: "Evidence",
    nav_analytics: "Analytics",
    nav_agent_builder: "Agent Builder",
    nav_settings: "Settings",

    // Topbar
    role_label: "Role",
    workspace_label: "Workspace",
    theme_dark: "Dark",
    theme_light: "Light",
    lang_fr: "FR",
    lang_en: "EN",

    // Roles
    role_nathaniel: "Nathaniel",
    role_manny: "Manny",
    role_antoine: "Antoine",
    role_agent: "Agent",

    // Command palette
    cmd_placeholder: "Navigate to…",
    cmd_no_results: "No results.",
    cmd_label: "Commands",
    cmd_hint: "Cmd+K",

    // Empty states
    empty_home: "No activity in progress. System is idle.",
    empty_work: "No tasks. Add work to get started.",
    empty_projects: "No active projects. Create a project to begin.",
    empty_clients: "No clients. Add a client workspace to get started.",
    empty_team: "No team members configured.",
    empty_agents: "No active agents. Configure an agent to get started.",
    empty_approvals: "No pending approvals.",
    empty_blockers: "No active blockers. System is advancing.",
    empty_meetings: "No meetings scheduled.",
    empty_crm: "No CRM data. Connect a provider to get started.",
    empty_automations: "No automations configured.",
    empty_websites: "No websites tracked.",
    empty_knowledge: "Knowledge base is empty.",
    empty_integrations: "No integrations configured.",
    empty_evidence: "No evidence recorded.",
    empty_analytics: "No analytics data available.",
    empty_agent_builder: "No agents in construction.",
    empty_settings: "System settings.",

    // Empty action prompts
    action_home: "Review agent status and pending decisions.",
    action_work: "Create or import tasks to assign to agents.",
    action_projects: "Group work into projects to track progress.",
    action_clients: "Isolate each client in their own workspace.",
    action_team: "Invite collaborators and define their capabilities.",
    action_agents: "Configure agents to automate recurring work.",
    action_approvals: "Approvals appear here when an agent awaits a human decision.",
    action_blockers: "Blockers appear here when an agent cannot proceed.",
    action_meetings: "Schedule meetings and let agents prepare context.",
    action_crm: "Connect your CRM so agents can access client data.",
    action_automations: "Build verified automations and deploy them.",
    action_websites: "Track deployments and client site status.",
    action_knowledge: "Publish facts, decisions, and context agents can consult.",
    action_integrations: "Connect providers to enable agent capabilities.",
    action_evidence: "Every external action produces verifiable evidence here.",
    action_analytics: "Visualize activity, performance, and system progress.",
    action_agent_builder: "Create and test new agents before deploying.",
    action_settings: "Configure the workspace, policies, and system preferences.",
  },
} as const;

export type TKey = keyof (typeof dict)["fr"];

export function t(key: TKey, lang: Lang = "fr"): string {
  return dict[lang][key];
}

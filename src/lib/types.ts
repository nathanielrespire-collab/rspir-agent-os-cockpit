/**
 * RSPIR Agent OS — modèle de données canonique (SPEC §31).
 * Ce fichier est un CONTRAT: le cockpit le consomme via fixtures aujourd'hui,
 * le Core devra servir ce schéma demain. Les providers sont des données, jamais des imports.
 */

export type Id = string;
export type ISODate = string; // ISO 8601

// ---------- Capabilities & policies ----------

export type CapabilityId =
  | "email.read"
  | "email.draft"
  | "email.send"
  | "calendar.read"
  | "calendar.create"
  | "files.read"
  | "files.write"
  | "files.search"
  | "contacts.read"
  | "transcripts.read"
  | "transcripts.search"
  | "meeting.read"
  | "meeting.process"
  | "crm.read"
  | "crm.search"
  | "crm.write"
  | "crm.create_activity"
  | "crm.add_note"
  | "automation.inspect"
  | "automation.build"
  | "automation.edit"
  | "automation.test"
  | "automation.deploy"
  | "automation.run"
  | "website.inspect"
  | "website.build"
  | "website.edit"
  | "website.test"
  | "website.deploy"
  | "website.verify"
  | "knowledge.publish"
  | "source_control.read"
  | "source_control.change_request"
  | "source_control.status"
  | "worker.code"
  | "worker.ops"
  | "worker.research"
  | "worker.review"
  | "notification.internal"
  | "spend_money"
  | "contract_commitment";

export type PolicyRule = "auto" | "approval_required" | "forbidden" | "human_only";

export interface Policy {
  id: Id;
  workspaceId: Id;
  capability: CapabilityId;
  rule: PolicyRule;
  /** Condition lisible (ex: "AUTO pour notes internes; APPROVAL pour deals > 10k$") */
  condition?: { fr: string; en: string };
}

// ---------- Actors ----------

export type ActorType = "human" | "ai_agent" | "service" | "automation";

export type AgentRole =
  | "architect"
  | "code_builder"
  | "ops_worker"
  | "researcher"
  | "reviewer"
  | "security_reviewer"
  | "website_builder"
  | "automation_builder";

export interface Actor {
  id: Id;
  name: string;
  type: ActorType;
  /** Rôle libre pour humains (ex: "owner"), typé pour agents */
  role: AgentRole | string;
  capabilities: CapabilityId[];
  /** Provider qui incarne cet acteur (agents seulement) — donnée, jamais import */
  providerId?: Id;
  availability: "available" | "busy" | "offline";
  workloadPct: number; // 0-100
  costPerHour?: number;
  health?: "ok" | "degraded" | "down";
  lastRunAt?: ISODate;
  successRatePct?: number;
  verificationPassRatePct?: number;
}

// ---------- Providers & integrations ----------

export type ProviderCategory =
  | "email"
  | "calendar"
  | "files"
  | "contacts"
  | "transcripts"
  | "crm"
  | "automation"
  | "website"
  | "knowledge"
  | "source_control"
  | "worker_code"
  | "worker_ops"
  | "reasoning"
  | "notifications";

export type ConnectionState = "mock" | "connected" | "not_configured";

export interface Provider {
  id: Id;
  name: string; // ex: "Fireflies", "Pipedrive" — affiché, jamais codé en dur ailleurs
  category: ProviderCategory;
  capabilities: CapabilityId[];
  state: ConnectionState;
  auth?: "oauth" | "api_key" | "none";
  health?: "ok" | "degraded" | "down";
  lastCheckAt?: ISODate;
}

export interface Integration {
  id: Id;
  workspaceId: Id;
  category: ProviderCategory;
  providerId: Id; // provider actif pour cette catégorie dans ce workspace
}

// ---------- Workspaces & clients ----------

export interface Workspace {
  id: Id;
  name: string; // ex: "RSPIR", "ABC Manufacturing"
  kind: "internal" | "client_install";
  createdAt: ISODate;
}

export interface Client {
  id: Id;
  workspaceId: Id;
  name: string;
  sector?: string;
  contactIds: Id[];
  enabledFeatureIds: Id[];
}

// ---------- Work ----------

export type WorkStatus =
  | "todo"
  | "ready"
  | "claimed"
  | "running"
  | "verification"
  | "a_valider"
  | "blocked"
  | "failed"
  | "done";

export type RuntimeStage =
  | "reconcile"
  | "select"
  | "claim"
  | "context"
  | "policy"
  | "execute"
  | "verify"
  | "update"
  | "continue";

export interface WorkItem {
  id: Id;
  workspaceId: Id;
  clientId?: Id;
  projectId?: Id;
  title: string;
  status: WorkStatus;
  stage?: RuntimeStage;
  priority: "P0" | "P1" | "P2" | "P3";
  /** OWNER = responsable de la complétion */
  ownerActorId: Id;
  /** ASSIGNED = qui exécute maintenant */
  assignedActorId?: Id;
  requiredCapabilities: CapabilityId[];
  dependsOn: Id[];
  blockerId?: Id;
  estimatedMinutes?: number;
  risk: "low" | "medium" | "high";
  externalEffect: boolean;
  acceptanceCriteria: string[];
  artifactIds: Id[];
  evidenceIds: Id[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Project {
  id: Id;
  workspaceId: Id;
  clientId: Id;
  name: string;
  taskCompletionPct: number;
  operationalPct: number;
  transferable: boolean;
  transferableReason?: { fr: string; en: string };
  teamActorIds: Id[];
  status: "active" | "paused" | "delivered";
}

export interface Blocker {
  id: Id;
  workspaceId: Id;
  scope: "local" | "global";
  workItemIds: Id[];
  ownerActorId: Id; // qui doit débloquer
  question: string;
  blockingDependency: string;
  nextVerificationAt?: ISODate;
  defaultDecision?: string;
  escalationAt?: ISODate;
  resolved: boolean;
  createdAt: ISODate;
}

export interface Approval {
  id: Id;
  workspaceId: Id;
  workItemId?: Id;
  title: string;
  whyHuman: string;
  ifApproved: string;
  ifRejected: string;
  evidenceIds: Id[];
  estimatedReviewMinutes: number;
  status: "pending" | "approved" | "rejected";
  decidedByActorId?: Id;
  decidedAt?: ISODate;
}

// ---------- Evidence & executions ----------

export interface Evidence {
  id: Id;
  workspaceId: Id;
  label: string; // ex: "Make scenario ID #91827", "Test webhook PASS"
  kind: "external_id" | "check" | "artifact" | "screenshot" | "log";
  result?: "pass" | "fail";
  url?: string;
  createdAt: ISODate;
}

export interface ExecutionStep {
  stage: "select" | "claim" | "execute" | "verify" | "update";
  summary: string;
  actorId?: Id;
  evidenceIds: Id[];
  at: ISODate;
}

export interface Execution {
  id: Id;
  workspaceId: Id;
  workItemId: Id;
  steps: ExecutionStep[]; // SELECT → CLAIM → EXECUTE → VERIFY → UPDATE
  outcome: "verified" | "rejected" | "in_progress";
}

export interface Event {
  id: Id;
  workspaceId: Id;
  at: ISODate;
  requestedByActorId?: Id;
  executedByActorId?: Id;
  capability?: CapabilityId;
  policyResult?: PolicyRule;
  action: string; // ex: "work.assign", "approval.approve", "provider.swap"
  targetId?: Id;
  result: "ok" | "refused" | "error";
}

export interface Artifact {
  id: Id;
  workspaceId: Id;
  name: string;
  kind: "document" | "code" | "design" | "automation" | "website" | "email_draft" | "brief";
  url?: string;
}

// ---------- Features ----------

export interface Feature {
  id: Id;
  key: string; // ex: "meeting-prep"
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  requires: CapabilityId[];
  produces: string[];
  version: string;
  acceptanceStatus: "pass" | "pending" | "fail";
}

// ---------- Meetings / CRM / Automations / Websites ----------

export interface Meeting {
  id: Id;
  workspaceId: Id;
  clientId: Id;
  title: string;
  at: ISODate;
  attendeeContactIds: Id[];
  transcriptId?: Id;
  prep?: {
    context: string;
    recentComms: string[];
    previousCommitments: string[];
    openQuestions: string[];
    suggestedAgenda: string[];
  };
  outcomes?: {
    decisions: string[];
    commitments: string[];
    createdWorkItemIds: Id[];
    facts: string[];
    blockerIds: Id[];
  };
}

export interface Transcript {
  id: Id;
  meetingId: Id;
  providerId: Id;
  excerpt: string;
  fullTextAvailable: boolean;
}

export interface Contact {
  id: Id;
  workspaceId: Id;
  clientId?: Id;
  name: string;
  email?: string;
  role?: string;
  companyId?: Id;
}

export interface Company {
  id: Id;
  workspaceId: Id;
  name: string;
  clientId?: Id;
}

export interface Deal {
  id: Id;
  workspaceId: Id;
  clientId?: Id;
  companyId: Id;
  title: string;
  valueCad: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  lastAgentAction?: {
    proposedByActorId: Id;
    executedByActorId: Id;
    verifiedByActorId?: Id;
    externalRecordId: string;
    at: ISODate;
  };
}

export type AutomationStage = "draft" | "test" | "verified" | "approved" | "deployed";

export interface Automation {
  id: Id;
  workspaceId: Id;
  clientId?: Id;
  name: string;
  providerId: Id;
  stage: AutomationStage;
  trigger: string;
  inputs: string[];
  actions: string[];
  version: string;
  lastRunAt?: ISODate;
  lastRunResult?: "pass" | "fail";
  evidenceIds: Id[];
}

export interface WebsiteDeployment {
  id: Id;
  at: ISODate;
  deploymentId: string;
  liveUrl: string;
  httpCheck?: "pass" | "fail";
  formCheck?: "pass" | "fail";
  integrationCheck?: "pass" | "fail";
  verified: boolean;
}

export interface Website {
  id: Id;
  workspaceId: Id;
  clientId?: Id;
  name: string;
  providerId: Id;
  pages: string[];
  deployments: WebsiteDeployment[];
  openIssues: string[];
}

// ---------- Knowledge & decisions ----------

export type MemoryLayer = "current_state" | "decision" | "knowledge";

export interface KnowledgeItem {
  id: Id;
  workspaceId: Id;
  clientId?: Id;
  layer: MemoryLayer;
  title: string;
  content: string;
  source: string; // provenance
  confidence: "high" | "medium" | "low";
  freshness: "fresh" | "aging" | "stale";
  relatedIds: Id[];
  createdAt: ISODate;
}

export interface Decision {
  id: Id;
  workspaceId: Id;
  at: ISODate;
  byActorId: Id;
  title: string;
  rationale: string;
  /** append-only: jamais modifiable dans l'UI */
  readonly immutable: true;
}

export interface ImprovementProposal {
  id: Id;
  workspaceId: Id;
  observation: string; // ex: "Enrichissement CRM manuel effectué 27 fois ce mois-ci"
  proposal: string;
  estimatedSetupHours: number;
  estimatedSavedHoursPerMonth: number;
  status: "proposed" | "investigating" | "approved" | "rejected" | "building" | "deployed";
}

// ---------- Build (zone développeur) ----------

export interface BuildInfo {
  version: string;
  pipeline: ("spec" | "build" | "test" | "verify" | "review" | "deploy")[];
  unitsDone: number;
  unitsTotal: number;
}

// ---------- Racine de l'état ----------

export interface AppState {
  workspaces: Workspace[];
  activeWorkspaceId: Id;
  clients: Client[];
  actors: Actor[];
  providers: Provider[];
  integrations: Integration[];
  policies: Policy[];
  features: Feature[];
  workItems: WorkItem[];
  projects: Project[];
  blockers: Blocker[];
  approvals: Approval[];
  evidence: Evidence[];
  executions: Execution[];
  events: Event[];
  artifacts: Artifact[];
  meetings: Meeting[];
  transcripts: Transcript[];
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  automations: Automation[];
  websites: Website[];
  knowledge: KnowledgeItem[];
  decisions: Decision[];
  proposals: ImprovementProposal[];
  build: BuildInfo;
}

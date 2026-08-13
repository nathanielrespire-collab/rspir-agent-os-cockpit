import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";
import type {
  AppState,
  Id,
  WorkItem,
  Blocker,
  Evidence,
  Decision,
  ExecutionStep,
  Event,
  ChainedSignature,
} from "@/lib/types";
import { chainTip, sign, GENESIS_HASH } from "@/lib/signature";
import type { Unsigned } from "@/lib/signature";
import {
  workspaces,
  clients,
  actors,
  providers,
  integrations,
  policies,
  features,
  workItems,
  projects,
  blockers,
  approvals,
  artifacts,
  meetings,
  transcripts,
  contacts,
  companies,
  deals,
  automations,
  websites,
  knowledge,
  proposals,
  rspirDecisions,
  rspirEvidence,
  rspirExecutions,
  msDecisions,
  msEvidence,
  type UnsignedExecution,
} from "@/lib/fixtures";

// ─── UI store ──────────────────────────────────────────────────────────────

export type Role = "Nathaniel" | "Manny" | "Antoine" | "Agent";
export type Theme = "dark" | "light";

interface UIStore {
  lang: Lang;
  theme: Theme;
  role: Role;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setRole: (role: Role) => void;
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      lang: "fr",
      theme: "dark",
      role: "Nathaniel",
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setRole: (role) => set({ role }),
    }),
    {
      name: "rspir-ui",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

// ─── App data store ────────────────────────────────────────────────────────

const EMPTY_APP_STATE: AppState = {
  workspaces: [],
  activeWorkspaceId: "ws-rspir",
  clients: [],
  actors: [],
  providers: [],
  integrations: [],
  policies: [],
  features: [],
  workItems: [],
  projects: [],
  blockers: [],
  approvals: [],
  evidence: [],
  executions: [],
  events: [],
  artifacts: [],
  meetings: [],
  transcripts: [],
  contacts: [],
  companies: [],
  deals: [],
  automations: [],
  websites: [],
  knowledge: [],
  decisions: [],
  proposals: [],
  build: {
    version: "0.2.0",
    pipeline: ["spec", "build"],
    unitsDone: 2,
    unitsTotal: 20,
  },
};

/** Collecte tous les items signés d'un workspace, triés par seq. */
export function getWorkspaceChain(state: AppState, workspaceId: Id): ChainedSignature[] {
  const items: ChainedSignature[] = [
    ...state.decisions.filter((d) => d.workspaceId === workspaceId),
    ...state.evidence.filter((e) => e.workspaceId === workspaceId),
    ...state.executions.filter((ex) => ex.workspaceId === workspaceId).flatMap((ex) => ex.steps),
  ];
  return items.sort((a, b) => a.seq - b.seq);
}

type TaggedUnsigned =
  | { kind: "decision"; item: Unsigned<Decision> }
  | { kind: "evidence"; item: Unsigned<Evidence> }
  | { kind: "step"; execId: Id; stepIdx: number; item: Unsigned<ExecutionStep> };

/** Scelle une chaîne de workspace depuis des items non signés. Ordre: par seq croissant. */
async function sealWorkspace(params: {
  decisions: Unsigned<Decision>[];
  evidence: Unsigned<Evidence>[];
  executions: UnsignedExecution[];
}): Promise<{
  decisions: Decision[];
  evidence: Evidence[];
  executions: import("@/lib/types").Execution[];
}> {
  const tagged: TaggedUnsigned[] = [
    ...params.decisions.map((item) => ({ kind: "decision" as const, item })),
    ...params.evidence.map((item) => ({ kind: "evidence" as const, item })),
    ...params.executions.flatMap((exec) =>
      exec.steps.map((step, stepIdx) => ({
        kind: "step" as const,
        execId: exec.id,
        stepIdx,
        item: step,
      })),
    ),
  ];

  tagged.sort((a, b) => a.item.seq - b.item.seq);

  let prevHash = GENESIS_HASH;
  const signedDecisions: Decision[] = [];
  const signedEvidence: Evidence[] = [];
  const signedSteps = new Map<Id, Map<number, ExecutionStep>>();

  for (const t of tagged) {
    if (t.kind === "decision") {
      const signed = await sign<Decision>(t.item, prevHash);
      prevHash = signed.hash;
      signedDecisions.push(signed);
    } else if (t.kind === "evidence") {
      const signed = await sign<Evidence>(t.item, prevHash);
      prevHash = signed.hash;
      signedEvidence.push(signed);
    } else {
      const signed = await sign<ExecutionStep>(t.item, prevHash);
      prevHash = signed.hash;
      if (!signedSteps.has(t.execId)) signedSteps.set(t.execId, new Map());
      signedSteps.get(t.execId)!.set(t.stepIdx, signed);
    }
  }

  const signedExecutions = params.executions.map((exec) => ({
    id: exec.id,
    workspaceId: exec.workspaceId,
    workItemId: exec.workItemId,
    outcome: exec.outcome,
    steps: exec.steps.map((_, idx) => signedSteps.get(exec.id)!.get(idx)!),
  }));

  return { decisions: signedDecisions, evidence: signedEvidence, executions: signedExecutions };
}

/** Génère un ID stable pour les entrées créées à l'exécution. */
function newId(prefix: string): Id {
  const rand = Math.random().toString(36).slice(2, 9);
  const ts = Date.now().toString(36);
  return `${prefix}-${ts}-${rand}`;
}

interface AppDataStore extends AppState {
  _hydrated: boolean;

  hydrateDemo: () => Promise<void>;
  resetDemo: () => Promise<void>;

  setActiveWorkspace: (id: Id) => void;

  createWorkItem: (
    data: Omit<WorkItem, "id" | "createdAt" | "updatedAt" | "evidenceIds" | "artifactIds">,
    requestedByActorId: Id,
  ) => Promise<void>;
  updateWorkItem: (
    id: Id,
    patch: Partial<Pick<WorkItem, "status" | "stage" | "priority" | "estimatedMinutes" | "title">>,
    requestedByActorId: Id,
  ) => Promise<void>;
  assignWorkItem: (workItemId: Id, actorId: Id, requestedByActorId: Id) => Promise<void>;

  approveApproval: (id: Id, actorId: Id) => Promise<void>;
  rejectApproval: (id: Id, actorId: Id) => Promise<void>;

  createBlocker: (
    data: Omit<Blocker, "id" | "createdAt" | "resolved">,
    requestedByActorId: Id,
  ) => Promise<void>;
  resolveBlocker: (id: Id, actorId: Id) => Promise<void>;

  toggleFeature: (clientId: Id, featureId: Id, enabled: boolean, actorId: Id) => Promise<void>;
  swapProvider: (integrationId: Id, newProviderId: Id, actorId: Id) => Promise<void>;
}

export const useAppStore = create<AppDataStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_APP_STATE,
      _hydrated: false,

      // ── Hydration ─────────────────────────────────────────────────────

      hydrateDemo: async () => {
        if (get()._hydrated) return;

        const [rspir, ms] = await Promise.all([
          sealWorkspace({
            decisions: rspirDecisions,
            evidence: rspirEvidence,
            executions: rspirExecutions,
          }),
          sealWorkspace({
            decisions: msDecisions,
            evidence: msEvidence,
            executions: [],
          }),
        ]);

        set({
          workspaces,
          activeWorkspaceId: "ws-rspir",
          clients,
          actors,
          providers,
          integrations,
          policies,
          features,
          workItems,
          projects,
          blockers,
          approvals,
          artifacts,
          meetings,
          transcripts,
          contacts,
          companies,
          deals,
          automations,
          websites,
          knowledge,
          proposals,
          decisions: [...rspir.decisions, ...ms.decisions],
          evidence: [...rspir.evidence, ...ms.evidence],
          executions: [...rspir.executions],
          events: [],
          build: { version: "0.2.0", pipeline: ["spec", "build"], unitsDone: 2, unitsTotal: 20 },
          _hydrated: true,
        });
      },

      resetDemo: async () => {
        set({ ...EMPTY_APP_STATE, _hydrated: false });
        await get().hydrateDemo();
      },

      // ── Workspace ─────────────────────────────────────────────────────

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

      // ── Work items ────────────────────────────────────────────────────

      createWorkItem: async (data, requestedByActorId) => {
        const now = new Date().toISOString();
        const id = newId("wi");
        const item: WorkItem = {
          ...data,
          id,
          evidenceIds: [],
          artifactIds: [],
          createdAt: now,
          updatedAt: now,
        };
        const event: Event = {
          id: newId("evt"),
          workspaceId: data.workspaceId,
          at: now,
          requestedByActorId,
          action: "work.create",
          targetId: id,
          result: "ok",
        };
        set((s) => ({ workItems: [...s.workItems, item], events: [...s.events, event] }));
      },

      updateWorkItem: async (id, patch, requestedByActorId) => {
        const now = new Date().toISOString();
        const item = get().workItems.find((w) => w.id === id);
        if (!item) return;
        const event: Event = {
          id: newId("evt"),
          workspaceId: item.workspaceId,
          at: now,
          requestedByActorId,
          action: "work.update",
          targetId: id,
          result: "ok",
        };
        set((s) => ({
          workItems: s.workItems.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: now } : w)),
          events: [...s.events, event],
        }));
      },

      assignWorkItem: async (workItemId, actorId, requestedByActorId) => {
        const now = new Date().toISOString();
        const item = get().workItems.find((w) => w.id === workItemId);
        if (!item) return;

        const chain = getWorkspaceChain(get(), item.workspaceId);
        const tip = chainTip(chain);
        const unsignedEv: Unsigned<Evidence> = {
          seq: tip.seq,
          id: newId("ev"),
          workspaceId: item.workspaceId,
          label: `Assigné à ${actorId} par ${requestedByActorId}`,
          kind: "check",
          result: "pass",
          createdAt: now,
        };
        const ev = await sign<Evidence>(unsignedEv, tip.prevHash);

        const event: Event = {
          id: newId("evt"),
          workspaceId: item.workspaceId,
          at: now,
          requestedByActorId,
          executedByActorId: requestedByActorId,
          action: "work.assign",
          targetId: workItemId,
          result: "ok",
        };

        set((s) => ({
          workItems: s.workItems.map((w) =>
            w.id === workItemId
              ? {
                  ...w,
                  assignedActorId: actorId,
                  updatedAt: now,
                  evidenceIds: [...w.evidenceIds, ev.id],
                }
              : w,
          ),
          evidence: [...s.evidence, ev],
          events: [...s.events, event],
        }));
      },

      // ── Approvals ─────────────────────────────────────────────────────

      approveApproval: async (id, actorId) => {
        const now = new Date().toISOString();
        const apr = get().approvals.find((a) => a.id === id);
        if (!apr || apr.status !== "pending") return;

        const chain = getWorkspaceChain(get(), apr.workspaceId);
        const tip = chainTip(chain);
        const unsignedEv: Unsigned<Evidence> = {
          seq: tip.seq,
          id: newId("ev"),
          workspaceId: apr.workspaceId,
          label: `Approbation accordée par ${actorId}`,
          kind: "check",
          result: "pass",
          createdAt: now,
        };
        const ev = await sign<Evidence>(unsignedEv, tip.prevHash);

        const event: Event = {
          id: newId("evt"),
          workspaceId: apr.workspaceId,
          at: now,
          requestedByActorId: actorId,
          executedByActorId: actorId,
          policyResult: "approval_required",
          action: "approval.approve",
          targetId: id,
          result: "ok",
        };

        set((s) => ({
          approvals: s.approvals.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "approved" as const,
                  decidedByActorId: actorId,
                  decidedAt: now,
                  evidenceIds: [...a.evidenceIds, ev.id],
                }
              : a,
          ),
          evidence: [...s.evidence, ev],
          events: [...s.events, event],
        }));
      },

      rejectApproval: async (id, actorId) => {
        const now = new Date().toISOString();
        const apr = get().approvals.find((a) => a.id === id);
        if (!apr || apr.status !== "pending") return;

        const chain = getWorkspaceChain(get(), apr.workspaceId);
        const tip = chainTip(chain);
        const unsignedEv: Unsigned<Evidence> = {
          seq: tip.seq,
          id: newId("ev"),
          workspaceId: apr.workspaceId,
          label: `Approbation refusée par ${actorId}`,
          kind: "check",
          result: "fail",
          createdAt: now,
        };
        const ev = await sign<Evidence>(unsignedEv, tip.prevHash);

        const event: Event = {
          id: newId("evt"),
          workspaceId: apr.workspaceId,
          at: now,
          requestedByActorId: actorId,
          executedByActorId: actorId,
          policyResult: "approval_required",
          action: "approval.reject",
          targetId: id,
          result: "ok",
        };

        set((s) => ({
          approvals: s.approvals.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "rejected" as const,
                  decidedByActorId: actorId,
                  decidedAt: now,
                  evidenceIds: [...a.evidenceIds, ev.id],
                }
              : a,
          ),
          evidence: [...s.evidence, ev],
          events: [...s.events, event],
        }));
      },

      // ── Blockers ──────────────────────────────────────────────────────

      createBlocker: async (data, requestedByActorId) => {
        const now = new Date().toISOString();
        const id = newId("blk");
        const blocker: Blocker = { ...data, id, resolved: false, createdAt: now };
        const event: Event = {
          id: newId("evt"),
          workspaceId: data.workspaceId,
          at: now,
          requestedByActorId,
          action: "blocker.create",
          targetId: id,
          result: "ok",
        };
        set((s) => ({ blockers: [...s.blockers, blocker], events: [...s.events, event] }));
      },

      resolveBlocker: async (id, actorId) => {
        const now = new Date().toISOString();
        const blk = get().blockers.find((b) => b.id === id);
        if (!blk || blk.resolved) return;

        const chain = getWorkspaceChain(get(), blk.workspaceId);
        const tip = chainTip(chain);
        const unsignedEv: Unsigned<Evidence> = {
          seq: tip.seq,
          id: newId("ev"),
          workspaceId: blk.workspaceId,
          label: `Blocage résolu par ${actorId}`,
          kind: "check",
          result: "pass",
          createdAt: now,
        };
        const ev = await sign<Evidence>(unsignedEv, tip.prevHash);

        const event: Event = {
          id: newId("evt"),
          workspaceId: blk.workspaceId,
          at: now,
          requestedByActorId: actorId,
          executedByActorId: actorId,
          action: "blocker.resolve",
          targetId: id,
          result: "ok",
        };

        set((s) => ({
          blockers: s.blockers.map((b) => (b.id === id ? { ...b, resolved: true } : b)),
          evidence: [...s.evidence, ev],
          events: [...s.events, event],
        }));
      },

      // ── Features ──────────────────────────────────────────────────────

      toggleFeature: async (clientId, featureId, enabled, actorId) => {
        const now = new Date().toISOString();
        const cl = get().clients.find((c) => c.id === clientId);
        if (!cl) return;

        const chain = getWorkspaceChain(get(), cl.workspaceId);
        const tip = chainTip(chain);
        const unsignedEv: Unsigned<Evidence> = {
          seq: tip.seq,
          id: newId("ev"),
          workspaceId: cl.workspaceId,
          label: `Feature ${featureId} ${enabled ? "activée" : "désactivée"} pour ${clientId}`,
          kind: "check",
          result: "pass",
          createdAt: now,
        };
        const ev = await sign<Evidence>(unsignedEv, tip.prevHash);

        const event: Event = {
          id: newId("evt"),
          workspaceId: cl.workspaceId,
          at: now,
          requestedByActorId: actorId,
          executedByActorId: actorId,
          action: enabled ? "feature.enable" : "feature.disable",
          targetId: featureId,
          result: "ok",
        };

        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c;
            const ids = enabled
              ? [...new Set([...c.enabledFeatureIds, featureId])]
              : c.enabledFeatureIds.filter((f) => f !== featureId);
            return { ...c, enabledFeatureIds: ids };
          }),
          evidence: [...s.evidence, ev],
          events: [...s.events, event],
        }));
      },

      // ── Provider swap ─────────────────────────────────────────────────

      swapProvider: async (integrationId, newProviderId, actorId) => {
        const now = new Date().toISOString();
        const integ = get().integrations.find((i) => i.id === integrationId);
        if (!integ) return;

        const chain = getWorkspaceChain(get(), integ.workspaceId);
        const tip = chainTip(chain);
        const unsignedEv: Unsigned<Evidence> = {
          seq: tip.seq,
          id: newId("ev"),
          workspaceId: integ.workspaceId,
          label: `Provider ${integ.providerId} → ${newProviderId} sur ${integrationId}`,
          kind: "check",
          result: "pass",
          createdAt: now,
        };
        const ev = await sign<Evidence>(unsignedEv, tip.prevHash);

        const event: Event = {
          id: newId("evt"),
          workspaceId: integ.workspaceId,
          at: now,
          requestedByActorId: actorId,
          executedByActorId: actorId,
          action: "provider.swap",
          targetId: integrationId,
          result: "ok",
        };

        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === integrationId ? { ...i, providerId: newProviderId } : i,
          ),
          evidence: [...s.evidence, ev],
          events: [...s.events, event],
        }));
      },
    }),
    {
      name: "rspir-app",
      onRehydrateStorage: () => async (state) => {
        if (state && !state._hydrated) {
          await state.hydrateDemo();
        }
      },
    },
  ),
);

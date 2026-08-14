import { create } from "zustand";
import { useAppStore } from "@/lib/store";
import type { WorkStatus } from "@/lib/types";

// ─── Step definitions ──────────────────────────────────────────────────────

export type SimDay = "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi";

export interface SimStep {
  id: string;
  day: SimDay;
  labelFr: string;
  labelEn: string;
  execute: (store: ReturnType<typeof useAppStore.getState>) => Promise<void>;
}

async function transition(
  store: ReturnType<typeof useAppStore.getState>,
  id: string,
  statuses: WorkStatus[],
  actorId: string,
) {
  for (const to of statuses) {
    await store.transitionWorkItemStatus(id, to, actorId);
  }
}

export const SCENARIO_STEPS: SimStep[] = [
  // ── LUNDI ──────────────────────────────────────────────────────────────

  {
    id: "lundi-1",
    day: "lundi",
    labelFr: "Réponse client reçue — blk-001 levé, migration débloquée",
    labelEn: "Client response received — blk-001 resolved, migration unblocked",
    execute: async (store) => {
      await store.resolveBlocker("blk-001", "act-nathaniel");
      await store.transitionWorkItemStatus("wi-010", "ready", "act-nathaniel");
    },
  },

  {
    id: "lundi-2",
    day: "lundi",
    labelFr: "Ops Agent Orbite assigné — exécution démarrée",
    labelEn: "Ops Agent Orbite assigned — execution started",
    execute: async (store) => {
      await store.assignWorkItem("wi-010", "act-ops", "act-nathaniel");
      await transition(store, "wi-010", ["claimed", "running"], "act-ops");
    },
  },

  {
    id: "lundi-3",
    day: "lundi",
    labelFr: "Migration Bellerive complétée — preuve archivée dans le ledger",
    labelEn: "Bellerive migration complete — proof archived in ledger",
    execute: async (store) => {
      await transition(store, "wi-010", ["verification", "a_valider", "done"], "act-ops");
    },
  },

  // ── MARDI ──────────────────────────────────────────────────────────────

  {
    id: "mardi-1",
    day: "mardi",
    labelFr: "Réunion Bellerive — Fireflies traite la transcription, tâches extraites",
    labelEn: "Bellerive meeting — Fireflies processes transcript, tasks extracted",
    execute: async (store) => {
      await store.assignWorkItem("wi-016", "act-clio", "act-nathaniel");
    },
  },

  {
    id: "mardi-2",
    day: "mardi",
    labelFr: "Audit automatisations — vérification en cours",
    labelEn: "Automation audit — verification in progress",
    execute: async (store) => {
      await transition(store, "wi-016", ["running", "verification", "a_valider"], "act-clio");
    },
  },

  {
    id: "mardi-3",
    day: "mardi",
    labelFr: "CRM mis à jour — courriel de suivi créé, audit complété",
    labelEn: "CRM updated — follow-up email created, audit complete",
    execute: async (store) => {
      await store.createAutomation(
        {
          name: "Suivi courriel post-réunion Bellerive",
          trigger: "meeting.processed",
          workspaceId: "ws-rspir",
          clientId: "cl-bellerive",
          evidenceLabel: "Brouillon courriel créé — agent Clio · Fireflies transcript",
        },
        "act-clio",
      );
      await transition(store, "wi-016", ["done"], "act-clio");
    },
  },

  // ── MERCREDI ───────────────────────────────────────────────────────────

  {
    id: "mercredi-1",
    day: "mercredi",
    labelFr: "Fireflies → Google Meet — fournisseur transcription remplacé",
    labelEn: "Fireflies → Google Meet — transcript provider swapped",
    execute: async (store) => {
      await store.swapProvider("int-transcripts", "prv-google-meet", "act-nathaniel");
    },
  },

  {
    id: "mercredi-2",
    day: "mercredi",
    labelFr: "Audit CRM 1867 complété — préparation réunion fonctionnelle avec Google Meet",
    labelEn: "CRM 1867 audit complete — meeting prep works with Google Meet",
    execute: async (store) => {
      await store.assignWorkItem("wi-024", "act-rev", "act-nathaniel");
      await transition(store, "wi-024", ["a_valider", "done"], "act-rev");
    },
  },

  // ── JEUDI ──────────────────────────────────────────────────────────────

  {
    id: "jeudi-1",
    day: "jeudi",
    labelFr: "Décision humaine — déploiement Bellerive approuvé",
    labelEn: "Human decision — Bellerive deployment approved",
    execute: async (store) => {
      await store.approveApproval("apr-001", "act-nathaniel");
    },
  },

  {
    id: "jeudi-2",
    day: "jeudi",
    labelFr: "Campagne courriel Boutique 1867 — approuvée, travail continue en parallèle",
    labelEn: "Boutique 1867 email campaign — approved, work continues in parallel",
    execute: async (store) => {
      await store.approveApproval("apr-002", "act-nathaniel");
    },
  },

  // ── VENDREDI ───────────────────────────────────────────────────────────

  {
    id: "vendredi-1",
    day: "vendredi",
    labelFr: "Décision stratégique Q4 enregistrée — blk-002 levé",
    labelEn: "Q4 strategic decision recorded — blk-002 resolved",
    execute: async (store) => {
      await store.resolveBlocker("blk-002", "act-nathaniel");
    },
  },

  {
    id: "vendredi-2",
    day: "vendredi",
    labelFr: "Revue sécurité pipeline CI/CD — complétée, evidence archivée",
    labelEn: "CI/CD pipeline security review — complete, evidence archived",
    execute: async (store) => {
      await transition(store, "wi-029", ["done"], "act-aria");
    },
  },
];

// ─── Simulation store ──────────────────────────────────────────────────────

export const TOTAL_STEPS = SCENARIO_STEPS.length;

interface SimState {
  active: boolean;
  paused: boolean;
  step: number;
  resetting: boolean;
}

interface SimActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  advance: () => Promise<void>;
  resetSim: () => Promise<void>;
}

export const useSimStore = create<SimState & SimActions>()((set, get) => ({
  active: false,
  paused: true,
  step: 0,
  resetting: false,

  start: () => set({ active: true, paused: false, step: 0 }),

  pause: () => set({ paused: true }),

  resume: () => set({ paused: false }),

  advance: async () => {
    const { step } = get();
    if (step >= TOTAL_STEPS) return;
    const scenarioStep = SCENARIO_STEPS[step];
    await scenarioStep.execute(useAppStore.getState());
    set({ step: step + 1, paused: true });
  },

  resetSim: async () => {
    set({ active: false, paused: true, step: 0, resetting: true });
    await useAppStore.getState().resetDemo();
    set({ resetting: false });
  },
}));

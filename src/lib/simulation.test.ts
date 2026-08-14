import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/lib/store";
import { SCENARIO_STEPS, TOTAL_STEPS, useSimStore } from "@/lib/simulation";

async function freshStore() {
  useAppStore.setState({ _hydrated: false });
  await useAppStore.getState().hydrateDemo();
  return useAppStore.getState();
}

describe("SCENARIO_STEPS", () => {
  it("contient exactement 12 étapes", () => {
    expect(TOTAL_STEPS).toBe(12);
    expect(SCENARIO_STEPS).toHaveLength(12);
  });

  it("chaque étape a un id, day, et labels non-vides", () => {
    for (const step of SCENARIO_STEPS) {
      expect(step.id).toBeTruthy();
      expect(step.day).toMatch(/^(lundi|mardi|mercredi|jeudi|vendredi)$/);
      expect(step.labelFr.length).toBeGreaterThan(10);
      expect(step.labelEn.length).toBeGreaterThan(10);
    }
  });

  it("les IDs de steps sont uniques", () => {
    const ids = SCENARIO_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Scénario complet", () => {
  beforeEach(async () => {
    await freshStore();
    useSimStore.setState({ active: false, paused: true, step: 0, resetting: false });
  });

  it("toutes les étapes s'exécutent sans erreur", async () => {
    for (const step of SCENARIO_STEPS) {
      await expect(step.execute(useAppStore.getState())).resolves.not.toThrow();
    }
  });

  it("le nombre de preuves (evidence) augmente après le scénario", async () => {
    const before = useAppStore.getState().evidence.length;
    for (const step of SCENARIO_STEPS) {
      await step.execute(useAppStore.getState());
    }
    const after = useAppStore.getState().evidence.length;
    expect(after).toBeGreaterThan(before + 4);
  });

  it("blk-001 est résolu après la première étape", async () => {
    await SCENARIO_STEPS[0].execute(useAppStore.getState());
    const blk = useAppStore.getState().blockers.find((b) => b.id === "blk-001");
    expect(blk?.resolved).toBe(true);
  });

  it("wi-010 est 'done' après les 3 premières étapes (Lundi)", async () => {
    for (let i = 0; i < 3; i++) {
      await SCENARIO_STEPS[i].execute(useAppStore.getState());
    }
    const wi = useAppStore.getState().workItems.find((w) => w.id === "wi-010");
    expect(wi?.status).toBe("done");
  });

  it("int-transcripts pointe vers prv-google-meet après Mercredi", async () => {
    // Steps 0-6: run up to and including mercredi-1 (step index 6)
    for (let i = 0; i <= 6; i++) {
      await SCENARIO_STEPS[i].execute(useAppStore.getState());
    }
    const integ = useAppStore.getState().integrations.find((i) => i.id === "int-transcripts");
    expect(integ?.providerId).toBe("prv-google-meet");
  });

  it("apr-001 est approuvée après Jeudi étape 1", async () => {
    for (let i = 0; i <= 8; i++) {
      await SCENARIO_STEPS[i].execute(useAppStore.getState());
    }
    const apr = useAppStore.getState().approvals.find((a) => a.id === "apr-001");
    expect(apr?.status).toBe("approved");
  });

  it("blk-002 est résolu après la première étape du Vendredi", async () => {
    for (let i = 0; i <= 10; i++) {
      await SCENARIO_STEPS[i].execute(useAppStore.getState());
    }
    const blk = useAppStore.getState().blockers.find((b) => b.id === "blk-002");
    expect(blk?.resolved).toBe(true);
  });
});

describe("useSimStore", () => {
  beforeEach(async () => {
    await freshStore();
    useSimStore.setState({ active: false, paused: true, step: 0, resetting: false });
  });

  it("start passe active à true et paused à false", () => {
    useSimStore.getState().start();
    expect(useSimStore.getState().active).toBe(true);
    expect(useSimStore.getState().paused).toBe(false);
  });

  it("advance exécute une étape et incrémente step", async () => {
    useSimStore.getState().start();
    await useSimStore.getState().advance();
    expect(useSimStore.getState().step).toBe(1);
    // blk-001 should now be resolved
    const blk = useAppStore.getState().blockers.find((b) => b.id === "blk-001");
    expect(blk?.resolved).toBe(true);
  });

  it("advance dépasse la limite sans planter", async () => {
    useSimStore.getState().start();
    // Advance beyond total steps
    for (let i = 0; i <= TOTAL_STEPS + 2; i++) {
      await useSimStore.getState().advance();
    }
    expect(useSimStore.getState().step).toBe(TOTAL_STEPS);
  });

  it("resetSim remet step à 0 et restaure les données démo", async () => {
    useSimStore.getState().start();
    await useSimStore.getState().advance(); // executes step 0
    const blkBefore = useAppStore.getState().blockers.find((b) => b.id === "blk-001");
    expect(blkBefore?.resolved).toBe(true);

    await useSimStore.getState().resetSim();
    expect(useSimStore.getState().step).toBe(0);
    expect(useSimStore.getState().active).toBe(false);

    const blkAfter = useAppStore.getState().blockers.find((b) => b.id === "blk-001");
    expect(blkAfter?.resolved).toBe(false);
  });
});

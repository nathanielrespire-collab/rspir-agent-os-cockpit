import { describe, it, expect } from "vitest";
import { verifyChain } from "@/lib/signature";
import { getWorkspaceChain, useAppStore } from "@/lib/store";

// Reset store state between tests
async function freshStore() {
  // Force re-hydration from fixtures each time
  useAppStore.setState({ _hydrated: false });
  await useAppStore.getState().hydrateDemo();
  return useAppStore.getState();
}

describe("hydrateDemo", () => {
  it("peuple le store avec les données démo", async () => {
    const s = await freshStore();
    expect(s.workspaces.length).toBe(2);
    expect(s.clients.length).toBe(4);
    expect(s.actors.length).toBe(9);
    expect(s.providers.length).toBe(14);
    expect(s.workItems.length).toBe(30);
    expect(s.projects.length).toBe(4);
    expect(s.blockers.length).toBe(3);
    expect(s.approvals.length).toBe(5);
    expect(s.meetings.length).toBe(4);
    expect(s.deals.length).toBe(6);
    expect(s.knowledge.length).toBe(12);
  });

  it("est idempotente: un second appel ne modifie pas l'état", async () => {
    const s = await freshStore();
    const evidenceBefore = s.evidence.length;
    await useAppStore.getState().hydrateDemo();
    expect(useAppStore.getState().evidence.length).toBe(evidenceBefore);
  });

  it("scelle les décisions et evidence avec des hashes non-vides", async () => {
    const s = await freshStore();
    for (const d of s.decisions) {
      expect(d.hash).toHaveLength(64);
      expect(d.prevHash).toHaveLength(64);
    }
    for (const e of s.evidence) {
      expect(e.hash).toHaveLength(64);
      expect(e.prevHash).toHaveLength(64);
    }
  });
});

describe("intégrité de chaîne après hydratation", () => {
  it("verifyChain retourne null pour ws-rspir", async () => {
    const s = await freshStore();
    const chain = getWorkspaceChain(s, "ws-rspir");
    expect(chain.length).toBeGreaterThan(0);
    const result = await verifyChain(chain);
    expect(result).toBeNull();
  });

  it("verifyChain retourne null pour ws-ms", async () => {
    const s = await freshStore();
    const chain = getWorkspaceChain(s, "ws-ms");
    expect(chain.length).toBeGreaterThan(0);
    const result = await verifyChain(chain);
    expect(result).toBeNull();
  });

  it("les chaînes ws-rspir et ws-ms sont indépendantes (aucun prevHash croisé)", async () => {
    const s = await freshStore();
    const rspirHashes = new Set(getWorkspaceChain(s, "ws-rspir").map((e) => e.hash));
    const msChain = getWorkspaceChain(s, "ws-ms");
    for (const item of msChain) {
      if (item.seq > 0) {
        expect(rspirHashes.has(item.prevHash)).toBe(false);
      }
    }
  });

  it("les seq de ws-rspir sont contigus à partir de 0", async () => {
    const s = await freshStore();
    const chain = getWorkspaceChain(s, "ws-rspir");
    chain.forEach((item, idx) => {
      expect(item.seq).toBe(idx);
    });
  });
});

describe("isolation par workspace", () => {
  it("les décisions ws-rspir n'apparaissent pas dans la chaîne ws-ms", async () => {
    const s = await freshStore();
    const rspirDecisionIds = new Set(
      s.decisions.filter((d) => d.workspaceId === "ws-rspir").map((d) => d.id),
    );
    const msChainItems = getWorkspaceChain(s, "ws-ms");
    const msDecisionIds = new Set(
      s.decisions.filter((d) => d.workspaceId === "ws-ms").map((d) => d.id),
    );
    for (const id of msDecisionIds) {
      expect(rspirDecisionIds.has(id)).toBe(false);
    }
    expect(msChainItems.length).toBe(2); // dec + evidence
  });

  it("l'evidence ws-rspir n'est pas visible depuis ws-ms", async () => {
    const s = await freshStore();
    const msEvidence = s.evidence.filter((e) => e.workspaceId === "ws-ms");
    const rspirEvidence = s.evidence.filter((e) => e.workspaceId === "ws-rspir");
    expect(msEvidence.length).toBe(1);
    expect(rspirEvidence.length).toBeGreaterThan(0);
  });
});

describe("action assignWorkItem", () => {
  it("met à jour assignedActorId et ajoute un event", async () => {
    await freshStore();
    await useAppStore.getState().assignWorkItem("wi-009", "act-builder", "act-nathaniel");
    const s = useAppStore.getState();
    const wi = s.workItems.find((w) => w.id === "wi-009");
    expect(wi?.assignedActorId).toBe("act-builder");
    const event = s.events.find((e) => e.action === "work.assign" && e.targetId === "wi-009");
    expect(event).toBeDefined();
    expect(event?.result).toBe("ok");
  });

  it("ajoute une evidence signée et la lie au work item", async () => {
    await freshStore();
    await useAppStore.getState().assignWorkItem("wi-009", "act-builder", "act-nathaniel");
    const s = useAppStore.getState();
    const wi = s.workItems.find((w) => w.id === "wi-009");
    expect(wi?.evidenceIds.length).toBeGreaterThan(0);
    const evId = wi!.evidenceIds[wi!.evidenceIds.length - 1];
    const ev = s.evidence.find((e) => e.id === evId);
    expect(ev).toBeDefined();
    expect(ev?.hash).toHaveLength(64);
  });

  it("verifyChain reste null après assignation", async () => {
    await freshStore();
    await useAppStore.getState().assignWorkItem("wi-009", "act-builder", "act-nathaniel");
    const s = useAppStore.getState();
    const result = await verifyChain(getWorkspaceChain(s, "ws-rspir"));
    expect(result).toBeNull();
  });
});

describe("action approveApproval / rejectApproval", () => {
  it("approuve une demande en attente", async () => {
    await freshStore();
    await useAppStore.getState().approveApproval("apr-001", "act-nathaniel");
    const s = useAppStore.getState();
    const apr = s.approvals.find((a) => a.id === "apr-001");
    expect(apr?.status).toBe("approved");
    expect(apr?.decidedByActorId).toBe("act-nathaniel");
    expect(apr?.decidedAt).toBeDefined();
  });

  it("rejette une demande en attente", async () => {
    await freshStore();
    await useAppStore.getState().rejectApproval("apr-002", "act-nathaniel");
    const s = useAppStore.getState();
    const apr = s.approvals.find((a) => a.id === "apr-002");
    expect(apr?.status).toBe("rejected");
  });

  it("ne modifie pas une approbation déjà décidée", async () => {
    await freshStore();
    await useAppStore.getState().approveApproval("apr-003", "act-nathaniel");
    const s = useAppStore.getState();
    // apr-003 était déjà "approved", decidedAt ne doit pas changer
    const apr = s.approvals.find((a) => a.id === "apr-003");
    expect(apr?.status).toBe("approved");
    // aucun event dupliqué
    const events = s.events.filter((e) => e.action === "approval.approve" && e.targetId === "apr-003");
    expect(events.length).toBe(0); // déjà décidé, action ignorée
  });

  it("verifyChain reste null après approbation", async () => {
    await freshStore();
    await useAppStore.getState().approveApproval("apr-001", "act-nathaniel");
    const s = useAppStore.getState();
    const result = await verifyChain(getWorkspaceChain(s, "ws-rspir"));
    expect(result).toBeNull();
  });
});

describe("action createBlocker / resolveBlocker", () => {
  it("crée un blocage et ajoute un event", async () => {
    await freshStore();
    await useAppStore.getState().createBlocker(
      {
        workspaceId: "ws-rspir",
        scope: "local",
        workItemIds: ["wi-018"],
        ownerActorId: "act-nathaniel",
        question: "Quel environnement de test utiliser?",
        blockingDependency: "Décision infrastructure",
      },
      "act-nathaniel",
    );
    const s = useAppStore.getState();
    const blk = s.blockers.find((b) => b.workItemIds.includes("wi-018") && !b.resolved);
    expect(blk).toBeDefined();
    expect(blk?.resolved).toBe(false);
    expect(s.events.some((e) => e.action === "blocker.create")).toBe(true);
  });

  it("résout un blocage existant et ajoute evidence + event", async () => {
    await freshStore();
    await useAppStore.getState().resolveBlocker("blk-001", "act-nathaniel");
    const s = useAppStore.getState();
    const blk = s.blockers.find((b) => b.id === "blk-001");
    expect(blk?.resolved).toBe(true);
    expect(s.events.some((e) => e.action === "blocker.resolve" && e.targetId === "blk-001")).toBe(true);
  });
});

describe("action toggleFeature", () => {
  it("désactive une feature pour un client", async () => {
    await freshStore();
    await useAppStore.getState().toggleFeature("cl-bellerive", "feat-meeting-prep", false, "act-nathaniel");
    const s = useAppStore.getState();
    const cl = s.clients.find((c) => c.id === "cl-bellerive");
    expect(cl?.enabledFeatureIds.includes("feat-meeting-prep")).toBe(false);
  });

  it("active une feature pour un client", async () => {
    await freshStore();
    await useAppStore.getState().toggleFeature("cl-1867", "feat-website-builder", true, "act-nathaniel");
    const s = useAppStore.getState();
    const cl = s.clients.find((c) => c.id === "cl-1867");
    expect(cl?.enabledFeatureIds.includes("feat-website-builder")).toBe(true);
  });

  it("verifyChain reste null après toggle", async () => {
    await freshStore();
    await useAppStore.getState().toggleFeature("cl-bellerive", "feat-email-drafter", true, "act-nathaniel");
    const s = useAppStore.getState();
    const result = await verifyChain(getWorkspaceChain(s, "ws-rspir"));
    expect(result).toBeNull();
  });
});

describe("action swapProvider", () => {
  it("remplace le provider d'une intégration", async () => {
    await freshStore();
    await useAppStore.getState().swapProvider("int-email", "prv-gmail", "act-nathaniel");
    // swap vers le même provider (no-op visible mais event créé)
    const s = useAppStore.getState();
    const integ = s.integrations.find((i) => i.id === "int-email");
    expect(integ?.providerId).toBe("prv-gmail");
    expect(s.events.some((e) => e.action === "provider.swap")).toBe(true);
  });

  it("verifyChain reste null après swap", async () => {
    await freshStore();
    await useAppStore.getState().swapProvider("int-email", "prv-gmail", "act-nathaniel");
    const s = useAppStore.getState();
    const result = await verifyChain(getWorkspaceChain(s, "ws-rspir"));
    expect(result).toBeNull();
  });
});

describe("intégrité après mutations multiples", () => {
  it("verifyChain reste null après une suite d'actions", async () => {
    await freshStore();
    await useAppStore.getState().assignWorkItem("wi-009", "act-builder", "act-nathaniel");
    await useAppStore.getState().approveApproval("apr-001", "act-nathaniel");
    await useAppStore.getState().resolveBlocker("blk-001", "act-nathaniel");
    await useAppStore.getState().toggleFeature("cl-1867", "feat-website-builder", true, "act-nathaniel");
    const s = useAppStore.getState();
    const result = await verifyChain(getWorkspaceChain(s, "ws-rspir"));
    expect(result).toBeNull();
  });

  it("une entrée modifiée manuellement rompt la chaîne", async () => {
    await freshStore();
    await useAppStore.getState().assignWorkItem("wi-009", "act-clio", "act-nathaniel");
    const s = useAppStore.getState();
    const chain = getWorkspaceChain(s, "ws-rspir");
    const lastIdx = chain.length - 1;

    // Tamper: modify label of the last evidence without recomputing hash
    const tampered = chain.map((item, idx) => {
      if (idx === lastIdx && "label" in item) {
        return { ...item, label: "FALSIFIÉ" };
      }
      return item;
    });

    const result = await verifyChain(tampered);
    expect(result).toBe(lastIdx);
  });
});

describe("resetDemo", () => {
  it("restaure l'état initial après mutations", async () => {
    await freshStore();
    await useAppStore.getState().assignWorkItem("wi-009", "act-builder", "act-nathaniel");
    await useAppStore.getState().approveApproval("apr-001", "act-nathaniel");
    const stateBefore = useAppStore.getState().events.length;
    expect(stateBefore).toBeGreaterThan(0);

    await useAppStore.getState().resetDemo();
    const s = useAppStore.getState();
    expect(s.events.length).toBe(0);
    expect(s.workItems.length).toBe(30);
    const wi = s.workItems.find((w) => w.id === "wi-009");
    expect(wi?.assignedActorId).toBeUndefined();
  });

  it("verifyChain reste null après reset", async () => {
    await freshStore();
    await useAppStore.getState().assignWorkItem("wi-009", "act-builder", "act-nathaniel");
    await useAppStore.getState().resetDemo();
    const s = useAppStore.getState();
    const result = await verifyChain(getWorkspaceChain(s, "ws-rspir"));
    expect(result).toBeNull();
  });
});

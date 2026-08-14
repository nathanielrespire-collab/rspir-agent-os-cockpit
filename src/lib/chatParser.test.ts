import { describe, it, expect } from "vitest";
import { parseCommand } from "@/lib/chatParser";
import { useAppStore } from "@/lib/store";

// ─── Parser unit tests ─────────────────────────────────────────────────────

describe("parseCommand — navigate", () => {
  it("FR: naviguer vers work", () => {
    expect(parseCommand("naviguer vers work", "fr")).toEqual({ kind: "navigate", path: "/work" });
  });
  it("FR: aller à projets", () => {
    expect(parseCommand("aller à projets", "fr")).toEqual({ kind: "navigate", path: "/projects" });
  });
  it("EN: go to approvals", () => {
    expect(parseCommand("go to approvals", "en")).toEqual({ kind: "navigate", path: "/approvals" });
  });
  it("EN: navigate to settings", () => {
    expect(parseCommand("navigate to settings", "en")).toEqual({
      kind: "navigate",
      path: "/settings",
    });
  });
  it("FR: ouvrir réunions", () => {
    expect(parseCommand("ouvrir réunions", "fr")).toEqual({ kind: "navigate", path: "/meetings" });
  });
  it("unknown route target returns unknown", () => {
    expect(parseCommand("naviguer vers zorglub", "fr")).toEqual({ kind: "unknown" });
  });
});

describe("parseCommand — search", () => {
  it("FR: chercher Bellerive", () => {
    expect(parseCommand("chercher Bellerive", "fr")).toEqual({
      kind: "search",
      query: "Bellerive",
    });
  });
  it("EN: search for invoice", () => {
    expect(parseCommand("search for invoice", "en")).toEqual({
      kind: "search",
      query: "invoice",
    });
  });
  it("FR: trouver wi-007", () => {
    expect(parseCommand("trouver wi-007", "fr")).toEqual({ kind: "search", query: "wi-007" });
  });
});

describe("parseCommand — create_work_item", () => {
  it("FR: créer un work item Refonte CRM", () => {
    expect(parseCommand("créer un work item Refonte CRM", "fr")).toEqual({
      kind: "create_work_item",
      title: "Refonte CRM",
    });
  });
  it("EN: create work item Update API docs", () => {
    expect(parseCommand("create work item Update API docs", "en")).toEqual({
      kind: "create_work_item",
      title: "Update API docs",
    });
  });
  it("FR: nouveau work item Migration BD pour le projet crm", () => {
    const r = parseCommand("nouveau work item Migration BD pour le projet crm", "fr");
    expect(r.kind).toBe("create_work_item");
    if (r.kind === "create_work_item") {
      expect(r.title).toBe("Migration BD");
      expect(r.projectRef).toBe("crm");
    }
  });
});

describe("parseCommand — assign", () => {
  it("FR: assigner wi-009 à Manny", () => {
    expect(parseCommand("assigner wi-009 à Manny", "fr")).toEqual({
      kind: "assign",
      workItemRef: "wi-009",
      actorRef: "Manny",
    });
  });
  it("EN: assign wi-009 to Builder", () => {
    expect(parseCommand("assign wi-009 to Builder", "en")).toEqual({
      kind: "assign",
      workItemRef: "wi-009",
      actorRef: "Builder",
    });
  });
});

describe("parseCommand — approve / reject", () => {
  it("FR: approuver apr-001", () => {
    expect(parseCommand("approuver apr-001", "fr")).toEqual({
      kind: "approve",
      approvalRef: "apr-001",
    });
  });
  it("EN: approve apr-002", () => {
    expect(parseCommand("approve apr-002", "en")).toEqual({
      kind: "approve",
      approvalRef: "apr-002",
    });
  });
  it("FR: rejeter apr-004", () => {
    expect(parseCommand("rejeter apr-004", "fr")).toEqual({
      kind: "reject",
      approvalRef: "apr-004",
    });
  });
  it("EN: reject apr-001", () => {
    expect(parseCommand("reject apr-001", "en")).toEqual({
      kind: "reject",
      approvalRef: "apr-001",
    });
  });
});

describe("parseCommand — create_blocker", () => {
  it("FR: créer un blocker Attente décision juridique", () => {
    expect(parseCommand("créer un blocker Attente décision juridique", "fr")).toEqual({
      kind: "create_blocker",
      description: "Attente décision juridique",
    });
  });
  it("EN: create blocker Need legal sign-off for wi-010", () => {
    const r = parseCommand("create blocker Need legal sign-off for wi-010", "en");
    expect(r.kind).toBe("create_blocker");
    if (r.kind === "create_blocker") {
      expect(r.description).toBe("Need legal sign-off");
      expect(r.workItemRef).toBe("wi-010");
    }
  });
});

describe("parseCommand — resolve_blocker", () => {
  it("FR: résoudre le blocker blk-001", () => {
    expect(parseCommand("résoudre le blocker blk-001", "fr")).toEqual({
      kind: "resolve_blocker",
      blockerRef: "blk-001",
    });
  });
  it("EN: resolve blocker blk-002", () => {
    expect(parseCommand("resolve blocker blk-002", "en")).toEqual({
      kind: "resolve_blocker",
      blockerRef: "blk-002",
    });
  });
});

describe("parseCommand — toggle_feature", () => {
  it("FR: activer feature meeting-prep pour client bellerive", () => {
    const r = parseCommand("activer feature meeting-prep pour client bellerive", "fr");
    expect(r).toEqual({
      kind: "toggle_feature",
      featureRef: "meeting-prep",
      clientRef: "bellerive",
      enabled: true,
    });
  });
  it("FR: désactiver feature crm-enrichment pour Films Casseau", () => {
    const r = parseCommand("désactiver feature crm-enrichment pour Films Casseau", "fr");
    expect(r).toEqual({
      kind: "toggle_feature",
      featureRef: "crm-enrichment",
      clientRef: "Films Casseau",
      enabled: false,
    });
  });
  it("EN: enable feature meeting-prep for client Bellerive", () => {
    const r = parseCommand("enable feature meeting-prep for client Bellerive", "en");
    expect(r).toEqual({
      kind: "toggle_feature",
      featureRef: "meeting-prep",
      clientRef: "Bellerive",
      enabled: true,
    });
  });
});

describe("parseCommand — meeting_brief", () => {
  it("FR: préparer un brief pour la réunion mtg-001", () => {
    expect(parseCommand("préparer un brief pour la réunion mtg-001", "fr")).toEqual({
      kind: "meeting_brief",
      meetingRef: "mtg-001",
    });
  });
  it("EN: prepare meeting brief mtg-002", () => {
    expect(parseCommand("prepare meeting brief mtg-002", "en")).toEqual({
      kind: "meeting_brief",
      meetingRef: "mtg-002",
    });
  });
  it("FR: préparer brief Bellerive Q2", () => {
    expect(parseCommand("préparer brief Bellerive Q2", "fr")).toEqual({
      kind: "meeting_brief",
      meetingRef: "Bellerive Q2",
    });
  });
});

describe("parseCommand — why_blocked", () => {
  it("FR: pourquoi wi-010 est bloqué", () => {
    expect(parseCommand("pourquoi wi-010 est bloqué", "fr")).toEqual({
      kind: "why_blocked",
      workItemRef: "wi-010",
    });
  });
  it("EN: why is wi-010 blocked", () => {
    expect(parseCommand("why is wi-010 blocked", "en")).toEqual({
      kind: "why_blocked",
      workItemRef: "wi-010",
    });
  });
  it("EN: what blocks wi-030", () => {
    expect(parseCommand("what blocks wi-030", "en")).toEqual({
      kind: "why_blocked",
      workItemRef: "wi-030",
    });
  });
});

describe("parseCommand — what_evidence", () => {
  it("FR: quelle evidence prouve wi-007", () => {
    expect(parseCommand("quelle evidence prouve wi-007", "fr")).toEqual({
      kind: "what_evidence",
      targetRef: "wi-007",
    });
  });
  it("FR: preuves pour apr-001", () => {
    expect(parseCommand("preuves pour apr-001", "fr")).toEqual({
      kind: "what_evidence",
      targetRef: "apr-001",
    });
  });
  it("EN: what evidence proves wi-001", () => {
    expect(parseCommand("what evidence proves wi-001", "en")).toEqual({
      kind: "what_evidence",
      targetRef: "wi-001",
    });
  });
  it("EN: show evidence for blk-001", () => {
    expect(parseCommand("show evidence for blk-001", "en")).toEqual({
      kind: "what_evidence",
      targetRef: "blk-001",
    });
  });
});

describe("parseCommand — unknown", () => {
  it("empty string", () => {
    expect(parseCommand("", "fr")).toEqual({ kind: "unknown" });
  });
  it("unrecognized text", () => {
    expect(parseCommand("bonjour comment ça va", "fr")).toEqual({ kind: "unknown" });
  });
  it("partial command prefix only", () => {
    expect(parseCommand("approuver", "fr")).toEqual({ kind: "unknown" });
  });
});

// ─── Integration: chat commands produce same Events as button paths ─────────

async function freshStore() {
  useAppStore.setState({ _hydrated: false });
  await useAppStore.getState().hydrateDemo();
  return useAppStore.getState();
}

describe("intégration — mêmes Events que les boutons", () => {
  it("approveApproval via store produit action=approval.approve", async () => {
    await freshStore();
    await useAppStore.getState().approveApproval("apr-001", "act-nathaniel");
    const s = useAppStore.getState();
    const ev = s.events.find((e) => e.action === "approval.approve" && e.targetId === "apr-001");
    expect(ev).toBeDefined();
    expect(ev?.result).toBe("ok");
    expect(ev?.policyResult).toBe("approval_required");
  });

  it("rejectApproval via store produit action=approval.reject", async () => {
    await freshStore();
    await useAppStore.getState().rejectApproval("apr-002", "act-nathaniel");
    const s = useAppStore.getState();
    const ev = s.events.find((e) => e.action === "approval.reject" && e.targetId === "apr-002");
    expect(ev).toBeDefined();
    expect(ev?.result).toBe("ok");
  });

  it("assignWorkItem via store produit action=work.assign + evidence signée", async () => {
    await freshStore();
    await useAppStore.getState().assignWorkItem("wi-009", "act-builder", "act-nathaniel");
    const s = useAppStore.getState();
    const ev = s.events.find((e) => e.action === "work.assign" && e.targetId === "wi-009");
    expect(ev).toBeDefined();
    const wi = s.workItems.find((w) => w.id === "wi-009");
    expect(wi?.assignedActorId).toBe("act-builder");
    expect(wi?.evidenceIds.length).toBeGreaterThan(0);
  });

  it("resolveBlocker via store produit action=blocker.resolve + evidence signée", async () => {
    await freshStore();
    await useAppStore.getState().resolveBlocker("blk-001", "act-nathaniel");
    const s = useAppStore.getState();
    const ev = s.events.find((e) => e.action === "blocker.resolve" && e.targetId === "blk-001");
    expect(ev).toBeDefined();
    const blk = s.blockers.find((b) => b.id === "blk-001");
    expect(blk?.resolved).toBe(true);
  });

  it("createBlocker via store produit action=blocker.create", async () => {
    await freshStore();
    await useAppStore.getState().createBlocker(
      {
        workspaceId: "ws-rspir",
        scope: "local",
        workItemIds: ["wi-005"],
        ownerActorId: "act-nathaniel",
        question: "Test question",
        blockingDependency: "Test dep",
      },
      "act-nathaniel",
    );
    const s = useAppStore.getState();
    const ev = s.events.find((e) => e.action === "blocker.create");
    expect(ev).toBeDefined();
  });

  it("toggleFeature via store produit evidence signée et event", async () => {
    await freshStore();
    await useAppStore
      .getState()
      .toggleFeature("cl-1867", "feat-meeting-prep", true, "act-nathaniel");
    const s = useAppStore.getState();
    const ev = s.events.find(
      (e) => e.action === "feature.enable" && e.targetId === "feat-meeting-prep",
    );
    expect(ev).toBeDefined();
    const cl = s.clients.find((c) => c.id === "cl-1867");
    expect(cl?.enabledFeatureIds.includes("feat-meeting-prep")).toBe(true);
  });

  it("createWorkItem via store produit action=work.create", async () => {
    await freshStore();
    const s0 = useAppStore.getState();
    const countBefore = s0.workItems.length;
    await useAppStore.getState().createWorkItem(
      {
        workspaceId: "ws-rspir",
        title: "Test chat work item",
        status: "todo",
        priority: "P2",
        ownerActorId: "act-nathaniel",
        requiredCapabilities: ["worker.code"],
        dependsOn: [],
        risk: "low",
        externalEffect: false,
        acceptanceCriteria: [],
      },
      "act-nathaniel",
    );
    const s = useAppStore.getState();
    expect(s.workItems.length).toBe(countBefore + 1);
    const ev = s.events.find((e) => e.action === "work.create");
    expect(ev).toBeDefined();
  });
});

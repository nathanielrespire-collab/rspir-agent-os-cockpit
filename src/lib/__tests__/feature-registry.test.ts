import { describe, it, expect } from "vitest";
import { computeCoveredCaps } from "@/lib/hooks";
import type { Integration, Provider } from "@/lib/types";

const mockProviders: Provider[] = [
  {
    id: "prv-transcript",
    name: "Fireflies",
    category: "transcripts",
    capabilities: ["transcripts.read", "transcripts.search"],
    state: "mock",
  },
  {
    id: "prv-crm",
    name: "Pipedrive",
    category: "crm",
    capabilities: ["crm.read", "crm.write", "crm.add_note"],
    state: "mock",
  },
  {
    id: "prv-email",
    name: "Gmail",
    category: "email",
    capabilities: ["email.read", "email.draft", "email.send"],
    state: "mock",
  },
];

const mockIntegrations: Integration[] = [
  { id: "int-t", workspaceId: "ws-1", category: "transcripts", providerId: "prv-transcript" },
  { id: "int-c", workspaceId: "ws-1", category: "crm", providerId: "prv-crm" },
  { id: "int-e", workspaceId: "ws-1", category: "email", providerId: "prv-email" },
  { id: "int-other", workspaceId: "ws-2", category: "email", providerId: "prv-email" },
];

describe("computeCoveredCaps", () => {
  it("couvre toutes les caps quand aucune intégration n'est désactivée", () => {
    const caps = computeCoveredCaps(mockIntegrations, mockProviders, "ws-1", []);
    expect(caps.has("transcripts.read")).toBe(true);
    expect(caps.has("crm.read")).toBe(true);
    expect(caps.has("crm.write")).toBe(true);
    expect(caps.has("email.draft")).toBe(true);
  });

  it("exclut les caps d'une intégration désactivée", () => {
    const caps = computeCoveredCaps(mockIntegrations, mockProviders, "ws-1", ["int-t"]);
    expect(caps.has("transcripts.read")).toBe(false);
    expect(caps.has("transcripts.search")).toBe(false);
    expect(caps.has("crm.read")).toBe(true);
    expect(caps.has("email.draft")).toBe(true);
  });

  it("retourne un Set vide si toutes les intégrations du workspace sont désactivées", () => {
    const caps = computeCoveredCaps(mockIntegrations, mockProviders, "ws-1", [
      "int-t",
      "int-c",
      "int-e",
    ]);
    expect(caps.size).toBe(0);
  });

  it("ignore les intégrations d'un autre workspace", () => {
    const caps = computeCoveredCaps(mockIntegrations, mockProviders, "ws-2", []);
    // Only ws-2 integration is int-other → email caps
    expect(caps.has("email.read")).toBe(true);
    expect(caps.has("transcripts.read")).toBe(false);
  });
});

describe("calcul READY/MISSING", () => {
  const featureRequires = ["transcripts.read" as const, "crm.read" as const];

  it("feature est READY quand toutes ses caps sont couvertes", () => {
    const caps = computeCoveredCaps(mockIntegrations, mockProviders, "ws-1", []);
    const missing = featureRequires.filter((c) => !caps.has(c));
    expect(missing).toHaveLength(0);
  });

  it("feature est MISSING quand une cap n'est pas couverte", () => {
    const caps = computeCoveredCaps(mockIntegrations, mockProviders, "ws-1", ["int-t"]);
    const missing = featureRequires.filter((c) => !caps.has(c));
    expect(missing).toContain("transcripts.read");
    expect(missing).not.toContain("crm.read");
  });

  it("désactiver une intégration flips les features dépendantes en MISSING", () => {
    // All active → READY
    const capsActive = computeCoveredCaps(mockIntegrations, mockProviders, "ws-1", []);
    const missingActive = featureRequires.filter((c) => !capsActive.has(c));
    expect(missingActive).toHaveLength(0);

    // Disable transcripts → MISSING:transcripts.read
    const capsDisabled = computeCoveredCaps(mockIntegrations, mockProviders, "ws-1", ["int-t"]);
    const missingDisabled = featureRequires.filter((c) => !capsDisabled.has(c));
    expect(missingDisabled).toContain("transcripts.read");
    expect(missingDisabled).not.toContain("crm.read");
  });

  it("une feature nécessitant uniquement des caps disponibles est toujours READY", () => {
    const emailFeatureRequires = ["email.draft" as const, "crm.read" as const];
    const caps = computeCoveredCaps(mockIntegrations, mockProviders, "ws-1", []);
    const missing = emailFeatureRequires.filter((c) => !caps.has(c));
    expect(missing).toHaveLength(0);
  });

  it("désactiver toutes les intégrations rend toutes les features MISSING", () => {
    const caps = computeCoveredCaps(mockIntegrations, mockProviders, "ws-1", [
      "int-t",
      "int-c",
      "int-e",
    ]);
    const missing = featureRequires.filter((c) => !caps.has(c));
    expect(missing).toHaveLength(featureRequires.length);
  });
});

import { describe, expect, it } from "vitest";

import { append, verifyChain } from "@/lib/signature";
import type { Evidence } from "@/lib/types";

type EvidenceBody = Omit<Evidence, "seq" | "prevHash" | "hash">;

function evBody(n: number): EvidenceBody {
  return {
    id: `ev-test-${n}`,
    workspaceId: "ws-test",
    label: `Evidence entrée ${n}`,
    kind: "check",
    result: "pass",
    createdAt: "2026-01-01T00:00:00Z",
  };
}

async function buildChain(count: number): Promise<Evidence[]> {
  const chain: Evidence[] = [];
  for (let i = 0; i < count; i++) {
    chain.push(await append<Evidence>(chain, evBody(i)));
  }
  return chain;
}

describe("Ledger — intégrité de la chaîne", () => {
  it("chaîne intacte → verifyChain retourne null (indicateur ok)", async () => {
    const chain = await buildChain(6);
    expect(await verifyChain(chain)).toBeNull();
  });

  it("entrée altérée → indicateur rompu, pointe la bonne entrée", async () => {
    const chain = await buildChain(6);
    // Simuler une altération de l'entrée d'index 2
    chain[2] = { ...chain[2], label: "Contenu falsifié après coup" };
    const broken = await verifyChain(chain);
    expect(broken).toBe(2);
  });

  it("le seq de la première entrée rompue correspond à l'index retourné", async () => {
    const chain = await buildChain(6);
    const targetIdx = 3;
    chain[targetIdx] = { ...chain[targetIdx], label: "Falsifié" };
    const broken = await verifyChain(chain);
    expect(broken).toBe(targetIdx);
    // seq est contigu depuis 0: chain[idx].seq === idx pour une chaîne intègre initiale
    expect(chain[broken!].seq).toBe(targetIdx);
  });

  it("rupture cascade: la première rupture est détectée, pas la suivante", async () => {
    const chain = await buildChain(6);
    // Altérer l'entrée à l'index 1 → la rupture doit être à 1, pas à 2+
    chain[1] = { ...chain[1], label: "Falsifié" };
    expect(await verifyChain(chain)).toBe(1);
  });

  it("re-vérification recalcule réellement (pas de valeur mémorisée)", async () => {
    const chain = await buildChain(5);

    // Premier appel: chaîne intacte
    const first = await verifyChain(chain);
    expect(first).toBeNull();

    // Altérer une entrée et rappeler: doit retourner l'index rompu, pas null
    chain[2] = { ...chain[2], label: "Falsifié" };
    const second = await verifyChain(chain);
    expect(second).toBe(2);
  });

  it("chaîne vide → intacte", async () => {
    expect(await verifyChain([])).toBeNull();
  });
});

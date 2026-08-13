import { describe, expect, it } from "vitest";

import {
  GENESIS_HASH,
  append,
  canonicalize,
  chainTip,
  hashEntry,
  shortHash,
  sign,
  verifyChain,
} from "./signature";
import type { Decision } from "./types";

type DecisionBody = Omit<Decision, "seq" | "prevHash" | "hash">;

function body(title: string): DecisionBody {
  return {
    id: `dec-${title}`,
    workspaceId: "ws-rspir",
    at: "2026-01-01T00:00:00.000Z",
    byActorId: "actor-nathaniel",
    title,
    rationale: `Parce que ${title}`,
    immutable: true,
  };
}

async function buildChain(titles: string[]): Promise<Decision[]> {
  const chain: Decision[] = [];
  for (const title of titles) {
    chain.push(await append<Decision>(chain, body(title)));
  }
  return chain;
}

describe("canonicalize", () => {
  it("ignore l'ordre d'écriture des clés", () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
  });

  it("préserve l'ordre des tableaux", () => {
    expect(canonicalize([1, 2])).not.toBe(canonicalize([2, 1]));
  });

  it("traite un champ undefined comme un champ absent", () => {
    expect(canonicalize({ a: 1, b: undefined })).toBe(canonicalize({ a: 1 }));
  });

  it("refuse les nombres non finis", () => {
    expect(() => canonicalize({ a: Number.NaN })).toThrow();
  });
});

describe("sign", () => {
  it("produit un SHA-256 hexadécimal de 64 caractères", async () => {
    const signed = await sign<Decision>({ ...body("a"), seq: 0 }, GENESIS_HASH);
    expect(signed.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("est déterministe: même contenu et même prevHash donnent le même hash", async () => {
    const first = await sign<Decision>({ ...body("a"), seq: 0 }, GENESIS_HASH);
    const second = await sign<Decision>({ ...body("a"), seq: 0 }, GENESIS_HASH);
    expect(second.hash).toBe(first.hash);
  });

  it("dépend de prevHash: le même contenu greffé ailleurs donne un hash différent", async () => {
    const onGenesis = await sign<Decision>({ ...body("a"), seq: 0 }, GENESIS_HASH);
    const onOther = await sign<Decision>({ ...body("a"), seq: 0 }, "f".repeat(64));
    expect(onOther.hash).not.toBe(onGenesis.hash);
  });
});

describe("chainTip", () => {
  it("ancre une chaîne vide sur GENESIS_HASH", () => {
    expect(chainTip([])).toEqual({ seq: 0, prevHash: GENESIS_HASH });
  });

  it("pointe sur la dernière entrée", async () => {
    const chain = await buildChain(["a", "b"]);
    expect(chainTip(chain)).toEqual({ seq: 2, prevHash: chain[1].hash });
  });
});

describe("verifyChain", () => {
  it("accepte une chaîne valide", async () => {
    const chain = await buildChain(["a", "b", "c"]);
    expect(await verifyChain(chain)).toBeNull();
  });

  it("accepte une chaîne vide ou à une seule entrée", async () => {
    expect(await verifyChain([])).toBeNull();
    expect(await verifyChain(await buildChain(["a"]))).toBeNull();
  });

  it("détecte une entrée dont le contenu a été modifié", async () => {
    const chain = await buildChain(["a", "b", "c"]);
    chain[1] = { ...chain[1], rationale: "raison réécrite après coup" };
    expect(await verifyChain(chain)).toBe(1);
  });

  it("détecte un hash bricolé pour coller au contenu modifié", async () => {
    const chain = await buildChain(["a", "b", "c"]);
    const forged = { ...chain[1], rationale: "raison réécrite après coup" };
    chain[1] = { ...forged, hash: await hashEntry(forged, forged.prevHash) };

    // L'entrée réécrite est cohérente avec elle-même: un hash non chaîné ne verrait rien.
    expect(await verifyChain([chain[1]])).toBeNull();
    // Mais elle ne porte plus le hash sur lequel la suivante s'est greffée.
    expect(await verifyChain(chain)).toBe(2);
  });

  it("détecte une entrée supprimée", async () => {
    const chain = await buildChain(["a", "b", "c"]);
    expect(await verifyChain([chain[0], chain[2]])).toBe(1);
  });

  it("détecte une réorganisation", async () => {
    const chain = await buildChain(["a", "b", "c"]);
    expect(await verifyChain([chain[0], chain[2], chain[1]])).toBe(1);
  });

  it("détecte une première entrée non ancrée sur GENESIS_HASH", async () => {
    const orphan = await sign<Decision>({ ...body("a"), seq: 0 }, "f".repeat(64));
    expect(await verifyChain([orphan])).toBe(0);
  });
});

describe("shortHash", () => {
  it("tronque sans altérer le hash de référence", async () => {
    const chain = await buildChain(["a"]);
    expect(shortHash(chain[0].hash)).toBe(chain[0].hash.slice(0, 12));
  });
});

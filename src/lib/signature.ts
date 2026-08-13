/**
 * Signature et chaînage des entrées append-only (SPEC: intégrité vérifiable).
 *
 * Principe: chaque entrée porte `seq`, `prevHash` et `hash`, où
 *
 *     hash = SHA-256( "rspir-sig-v1" + canonicalize(corps) + prevHash )
 *
 * `corps` = l'entrée privée de `hash` et `prevHash`; `prevHash` est ensuite concaténé
 * explicitement, séparateurs inclus.
 *
 * Un hash non chaîné ne prouve rien: quiconque réécrit le contenu recalcule son hash et la
 * falsification passe inaperçue. C'est le chaînage qui porte la preuve — `prevHash` entrant dans
 * le calcul, toucher une entrée invalide son hash ET tous les suivants. `verifyChain()` rend cette
 * rupture visible en retournant l'index de la première entrée invalide.
 *
 * Ce mécanisme est une détection, pas une protection: sans clé secrète, un adversaire qui contrôle
 * tout le journal peut le re-signer intégralement. Il rend la réécriture détectable par quiconque
 * a conservé un hash antérieur, ce qui est exactement le besoin du ledger d'evidence.
 */

import type { ChainedSignature } from "./types";

/** `prevHash` de la première entrée d'une chaîne. */
export const GENESIS_HASH = "0".repeat(64);

/** Étiquette de domaine: empêche qu'un hash calculé ailleurs soit rejouable ici. */
const DOMAIN = "rspir-sig-v1";

/** Une entrée telle qu'écrite avant signature: le contenu et son rang, sans les hashs. */
export type Unsigned<T extends ChainedSignature> = Omit<T, "prevHash" | "hash">;

/** Position courante d'une chaîne: ce sur quoi la prochaine entrée doit se greffer. */
export interface ChainTip {
  seq: number;
  prevHash: string;
}

/**
 * Sérialisation canonique déterministe.
 *
 * Clés d'objet triées (ordre des unités de code UTF-16), ordre des tableaux préservé (il porte du
 * sens), champs `undefined` omis — un champ absent et un champ `undefined` sont indiscernables
 * après un aller-retour JSON, ils doivent donc produire le même hash.
 */
export function canonicalize(value: unknown): string {
  if (value === null) return "null";

  const kind = typeof value;

  if (kind === "string" || kind === "boolean") return JSON.stringify(value);

  if (kind === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`canonicalize: nombre non fini (${String(value)})`);
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }

  if (kind === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort();
    const pairs = keys.map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
    return `{${pairs.join(",")}}`;
  }

  throw new Error(`canonicalize: type non sérialisable (${kind})`);
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Le corps hashé: tout sauf les hashs eux-mêmes. `seq` en fait partie. */
function bodyOf(entry: object): Record<string, unknown> {
  const record = entry as Record<string, unknown>;
  const body: Record<string, unknown> = {};
  for (const key of Object.keys(record)) {
    if (key === "hash" || key === "prevHash") continue;
    body[key] = record[key];
  }
  return body;
}

/** Calcule le hash d'un corps greffé sur `prevHash`. */
export function hashEntry(entry: object, prevHash: string): Promise<string> {
  return sha256Hex(`${DOMAIN}\n${canonicalize(bodyOf(entry))}\n${prevHash}`);
}

/**
 * Signe une entrée en la greffant sur `prevHash`.
 * Le `seq` doit déjà être posé par l'appelant (voir `chainTip`).
 */
export async function sign<T extends ChainedSignature>(
  entry: Unsigned<T>,
  prevHash: string,
): Promise<T> {
  const hash = await hashEntry(entry, prevHash);
  return { ...entry, prevHash, hash } as T;
}

/**
 * Position sur laquelle greffer la prochaine entrée d'une chaîne.
 * Chaîne vide → `seq` 0 et `GENESIS_HASH`.
 */
export function chainTip(entries: readonly ChainedSignature[]): ChainTip {
  if (entries.length === 0) return { seq: 0, prevHash: GENESIS_HASH };
  const last = entries[entries.length - 1];
  return { seq: last.seq + 1, prevHash: last.hash };
}

/** Signe une entrée en la greffant sur la fin de `entries`. Ne mute pas `entries`. */
export function append<T extends ChainedSignature>(
  entries: readonly ChainedSignature[],
  body: Omit<Unsigned<T>, "seq">,
): Promise<T> {
  const tip = chainTip(entries);
  return sign<T>({ ...body, seq: tip.seq } as Unsigned<T>, tip.prevHash);
}

/**
 * Vérifie l'intégrité d'une chaîne complète, dans l'ordre.
 *
 * Retourne l'index de la PREMIÈRE entrée rompue, ou `null` si la chaîne est intacte.
 * Une entrée est rompue si son `seq` ne suit pas, si son `prevHash` ne pointe pas sur le `hash`
 * précédent, ou si son `hash` ne correspond pas à son contenu recalculé.
 *
 * L'ancrage `GENESIS_HASH` n'est exigé que si la chaîne commence à `seq` 0 — une tranche
 * verifiable ne commençant pas au début reste vérifiable en interne.
 */
export async function verifyChain(entries: readonly ChainedSignature[]): Promise<number | null> {
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];

    if (index === 0) {
      if (entry.seq === 0 && entry.prevHash !== GENESIS_HASH) return index;
    } else {
      const previous = entries[index - 1];
      if (entry.seq !== previous.seq + 1) return index;
      if (entry.prevHash !== previous.hash) return index;
    }

    if ((await hashEntry(entry, entry.prevHash)) !== entry.hash) return index;
  }

  return null;
}

/** Hash court pour l'affichage (Plex Mono). Le hash complet reste la référence. */
export function shortHash(hash: string, length = 12): string {
  return hash.slice(0, length);
}

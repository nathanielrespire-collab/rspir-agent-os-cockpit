# BUILD-016 — Knowledge + Notion sync

## Objectif

SPEC §13+16. Trois mémoires distinctes; Notion = vue publiée, jamais canonique.

## Scope IN

- Trois onglets: CURRENT STATE (dérivé live du store), DECISION MEMORY (journal append-only),
  KNOWLEDGE MEMORY (items avec source, timestamp, client, provenance, confiance, fraîcheur, liens).
- Panneau Notion: direction Agent OS → Notion, last sync, pages updated, sync failures (mock).
- **Intégrité de la DECISION MEMORY** (via `src/lib/signature.ts`, ne pas réimplémenter):
  - chaque décision affiche son horodatage, son `seq` et son `hash` court (`shortHash()`) en
    Plex Mono, hash complet accessible;
  - indicateur d'état de chaîne en tête d'onglet: **intacte** ou **rompue** avec la première
    entrée en rupture;
  - bouton "Revérifier la chaîne" (`verifyChain()`, async, état de chargement, horodatage de la
    dernière vérification).
  - Même composant d'indicateur que BUILD-009 — le réutiliser, ne pas en écrire un second.
- Copy i18n FR/EN via `t()`.

## Acceptance

Decision memory sans édition possible; chaque knowledge item affiche provenance et fraîcheur.
Chaîne intacte sur les fixtures → indicateur ok; une décision altérée dans l'état fait passer
l'indicateur à rompu et pointe la bonne entrée.

## Evidence

Screenshots des trois mémoires + panneau Notion + indicateur de chaîne de la decision memory.

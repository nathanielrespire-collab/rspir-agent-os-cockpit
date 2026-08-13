# BUILD-016 — Knowledge + Notion sync

## Objectif

SPEC §13+16. Trois mémoires distinctes; Notion = vue publiée, jamais canonique.

## Scope IN

- Trois onglets: CURRENT STATE (dérivé live du store), DECISION MEMORY (journal append-only),
  KNOWLEDGE MEMORY (items avec source, timestamp, client, provenance, confiance, fraîcheur, liens).
- Panneau Notion: direction Agent OS → Notion, last sync, pages updated, sync failures (mock).

## Acceptance

Decision memory sans édition possible; chaque knowledge item affiche provenance et fraîcheur.

## Evidence

Screenshots des trois mémoires + panneau Notion.

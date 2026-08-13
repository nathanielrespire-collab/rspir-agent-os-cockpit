# BUILD-000 — La machine se prouve elle-même

## Objectif

Prouver le chemin doré complet du pipeline sur un changement trivial, et durcir la machine.

## Scope IN

- `npm install` → committer `package-lock.json`. Réparer toute incompatibilité de versions du squelette.
- Faire passer `npm run check` et `npm run e2e` en local ET dans les gates.
- Ajouter un marqueur visible "BUILD-000 ✓" dans App.tsx (preuve du changement trivial).
- Durcir les workflows SEULEMENT si un défaut mécanique t'empêche de finir (mandat explicite:
  cette unité PEUT toucher `.github/workflows/` et `tools/queue.mjs` pour les réparer, en expliquant chaque fix dans la PR).
- Documenter dans la PR tout écart découvert (ex: déclencheurs, permissions, caches à ajouter).

## Scope OUT

Aucune feature produit. Aucun composant UI au-delà du marqueur.

## Acceptance

Pipeline complet sans humain: builder → gates PASS → review APPROVE → merge → BUILD-001 dispatché.

## Evidence

Screenshot de `/` avec le marqueur; verdict gates JSON vert; run review visible.

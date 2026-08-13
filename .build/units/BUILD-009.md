# BUILD-009 — Evidence Ledger

## Objectif

SPEC §22. Historique immuable, séparé de l'état courant.

## Scope IN

- Ledger global filtrable (client, acteur, type); entrée = exécution complète
  SELECT→CLAIM→EXECUTE→VERIFY→UPDATE avec horodatage, acteurs, IDs externes, PASS/FAIL.
- Rendu "registre" (Plex Mono, lignes denses, aspect immuable); lien depuis tout item "done".
- **Intégrité de la chaîne** (via `src/lib/signature.ts`, ne pas réimplémenter):
  - chaque ligne affiche son `seq` et son `hash` court (`shortHash()`, 12 car.) en Plex Mono,
    hash complet accessible (title/copie) — le court sert à l'œil, le complet fait foi;
  - indicateur d'état de chaîne en tête de ledger: **intacte** (statut ok) ou **rompue** (statut err)
    avec l'index et le `seq` de la première entrée en rupture, et les entrées à partir de là
    marquées visuellement;
  - bouton "Revérifier la chaîne" qui relance `verifyChain()` et affiche l'horodatage de la dernière
    vérification. La vérification est async: état de chargement pendant le calcul.
- Copy i18n FR/EN via `t()`; l'indicateur ne dit jamais "vérifié" sans avoir recalculé les hashs.

## Scope OUT

Aucune réparation de chaîne: le ledger constate, il ne corrige pas.

## Acceptance

Toute exécution des fixtures est retrouvable; aucun bouton d'édition sur le ledger.
Chaîne intacte sur les fixtures → indicateur ok. Test vitest: en altérant une entrée de l'état,
l'indicateur passe à rompu et pointe la bonne entrée. Le bouton de revérification recalcule
réellement (pas de valeur mémorisée).

## Evidence

Screenshots ledger + une exécution dépliée + indicateur de chaîne dans les deux états
(intacte et rompue).

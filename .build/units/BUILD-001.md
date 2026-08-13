# BUILD-001 — Shell, navigation, thèmes, i18n, palette de commandes

## Objectif

Coquille applicative complète: le squelette dans lequel tous les écrans vivront.

## Scope IN

- Layout: sidebar dense (18 zones de SPEC §MAIN NAVIGATION, icônes lucide, ordre exact), topbar
  (sélecteur workspace stub, toggle FR/EN, toggle dark/light, sélecteur de rôle: Nathaniel/Manny/Antoine/Agent).
- Routes placeholders pour les 18 zones (`src/routes/`), chacune avec titre i18n + état vide propre ("invitation à agir").
- i18n réel: `t()` + dictionnaires fr/en + persistance du choix; thème via `data-theme` persisté.
- Palette de commandes (Cmd+K): navigation vers toutes les zones (actions viendront plus tard).
- shadcn/ui: installer utilitaires (cn) + composants de base nécessaires (button, card, badge, dialog, input, table).
- Toutes les routes ajoutées à `e2e/routes.json`.

## Scope OUT

Aucune donnée, aucun contenu d'écran réel.

## Acceptance

Navigation clavier complète entre 18 zones; FR/EN change toutes les strings visibles; dark/light OK;
Cmd+K navigue; aucune string en dur; aucun hex en dur.

## Evidence

Screenshots des 18 routes (dark) + home en light et en EN.

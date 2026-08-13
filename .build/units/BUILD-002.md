# BUILD-002 — Store, persistance locale, fixtures démo complètes

## Objectif

Le monde de données du cockpit: état canonique typé + jeu démo crédible en français.

## Scope IN

- `src/lib/store.ts`: zustand + persist(localStorage), hydraté depuis les fixtures au premier run,
  bouton "Réinitialiser la démo" dans Settings. Sélecteurs par workspace (isolation client).
- `src/lib/fixtures/`: implémentation COMPLÈTE de types.ts, en FR, clients fictifs
  (Gestion Bellerive, Films Casseau, Boutique 1867), équipe (Nathaniel, Manny, Antoine), 6 agents,
  ~30 work items sur tous les statuts, 4 projets (dont un "tasks 100% / transferable NO"),
  blockers locaux+1 global résolu, 5 approvals, 8 exécutions avec evidence complète
  (SELECT→CLAIM→EXECUTE→VERIFY→UPDATE), meetings avec transcripts mock, deals CRM, automations,
  websites, knowledge (3 couches), decisions journal, providers RSPIR (MOCK), features, policies,
  workspace B Microsoft (pré-généré, désactivé). Cohérence croisée des IDs obligatoire.
- Actions du store: create/update work item, assign, approve/reject, create blocker, resolve,
  toggle feature, swap provider — avec écriture d'Event + Evidence à chaque mutation conséquente.

## Scope OUT

Aucun écran (les zones consomment le store dans les unités suivantes).

## Acceptance

`store.test.ts` (vitest): hydratation, isolation par workspace, chaque action mutante produit son Event;
reset démo restaure l'état initial. Typecheck strict sans any.

## Evidence

Tests verts dans les gates; taille et cohérence des fixtures décrites dans la PR.

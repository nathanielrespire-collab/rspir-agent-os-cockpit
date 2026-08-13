# BUILD-004 — Work: file opérationnelle unifiée
## Objectif
SPEC §2. La file de travail avec la distinction OWNER vs ASSIGNED.
## Scope IN
- Table dense filtrable (statut, client, projet, priorité, acteur, risque, effet externe) + tri;
  pilules de statut (les 9); vue kanban optionnelle simple.
- Panneau latéral work item: tous les champs SPEC §2, capabilities requises, dépendances,
  blocker lié, acceptance criteria, artifacts, evidence, historique d'activité, mini-spine d'état.
- Actions: créer un work item (formulaire), assigner humain/agent (policy affichée), changer statut
  (transitions valides seulement — done exige evidence).
## Acceptance
Transition vers done sans evidence impossible (UI + store); OWNER ≠ ASSIGNED visibles partout;
filtres cumulables; ajout routes e2e.
## Evidence
Screenshots table + panneau; test store des transitions invalides.

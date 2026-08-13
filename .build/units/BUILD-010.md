# BUILD-010 — Integrations + Capability Registry
## Objectif
SPEC §15+18. Providers = données; readiness "rspir doctor".
## Scope IN
- Integrations: catégories SPEC §15, cartes provider (état MOCK/CONNECTED/NOT_CONFIGURED, auth,
  capabilities, permissions, santé, dernier check, bouton Replace provider → ouvre le flux de BUILD-019 en stub).
- Capability Registry: table doctor CORE/STATE puis capability → provider → statut, section FEATURES
  READY/MISSING (calculée depuis features×capabilities du store, pas codée en dur).
## Acceptance
Désactiver un provider (action store) fait passer les features dépendantes à MISSING en live.
## Evidence
Screenshots des deux écrans + démonstration MISSING dans la PR.

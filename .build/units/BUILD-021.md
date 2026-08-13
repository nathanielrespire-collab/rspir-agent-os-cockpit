# BUILD-021 — Simulation du runtime + scénario démo
## Objectif
SPEC §37. Rendre la boucle vivante et le scénario Lundi→Vendredi rejouable.
## Scope IN
- Mode "Simulation" (Settings ou bouton Home): fait avancer le temps par étapes scriptées du
  scénario §37; chaque étape mute le store via les actions réelles (events, evidence, approvals,
  spine qui bouge, swap mercredi, décision jeudi, bilan vendredi).
- Contrôles: play/pause/step/reset; bandeau SIMULATION.
## Acceptance
Le scénario complet se rejoue sans erreur après reset; chaque étape est visible dans Evidence.
## Evidence
Screenshots de 3 moments du scénario + test du script de simulation.

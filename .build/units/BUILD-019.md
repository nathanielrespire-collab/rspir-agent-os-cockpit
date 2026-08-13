# BUILD-019 — Agent Builder + workspace B + provider swap
## Objectif
SPEC §19+26+27. La duplication, concept central.
## Scope IN
- Wizard 10 étapes (Company→Deployment) avec le client Microsoft prérempli; sortie: plan de
  déploiement (workspace, providers, agents, policies, features, credentials manquants, acceptance,
  statut). Provisioning MOCK étiqueté.
- Génère/active le workspace B (fixtures BUILD-002): mêmes features, providers Microsoft.
- Provider Swap: flux Fireflies→Google Meet — compatibilité par capability PASS, features affectées,
  acceptance 7/7 PASS, bouton SWITCH → provider remplacé dans le store, doctor mis à jour.
## Acceptance
Après le wizard, le sélecteur de workspace montre le client Microsoft fonctionnel; après le swap,
Meetings fonctionne toujours et affiche le nouveau provider.
## Evidence
Screenshots wizard, plan généré, workspace B, flux swap complet.

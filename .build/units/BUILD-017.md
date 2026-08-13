# BUILD-017 — Chat assistant (couche de commandes réelle)
## Objectif
SPEC §14 + décision gelée: commandes réelles, langage simulé étiqueté SIMULATION.
## Scope IN
- Panneau chat global (raccourci + bouton): parseur de commandes déterministe (FR et EN) couvrant au
  minimum: naviguer, chercher un objet, créer work item, assigner, approuver/rejeter, créer blocker,
  résoudre blocker, toggle feature, préparer un brief meeting (assemblage store), "pourquoi X est
  bloqué", "quelle evidence prouve X".
- Avant tout effet: carte de confirmation — action demandée, acteur, capability, policy, approbation
  requise → exécute via LES MÊMES actions du store que les boutons. Jamais de bypass.
- Réponses en langage naturel = templates, bandeau permanent SIMULATION; intentions non comprises →
  suggestions de commandes (pas de fausse IA).
## Acceptance
Chaque commande produit exactement le même Event/Evidence que le chemin bouton (tests);
policy FORBIDDEN → refus affiché avec la règle.
## Evidence
Screenshots conversation avec confirmation de commande + refus policy; tests parseur.

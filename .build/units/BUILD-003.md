# BUILD-003 — Home / Command Center + spine du runtime
## Objectif
L'écran le plus important (SPEC §1) + la signature visuelle du produit.
## Scope IN
- Bandeau TODAY: unités actives, agents au travail, items vérifiés aujourd'hui, décisions requises,
  blockers externes/globaux (données du store).
- YOUR ATTENTION (Or): uniquement ce qui requiert l'humain, avec temps de review estimé, action au clic.
- SYSTEM WORKING NOW (Laiton): acteurs + travail courant + progression/état de vérification.
- RECENT VERIFIED WORK: chaque item cliquable montre sa preuve (drawer evidence).
- SPINE DU RUNTIME (signature): composant réutilisable `RuntimeSpine` — la boucle RECONCILE→…→CONTINUE,
  états live par work item ou vue agrégée, sobre, animée avec retenue, reduced-motion respecté.
## Acceptance
Zéro liste de tâches brute; tout clic mène à l'objet; spine réutilisable exportée; i18n/tokens stricts.
## Evidence
Screenshots home dark+light; screenshot du drawer evidence ouvert.

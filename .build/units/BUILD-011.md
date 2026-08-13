# BUILD-011 — Feature Registry
## Objectif
SPEC §17. Catalogue de features avec capabilities requises.
## Scope IN
- Catalogue: description, capabilities requises (et quel provider les satisfait), version,
  workspaces activés, statut acceptance, READY/MISSING:<cap>.
- Enable/disable par workspace → Event; fiche feature détaillée.
## Acceptance
READY/MISSING dérivé du même calcul que BUILD-010 (une seule source); toggle persiste.
## Evidence
Screenshots catalogue + fiche; test du calcul READY/MISSING.

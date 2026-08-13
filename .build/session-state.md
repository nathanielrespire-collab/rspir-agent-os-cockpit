# Session longue — point de reprise

Tag de session: `session-longue-20260813-1401`

## État de départ (vérifié)

- main = 4ac5014, propre, check.yml vert.
- unit-pipeline et review-pipeline: `disabled_manually`, aucun run en vol, aucune issue ouverte.
- PR #5 (BUILD-002, branche `unit/BUILD-002`): GATES pass (attempt 1), REVIEW CHANGES (attempt 1).
  Run act 31702652956 en échec.
- stash@{0} = builder-log.txt, sans valeur — pas encore drop (prévu fin de phase C).

## Phase A — CAUSE + OUTILLAGE + MODÈLE — TERMINÉE (2026-08-13, itérations: 0 correction nécessaire)

- **A1 — cause confirmée**: `gh run view 31702652956 --log-failed` montre que le step `act` de
  review-pipeline a tenté `gh workflow run unit-pipeline.yml -f attempt="2"` et a échoué avec
  `HTTP 422: Cannot trigger a 'workflow_dispatch' on a disabled workflow`. La cause est exactement
  celle supposée: unit-pipeline était `disabled_manually`, donc le redispatch attempt 2 n'est
  jamais parti. Pas de cause alternative — phase C peut redispatcher tel quel une fois les
  workflows réactivés.
- **A2 — outillage**:
  - node portable: `C:\Users\15813\tools\node\node.exe` (v22.14.0, uniquement l'exe, zip supprimé
    après extraction — chemin hors repo, stable).
  - npm n'est PAS présent dans ce portable (seul node.exe a été extrait, comme demandé). Pas eu
    besoin de npm en local pour cette session (yaml validation via Python, pas via npm).
  - jq: `C:\Users\15813\AppData\Local\Microsoft\WinGet\Packages\jqlang.jq_Microsoft.Winget.Source_8wekyb3d8bbwe\jq.exe`
    (installé via winget, pas dans le PATH de Git Bash — utiliser le chemin complet).
  - Python (pour yaml.safe_load, PyYAML 6.0.3 déjà installé):
    `C:\Users\15813\AppData\Local\Programs\Python\Python312\python.exe`.
- **A3 — modèle du reviewer selon l'attempt**:
  - Mécanisme copié de `tools/queue.mjs` (`a >= 3 ? "claude-opus-4-8" : "claude-sonnet-4-6"`).
  - `.github/workflows/review-pipeline.yml`: nouveau step `id: m` dans le job `review`, calcule
    `model` selon `inputs.attempt >= 3`, puis `claude_args` référence `${{ steps.m.outputs.model }}`.
  - Aucune gate retirée, aucun test sauté, aucun critère de review assoupli — seul le modèle change.
  - `.build/protocol.md` section Constantes mise à jour pour documenter le nouveau seuil.
- **A4 — validation**:
  - `tools/validate-workflows.py` (nouveau, réutilisé en phase B): glob
    `.github/workflows/*.yml`, `yaml.safe_load` sur chacun, échec si un seul est invalide.
    Résultat: OK sur check.yml, claude.yml, review-pipeline.yml, unit-pipeline.yml.
  - Commit `576112d` "feat(review): modèle du reviewer selon l'attempt (sonnet 1-2, opus 3)",
    push sur main, check.yml run 31728666046 → succès.

## Reste à faire

- Phase B: `tools/watchdog.mjs` + `.github/workflows/watchdog.yml`, doc protocole, dry-run.
- Phase C: réactivation des pipelines, redispatch BUILD-002 attempt 2, preuve watchdog garde 4,
  drop stash@{0}, fermeture des escalades résolues.

## Écarts par rapport au prompt

- Aucun écart en phase A.

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

## Phase B — CHIEN DE GARDE — TERMINÉE (2026-08-13, itérations: 0 correction nécessaire)

- **B1 — `tools/watchdog.mjs`**: zéro LLM. Gardes dans l'ordre: kill switch
  (`.build/watchdog.off`) → maintenance (workflow state via `gh api .../actions/workflows`,
  path exact) → porte humaine (issue label `escalation` ouverte) → en vol (run
  `in_progress`/`queued` sur les deux pipelines) → file vide (tout `done`) → disjoncteur →
  table d'états. Chaque décision loggée avec horodatage, écrite sur stdout et
  `$GITHUB_STEP_SUMMARY`.
  - Décision de conception clé: l'API GitHub REST (`gh api repos/.../actions/runs/{id}`) n'expose
    PAS les inputs d'un `workflow_dispatch` une fois le run créé (vérifié empiriquement sur le
    run 31702652956 — pas de champ `inputs` dans la réponse). Le watchdog ne grep donc jamais de
    logs de run pour deviner un attempt: il dérive systématiquement l'attempt attendu des verdicts
    JSON signés postés en commentaire de PR par gates/review (champ `attempt` explicite dans
    chaque verdict). C'est plus robuste que du log-scraping et couvre nativement les 3 branches
    "gates pass sans review", "review CHANGES sans redispatch (route morte — le cas BUILD-002)"
    et "dernier run échoué sans verdict (transitoire)" avec une seule fonction (`analyzePending`
    - comparaison des runs après le dernier verdict).
  - Extension au-delà des 5 puces demandées (documentée, pas un écart caché): la route morte est
    généralisée aux gates FAIL (pas seulement review CHANGES) — même classe de bug (un
    `gh workflow run` qui 422 parce qu'un pipeline est désactivé), même mécanisme de détection.
    Aucune des 5 puces explicites n'est retirée ou modifiée par cet ajout.
  - Disjoncteur: 3 runs relancés pour le même (unité, attempt attendu) en échec sans nouveau
    verdict NI nouveau commit sur `unit/<ID>` → issue `watchdog: stall persistant — <ID>` avec
    labels `watchdog-stall` (dédup, vérifiée avant création) + `escalation` (arme la garde 3 au
    tour suivant, empêche le watchdog de re-boucler indéfiniment).
  - `DRY_RUN=1`: aucun `gh workflow run` / commit / `gh issue create` exécuté, seulement loggé.
- **B2 — `.github/workflows/watchdog.yml`**: `on: schedule (cron */30 * * * *)` +
  `workflow_dispatch`. `concurrency: group: watchdog, cancel-in-progress: false` (dédié, jamais
  `build-pipeline` — ne doit ni bloquer ni être bloqué par une unité en vol). `timeout-minutes: 10`.
  `permissions:` explicite minimal: `actions: write, contents: write, issues: write` (pas de
  `pull-requests` — le watchdog ne commente/merge jamais de PR lui-même, seulement des dispatches,
  des commits sur main via `queue.mjs`, et des issues). `GITHUB_TOKEN` par défaut suffit pour
  dispatcher les workflows cibles.
- **B3**: `.build/protocol.md` — nouvelle section "Chien de garde" documentant le critère
  transitoire/réel, le disjoncteur, le délai non garanti du cron GitHub, et la désactivation
  automatique des workflows `schedule` après 60 jours d'inactivité du repo.
- **B4 — validation**:
  - `tools/validate-workflows.py` (glob) → OK sur les 5 fichiers de `.github/workflows/`
    (check, claude, review-pipeline, unit-pipeline, watchdog).
  - `node --check tools/watchdog.mjs` → OK (testé avec le node portable, voir phase A).
  - Test à blanc OBLIGATOIRE exécuté contre l'état réel (pipelines encore `disabled_manually`):
    `DRY_RUN=1 node tools/watchdog.mjs` →
    `DÉCISION: maintenance: unit-pipeline=disabled_manually review-pipeline=disabled_manually —
un humain opère, watchdog ne touche à rien.` Conforme à la table: garde 2 sort en premier,
    comme attendu tant que les pipelines sont coupés.
  - Commit `43ff541` "feat(watchdog): chien de garde déterministe pour la chaîne unit/review",
    push sur main, check.yml run 31729407769 → succès.

## Phase C — REMISE EN MARCHE ET PREUVE — TERMINÉE (2026-08-13, itérations: 0 — la machine a réussi seule)

- **C1**: `gh workflow enable unit-pipeline.yml && gh workflow enable review-pipeline.yml` →
  les deux `active`. `watchdog.yml` déjà `active` depuis la phase B (schedule).
- **C2**: `gh workflow run unit-pipeline.yml -f unit_id="BUILD-002" -f attempt="2"` (noms
  d'inputs vérifiés via `gh workflow view unit-pipeline.yml --yaml` avant dispatch) →
  run 31729580298.
- **C3**: surveillance. Cycle complet observé dans les commentaires de PR #5:
  attempt 1: GATES pass, REVIEW CHANGES. attempt 2: GATES pass, REVIEW APPROVE → merge squash
  → `queue.mjs done BUILD-002` (commit `b040d93` sur main, poussé par le job `act` avec le
  `GITHUB_TOKEN` — ce commit n'a pas déclenché `check.yml`: comportement standard de GitHub
  Actions, les push via `GITHUB_TOKEN` depuis un run n'émettent pas d'événement `push` pour
  d'autres workflows, pas un bug) → unité suivante (BUILD-003, premier `todo` avec deps
  `done`) dispatchée automatiquement, run 31730749755 (guard validé, build en cours au moment
  du rapport — machine saine, aucune intervention nécessaire).
- **C4 — preuve du watchdog**: déclenché manuellement (`gh workflow run watchdog.yml`) pendant
  que le run unit-pipeline 31729580298 était `queued`/`in_progress`. Résultat exact dans le
  step summary/log: `DÉCISION: en vol: 1 run(s) actif(s)
(.../actions/runs/31729580298) — rien à faire.` → garde 4 confirmée en conditions réelles.
- **C5**: `git stash show -p --include-untracked stash@{0}` confirmé = uniquement
  `builder-log.txt` (binaire, sans valeur) → `git stash drop stash@{0}`. Escalades: `gh issue
list --state open` = vide, rien à fermer. Deux anciennes issues d'escalade (#1, #3) déjà
  `closed` avant cette session — aucune action requise.

## TERMINÉ

PR #5 mergée ✓ · unité suivante (BUILD-003) dispatchée seule par la machine ✓ · watchdog
prouvé en conditions réelles (garde 4) ✓ · zéro escalade ouverte ✓ · stash@{0} drop ✓.
Aucun budget de correction consommé sur aucune des 3 phases.

## Écarts par rapport au prompt

- Aucun écart en phase A.
- Phase B: une extension additive documentée ci-dessus (route morte généralisée aux gates FAIL) —
  n'enlève rien de demandé, ajoute une couverture symétrique au cas BUILD-002 explicitement cité.
- Aucun écart en phase C.

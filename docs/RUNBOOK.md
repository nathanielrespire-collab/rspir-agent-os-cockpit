# RUNBOOK — quirks connus et plans B

## Mécanique GitHub

- Les événements créés avec `GITHUB_TOKEN` ne déclenchent PAS d'autres workflows (anti-boucle
  GitHub). Le pipeline est conçu autour de ça: gates dans le MÊME run que le builder, et
  enchaînement par `workflow_dispatch` (exception documentée qui fonctionne avec GITHUB_TOKEN).
- Si un enchaînement `gh workflow run` refusait de partir: créer un fine-grained PAT
  (repo scope: actions write + contents write), le mettre en secret `PIPELINE_PAT`, et dans
  les jobs `route`/`act` remplacer `GH_TOKEN: ${{ github.token }}` par le PAT. BUILD-000 a le
  mandat d'appliquer ce genre de fix.
- Branch protection sur main: laisser OFF au début (le pipeline committe queue.json sur main).
  Si activée plus tard: autoriser le bypass pour github-actions.

## Pipeline

- Une unité à la fois (concurrency `build-pipeline`) — voulu, pas un bug.
- Attempts: 1 initial + 2 corrections max (attempt 3 = builder passe à Opus), puis escalade.
- Preuves par PR: commentaire GATES (JSON), artifacts screenshots, review APPROVE.
- Relance manuelle toujours possible: Actions → unit-pipeline → Run workflow → unit_id, attempt 1.
- État de la file: `.build/queue.json` (statuts done committés sur main par le pipeline).

## Claude

- Builder/repair: Sonnet (`claude-sonnet-4-6`). Review: Opus (`claude-opus-4-8`).
  Attempt 3: builder sur Opus. Tout passe par le secret `CLAUDE_CODE_OAUTH_TOKEN` (abonnement).
- Canal ad hoc: écrire `@claude <consigne>` dans n'importe quelle issue/PR du repo.
- Si l'action `anthropics/claude-code-action@v1` change ses entrées: voir sa doc; BUILD-000
  et les escalades couvrent l'ajustement.

## Coûts / quota

- Aucune facture API: tout roule sur l'abonnement via OAuth token. Les runs consomment du quota
  Claude (Sonnet surtout) + minutes GitHub Actions (repo privé: 2000 min/mois gratuites — si
  ça bloque, passer le repo public ou upgrader).

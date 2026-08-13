# SETUP — 10 minutes, une seule fois

Après ça, la machine roule seule. Ta seule interaction: répondre aux issues `escalation`.

## 1. Créer le repo

Sur GitHub (compte `nathanielrespire-collab`): **New repository** → `rspir-agent-os-cockpit`
→ Private → **sans** README/gitignore (repo vide).

## 2. Pousser le bootstrap

Dézipper le paquet, puis dans le dossier:

```bash
git init && git add -A && git commit -m "bootstrap: machine + contrats + squelette"
git branch -M main
git remote add origin git@github.com:nathanielrespire-collab/rspir-agent-os-cockpit.git
git push -u origin main
```

(ou HTTPS si tu n'as pas de clé SSH: `https://github.com/nathanielrespire-collab/rspir-agent-os-cockpit.git`)

## 3. Permissions Actions (REQUIS — sinon rien ne merge)

Repo → **Settings → Actions → General → Workflow permissions**:

- cocher **Read and write permissions**
- cocher **Allow GitHub Actions to create and approve pull requests**
- Save.

## 4. Connecter Claude (token abonnement, zéro facture API)

Dans un terminal, à la racine du repo cloné:

```bash
claude
/install-github-app
```

Choisir ce repo → suivre le flow → quand le choix du secret arrive, prendre l'option
**OAuth token (abonnement Claude)**. Ça installe l'app GitHub et enregistre le secret
`CLAUDE_CODE_OAUTH_TOKEN` dans le repo.

Plan B manuel: `claude setup-token` → copier le token → Repo → Settings → Secrets and
variables → Actions → **New repository secret** → nom `CLAUDE_CODE_OAUTH_TOKEN`.

Note: `/install-github-app` propose de committer un workflow d'exemple — refuse ou écrase-le,
le repo a déjà son `claude.yml`.

## 5. Kickoff

Repo → **Actions** → workflow **unit-pipeline** → **Run workflow** →
`unit_id`: `BUILD-000` → Run.

## 6. C'est tout

- BUILD-000 = la machine se prouve elle-même (build → gates → review Opus → merge → BUILD-001
  part tout seul). Premier run ~10-20 min (installation Playwright incluse).
- Suivi: onglet Actions (runs), PRs (verdicts + screenshots en artifacts).
- La machine ne te parle que par issues **escalation** (assignées à toi). Tu réponds dans
  l'issue (`@claude` peut exécuter ta consigne), puis tu relances: Actions → unit-pipeline →
  Run workflow → l'unité indiquée.

## Vercel (optionnel, quand tu veux la démo publique)

vercel.com → Add New Project → importer le repo → framework Vite (auto) → Deploy.
Chaque merge sur main redéploie. BUILD-022 finalise la config.

# RSPIR Agent OS — Cockpit

Prototype web du poste de pilotage RSPIR Agent OS: humains + agents + preuves, dans une seule
interface. Construit par un pipeline autonome (Claude Code + GitHub Actions) unité par unité.

- **Spec produit**: `SPEC.md` · **Constitution**: `CLAUDE.md` · **Machine**: `.build/protocol.md`
- **Démarrage**: `docs/SETUP.md` (10 min) · **Dépannage**: `docs/RUNBOOK.md`
- **File de build**: `.build/queue.json` + contrats dans `.build/units/`

Local: `npm install` puis `npm run dev`. Qualité: `npm run check` + `npm run e2e`.

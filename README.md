# RSPIR Agent OS — Cockpit

A control plane for running a company with humans, agents, and software — not a prettier task manager.

RSPIR Agent OS is a web prototype demonstrating what a real operational cockpit looks like when humans and AI agents work together: every action has an actor, a policy, and verifiable evidence. No agent acts without a trace. No task is "done" without proof.

Built by an autonomous pipeline (Claude Code + GitHub Actions) unit by unit, from spec to deploy.

## What it demonstrates

| Criterion | Screen |
|---|---|
| What Agent OS is | [Home](/), [Agents](/agents) |
| What is running right now | [Work](/work) |
| What needs human attention | [Approvals](/approvals), [Blockers](/blockers) |
| Which agent does what | [Agents](/agents), [Agent Builder](/agent-builder) |
| How completion is proven | [Evidence](/evidence) |
| Why a task is blocked | [Blockers](/blockers) |
| How providers are interchangeable | [Agent Builder](/agent-builder), [Integrations](/integrations) |
| How a feature is enabled per client | [Features](/features), [Clients](/clients) |
| How a client installation is duplicated | [Clients](/clients), [Agent Builder](/agent-builder) |
| How security and approvals constrain agents | [Security](/security), [Policies](/policies), [Approvals](/approvals) |

All 10 criteria are navigable from the [Build Zone](/build) checklist.

## Key concepts

- **Evidence-first**: every consequential action records who requested it, who executed it, under which policy, with what result. A "done" item without evidence is a bug.
- **Policy engine**: capabilities are gated by human/agent roles. The chat assistant shows the policy before executing any mutation.
- **Provider abstraction**: agents are bound to capabilities, not specific tools. Swap Fireflies → Google Meet without breaking the meeting prep feature.
- **Feature registry**: features are enabled per client workspace, not hardcoded. Enable `meeting-prep` for Bellerive, keep it off for Casseau.
- **Simulation mode**: replay a Monday→Friday demo scenario step by step, watching the store mutate through real actions.

## Stack

- **Vite + React 18 + TypeScript strict** — no framework magic
- **Tailwind CSS 3.4 + shadcn/ui** — design system tokens in `src/styles/tokens.css`
- **Zustand + localStorage** — persistent demo state, no backend
- **IBM Plex Sans / Mono** — UI and data typography
- **Dark/light themes** — `data-theme` on `<html>`, tokens only, no hard-coded hex
- **i18n** — FR/EN, all strings via `t()`, no external library

## Running locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + build + tests
npm run e2e          # Playwright screenshots → e2e/shots/
```

## Demo data

Fictional clients only (public demo): **Gestion Bellerive**, **Films Casseau**, **Boutique 1867**.
Team: Nathaniel (owner), Manny (operator), Antoine (collaborator), plus AI agents.
All data is local — no network calls, no secrets.

Reset the demo at any time from [Settings](/settings).

## Deploy (Vercel)

1. Import this repo at vercel.com → framework: **Vite** (auto-detected)
2. `vercel.json` handles client-side routing rewrites — no extra config needed
3. Every merge to `main` redeploys automatically

See `docs/SETUP.md` for the full setup guide and `docs/RUNBOOK.md` for troubleshooting.

## References

- **Product spec**: `SPEC.md`
- **Build constitution**: `CLAUDE.md`
- **Autonomous pipeline**: `.build/protocol.md`
- **Build queue**: `.build/queue.json` + unit contracts in `.build/units/`

# RSPIR Agent OS — Product Specification (frozen)

Source: Nathaniel, August 2026. This is the canonical product spec for the cockpit prototype.
Frozen decisions layered on top: bilingual FR/EN (demo data in FR), fictional clients, public demo,
RSPIR palette (Ardoise/Or/Laiton), zero backend, chat = real command layer + simulated language labeled SIMULATION.

Product name: RSPIR Agent OS

Build a polished, production-minded web application prototype for an autonomous operations system
for small and medium businesses. This is NOT a generic project management app. The product is an
operational operating system that coordinates: humans; AI agents; projects; tasks; meetings; CRM;
email; documents; automations; websites; approvals; blockers; evidence; business knowledge.

The core product question: "What useful work can advance now, who or what should do it, and how can
the system prove that it is actually completed?"

The application should feel like: company operating system; autonomous project manager; AI agent
control center; team dispatcher; client workspace; integration hub; evidence/audit system.
Do NOT make it look like a generic Jira clone.

## PRODUCT PRINCIPLES

1. Agents stateless, system stateful.
2. Deterministic core, probabilistic edge.
3. An agent saying "done" is never proof.
4. Verified work before completion.
5. Local blocker does not stop unrelated work.
6. Human intervention only when genuinely necessary.
7. Providers must be replaceable.
8. Core business logic must not depend directly on vendor names.
9. Current state and historical evidence are separate concepts.
10. External effects require explicit policy.
11. Every important action should be auditable.
12. The system should keep working when the dashboard is closed.

## PRIMARY USERS

Business owner/director; project manager; employee; AI agent/operator; consultant; future client
administrator. Example users: Nathaniel (owner), Manny (operator), Antoine (collaborator), AI workers.

## CORE RUNTIME MODEL

Full loop: INGEST → NORMALIZE → RECONCILE → UNDERSTAND → PLAN → SELECT → CLAIM → CONTEXT → POLICY
→ EXECUTE → VERIFY → UPDATE → OBSERVE → CONTINUE.
Simplified operational loop: RECONCILE → SELECT → CLAIM → CONTEXT → POLICY → EXECUTE → VERIFY →
UPDATE → CONTINUE. The UI should help a user understand where work currently is in this lifecycle.

## MAIN NAVIGATION

1 Home · 2 Work · 3 Projects · 4 Clients · 5 Team · 6 Agents · 7 Approvals · 8 Blockers · 9 Meetings
· 10 CRM · 11 Automations · 12 Websites · 13 Knowledge · 14 Integrations · 15 Evidence · 16 Analytics
· 17 Agent Builder · 18 Settings

## 1. HOME / COMMAND CENTER

Most important screen. No overwhelming task list. Show TODAY: work running; verified work completed;
work waiting validation; local blockers; global blockers; decisions required.
Sections: YOUR ATTENTION (only things requiring the human, with estimated review time);
SYSTEM WORKING NOW (each actor + current work + progress/verification state);
RECENT VERIFIED WORK (every completed item displays proof: who, evidence artifacts, checks PASS).

## 2. WORK

Unified operational queue. Statuses: todo, ready, claimed, running, verification, a_valider,
blocked, failed, done. Each item: title; client; project; priority; owner class; assigned actor;
required capabilities; dependencies; blocker; estimated duration; risk level; external effect;
acceptance criteria; artifacts; evidence; activity history.
Key distinction: OWNER = responsible for completion. ASSIGNED = executing now.

## 3. PROJECTS

Show actual progress; verified deliverables; blockers; dependencies; next admissible work; team;
automation activity; client status. Do NOT equate completion with task counts. Include
TRANSFERABILITY / OPERATIONAL READINESS (e.g. Tasks 100%, Operational 82%, Transferable NO + reason).

## 4. CLIENTS

Isolated workspace per client: projects; contacts; meetings; CRM records; files; knowledge; policies;
enabled features; providers; agents; approvals; evidence; activity. Clients must feel isolated.

## 5. TEAM

Humans and agents share a common Actor model: name; type (Human / AI Agent / Service / Automation);
role; capabilities; permissions; workload; assigned work; availability; cost; recent outcomes.

## 6. AGENTS

Agent Control Center. Roles: Architect/Planner; Code Builder; Ops Worker; Researcher; Reviewer;
Security Reviewer; Website Builder; Automation Builder. Example mappings: Architect→ChatGPT,
Code Builder→Claude Code, Ops→Claude Cowork, Website→Claude Design, Automation→Make.
Each agent: current assignment; capabilities; allowed actions; provider; health; last run; success
rate; verification pass rate; recent failures. Not a swarm — explicit roles and capabilities.

## 7. APPROVALS

Clean approval inbox. Human sees only decisions requiring human judgment (client-facing method,
financial commitment, contractual commitment, high-risk deletion, external publishing, sensitive CRM
changes). Each approval: what decision; why human needed; effect if approved; effect if rejected;
available evidence; expected review time. Prefer concrete choices over vague "please review".

## 8. BLOCKERS

LOCAL (item blocked, other work continues) vs GLOBAL (nothing independent can continue). Each:
who; exact question; blocking dependency; next verification; work continuing meanwhile; default
decision if allowed; escalation date; history. Prominently show WORK CONTINUING WHILE WAITING.

## 9. MEETINGS

Meeting intelligence. Initial provider Fireflies; future Google Meet / Teams / Zoom.
Capabilities: transcripts.read, transcripts.search, meeting.read, meeting.process.
Flow: calendar event → preparation → meeting → transcript → decisions → tasks → blockers → CRM
update → follow-up draft. Before: context, recent comms, previous commitments, CRM info, open
questions, suggested agenda. After: decisions, commitments, tasks, facts, blockers, suggested
updates, evidence citations.

## 10. CRM

First provider Pipedrive, but UI/architecture says CRM, not Pipedrive. Capabilities: crm.read,
crm.search, crm.write, crm.create_activity, crm.add_note. Replaceable: HubSpot, Salesforce, other.
Screens: pipeline, deals, contacts, companies, activities, recent agent actions. Every AI-generated
CRM change displays: proposed by / executed by / verified by / external record ID.

## 11. AUTOMATIONS

Initial provider Make; future n8n, Zapier, Power Automate. Automation Builder. Capabilities:
automation.inspect/build/edit/test/deploy/run. Page: name, provider, status, trigger, inputs,
actions, test status, production status, version, last run, failures, evidence.
Lifecycle: Draft → Test → Verified → Approved → Deployed.

## 12. WEBSITES

Initial builder Claude Design; replaceable. Capabilities: website.inspect/build/edit/test/deploy/
verify. Screens: sites, pages, components, deployments, tests, analytics, issues. Every deployment
includes verification: live URL, HTTP response, form test, integration test, deployment ID.

## 13. KNOWLEDGE / MEMORY

Three separate layers. CURRENT STATE (what is true now). DECISION MEMORY (append-only journal of
why decisions were made). KNOWLEDGE MEMORY (people, facts, documents, meeting history, decisions,
CRM context). Every knowledge item: source, timestamp, client, provenance, confidence, freshness,
related objects. Not built around a vector database.

## 14. INTERNAL CHAT AGENT

Embedded business chat. Examples: "What is blocking Gestion D. Roy?", "Prepare my meeting tomorrow",
"Assign this to Manny", "Build an automation for this", "Why was this marked complete?", "What
evidence proves this?". Architecture: CHAT → Agent OS Core → capabilities/policies → action. Chat
must NOT bypass permissions or edit raw data. Before consequential action show: requested action,
actor, capability, policy result, approval requirement.
Frozen decision: command layer is REAL (same action layer as buttons); language generation is
SIMULATED and labeled SIMULATION. Real API wiring is a later phase behind protected access.

## 15. INTEGRATIONS

Provider management. Categories: email, calendar, files, contacts, meetings/transcripts, CRM,
automation, website, knowledge publishing, source control, code worker, ops worker, reasoning model,
notifications. Initial mappings: Gmail, Google Calendar, Google Drive, Google Contacts, Fireflies,
Pipedrive, Make, Claude Design, Notion, GitHub, Claude Code, Claude Cowork, ChatGPT.
Each provider: connected state, authentication, capabilities, permissions, health, last check,
replace provider action. States: MOCK / CONNECTED / NOT_CONFIGURED — never pretend a mock is real.

## 16. NOTION

Human-facing published view (team/personal/client tasks, projects, blockers, approvals). NOT the
canonical database. Sync direction: Agent OS → Notion. Show last sync, pages updated, sync failures.

## 17. FEATURE REGISTRY

Feature catalog. Each feature: description; required capabilities; providers satisfying them;
version; enabled workspaces; acceptance test status; READY or MISSING:<capability>.
Examples: meeting-prep (calendar.read, contacts.read, transcripts.search, files.search, crm.read →
meeting_brief); sales-followup (transcripts.read, crm.read, crm.write, email.draft).

## 18. CAPABILITY REGISTRY

System readiness page ("rspir doctor"): CORE OK / STATE OK, then capability → provider → status
table, then FEATURES with READY/MISSING. Visually clear and useful.

## 19. AGENT BUILDER

Major feature. Wizard (Deployment Factory): 1 Company, 2 Team, 3 Providers, 4 Capabilities,
5 Policies, 6 Features, 7 Agents, 8 Permissions, 9 Acceptance tests, 10 Deployment. Example new
client on Microsoft stack (Outlook, M365, OneDrive, HubSpot, Teams, Power Automate, SharePoint).
Generates deployment plan: workspace, providers, agents, policies, features, missing credentials,
acceptance tests, deployment status. Mock provisioning only.

## 20. SECURITY CENTER

Identity, permissions, secrets, provider access, agent permissions, external-effect policies,
security findings (HIGH/MEDIUM/LOW with concrete examples), audit history. Concepts: least
privilege, workspace isolation, secret protection, prompt injection protection, external content =
data, approval requirements, provider health, supply-chain security.

## 21. POLICY ENGINE UI

Understandable rules per capability: AUTO / APPROVAL REQUIRED / FORBIDDEN / HUMAN ONLY, with
conditions (e.g. crm.write AUTO for internal notes, APPROVAL for high-value deal stage changes).
Policies per workspace/client.

## 22. EVIDENCE

Evidence Ledger. Per execution: SELECT (why chosen) → CLAIM (by whom) → EXECUTE (what) → VERIFY
(checks + external IDs + PASS/FAIL) → UPDATE (state change). Immutable-looking history, separate
from current state.

## 23. ANALYTICS

Verified work completed; human decisions required; agent work completed; verification failure rate;
avg time to verified completion; local blockers bypassed; global blocked time; agent retries;
external-effect approvals; automation value. Cost/value: AI cost, automation cost, human time saved,
estimated operational value. No fake precision.

## 24. BUILD / SYSTEM EVOLUTION

Lightweight developer area: current version, build pipeline, features under development, provider
adapters, acceptance tests, system health. Philosophy: SPEC → BUILD → TEST → VERIFY → REVIEW →
DEPLOY. Builders: Architect ChatGPT, Code Claude Code, Website Claude Design, Automation Make, Ops
Claude Cowork. Independent verification: CI. Agent-Builder-created components pass the same lifecycle.

## 25. SELF-IMPROVEMENT

Improvement Proposals screen. Observed repetition → proposal (estimated setup vs monthly savings) →
Investigate / Approve Build / Reject → Agent Builder → build pipeline → test → security → verify →
deploy. Never uncontrolled self-modification of the core.

## 26. CLIENT DUPLICATION

Two workspaces demonstrated: RSPIR (Google/Gmail/Fireflies/Pipedrive/Make/Notion/Claude) and a
Microsoft-stack client (M365/Teams/OneDrive/HubSpot/Power Automate/SharePoint). Same features,
different providers. Extremely important concept.

## 27. PROVIDER SWAP UI

Flow: replace transcript provider Fireflies → Google Meet. Show capability compatibility (PASS per
capability), features affected (compatible), acceptance tests 7/7 PASS, then SWITCH PROVIDER.

## 28. VISUAL DESIGN

Premium, serious, operational, modern, technical but approachable, dark/light, dense but not
cluttered. Think Linear, Vercel, Raycast, GitHub, modern enterprise control center. Strong
typography; compact cards; status pills; clean data tables; command palette; contextual side
panels; activity timeline; keyboard-friendly. Desktop first; mobile focuses on approvals, blockers,
current work, chat, notifications.
Frozen: palette Ardoise/Or/Laiton (tokens.css), IBM Plex Sans + IBM Plex Mono, FR/EN toggle.

## 29. DEMO DATA

Realistic, believable, in French. FICTIONAL clients only (frozen decision — public demo):
"Gestion Bellerive", "Films Casseau", "Boutique 1867". Team: Nathaniel, Manny, Antoine. Agents:
ChatGPT Architect, Claude Code Builder, Claude Cowork Ops, Claude Design Website Builder, Make
Automation Builder, Security Reviewer. Believable projects, tasks, blockers, meetings, deals,
automation runs, evidence. No lorem ipsum.

## 30. FUNCTIONAL PROTOTYPE REQUIREMENTS

Interactive minimum: create project; create work item; assign human/agent; change provider config;
create blocker; add approval; approve/reject; inspect evidence; open chat; create feature;
enable/disable feature; run Agent Builder wizard; inspect capability registry; provider swap
simulation; create automation draft; create website build draft; view CRM; view meeting summary;
view execution timeline. Persist state locally (localStorage).

## 31. DATA MODEL

Entities: Workspace, Client, Project, Task, Blocker, Actor, Role, Capability, Permission,
Assignment, Provider, Integration, Feature, Policy, Approval, Meeting, Transcript, Contact,
Company, Deal, Automation, Website, Artifact, Evidence, Execution, Event, KnowledgeItem, Decision,
Build, Agent. Avoid provider-specific fields in core entities. Canonical: `src/lib/types.ts`.

## 32. PROVIDER ABSTRACTION

Interfaces/adapters: EmailProvider, CalendarProvider, FileProvider, TranscriptProvider, CRMProvider,
AutomationProvider, WebsiteProvider, KnowledgeProvider, SourceControlProvider, WorkerProvider.
Simple adapters, no over-engineered plugin framework.

## 33. MOCK VS REAL

Mocks acceptable; boundaries clean; label MOCK / CONNECTED / NOT_CONFIGURED; never pretend fake is
real; mocks replaceable by real adapters later.

## 34. SECURITY REQUIREMENTS

No hardcoded secrets; no client-side API keys; design for env secrets, OAuth, server-side calls,
workspace isolation, least privilege. Every consequential action retains: requested_by, executed_by,
provider, timestamp, result, evidence.

## 35. NON-GOALS

No Kubernetes, no microservices, no arbitrary swarm, no blockchain, Notion not canonical, no vector
DB unless necessary, no hardcoding around Claude/Pipedrive/Make/Google, no fake AI pretending to be
autonomous, no completion without evidence.

## 36. IMPLEMENTATION PHASES

PHASE 1 shell: navigation, dashboard, clients, projects, work, team, agents, blockers, approvals,
evidence. PHASE 2 providers: integrations, capability registry, feature registry, CRM, meetings,
automations, websites. PHASE 3 advanced: Agent Builder, policy center, security, memory, chat,
analytics, provider swap. PHASE 4 behavior: execution lifecycle, verify/update, blocker handling,
feature execution, deployment factory. Coherent working product over simultaneous everything.

## 37. FINAL DEMO SCENARIO

Monday: client response unblocks work → task selected → Ops Agent executes → system verifies →
complete. Code task → Claude Code assigned → CI verifies. Blocked task waits for Antoine; other
work continues. Tuesday: meeting → Fireflies transcript → decisions/tasks extracted → CRM updated →
Gmail follow-up draft. Wednesday: Fireflies swapped for Google Meet; Meeting Prep still works.
Thursday: one human decision in Approvals; everything else continues. Friday: evidence shows what
completed; project not "operational" just because checkboxes are done. Then Agent Builder: new
client on the Microsoft stack → second workspace, same core features, different providers.
Understandable from the UI without documentation.

## 38. SUCCESS CRITERIA

Someone can immediately understand: what Agent OS is; what is running; what needs human attention;
which agent does what; how completion is proven; why a task is blocked; how providers are
interchangeable; how a feature is enabled; how a client installation is duplicated; how security
and approvals constrain agents. Feels like a control plane for running a company with humans +
agents + software. Not a prettier task manager.

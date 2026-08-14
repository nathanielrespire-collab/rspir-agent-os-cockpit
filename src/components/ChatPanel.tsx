import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Send, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/hooks";
import { useUIStore, useAppStore } from "@/lib/store";
import { parseCommand } from "@/lib/chatParser";
import type { ParsedCommand } from "@/lib/chatParser";
import type {
  CapabilityId,
  PolicyRule,
  Policy,
  Approval,
  Blocker,
  WorkItem,
  Meeting,
  Feature,
  Client,
  Actor,
  Id,
} from "@/lib/types";

export const CHAT_OPEN_EVENT = "rspir:chat:open";

export function dispatchChatOpen() {
  document.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT));
}

type Role = "Nathaniel" | "Manny" | "Antoine" | "Agent";

const ROLE_ACTOR_MAP: Record<Role, Id> = {
  Nathaniel: "act-nathaniel",
  Manny: "act-manny",
  Antoine: "act-antoine",
  Agent: "act-clio",
};

// ─── Capability per command kind ──────────────────────────────────────────

const CMD_CAPABILITY: Partial<Record<ParsedCommand["kind"], CapabilityId>> = {
  create_work_item: "worker.code",
  assign: "worker.code",
  approve: "contract_commitment",
  reject: "contract_commitment",
  create_blocker: "worker.ops",
  resolve_blocker: "worker.ops",
  toggle_feature: "knowledge.publish",
};

// ─── Policy helpers ────────────────────────────────────────────────────────

function lookupPolicy(policies: Policy[], workspaceId: Id, cap: CapabilityId): PolicyRule {
  return (
    policies.find((p) => p.workspaceId === workspaceId && p.capability === cap)?.rule ?? "auto"
  );
}

function lookupPolicyObject(
  policies: Policy[],
  workspaceId: Id,
  cap: CapabilityId,
): Policy | undefined {
  return policies.find((p) => p.workspaceId === workspaceId && p.capability === cap);
}

function isBlocked(rule: PolicyRule, role: Role): boolean {
  if (rule === "forbidden") return true;
  // human_only blocks the Agent persona
  if (rule === "human_only" && role === "Agent") return true;
  return false;
}

// ─── Ref resolution helpers ────────────────────────────────────────────────

function findApproval(approvals: Approval[], ref: string): Approval | null {
  const lo = ref.toLowerCase();
  return (
    approvals.find((a) => a.id.toLowerCase() === lo) ??
    approvals.find((a) => a.id.toLowerCase().includes(lo)) ??
    approvals.find((a) => a.title.toLowerCase().includes(lo)) ??
    null
  );
}

function findBlocker(blockers: Blocker[], ref: string): Blocker | null {
  const lo = ref.toLowerCase();
  return (
    blockers.find((b) => b.id.toLowerCase() === lo) ??
    blockers.find((b) => b.id.toLowerCase().includes(lo)) ??
    blockers.find((b) => b.question.toLowerCase().includes(lo)) ??
    null
  );
}

function findWorkItem(workItems: WorkItem[], ref: string): WorkItem | null {
  const lo = ref.toLowerCase();
  return (
    workItems.find((w) => w.id.toLowerCase() === lo) ??
    workItems.find((w) => w.id.toLowerCase().includes(lo)) ??
    workItems.find((w) => w.title.toLowerCase().includes(lo)) ??
    null
  );
}

function findActor(actors: Actor[], ref: string): Actor | null {
  const lo = ref.toLowerCase();
  return (
    actors.find((a) => a.id.toLowerCase() === lo) ??
    actors.find((a) => a.name.toLowerCase() === lo) ??
    actors.find((a) => a.name.toLowerCase().includes(lo)) ??
    null
  );
}

function findFeature(features: Feature[], ref: string): Feature | null {
  const lo = ref.toLowerCase();
  return (
    features.find((f) => f.id.toLowerCase() === lo) ??
    features.find((f) => f.key.toLowerCase() === lo) ??
    features.find((f) => f.key.toLowerCase().includes(lo)) ??
    features.find((f) => f.name.fr.toLowerCase().includes(lo)) ??
    null
  );
}

function findClient(clients: Client[], ref: string): Client | null {
  const lo = ref.toLowerCase();
  return (
    clients.find((c) => c.id.toLowerCase() === lo) ??
    clients.find((c) => c.id.toLowerCase().includes(lo)) ??
    clients.find((c) => c.name.toLowerCase().includes(lo)) ??
    null
  );
}

function findMeeting(meetings: Meeting[], ref: string): Meeting | null {
  const lo = ref.toLowerCase();
  return (
    meetings.find((m) => m.id.toLowerCase() === lo) ??
    meetings.find((m) => m.id.toLowerCase().includes(lo)) ??
    meetings.find((m) => m.title.toLowerCase().includes(lo)) ??
    null
  );
}

// ─── Message types ─────────────────────────────────────────────────────────

type UserMsg = { id: string; kind: "user"; text: string };
type AssistantMsg = { id: string; kind: "assistant"; text: string };
type InfoMsg = { id: string; kind: "info"; title: string; lines: string[] };
type SuggestionsMsg = { id: string; kind: "suggestions" };
type ForbiddenMsg = {
  id: string;
  kind: "forbidden";
  capability: CapabilityId;
  rule: PolicyRule;
  condition?: { fr: string; en: string };
};
type ResultMsg = { id: string; kind: "result"; text: string };

type ChatMsg = UserMsg | AssistantMsg | InfoMsg | SuggestionsMsg | ForbiddenMsg | ResultMsg;
type ChatMsgInput =
  | Omit<UserMsg, "id">
  | Omit<AssistantMsg, "id">
  | Omit<InfoMsg, "id">
  | Omit<SuggestionsMsg, "id">
  | Omit<ForbiddenMsg, "id">
  | Omit<ResultMsg, "id">;

interface PendingAction {
  description: string;
  actor: string;
  capability: CapabilityId;
  policy: PolicyRule;
  condition?: { fr: string; en: string };
  execute: () => Promise<void>;
}

let msgCounter = 0;
function nextId() {
  return `msg-${++msgCounter}`;
}

// ─── Suggestion list ───────────────────────────────────────────────────────

const SUGGESTIONS_FR = [
  "naviguer vers work",
  "chercher Bellerive",
  "créer un work item Refonte CRM",
  "assigner wi-009 à Manny",
  "approuver apr-001",
  "rejeter apr-002",
  "créer un blocker Décision requise pour wi-010",
  "résoudre le blocker blk-001",
  "activer feature meeting-prep pour client bellerive",
  "préparer un brief pour la réunion mtg-001",
  "pourquoi wi-010 est bloqué",
  "quelle evidence prouve wi-007",
];

const SUGGESTIONS_EN = [
  "navigate to work",
  "search for Bellerive",
  "create work item CRM Overhaul",
  "assign wi-009 to Manny",
  "approve apr-001",
  "reject apr-002",
  "create blocker Need legal sign-off for wi-010",
  "resolve blocker blk-001",
  "enable feature meeting-prep for client bellerive",
  "prepare meeting brief mtg-001",
  "why is wi-010 blocked",
  "what evidence proves wi-007",
];

// ─── ChatPanel ─────────────────────────────────────────────────────────────

export function ChatPanel() {
  const t = useT();
  const navigate = useNavigate();
  const { lang: uiLang, role: uiRole } = useUIStore();
  const store = useAppStore();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [executing, setExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Ctrl+Shift+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen((v) => !v);
    document.addEventListener("keydown", onKey);
    document.addEventListener(CHAT_OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener(CHAT_OPEN_EVENT, onOpen);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, pending]);

  function addMsg(msg: ChatMsgInput) {
    setMessages((prev) => [...prev, { ...msg, id: nextId() } as ChatMsg]);
  }

  // ─── Command executor ────────────────────────────────────────────────────

  async function handleSubmit(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setInput("");

    addMsg({ kind: "user", text });

    const cmd = parseCommand(text, uiLang);
    const actorId = ROLE_ACTOR_MAP[uiRole];
    const wsId = store.activeWorkspaceId;

    // ── Read-only commands (no confirmation needed) ──────────────────────

    if (cmd.kind === "navigate") {
      navigate(cmd.path);
      addMsg({ kind: "assistant", text: t("chat_nav_done") });
      return;
    }

    if (cmd.kind === "search") {
      navigate(`/work?q=${encodeURIComponent(cmd.query)}`);
      addMsg({ kind: "assistant", text: `${t("chat_search_results")}: "${cmd.query}"` });
      return;
    }

    if (cmd.kind === "why_blocked") {
      const wi = findWorkItem(store.workItems, cmd.workItemRef);
      if (!wi) {
        addMsg({ kind: "result", text: `${t("chat_ref_not_found")} "${cmd.workItemRef}"` });
        return;
      }
      const blk = wi.blockerId ? store.blockers.find((b) => b.id === wi.blockerId) : null;
      if (!blk) {
        addMsg({
          kind: "info",
          title: `${t("chat_why_blocked_title")}: ${wi.title}`,
          lines: [t("chat_no_blocker")],
        });
        return;
      }
      addMsg({
        kind: "info",
        title: `${t("chat_why_blocked_title")}: ${wi.title}`,
        lines: [blk.question, blk.blockingDependency, blk.defaultDecision ?? ""].filter(Boolean),
      });
      return;
    }

    if (cmd.kind === "what_evidence") {
      const wi = findWorkItem(store.workItems, cmd.targetRef);
      const evIds = wi?.evidenceIds ?? [];
      if (!wi || evIds.length === 0) {
        addMsg({
          kind: "info",
          title: `${t("chat_evidence_title")} "${cmd.targetRef}"`,
          lines: [t("chat_no_evidence")],
        });
        return;
      }
      const evItems = store.evidence.filter((e) => evIds.includes(e.id));
      addMsg({
        kind: "info",
        title: `${t("chat_evidence_title")} ${wi.title}`,
        lines: evItems.map((e) => `[${e.kind}] ${e.label} — ${e.result ?? "—"}`),
      });
      return;
    }

    if (cmd.kind === "meeting_brief") {
      const mtg = findMeeting(store.meetings, cmd.meetingRef);
      if (!mtg?.prep) {
        addMsg({ kind: "result", text: `${t("chat_ref_not_found")} "${cmd.meetingRef}"` });
        return;
      }
      addMsg({
        kind: "info",
        title: `${t("chat_meeting_brief_title")}: ${mtg.title}`,
        lines: [
          mtg.prep.context,
          ...mtg.prep.suggestedAgenda.map((a) => `• ${a}`),
          ...mtg.prep.openQuestions.map((q) => `? ${q}`),
        ],
      });
      return;
    }

    if (cmd.kind === "unknown") {
      addMsg({ kind: "assistant", text: t("chat_unknown") });
      addMsg({ kind: "suggestions" });
      return;
    }

    // ── Mutating commands — policy check then confirmation card ──────────

    const cap = CMD_CAPABILITY[cmd.kind];
    if (!cap) {
      addMsg({ kind: "assistant", text: t("chat_unknown") });
      return;
    }

    const rule = lookupPolicy(store.policies, wsId, cap);
    const policyObj = lookupPolicyObject(store.policies, wsId, cap);

    if (isBlocked(rule, uiRole)) {
      addMsg({
        kind: "forbidden",
        capability: cap,
        rule,
        condition: policyObj?.condition,
      });
      return;
    }

    // Build PendingAction per command kind
    if (cmd.kind === "create_work_item") {
      setPending({
        description: `${t("chat_confirm_create_wi")} "${cmd.title}"`,
        actor: uiRole,
        capability: cap,
        policy: rule,
        condition: policyObj?.condition,
        execute: async () => {
          await store.createWorkItem(
            {
              workspaceId: wsId,
              title: cmd.title,
              status: "todo",
              priority: "P2",
              ownerActorId: actorId,
              requiredCapabilities: ["worker.code"],
              dependsOn: [],
              risk: "low",
              externalEffect: false,
              acceptanceCriteria: [],
            },
            actorId,
          );
        },
      });
      return;
    }

    if (cmd.kind === "assign") {
      const wi = findWorkItem(store.workItems, cmd.workItemRef);
      const actor = findActor(store.actors, cmd.actorRef);
      if (!wi) {
        addMsg({ kind: "result", text: `${t("chat_ref_not_found")} "${cmd.workItemRef}"` });
        return;
      }
      if (!actor) {
        addMsg({ kind: "result", text: `${t("chat_ref_not_found")} "${cmd.actorRef}"` });
        return;
      }
      setPending({
        description: `${t("chat_confirm_assign")} "${wi.title}" → ${actor.name}`,
        actor: uiRole,
        capability: cap,
        policy: rule,
        condition: policyObj?.condition,
        execute: async () => {
          await store.assignWorkItem(wi.id, actor.id, actorId);
        },
      });
      return;
    }

    if (cmd.kind === "approve") {
      const apr = findApproval(store.approvals, cmd.approvalRef);
      if (!apr) {
        addMsg({ kind: "result", text: `${t("chat_ref_not_found")} "${cmd.approvalRef}"` });
        return;
      }
      if (apr.status !== "pending") {
        addMsg({
          kind: "result",
          text: t("chat_approval_already_decided")
            .replace("{id}", apr.id)
            .replace("{status}", apr.status),
        });
        return;
      }
      setPending({
        description: `${t("chat_confirm_approve")} "${apr.title}"`,
        actor: uiRole,
        capability: cap,
        policy: rule,
        condition: policyObj?.condition,
        execute: async () => {
          await store.approveApproval(apr.id, actorId);
        },
      });
      return;
    }

    if (cmd.kind === "reject") {
      const apr = findApproval(store.approvals, cmd.approvalRef);
      if (!apr) {
        addMsg({ kind: "result", text: `${t("chat_ref_not_found")} "${cmd.approvalRef}"` });
        return;
      }
      if (apr.status !== "pending") {
        addMsg({
          kind: "result",
          text: t("chat_approval_already_decided")
            .replace("{id}", apr.id)
            .replace("{status}", apr.status),
        });
        return;
      }
      setPending({
        description: `${t("chat_confirm_reject")} "${apr.title}"`,
        actor: uiRole,
        capability: cap,
        policy: rule,
        condition: policyObj?.condition,
        execute: async () => {
          await store.rejectApproval(apr.id, actorId);
        },
      });
      return;
    }

    if (cmd.kind === "create_blocker") {
      setPending({
        description: `${t("chat_confirm_create_blocker")} "${cmd.description}"`,
        actor: uiRole,
        capability: cap,
        policy: rule,
        condition: policyObj?.condition,
        execute: async () => {
          const wi = cmd.workItemRef ? findWorkItem(store.workItems, cmd.workItemRef) : null;
          await store.createBlocker(
            {
              workspaceId: wsId,
              scope: "local",
              workItemIds: wi ? [wi.id] : [],
              ownerActorId: actorId,
              question: cmd.description,
              blockingDependency: cmd.description,
            },
            actorId,
          );
        },
      });
      return;
    }

    if (cmd.kind === "resolve_blocker") {
      const blk = findBlocker(store.blockers, cmd.blockerRef);
      if (!blk) {
        addMsg({ kind: "result", text: `${t("chat_ref_not_found")} "${cmd.blockerRef}"` });
        return;
      }
      if (blk.resolved) {
        addMsg({
          kind: "result",
          text: t("chat_blocker_already_resolved").replace("{id}", blk.id),
        });
        return;
      }
      setPending({
        description: `${t("chat_confirm_resolve_blocker")} "${blk.question.slice(0, 60)}…"`,
        actor: uiRole,
        capability: cap,
        policy: rule,
        condition: policyObj?.condition,
        execute: async () => {
          await store.resolveBlocker(blk.id, actorId);
        },
      });
      return;
    }

    if (cmd.kind === "toggle_feature") {
      const feat = findFeature(store.features, cmd.featureRef);
      const client = findClient(store.clients, cmd.clientRef);
      if (!feat) {
        addMsg({ kind: "result", text: `${t("chat_ref_not_found")} feature "${cmd.featureRef}"` });
        return;
      }
      if (!client) {
        addMsg({ kind: "result", text: `${t("chat_ref_not_found")} client "${cmd.clientRef}"` });
        return;
      }
      setPending({
        description: t("chat_confirm_toggle_feature")
          .replace("{verb}", t(cmd.enabled ? "chat_verb_enable" : "chat_verb_disable"))
          .replace("{name}", feat.name[uiLang])
          .replace("{client}", client.name),
        actor: uiRole,
        capability: cap,
        policy: rule,
        condition: policyObj?.condition,
        execute: async () => {
          await store.toggleFeature(client.id, feat.id, cmd.enabled, actorId);
        },
      });
      return;
    }
  }

  async function confirmAction() {
    if (!pending || executing) return;
    setExecuting(true);
    try {
      await pending.execute();
      addMsg({ kind: "result", text: t("chat_executed") });
    } catch {
      addMsg({ kind: "result", text: t("chat_execute_error") });
    } finally {
      setPending(null);
      setExecuting(false);
    }
  }

  function cancelAction() {
    setPending(null);
    addMsg({ kind: "result", text: t("chat_cancelled") });
  }

  function policyLabel(rule: PolicyRule): string {
    if (rule === "auto") return t("chat_policy_auto");
    if (rule === "approval_required") return t("chat_policy_approval_required");
    if (rule === "human_only") return t("chat_policy_human_only");
    return rule;
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!open) return null;

  const suggestions = uiLang === "fr" ? SUGGESTIONS_FR : SUGGESTIONS_EN;

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex w-[420px] flex-col border-l border-line bg-bg-1 shadow-2xl"
      role="dialog"
      aria-label={t("chat_title")}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-laiton" aria-hidden="true" />
          <span className="text-[13px] font-medium text-tx-1">{t("chat_title")}</span>
          <span className="rounded border border-or/30 bg-or/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-or">
            {t("chat_simulation_badge")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-tx-3"
              onClick={() => {
                setMessages([]);
                setPending(null);
              }}
              aria-label={t("chat_clear")}
            >
              {t("chat_clear")}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-tx-3"
            onClick={() => setOpen(false)}
            aria-label={t("chat_close")}
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Simulation notice */}
      <div className="shrink-0 border-b border-line bg-bg-0 px-4 py-1.5">
        <span className="font-mono text-[11px] text-tx-3">{t("chat_simulation_notice")}</span>
      </div>

      {/* Thread */}
      <div ref={threadRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {messages.length === 0 && !pending && (
          <div className="space-y-2">
            <p className="font-mono text-[11px] text-tx-3">{t("chat_suggestions_title")}</p>
            {suggestions.map((s) => (
              <button
                key={s}
                className="block w-full rounded border border-line bg-bg-2 px-3 py-1.5 text-left font-mono text-[12px] text-tx-2 transition-colors hover:border-laiton hover:text-tx-1"
                onClick={() => {
                  setInput(s);
                  inputRef.current?.focus();
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => {
          if (msg.kind === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-lg bg-bg-2 px-3 py-2 text-[13px] text-tx-1">
                  {msg.text}
                </div>
              </div>
            );
          }

          if (msg.kind === "assistant") {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[85%] rounded-lg border border-line bg-bg-0 px-3 py-2 font-mono text-[13px] text-tx-2">
                  {msg.text}
                </div>
              </div>
            );
          }

          if (msg.kind === "result") {
            return (
              <div key={msg.id} className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
                <span className="font-mono text-[12px] text-ok">{msg.text}</span>
              </div>
            );
          }

          if (msg.kind === "info") {
            return (
              <div key={msg.id} className="rounded border border-line bg-bg-0 p-3">
                <p className="mb-1.5 text-[12px] font-medium text-tx-1">{msg.title}</p>
                {msg.lines.map((line, i) => (
                  <p key={i} className="font-mono text-[12px] text-tx-2">
                    {line}
                  </p>
                ))}
              </div>
            );
          }

          if (msg.kind === "forbidden") {
            const condText = msg.condition?.[uiLang];
            return (
              <div key={msg.id} className="rounded border border-err/30 bg-err/5 p-3" role="alert">
                <div className="mb-1 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-err" aria-hidden="true" />
                  <span className="text-[12px] font-medium text-err">
                    {t("chat_forbidden_title")}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-tx-2">
                  {t("chat_forbidden_detail")} {msg.capability} / {policyLabel(msg.rule)}
                </p>
                {condText && <p className="mt-1 font-mono text-[11px] text-tx-3">{condText}</p>}
              </div>
            );
          }

          if (msg.kind === "suggestions") {
            return (
              <div key={msg.id} className="space-y-1.5">
                <p className="font-mono text-[11px] text-tx-3">{t("chat_suggestions_title")}</p>
                {suggestions.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    className="block w-full rounded border border-line bg-bg-2 px-2 py-1 text-left font-mono text-[11px] text-tx-3 transition-colors hover:text-tx-1"
                    onClick={() => {
                      setInput(s);
                      inputRef.current?.focus();
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Confirmation card */}
      {pending && (
        <div className="shrink-0 border-t border-line bg-bg-0 p-4">
          <p className="mb-3 text-[12px] font-medium text-tx-1">{t("chat_confirm_title")}</p>
          <dl className="mb-3 space-y-1">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 font-mono text-[11px] text-tx-3">
                {t("chat_confirm_action")}
              </dt>
              <dd className="font-mono text-[11px] text-tx-1">{pending.description}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 font-mono text-[11px] text-tx-3">
                {t("chat_confirm_actor")}
              </dt>
              <dd className="font-mono text-[11px] text-tx-1">{pending.actor}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 font-mono text-[11px] text-tx-3">
                {t("chat_confirm_capability")}
              </dt>
              <dd className="font-mono text-[11px] text-laiton">{pending.capability}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 font-mono text-[11px] text-tx-3">
                {t("chat_confirm_policy")}
              </dt>
              <dd className="font-mono text-[11px] text-or">{policyLabel(pending.policy)}</dd>
            </div>
            {pending.condition && (
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-mono text-[11px] text-tx-3" />
                <dd className="font-mono text-[11px] text-tx-3">{pending.condition[uiLang]}</dd>
              </div>
            )}
          </dl>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={confirmAction}
              disabled={executing}
              aria-label={t("chat_confirm_execute")}
            >
              {t("chat_confirm_execute")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={cancelAction}
              disabled={executing}
              aria-label={t("chat_confirm_cancel")}
            >
              {t("chat_confirm_cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-line bg-bg-1 p-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit(input);
          }}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat_placeholder")}
            className="flex-1 font-mono text-[13px]"
            aria-label={t("chat_placeholder")}
            autoComplete="off"
            disabled={executing}
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!input.trim() || executing}
            aria-label={t("chat_send")}
          >
            <Send size={14} />
          </Button>
        </form>
        <p className="mt-1.5 font-mono text-[10px] text-tx-3">{t("chat_hint")}</p>
      </div>
    </div>
  );
}

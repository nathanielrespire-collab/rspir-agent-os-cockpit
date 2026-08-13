import { useState, useEffect } from "react";
import {
  Users,
  ChevronLeft,
  Mail,
  User,
  Bot,
  Zap,
  CalendarDays,
  BarChart3,
  BookOpen,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { WorkStatus, PolicyRule, Deal } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  "overview" | "work" | "contacts" | "meetings" | "crm" | "automations" | "features" | "policies";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_KEY: Record<WorkStatus, TKey> = {
  todo: "work_status_todo",
  ready: "work_status_ready",
  claimed: "work_status_claimed",
  running: "work_status_running",
  verification: "work_status_verification",
  a_valider: "work_status_a_valider",
  blocked: "work_status_blocked",
  failed: "work_status_failed",
  done: "work_status_done",
};

type BadgeVariant = "default" | "ok" | "warn" | "err" | "info" | "or" | "laiton";

const STATUS_BADGE: Record<WorkStatus, BadgeVariant> = {
  todo: "default",
  ready: "info",
  claimed: "laiton",
  running: "laiton",
  verification: "warn",
  a_valider: "or",
  blocked: "err",
  failed: "err",
  done: "ok",
};

const DEAL_STAGE_KEY: Record<Deal["stage"], TKey> = {
  lead: "cli_deal_lead",
  qualified: "cli_deal_qualified",
  proposal: "cli_deal_proposal",
  negotiation: "cli_deal_negotiation",
  won: "cli_deal_won",
  lost: "cli_deal_lost",
};

const DEAL_BADGE: Record<Deal["stage"], BadgeVariant> = {
  lead: "default",
  qualified: "info",
  proposal: "laiton",
  negotiation: "warn",
  won: "ok",
  lost: "err",
};

const POLICY_KEY: Record<PolicyRule, TKey> = {
  auto: "cli_policy_auto",
  approval_required: "cli_policy_approval",
  forbidden: "cli_policy_forbidden",
  human_only: "cli_policy_human",
};

const POLICY_BADGE: Record<PolicyRule, BadgeVariant> = {
  auto: "ok",
  approval_required: "or",
  forbidden: "err",
  human_only: "warn",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-tx-3">{children}</p>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="font-mono text-[12px] text-tx-3">{label}</p>;
}

// ─── Tab panels ──────────────────────────────────────────────────────────────

function OverviewTab({ clientId }: { clientId: string }) {
  const t = useT();
  const { workItems, projects, contacts, meetings, deals } = useAppStore();

  const clientWork = workItems.filter((wi) => wi.clientId === clientId);
  const activeWork = clientWork.filter((wi) =>
    ["claimed", "running", "verification", "a_valider"].includes(wi.status),
  );
  const verifiedWork = clientWork.filter((wi) => wi.status === "done");
  const clientContacts = contacts.filter((c) => c.clientId === clientId);
  const clientMeetings = meetings.filter((m) => m.clientId === clientId);
  const clientDeals = deals.filter((d) => d.clientId === clientId);
  const clientProjects = projects.filter((p) => p.clientId === clientId);

  const stats = [
    { key: t("cli_overview_active"), value: activeWork.length, variant: "laiton" as const },
    { key: t("cli_overview_verified"), value: verifiedWork.length, variant: "ok" as const },
    { key: t("cli_overview_meetings"), value: clientMeetings.length, variant: "default" as const },
    { key: t("cli_overview_deals"), value: clientDeals.length, variant: "default" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.key} className="rounded-card border border-line bg-bg-1 p-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-tx-3">{s.key}</p>
            <p
              className={cn(
                "mt-1.5 font-mono text-2xl font-semibold leading-none",
                s.variant === "laiton"
                  ? "text-laiton"
                  : s.variant === "ok"
                    ? "text-ok"
                    : "text-tx-1",
              )}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Projects */}
      {clientProjects.length > 0 && (
        <section aria-label={t("nav_projects")}>
          <SectionLabel>{t("nav_projects")}</SectionLabel>
          <div className="space-y-2">
            {clientProjects.map((p) => (
              <div key={p.id} className="rounded-ctl border border-line bg-bg-1 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-tx-1">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-tx-3">
                      {p.taskCompletionPct}% {t("proj_tasks_pct")}
                    </span>
                    <Badge variant={p.transferable ? "ok" : "err"} className="font-mono text-[9px]">
                      {p.transferable ? t("proj_transferable_yes") : t("proj_transferable_no")}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active work */}
      {activeWork.length > 0 && (
        <section aria-label={t("cli_overview_active")}>
          <SectionLabel>{t("cli_overview_active")}</SectionLabel>
          <div className="space-y-1.5">
            {activeWork.map((wi) => (
              <div
                key={wi.id}
                className="flex items-center gap-2.5 rounded-ctl border border-line bg-bg-0/50 px-3 py-2"
              >
                <Badge variant={STATUS_BADGE[wi.status]} className="shrink-0 font-mono text-[9px]">
                  {t(STATUS_KEY[wi.status])}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-[12px] text-tx-1">{wi.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-tx-3">{wi.id}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Last meeting */}
      {clientMeetings.length > 0 && (
        <section aria-label={t("cli_tab_meetings")}>
          <SectionLabel>{t("cli_tab_meetings")}</SectionLabel>
          {clientMeetings.slice(-1).map((m) => (
            <div key={m.id} className="rounded-ctl border border-line bg-bg-1 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <CalendarDays size={12} className="mt-0.5 shrink-0 text-tx-3" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-tx-1">{m.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-tx-3">
                    {new Date(m.at).toLocaleDateString()}
                  </p>
                  {m.outcomes?.decisions && m.outcomes.decisions.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {m.outcomes.decisions.slice(0, 2).map((d, i) => (
                        <p key={i} className="font-mono text-[10px] text-tx-2">
                          · {d}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {clientContacts.length > 0 && (
        <section aria-label={t("cli_tab_contacts")}>
          <SectionLabel>{t("cli_tab_contacts")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {clientContacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 rounded-ctl border border-line bg-bg-1 px-2.5 py-1.5"
              >
                <User size={11} className="shrink-0 text-tx-3" aria-hidden />
                <span className="text-[12px] text-tx-1">{c.name}</span>
                {c.role && <span className="font-mono text-[10px] text-tx-3">· {c.role}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function WorkTab({ clientId }: { clientId: string }) {
  const t = useT();
  const { workItems } = useAppStore();
  const clientWork = workItems.filter((wi) => wi.clientId === clientId);

  if (clientWork.length === 0) return <EmptyState label={t("cli_no_work")} />;

  const grouped: Record<string, typeof clientWork> = {
    active: clientWork.filter((wi) =>
      ["claimed", "running", "verification", "a_valider"].includes(wi.status),
    ),
    todo: clientWork.filter((wi) => ["todo", "ready", "blocked", "failed"].includes(wi.status)),
    done: clientWork.filter((wi) => wi.status === "done"),
  };

  const groups: Array<{ label: string; items: typeof clientWork }> = [
    { label: t("cli_overview_active"), items: grouped.active },
    { label: t("work_status_todo"), items: grouped.todo },
    { label: t("work_status_done"), items: grouped.done },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.label} aria-label={g.label}>
          <SectionLabel>{g.label}</SectionLabel>
          <div className="space-y-1.5">
            {g.items.map((wi) => (
              <div
                key={wi.id}
                className="flex items-center gap-2.5 rounded-ctl border border-line bg-bg-0/50 px-3 py-2"
              >
                <Badge variant={STATUS_BADGE[wi.status]} className="shrink-0 font-mono text-[9px]">
                  {t(STATUS_KEY[wi.status])}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-[12px] text-tx-1">{wi.title}</span>
                <Badge variant="default" className="shrink-0 font-mono text-[9px]">
                  {wi.priority}
                </Badge>
                {wi.externalEffect && (
                  <ArrowRight size={10} className="shrink-0 text-warn" aria-label="external" />
                )}
                <span className="shrink-0 font-mono text-[10px] text-tx-3">{wi.id}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ContactsTab({ clientId }: { clientId: string }) {
  const t = useT();
  const { contacts } = useAppStore();
  const clientContacts = contacts.filter((c) => c.clientId === clientId);

  if (clientContacts.length === 0) return <EmptyState label={t("cli_no_contacts")} />;

  return (
    <div className="space-y-2">
      {clientContacts.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 rounded-card border border-line bg-bg-1 px-3 py-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl border border-line bg-bg-2">
            <User size={13} className="text-tx-2" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-tx-1">{c.name}</p>
            {c.role && <p className="font-mono text-[11px] text-tx-3">{c.role}</p>}
          </div>
          {c.email && (
            <a
              href={`mailto:${c.email}`}
              className="flex items-center gap-1 font-mono text-[11px] text-tx-3 transition-colors hover:text-tx-1 focus-visible:outline-2 focus-visible:outline-or"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail size={11} aria-hidden />
              {c.email}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function MeetingsTab({ clientId }: { clientId: string }) {
  const t = useT();
  const { meetings } = useAppStore();
  const clientMeetings = meetings.filter((m) => m.clientId === clientId);

  if (clientMeetings.length === 0) return <EmptyState label={t("cli_no_meetings")} />;

  return (
    <div className="space-y-3">
      {clientMeetings.map((m) => (
        <div key={m.id} className="rounded-card border border-line bg-bg-1 p-4">
          <div className="mb-2 flex items-start gap-2">
            <CalendarDays size={13} className="mt-0.5 shrink-0 text-tx-3" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-tx-1">{m.title}</p>
              <p className="mt-0.5 font-mono text-[11px] text-tx-3">
                {new Date(m.at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {m.prep?.context && (
            <p className="mb-2 pl-5 font-mono text-[11px] leading-snug text-tx-2">
              {m.prep.context}
            </p>
          )}

          {m.outcomes && (
            <div className="mt-2 space-y-2 border-t border-line pt-2 pl-5">
              {m.outcomes.decisions.length > 0 && (
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-tx-3">
                    {t("home_evidence")}
                  </p>
                  <div className="space-y-0.5">
                    {m.outcomes.decisions.map((d, i) => (
                      <p key={i} className="font-mono text-[11px] text-tx-2">
                        · {d}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {m.outcomes.commitments.length > 0 && (
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-tx-3">
                    {t("cli_commitments")}
                  </p>
                  <div className="space-y-0.5">
                    {m.outcomes.commitments.map((c, i) => (
                      <p key={i} className="font-mono text-[11px] text-tx-2">
                        · {c}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CrmTab({ clientId }: { clientId: string }) {
  const t = useT();
  const { deals } = useAppStore();
  const clientDeals = deals.filter((d) => d.clientId === clientId);

  if (clientDeals.length === 0) return <EmptyState label={t("cli_no_deals")} />;

  return (
    <div className="space-y-2">
      {clientDeals.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-3 rounded-ctl border border-line bg-bg-0/50 px-3 py-2.5"
        >
          <Badge variant={DEAL_BADGE[d.stage]} className="shrink-0 font-mono text-[9px]">
            {t(DEAL_STAGE_KEY[d.stage])}
          </Badge>
          <span className="min-w-0 flex-1 truncate text-[12px] text-tx-1">{d.title}</span>
          <span className="shrink-0 font-mono text-[12px] font-semibold text-tx-1">
            {d.valueCad.toLocaleString()} $
          </span>
          {d.lastAgentAction && (
            <div className="flex items-center gap-1">
              <Bot size={10} className="text-laiton" aria-hidden />
              <span className="font-mono text-[10px] text-tx-3">
                {d.lastAgentAction.externalRecordId}
              </span>
              <Badge variant="laiton" className="font-mono text-[9px]">
                {t("home_mock_badge")}
              </Badge>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AutomationsTab({ clientId }: { clientId: string }) {
  const t = useT();
  const { automations } = useAppStore();
  const clientAutomations = automations.filter((a) => a.clientId === clientId);

  if (clientAutomations.length === 0) return <EmptyState label={t("cli_no_automations")} />;

  return (
    <div className="space-y-2">
      {clientAutomations.map((a) => (
        <div key={a.id} className="rounded-ctl border border-line bg-bg-1 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Zap size={12} className="mt-0.5 shrink-0 text-laiton" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-tx-1">{a.name}</span>
                <Badge
                  variant={a.stage === "deployed" ? "ok" : a.stage === "test" ? "warn" : "default"}
                  className="font-mono text-[9px]"
                >
                  {a.stage}
                </Badge>
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-tx-3">{a.trigger}</p>
              {a.lastRunAt && (
                <div className="mt-1 flex items-center gap-1.5">
                  <Clock size={10} className="text-tx-3" aria-hidden />
                  <span className="font-mono text-[10px] text-tx-3">
                    {new Date(a.lastRunAt).toLocaleDateString()}
                  </span>
                  {a.lastRunResult && (
                    <Badge
                      variant={a.lastRunResult === "pass" ? "ok" : "err"}
                      className="font-mono text-[9px]"
                    >
                      {a.lastRunResult}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturesTab({ clientId }: { clientId: string }) {
  const t = useT();
  const { lang, role } = useUIStore();
  const { clients, features, toggleFeature } = useAppStore();

  // resolving role to actorId
  const actorMap: Record<string, string> = {
    Nathaniel: "act-nathaniel",
    Manny: "act-manny",
    Antoine: "act-antoine",
    Agent: "act-aria",
  };
  const actorId = actorMap[role] ?? "act-nathaniel";

  const client = clients.find((c) => c.id === clientId);
  const wsFeatures = features;

  return (
    <div className="space-y-2">
      {wsFeatures.map((f) => {
        const enabled = client?.enabledFeatureIds.includes(f.id) ?? false;
        return (
          <div
            key={f.id}
            className={cn(
              "rounded-ctl border px-3 py-2.5",
              enabled ? "border-laiton/25 bg-laiton/5" : "border-line bg-bg-1",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-tx-1">{f.name[lang]}</span>
                  <Badge
                    variant={
                      f.acceptanceStatus === "pass"
                        ? "ok"
                        : f.acceptanceStatus === "pending"
                          ? "warn"
                          : "err"
                    }
                    className="font-mono text-[9px]"
                  >
                    {f.acceptanceStatus}
                  </Badge>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-tx-3">{f.description[lang]}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {f.requires.map((cap) => (
                    <span
                      key={cap}
                      className="rounded-ctl border border-line bg-bg-0/60 px-1.5 py-0.5 font-mono text-[9px] text-tx-3"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => toggleFeature(clientId, f.id, !enabled, actorId)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-ctl border px-2 py-1 font-mono text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-or",
                  enabled
                    ? "border-laiton/30 text-laiton hover:border-err/30 hover:text-err"
                    : "border-line text-tx-3 hover:border-laiton/30 hover:text-laiton",
                )}
                aria-pressed={enabled}
                aria-label={`${f.name[lang]}: ${enabled ? t("cli_feature_enabled") : t("cli_feature_disabled")}`}
              >
                {enabled ? (
                  <CheckCircle2 size={11} aria-hidden />
                ) : (
                  <XCircle size={11} aria-hidden />
                )}
                {enabled ? t("cli_feature_enabled") : t("cli_feature_disabled")}
              </button>
            </div>

            {/* Evidence metadata for toggle */}
            {enabled && (
              <div className="mt-2 flex items-center gap-2 border-t border-line/50 pt-1.5 pl-1">
                <span className="font-mono text-[9px] text-tx-3">{t("home_policy_label")}:</span>
                <Badge variant="laiton" className="font-mono text-[9px]">
                  auto
                </Badge>
                <span className="font-mono text-[9px] text-tx-3">
                  {t("work_form_policy_value")}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PoliciesTab({ workspaceId }: { workspaceId: string }) {
  const t = useT();
  const { policies } = useAppStore();
  const { lang } = useUIStore();
  const wsPolicies = policies.filter((p) => p.workspaceId === workspaceId);

  if (wsPolicies.length === 0) return <EmptyState label={t("cli_no_policies")} />;

  return (
    <div className="space-y-2">
      {wsPolicies.map((p) => (
        <div
          key={p.id}
          className="flex items-start gap-3 rounded-ctl border border-line bg-bg-1 px-3 py-2.5"
        >
          <Shield size={12} className="mt-0.5 shrink-0 text-tx-3" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-tx-1">{p.capability}</span>
              <Badge variant={POLICY_BADGE[p.rule]} className="font-mono text-[9px]">
                {t(POLICY_KEY[p.rule])}
              </Badge>
            </div>
            {p.condition && (
              <p className="mt-0.5 font-mono text-[11px] text-tx-3">{p.condition[lang]}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

const TABS: Array<{ key: Tab; labelKey: TKey; icon: React.ElementType }> = [
  { key: "overview", labelKey: "cli_tab_overview", icon: BarChart3 },
  { key: "work", labelKey: "cli_tab_work", icon: AlertTriangle },
  { key: "contacts", labelKey: "cli_tab_contacts", icon: Users },
  { key: "meetings", labelKey: "cli_tab_meetings", icon: CalendarDays },
  { key: "crm", labelKey: "cli_tab_crm", icon: BarChart3 },
  { key: "automations", labelKey: "cli_tab_automations", icon: Zap },
  { key: "features", labelKey: "cli_tab_features", icon: BookOpen },
  { key: "policies", labelKey: "cli_tab_policies", icon: Shield },
];

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const navigate = useNavigate();
  const { clients } = useAppStore();
  const { setActiveClient } = useUIStore();

  const [tab, setTab] = useState<Tab>("overview");

  const client = clients.find((c) => c.id === id);

  useEffect(() => {
    setActiveClient(id ?? null);
    return () => {
      setActiveClient(null);
    };
  }, [id, setActiveClient]);

  if (!client) return <Navigate to="/clients" replace />;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <button
          className="mb-3 flex items-center gap-1.5 font-mono text-[11px] text-tx-3 transition-colors hover:text-tx-1 focus-visible:outline-2 focus-visible:outline-or"
          onClick={() => navigate("/clients")}
          aria-label={t("cli_back")}
        >
          <ChevronLeft size={13} aria-hidden />
          {t("cli_back")}
        </button>

        <div className="flex items-start gap-3">
          <Users size={16} className="mt-0.5 shrink-0 text-tx-3" aria-hidden />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-tx-1">{client.name}</h1>
            {client.sector && (
              <p className="mt-0.5 font-mono text-[11px] text-tx-3">
                {t("cli_sector")}: {client.sector}
              </p>
            )}
          </div>
          <Badge variant="laiton" className="shrink-0 font-mono text-[10px]">
            {t("home_mock_badge")}
          </Badge>
        </div>
      </div>

      {/* Tab strip */}
      <nav
        aria-label={t("cli_tabs_nav")}
        className="flex gap-0.5 overflow-x-auto border-b border-line pb-px"
      >
        {TABS.map(({ key, labelKey, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-or",
              tab === key
                ? "border-or text-tx-1"
                : "border-transparent text-tx-3 hover:border-line hover:text-tx-2",
            )}
            aria-selected={tab === key}
            role="tab"
          >
            <Icon size={11} aria-hidden />
            {t(labelKey)}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div role="tabpanel">
        {tab === "overview" && <OverviewTab clientId={client.id} />}
        {tab === "work" && <WorkTab clientId={client.id} />}
        {tab === "contacts" && <ContactsTab clientId={client.id} />}
        {tab === "meetings" && <MeetingsTab clientId={client.id} />}
        {tab === "crm" && <CrmTab clientId={client.id} />}
        {tab === "automations" && <AutomationsTab clientId={client.id} />}
        {tab === "features" && <FeaturesTab clientId={client.id} />}
        {tab === "policies" && <PoliciesTab workspaceId={client.workspaceId} />}
      </div>
    </div>
  );
}

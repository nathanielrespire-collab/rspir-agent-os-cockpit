import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  Activity,
  Bot,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Shield,
  FileText,
  Hash,
  Camera,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { RuntimeSpine } from "@/components/RuntimeSpine";
import type { WorkItem, Approval, Actor, Evidence, RuntimeStage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

// ─── Helpers ───────────────────────────────────────────────────────────────

function getEffectiveStage(wi: WorkItem): RuntimeStage | undefined {
  if (wi.stage) return wi.stage;
  switch (wi.status) {
    case "ready":
      return "select";
    case "claimed":
      return "claim";
    case "running":
      return "execute";
    case "verification":
      return "verify";
    case "a_valider":
      return "policy";
    case "done":
      return "continue";
    default:
      return undefined;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────

interface StatTileProps {
  count: number;
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
  warn?: boolean;
}

function StatTile({ count, label, icon: Icon, highlight = false, warn = false }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-card border bg-bg-1 px-4 py-3",
        highlight ? "border-or/40" : warn ? "border-warn/30" : "border-line",
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <Icon size={14} className={cn(highlight ? "text-or" : warn ? "text-warn" : "text-tx-3")} />
        <span
          className={cn(
            "font-mono text-2xl font-semibold leading-none",
            highlight ? "text-or" : warn ? "text-warn" : "text-tx-1",
          )}
        >
          {count}
        </span>
      </div>
      <p className="text-[11px] text-tx-3">{label}</p>
    </div>
  );
}

interface ApprovalRowProps {
  approval: Approval;
  onReview: () => void;
}

function ApprovalRow({ approval, onReview }: ApprovalRowProps) {
  const t = useT();
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-or" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-snug text-tx-1">{approval.title}</p>
        <p className="mt-0.5 font-mono text-[11px] text-tx-3">
          ~{approval.estimatedReviewMinutes}&nbsp;{t("home_min_est")}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onReview}
        className="flex-shrink-0"
        aria-label={`${t("home_review_btn")} — ${approval.title}`}
      >
        {t("home_review_btn")}
      </Button>
    </div>
  );
}

interface AgentRowProps {
  agent: Actor;
  items: WorkItem[];
}

function AgentRow({ agent, items }: AgentRowProps) {
  const firstItem = items[0];
  const stage = firstItem ? getEffectiveStage(firstItem) : undefined;
  const isHumanGate = firstItem?.status === "a_valider";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-laiton/30 bg-laiton/10">
        <Bot size={12} className="text-laiton" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-tx-1">{agent.name}</span>
          <span className="font-mono text-[9px] uppercase text-tx-3">{agent.role}</span>
        </div>
        {firstItem && (
          <p className="mt-0.5 truncate font-mono text-[11px] text-tx-2">{firstItem.title}</p>
        )}
        {items.length > 1 && <p className="font-mono text-[9px] text-tx-3">+{items.length - 1}</p>}
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        <span className="font-mono text-[11px] text-laiton">{agent.workloadPct}%</span>
        {stage && (
          <Badge variant={isHumanGate ? "or" : "laiton"} className="font-mono text-[8px] uppercase">
            {stage}
          </Badge>
        )}
      </div>
    </div>
  );
}

interface VerifiedWorkCardProps {
  item: WorkItem;
  actors: Actor[];
  onClick: () => void;
}

function VerifiedWorkCard({ item, actors, onClick }: VerifiedWorkCardProps) {
  const t = useT();
  const assignee = actors.find((a) => a.id === item.assignedActorId);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-card border border-line bg-bg-1 px-4 py-3 text-left transition-colors hover:border-ok/40 hover:bg-bg-2 focus-visible:outline-2 focus-visible:outline-or"
      aria-label={`${item.title} — ${t("home_evidence")}`}
    >
      <div className="mb-2 flex items-start gap-2">
        <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0 text-ok" aria-hidden="true" />
        <span className="line-clamp-2 text-[13px] font-medium leading-snug text-tx-1">
          {item.title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {assignee && <span className="font-mono text-[11px] text-laiton">{assignee.name}</span>}
        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-tx-3">
          <Shield size={10} aria-hidden="true" />
          {item.evidenceIds.length}
        </span>
      </div>
    </button>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-wide text-tx-3">{label}</span>
      <div className="text-[13px] text-tx-1">{children}</div>
    </div>
  );
}

function EvidenceKindIcon({
  kind,
  result,
}: {
  kind: Evidence["kind"];
  result?: Evidence["result"];
}) {
  const cls = "mt-0.5 flex-shrink-0";
  if (kind === "screenshot")
    return <Camera size={14} className={cn(cls, "text-info")} aria-hidden="true" />;
  if (kind === "artifact")
    return <FileText size={14} className={cn(cls, "text-laiton")} aria-hidden="true" />;
  if (kind === "external_id")
    return <Hash size={14} className={cn(cls, "text-tx-2")} aria-hidden="true" />;
  if (kind === "log")
    return <Terminal size={14} className={cn(cls, "text-tx-3")} aria-hidden="true" />;
  return (
    <CheckCircle2
      size={14}
      className={cn(
        cls,
        result === "pass" ? "text-ok" : result === "fail" ? "text-err" : "text-tx-2",
      )}
      aria-hidden="true"
    />
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function Home() {
  const t = useT();
  const navigate = useNavigate();
  const [drawerItem, setDrawerItem] = useState<WorkItem | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { workItems, actors, approvals, blockers, evidence, policies, activeWorkspaceId } =
    useAppStore();

  // Focus close button when drawer opens; close on Escape
  useEffect(() => {
    if (drawerItem) {
      closeRef.current?.focus();
    }
  }, [drawerItem]);

  useEffect(() => {
    if (!drawerItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerItem(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerItem]);

  // ─── Data ──────────────────────────────────────────────────────────────

  const wsId = activeWorkspaceId;

  const activeWorkItems = workItems.filter(
    (wi) =>
      wi.workspaceId === wsId &&
      ["running", "claimed", "verification", "a_valider"].includes(wi.status),
  );

  const busyAgents = actors.filter(
    (a) => a.type === "ai_agent" && (a.availability === "busy" || a.workloadPct > 0),
  );

  const verifiedItems = workItems.filter(
    (wi) => wi.workspaceId === wsId && wi.status === "done" && wi.evidenceIds.length > 0,
  );

  const pendingApprovals = approvals.filter(
    (a) => a.workspaceId === wsId && a.status === "pending",
  );

  const activeBlockers = blockers.filter((b) => b.workspaceId === wsId && !b.resolved);

  // Map each AI agent to their active work items
  const agentItemsMap = new Map<string, WorkItem[]>();
  activeWorkItems.forEach((wi) => {
    if (wi.assignedActorId) {
      const prev = agentItemsMap.get(wi.assignedActorId) ?? [];
      agentItemsMap.set(wi.assignedActorId, [...prev, wi]);
    }
  });
  const workingAgents = actors.filter((a) => agentItemsMap.has(a.id));

  // Aggregate stage counts for the spine
  const stageCounts: Partial<Record<RuntimeStage, number>> = {};
  activeWorkItems.forEach((wi) => {
    const stage = getEffectiveStage(wi);
    if (stage) {
      stageCounts[stage] = (stageCounts[stage] ?? 0) + 1;
    }
  });

  // Recent verified work (up to 6)
  const recentVerified = verifiedItems.slice(-6).reverse();

  // Drawer data
  const drawerOwner = drawerItem ? actors.find((a) => a.id === drawerItem.ownerActorId) : null;
  const drawerAssignee = drawerItem
    ? actors.find((a) => a.id === drawerItem.assignedActorId)
    : null;
  const drawerPolicies = drawerItem
    ? policies.filter(
        (p) =>
          p.workspaceId === wsId &&
          drawerItem.requiredCapabilities.some((cap) => p.capability === cap),
      )
    : [];
  const drawerEvidence = drawerItem
    ? drawerItem.evidenceIds.flatMap((id) => {
        const ev = evidence.find((e) => e.id === id);
        return ev ? [ev] : [];
      })
    : [];

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <HomeIcon size={16} className="text-tx-3" aria-hidden="true" />
        <h1 className="text-sm font-semibold">{t("nav_home")}</h1>
        <Badge variant="laiton" className="ml-auto font-mono text-[10px]">
          {t("home_mock_badge")}
        </Badge>
      </div>

      {/* TODAY bandeau */}
      <div className="grid grid-cols-5 gap-3" role="region" aria-label="Aujourd'hui">
        <StatTile count={activeWorkItems.length} label={t("home_active_units")} icon={Activity} />
        <StatTile count={busyAgents.length} label={t("home_agents_at_work")} icon={Bot} />
        <StatTile
          count={verifiedItems.length}
          label={t("home_verified_today")}
          icon={CheckCircle2}
        />
        <StatTile
          count={pendingApprovals.length}
          label={t("home_decisions_req")}
          icon={AlertCircle}
          highlight={pendingApprovals.length > 0}
        />
        <StatTile
          count={activeBlockers.length}
          label={t("home_blockers_ext")}
          icon={AlertTriangle}
          warn={activeBlockers.length > 0}
        />
      </div>

      {/* Main 2-column */}
      <div className="grid grid-cols-2 gap-4">
        {/* YOUR ATTENTION */}
        <section
          aria-label={t("home_your_attention")}
          className="overflow-hidden rounded-card border border-or/30 bg-bg-1"
        >
          <div className="flex items-center gap-2 border-b border-or/20 px-4 py-3">
            <AlertCircle size={14} className="text-or" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-or">{t("home_your_attention")}</h2>
            {pendingApprovals.length > 0 && (
              <span className="ml-auto font-mono text-xs text-or">{pendingApprovals.length}</span>
            )}
          </div>
          <div className="divide-y divide-line/50">
            {pendingApprovals.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-tx-3">{t("home_no_attention")}</p>
            ) : (
              pendingApprovals.map((apr) => (
                <ApprovalRow key={apr.id} approval={apr} onReview={() => navigate("/approvals")} />
              ))
            )}
          </div>
        </section>

        {/* SYSTEM WORKING NOW */}
        <section
          aria-label={t("home_system_working")}
          className="overflow-hidden rounded-card border border-laiton/30 bg-bg-1"
        >
          <div className="flex items-center gap-2 border-b border-laiton/20 px-4 py-3">
            <Bot size={14} className="text-laiton" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-laiton">{t("home_system_working")}</h2>
            {workingAgents.length > 0 && (
              <span className="ml-auto font-mono text-xs text-laiton">{workingAgents.length}</span>
            )}
          </div>

          {/* Aggregate spine */}
          <div className="border-b border-line/50 px-4 py-3">
            <RuntimeSpine stageCounts={stageCounts} size="sm" showLabels={true} />
          </div>

          {/* Agent rows */}
          <div className="divide-y divide-line/50">
            {workingAgents.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-tx-3">{t("home_no_agents")}</p>
            ) : (
              workingAgents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} items={agentItemsMap.get(agent.id) ?? []} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* RECENT VERIFIED WORK */}
      <section aria-label={t("home_recent_verified")}>
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-ok" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-tx-2">{t("home_recent_verified")}</h2>
          <span className="ml-auto font-mono text-xs text-tx-3">{verifiedItems.length}</span>
        </div>
        {recentVerified.length === 0 ? (
          <p className="text-xs text-tx-3">{t("home_no_verified")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {recentVerified.map((wi) => (
              <VerifiedWorkCard
                key={wi.id}
                item={wi}
                actors={actors}
                onClick={() => setDrawerItem(wi)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Evidence drawer */}
      {drawerItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-bg-0/60 backdrop-blur-sm"
            onClick={() => setDrawerItem(null)}
            aria-hidden="true"
          />

          {/* Panel */}
          <aside
            className="fixed right-0 top-0 z-50 flex h-full w-[440px] flex-col overflow-hidden border-l border-line bg-bg-1"
            role="dialog"
            aria-modal="true"
            aria-label={t("home_evidence")}
          >
            {/* Drawer header */}
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <Shield size={16} className="flex-shrink-0 text-ok" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-tx-1">{drawerItem.title}</h3>
                <p className="font-mono text-[11px] text-tx-3">{drawerItem.id}</p>
              </div>
              <button
                ref={closeRef}
                onClick={() => setDrawerItem(null)}
                className="rounded-ctl p-1 text-tx-3 transition-colors hover:bg-bg-2 hover:text-tx-1 focus-visible:outline-2 focus-visible:outline-or"
                aria-label={t("home_close")}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Metadata: requested by / executed by / policy */}
              <div className="space-y-3">
                <MetaRow label={t("home_requested_by")}>
                  <span className="font-mono text-[13px]">
                    {drawerOwner?.name ?? drawerItem.ownerActorId}
                  </span>
                </MetaRow>
                <MetaRow label={t("home_executed_by")}>
                  <span className="font-mono text-[13px]">
                    {drawerAssignee?.name ?? t("home_no_assignee")}
                  </span>
                </MetaRow>
                <MetaRow label={t("home_policy_label")}>
                  {drawerPolicies.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {drawerPolicies.map((p) => (
                        <span key={p.id} className="font-mono text-[11px] text-tx-2">
                          {p.capability}: {p.rule}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="font-mono text-[11px] text-tx-3">auto</span>
                  )}
                </MetaRow>
              </div>

              <div className="border-t border-line" />

              {/* Evidence list */}
              <div>
                <h4 className="mb-3 text-xs font-semibold text-tx-2">{t("home_evidence")}</h4>
                {drawerEvidence.length === 0 ? (
                  <p className="text-xs text-tx-3">{t("home_evidence_none")}</p>
                ) : (
                  <ul className="space-y-2" role="list">
                    {drawerEvidence.map((ev) => (
                      <li
                        key={ev.id}
                        className="flex items-start gap-3 rounded-ctl border border-line bg-bg-0/50 px-3 py-2"
                      >
                        <EvidenceKindIcon kind={ev.kind} result={ev.result} />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[12px] leading-snug text-tx-1">{ev.label}</p>
                          <p className="font-mono text-[10px] text-tx-3">
                            {ev.kind} · {ev.id}
                          </p>
                        </div>
                        {ev.result && (
                          <Badge
                            variant={ev.result === "pass" ? "ok" : "err"}
                            className="shrink-0 text-[10px]"
                          >
                            {ev.result}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Acceptance criteria */}
              {drawerItem.acceptanceCriteria.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold text-tx-2">{t("home_acceptance")}</h4>
                  <ul className="space-y-1.5" role="list">
                    {drawerItem.acceptanceCriteria.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2
                          size={12}
                          className="mt-0.5 flex-shrink-0 text-ok"
                          aria-hidden="true"
                        />
                        <span className="text-[12px] text-tx-2">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Per-item runtime spine */}
              {(() => {
                const stage = getEffectiveStage(drawerItem);
                if (!stage) return null;
                return (
                  <div>
                    <h4 className="mb-3 text-xs font-semibold text-tx-2">
                      {t("home_spine_label")}
                    </h4>
                    <RuntimeSpine
                      activeStage={stage}
                      stageState="done"
                      size="sm"
                      showLabels={true}
                    />
                  </div>
                );
              })()}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

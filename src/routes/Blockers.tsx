import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Shield,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import type { Blocker, WorkItem } from "@/lib/types";

// ─── Role → actor mapping ────────────────────────────────────────────────────

const ROLE_ACTOR: Record<string, string> = {
  Nathaniel: "act-nathaniel",
  Manny: "act-manny",
  Antoine: "act-antoine",
  Agent: "act-claude-code",
};

// ─── Status badge helper ──────────────────────────────────────────────────────

const STATUS_ACTIVE = new Set(["todo", "ready", "claimed", "running", "verification", "a_valider"]);

function formatDate(iso: string | undefined, locale = "fr-CA") {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale);
}

// ─── "Work continuing" panel ─────────────────────────────────────────────────

interface WorkContinuingProps {
  blockedIds: string[];
  allWorkItems: WorkItem[];
  workspaceId: string;
}

function WorkContinuingPanel({
  blockedIds,
  allWorkItems,
  workspaceId,
}: WorkContinuingProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(true);

  const continuing = allWorkItems.filter(
    (w) =>
      w.workspaceId === workspaceId && !blockedIds.includes(w.id) && STATUS_ACTIVE.has(w.status),
  );

  return (
    <div className="rounded-ctl border border-ok/25 bg-ok/5">
      <button
        className="flex w-full items-center justify-between px-3 py-2"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-ok" />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wide text-ok">
            {t("blk_work_continuing")}
          </span>
          <span className="font-mono text-[11px] text-ok/60">({continuing.length})</span>
        </div>
        {expanded ? (
          <ChevronUp size={13} className="text-ok/60" />
        ) : (
          <ChevronDown size={13} className="text-ok/60" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-ok/15 px-3 pb-3 pt-2 space-y-1.5">
          {continuing.length === 0 ? (
            <p className="text-[12px] text-tx-3 italic">{t("blk_work_continuing_empty")}</p>
          ) : (
            continuing.slice(0, 8).map((w) => (
              <div key={w.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                    w.status === "running" ? "bg-ok" : "bg-tx-3",
                  )}
                />
                <span className="text-[12px] text-tx-2 truncate flex-1">{w.title}</span>
                <span className="font-mono text-[10px] text-tx-3 shrink-0">{w.status}</span>
              </div>
            ))
          )}
          {continuing.length > 8 && (
            <p className="text-[11px] text-tx-3 pl-3.5">+{continuing.length - 8} autres</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Blocker card ─────────────────────────────────────────────────────────────

interface BlockerCardProps {
  blocker: Blocker;
  allWorkItems: WorkItem[];
  actorName: (id: string | undefined) => string;
  workItemTitle: (id: string) => string;
  onResolve: (id: string) => void;
  resolved?: boolean;
}

function BlockerCard({
  blocker,
  allWorkItems,
  actorName,
  workItemTitle,
  onResolve,
  resolved = false,
}: BlockerCardProps) {
  const t = useT();
  const isGlobal = blocker.scope === "global";

  return (
    <div
      className={cn(
        "rounded-card border overflow-hidden",
        resolved
          ? "border-line/40 bg-bg-1/40 opacity-60"
          : isGlobal
            ? "border-err/30 bg-bg-1"
            : "border-warn/20 bg-bg-1",
      )}
    >
      {/* Scope accent bar */}
      {!resolved && <div className={cn("h-0.5 w-full", isGlobal ? "bg-err/60" : "bg-warn/50")} />}

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={isGlobal ? "err" : "warn"}>
              {isGlobal ? t("blk_scope_global") : t("blk_scope_local")}
            </Badge>
            {resolved ? (
              <Badge variant="ok">{t("blk_resolved_badge")}</Badge>
            ) : (
              <Badge variant={isGlobal ? "err" : "warn"}>{t("blk_active_badge")}</Badge>
            )}
          </div>
          {blocker.escalationAt && !resolved && (
            <div className="flex items-center gap-1 text-[11px] text-err/80 shrink-0">
              <AlertCircle size={11} />
              <span className="font-mono">
                {t("blk_escalation")}: {formatDate(blocker.escalationAt)}
              </span>
            </div>
          )}
        </div>

        {/* Scope description */}
        {!resolved && (
          <p className="text-[11px] text-tx-3 italic">
            {isGlobal ? t("blk_global_desc") : t("blk_local_desc")}
          </p>
        )}

        {/* Question — prominent */}
        <div>
          <p className="text-[11px] uppercase tracking-wide text-tx-3 mb-1">{t("blk_question")}</p>
          <p className="font-mono text-[13px] text-tx-1 leading-relaxed">{blocker.question}</p>
        </div>

        {/* Dependency */}
        <div>
          <p className="text-[11px] uppercase tracking-wide text-tx-3 mb-1">
            {t("blk_dependency")}
          </p>
          <p className="text-[12px] text-tx-2">{blocker.blockingDependency}</p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
          <div className="flex items-center gap-2">
            <User size={11} className="text-tx-3 shrink-0" />
            <span className="text-tx-3">{t("blk_who")}:</span>
            <span className="font-mono text-tx-2 truncate">{actorName(blocker.ownerActorId)}</span>
          </div>
          {blocker.nextVerificationAt && (
            <div className="flex items-center gap-2">
              <Calendar size={11} className="text-tx-3 shrink-0" />
              <span className="text-tx-3">{t("blk_next_verify")}:</span>
              <span className="font-mono text-tx-2">{formatDate(blocker.nextVerificationAt)}</span>
            </div>
          )}
          {blocker.defaultDecision !== undefined && (
            <div className="flex items-center gap-2 col-span-2">
              <Shield size={11} className="text-tx-3 shrink-0" />
              <span className="text-tx-3">{t("blk_default_decision")}:</span>
              <span className="font-mono text-tx-2">
                {blocker.defaultDecision ?? t("blk_no_default")}
              </span>
            </div>
          )}
        </div>

        {/* Blocked items */}
        <div>
          <p className="text-[11px] uppercase tracking-wide text-tx-3 mb-1.5">
            {t("blk_work_blocked")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {blocker.workItemIds.map((wid) => (
              <Badge key={wid} variant="err" className="text-[10px]">
                {workItemTitle(wid)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Work continuing (only for active local blockers) */}
        {!resolved && blocker.scope === "local" && (
          <WorkContinuingPanel
            blockedIds={blocker.workItemIds}
            allWorkItems={allWorkItems}
            workspaceId={blocker.workspaceId}
          />
        )}

        {/* Global: show all workspace work in a different frame */}
        {!resolved && blocker.scope === "global" && (
          <WorkContinuingPanel
            blockedIds={blocker.workItemIds}
            allWorkItems={allWorkItems}
            workspaceId={blocker.workspaceId}
          />
        )}

        {/* Resolve action (active only) */}
        {!resolved && (
          <div className="flex justify-between items-center pt-1 border-t border-line/40">
            <div className="flex items-center gap-2 text-[11px] text-tx-3">
              <Clock size={11} />
              <span>
                {t("blk_created_at")} {formatDate(blocker.createdAt)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-ok border-ok/30 hover:bg-ok/10 hover:text-ok"
              onClick={() => onResolve(blocker.id)}
            >
              {t("blk_resolve_btn")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main route ───────────────────────────────────────────────────────────────

export default function Blockers() {
  const t = useT();
  const role = useUIStore((s) => s.role);
  const actors = useAppStore((s) => s.actors);
  const blockers = useAppStore((s) => s.blockers);
  const workItems = useAppStore((s) => s.workItems);
  const resolveBlocker = useAppStore((s) => s.resolveBlocker);
  const [showResolved, setShowResolved] = useState(false);

  const actorId = ROLE_ACTOR[role] ?? "act-nathaniel";
  const actorName = (id: string | undefined) => {
    if (!id) return "—";
    return actors.find((a) => a.id === id)?.name ?? id;
  };
  const workItemTitle = (wid: string) => {
    return workItems.find((w) => w.id === wid)?.title ?? wid;
  };

  const active = blockers.filter((b) => !b.resolved);
  const resolved = blockers.filter((b) => b.resolved);

  const globalActive = active.filter((b) => b.scope === "global");
  const localActive = active.filter((b) => b.scope === "local");

  async function handleResolve(id: string) {
    await resolveBlocker(id, actorId);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className={active.length > 0 ? "text-warn" : "text-tx-3"} />
          <h1 className="text-sm font-semibold">{t("nav_blockers")}</h1>
          {active.length > 0 && (
            <Badge variant={globalActive.length > 0 ? "err" : "warn"}>
              {active.length} {t("blk_count_active")}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        {/* Global alert banner */}
        {globalActive.length > 0 && (
          <div className="flex items-start gap-2 rounded-ctl border border-err/40 bg-err/10 px-3 py-2.5">
            <AlertCircle size={14} className="text-err shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-err">{t("blk_scope_global")}</p>
              <p className="text-[12px] text-err/80 mt-0.5">{t("blk_global_desc")}</p>
            </div>
          </div>
        )}

        {/* Active section */}
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
            <p className="text-[13px] text-tx-2">{t("blk_no_active")}</p>
            <p className="font-mono text-xs text-tx-3">{t("empty_blockers")}</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-tx-3 mb-2">
                {t("blk_section_active")}
              </p>
              <div className="space-y-3">
                {/* Global blockers first */}
                {globalActive.map((b) => (
                  <BlockerCard
                    key={b.id}
                    blocker={b}
                    allWorkItems={workItems}
                    actorName={actorName}
                    workItemTitle={workItemTitle}
                    onResolve={handleResolve}
                  />
                ))}
                {/* Local blockers */}
                {localActive.map((b) => (
                  <BlockerCard
                    key={b.id}
                    blocker={b}
                    allWorkItems={workItems}
                    actorName={actorName}
                    workItemTitle={workItemTitle}
                    onResolve={handleResolve}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Resolved section (collapsible) */}
        {resolved.length > 0 && (
          <div>
            <button
              className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-tx-3 hover:text-tx-2 transition-colors mb-2"
              onClick={() => setShowResolved((v) => !v)}
            >
              {showResolved ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {t("blk_section_resolved")} ({resolved.length})
            </button>

            {showResolved && (
              <div className="space-y-3">
                {resolved.map((b) => (
                  <BlockerCard
                    key={b.id}
                    blocker={b}
                    allWorkItems={workItems}
                    actorName={actorName}
                    workItemTitle={workItemTitle}
                    onResolve={handleResolve}
                    resolved
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

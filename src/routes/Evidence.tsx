import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BookOpen,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useT } from "@/lib/hooks";
import { useAppStore, getWorkspaceChain } from "@/lib/store";
import { verifyChain, shortHash } from "@/lib/signature";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { Execution, ExecutionStep, Actor, Client } from "@/lib/types";
import { ChainStatusBar, type ChainPhase } from "@/components/ChainStatusBar";

// ─── Constants ───────────────────────────────────────────────────────────────

const STAGE_TAG: Record<ExecutionStep["stage"], string> = {
  select: "SELECT",
  claim: "CLAIM",
  execute: "EXECUTE",
  verify: "VERIFY",
  update: "UPDATE",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string): string {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

// ─── HashCell ────────────────────────────────────────────────────────────────

function HashCell({ hash }: { hash: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="flex items-center gap-1">
      <span className="font-mono text-[11px] text-tx-2" title={hash}>
        {shortHash(hash)}
      </span>
      <button
        onClick={copy}
        className="text-tx-3 transition-colors hover:text-tx-1"
        aria-label={t("ledger_copy_hash")}
        type="button"
      >
        {copied ? <Check size={9} className="text-ok" /> : <Copy size={9} />}
      </button>
    </span>
  );
}

// ─── OutcomeBadge ────────────────────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: Execution["outcome"] }) {
  const t = useT();
  const map: Record<Execution["outcome"], { label: string; variant: "ok" | "err" | "laiton" }> = {
    verified: { label: t("ledger_outcome_verified"), variant: "ok" },
    rejected: { label: t("ledger_outcome_rejected"), variant: "err" },
    in_progress: { label: t("ledger_outcome_in_progress"), variant: "laiton" },
  };
  const { label, variant } = map[outcome];
  return (
    <Badge variant={variant} className="shrink-0 text-[9px]">
      {label}
    </Badge>
  );
}

// ─── StepRow ─────────────────────────────────────────────────────────────────

function StepRow({
  step,
  actor,
  broken,
}: {
  step: ExecutionStep;
  actor: Actor | undefined;
  broken: boolean;
}) {
  return (
    <div
      role="listitem"
      className={cn(
        "flex items-start gap-3 border-b border-line/20 px-4 py-2 last:border-b-0",
        broken && "border-l-2 border-l-err bg-err/5",
      )}
    >
      {/* seq */}
      <span className="w-14 shrink-0 font-mono text-[10px] text-tx-3">
        ·{String(step.seq).padStart(3, "0")}
      </span>

      {/* shortHash + copy */}
      <div className="w-[116px] shrink-0">
        <HashCell hash={step.hash} />
      </div>

      {/* stage */}
      <span className="w-[72px] shrink-0 font-mono text-[10px] font-medium text-laiton">
        {STAGE_TAG[step.stage]}
      </span>

      {/* actor */}
      <span className="w-20 shrink-0 truncate font-mono text-[10px] text-tx-2">
        {actor?.name ?? "—"}
      </span>

      {/* date */}
      <span className="w-28 shrink-0 font-mono text-[10px] text-tx-3">{fmt(step.at)}</span>

      {/* summary */}
      <span className="min-w-0 flex-1 font-mono text-[11px] leading-normal text-tx-1">
        {step.summary}
      </span>

      {/* broken marker */}
      {broken && <AlertTriangle size={11} className="mt-0.5 shrink-0 text-err" aria-hidden />}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Evidence() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const wiFilter = searchParams.get("workItem");

  const { executions, workItems, clients, actors, activeWorkspaceId } = useAppStore();

  const [clientFilter, setClientFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [chainState, setChainState] = useState<ChainPhase>({ phase: "idle" });

  const workItemMap = useMemo(() => new Map(workItems.map((w) => [w.id, w])), [workItems]);
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const actorMap = useMemo(() => new Map(actors.map((a) => [a.id, a])), [actors]);

  const runVerify = useCallback(async () => {
    setChainState({ phase: "checking" });
    const chain = getWorkspaceChain(useAppStore.getState(), activeWorkspaceId);
    const idx = await verifyChain(chain);
    const brokenSeq = idx !== null ? (chain[idx]?.seq ?? null) : null;
    setChainState({
      phase: "done",
      brokenSeq,
      checkedAt: new Date().toISOString(),
    });
  }, [activeWorkspaceId]);

  useEffect(() => {
    runVerify();
  }, [runVerify]);

  const wsExecs = useMemo(
    () => executions.filter((ex) => ex.workspaceId === activeWorkspaceId),
    [executions, activeWorkspaceId],
  );

  // Filter options derived from workspace executions
  const clientOpts = useMemo(() => {
    const seen = new Map<string, string>();
    wsExecs.forEach((ex) => {
      const wi = workItemMap.get(ex.workItemId);
      if (wi?.clientId) seen.set(wi.clientId, clientMap.get(wi.clientId)?.name ?? wi.clientId);
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [wsExecs, workItemMap, clientMap]);

  const actorOpts = useMemo(() => {
    const seen = new Map<string, string>();
    wsExecs.forEach((ex) => {
      ex.steps.forEach((s) => {
        if (s.actorId) seen.set(s.actorId, actorMap.get(s.actorId)?.name ?? s.actorId);
      });
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [wsExecs, actorMap]);

  // Apply all filters
  const filtered = useMemo(() => {
    let r = wsExecs;
    if (wiFilter) r = r.filter((ex) => ex.workItemId === wiFilter);
    if (clientFilter !== "all")
      r = r.filter((ex) => workItemMap.get(ex.workItemId)?.clientId === clientFilter);
    if (actorFilter !== "all")
      r = r.filter((ex) => ex.steps.some((s) => s.actorId === actorFilter));
    if (typeFilter !== "all") r = r.filter((ex) => ex.outcome === typeFilter);
    // Most recent first (by first step date)
    return [...r].sort((a, b) => (b.steps[0]?.at ?? "").localeCompare(a.steps[0]?.at ?? ""));
  }, [wsExecs, wiFilter, clientFilter, actorFilter, typeFilter, workItemMap]);

  const isStepBroken = (seq: number): boolean => {
    if (chainState.phase !== "done" || chainState.brokenSeq === null) return false;
    return seq >= chainState.brokenSeq;
  };

  const isExecAffected = (exec: Execution): boolean => {
    if (chainState.phase !== "done" || chainState.brokenSeq === null) return false;
    return exec.steps.some((s) => s.seq >= chainState.brokenSeq!);
  };

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Select element shared class
  const selectCls =
    "rounded-ctl border border-line bg-bg-1 px-2 py-0.5 font-mono text-[11px] text-tx-1 outline-none focus:ring-1 focus:ring-or/50";

  return (
    <div className="flex h-full flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-tx-3" aria-hidden />
        <h1 className="text-sm font-semibold">{t("nav_evidence")}</h1>
        <span className="ml-auto font-mono text-[11px] text-tx-3">
          {filtered.length} {t("ledger_entries_count")}
        </span>
      </div>

      {/* ── Chain status bar ── */}
      <ChainStatusBar chainState={chainState} onVerify={runVerify} />

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* work item pre-filter chip */}
        {wiFilter && (
          <span className="flex items-center gap-1 rounded-ctl border border-laiton/40 bg-laiton/10 px-2 py-0.5 font-mono text-[10px] text-laiton">
            {wiFilter}
            <Link
              to="/evidence"
              className="ml-0.5 leading-none text-laiton/70 hover:text-laiton"
              aria-label={t("ledger_clear_filter")}
            >
              ×
            </Link>
          </span>
        )}

        {/* Client */}
        <label className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-tx-3">{t("ledger_filter_client")}</span>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">{t("ledger_filter_all")}</option>
            {clientOpts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {/* Actor */}
        <label className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-tx-3">{t("ledger_filter_actor")}</span>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">{t("ledger_filter_all")}</option>
            {actorOpts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        {/* Type (outcome) */}
        <label className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-tx-3">{t("ledger_filter_type")}</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">{t("ledger_filter_all")}</option>
            <option value="verified">{t("ledger_outcome_verified")}</option>
            <option value="rejected">{t("ledger_outcome_rejected")}</option>
            <option value="in_progress">{t("ledger_outcome_in_progress")}</option>
          </select>
        </label>
      </div>

      {/* ── Ledger ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
          <p className="text-[13px] text-tx-2">{t("ledger_no_executions")}</p>
          <p className="font-mono text-xs text-tx-3">{t("action_evidence")}</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-line">
          {filtered.map((exec) => {
            const wi = workItemMap.get(exec.workItemId);
            const client: Client | undefined = wi?.clientId
              ? clientMap.get(wi.clientId)
              : undefined;
            const expanded = expandedIds.has(exec.id);
            const affected = isExecAffected(exec);
            const firstSeq = exec.steps[0]?.seq;

            return (
              <div
                key={exec.id}
                className={cn(
                  "border-b border-line/30 last:border-b-0",
                  affected && "border-l-2 border-l-err",
                )}
              >
                {/* Execution header (toggle expand) */}
                <button
                  onClick={() => toggleExpand(exec.id)}
                  aria-expanded={expanded}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-bg-1/50",
                    affected && "bg-err/5",
                  )}
                  type="button"
                >
                  {expanded ? (
                    <ChevronDown size={11} className="shrink-0 text-tx-3" aria-hidden />
                  ) : (
                    <ChevronRight size={11} className="shrink-0 text-tx-3" aria-hidden />
                  )}

                  {/* seq of first step */}
                  <span className="w-14 shrink-0 font-mono text-[10px] text-tx-3">
                    {firstSeq !== undefined ? `·${String(firstSeq).padStart(3, "0")}` : "—"}
                  </span>

                  {/* work item title */}
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-tx-1">
                    {wi?.title ?? exec.workItemId}
                  </span>

                  {/* client name */}
                  {client && (
                    <span className="shrink-0 font-mono text-[10px] text-tx-3">{client.name}</span>
                  )}

                  {/* outcome badge */}
                  <OutcomeBadge outcome={exec.outcome} />

                  {/* step count */}
                  <span className="shrink-0 font-mono text-[10px] text-tx-3">
                    {exec.steps.length} {t("ledger_step_count")}
                  </span>

                  {/* broken indicator */}
                  {affected && (
                    <AlertTriangle
                      size={11}
                      className="shrink-0 text-err"
                      aria-label={t("ledger_broken_from")}
                    />
                  )}
                </button>

                {/* Steps (expanded) */}
                {expanded && (
                  <div
                    className="border-t border-line/20"
                    role="list"
                    aria-label={wi?.title ?? exec.id}
                  >
                    {exec.steps.map((step) => (
                      <StepRow
                        key={step.seq}
                        step={step}
                        actor={step.actorId ? actorMap.get(step.actorId) : undefined}
                        broken={isStepBroken(step.seq)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

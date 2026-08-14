import { useMemo } from "react";
import { LineChart } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import type { TKey } from "@/lib/i18n";

// ─── Stat tile ───────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  estimation?: boolean;
  variant?: "default" | "ok" | "warn" | "err" | "or" | "laiton";
}

function StatTile({ label, value, unit, estimation, variant = "default" }: StatTileProps) {
  const valueColor =
    variant === "ok"
      ? "text-ok"
      : variant === "warn"
        ? "text-warn"
        : variant === "err"
          ? "text-err"
          : variant === "or"
            ? "text-or"
            : variant === "laiton"
              ? "text-laiton"
              : "text-tx-1";

  return (
    <div className="rounded-card border border-line bg-bg-1 px-4 py-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-tx-3 truncate">{label}</span>
        {estimation && (
          <span className="shrink-0 rounded border border-or/30 bg-or/10 px-1 py-px font-mono text-[9px] text-or">
            ESTIM.
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-2xl font-semibold tabular-nums ${valueColor}`}>
          {value}
        </span>
        {unit && <span className="font-mono text-[11px] text-tx-3">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <h2 className="mt-6 mb-3 text-[11px] font-semibold uppercase tracking-wider text-tx-3">
      {label}
    </h2>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const t = useT();
  const {
    workItems,
    actors,
    approvals,
    executions,
    blockers,
    automations,
    proposals,
    activeWorkspaceId,
  } = useAppStore();

  const metrics = useMemo(() => {
    const wsItems = workItems.filter((w) => w.workspaceId === activeWorkspaceId);
    const wsActors = actors.filter(() => true);
    const wsApprovals = approvals.filter((a) => a.workspaceId === activeWorkspaceId);
    const wsExecutions = executions.filter((e) => e.workspaceId === activeWorkspaceId);
    const wsBlockers = blockers.filter((b) => b.workspaceId === activeWorkspaceId);
    const wsAutomations = automations.filter((a) => a.workspaceId === activeWorkspaceId);
    const wsProposals = proposals.filter((p) => p.workspaceId === activeWorkspaceId);

    // Work
    const doneItems = wsItems.filter((w) => w.status === "done");
    const agentDone = doneItems.filter((w) => {
      const actor = wsActors.find((a) => a.id === w.assignedActorId);
      return actor?.type === "ai_agent";
    });
    const pendingDecisions = wsApprovals.filter((a) => a.status === "pending").length;

    // Verification
    const verifiedExec = wsExecutions.filter((e) => e.outcome === "verified").length;
    const rejectedExec = wsExecutions.filter((e) => e.outcome === "rejected").length;
    const totalExec = verifiedExec + rejectedExec;
    const verifyFailRate = totalExec > 0 ? Math.round((rejectedExec / totalExec) * 100) : 0;

    // Blockers
    const localResolved = wsBlockers.filter((b) => b.scope === "local" && b.resolved).length;
    const globalActive = wsBlockers.filter((b) => b.scope === "global" && !b.resolved).length;

    // External-effect approvals
    const extApprovals = wsApprovals.filter((a) => {
      if (!a.workItemId) return false;
      const wi = wsItems.find((w) => w.id === a.workItemId);
      return wi?.externalEffect;
    }).length;

    // Automations
    const deployedAutomations = wsAutomations.filter((a) => a.stage === "deployed").length;

    // Cost & value (ESTIMATION)
    const aiAgents = wsActors.filter((a) => a.type === "ai_agent" && a.costPerHour !== undefined);
    const aiCostPerDay = aiAgents.reduce(
      (sum, a) => sum + (a.costPerHour ?? 0) * (a.workloadPct / 100) * 8,
      0,
    );

    const savedHoursPerMonth = wsProposals
      .filter((p) => p.status === "deployed" || p.status === "building" || p.status === "approved")
      .reduce((sum, p) => sum + p.estimatedSavedHoursPerMonth, 0);

    const hourlyRate = 60;
    const operationalValue = savedHoursPerMonth * hourlyRate;

    return {
      doneItems: doneItems.length,
      agentDone: agentDone.length,
      pendingDecisions,
      verifyFailRate,
      localResolved,
      globalActive,
      extApprovals,
      deployedAutomations,
      aiCostPerDay: aiCostPerDay.toFixed(2),
      savedHoursPerMonth: savedHoursPerMonth.toFixed(1),
      operationalValue: Math.round(operationalValue),
    };
  }, [
    workItems,
    actors,
    approvals,
    executions,
    blockers,
    automations,
    proposals,
    activeWorkspaceId,
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LineChart size={16} className="text-tx-3" />
          <h1 className="text-sm font-semibold">{t("nav_analytics")}</h1>
        </div>
        <Badge variant="laiton" className="font-mono text-[10px]">
          MOCK
        </Badge>
      </div>

      {/* ── Work ─────────────────────────────────────────────────────────────── */}
      <SectionHeader label={t("anl_section_work" as TKey)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label={t("anl_metric_verified" as TKey)}
          value={metrics.doneItems}
          unit={t("anl_unit_items" as TKey)}
          variant="ok"
        />
        <StatTile
          label={t("anl_metric_agent_done" as TKey)}
          value={metrics.agentDone}
          unit={t("anl_unit_items" as TKey)}
          variant="laiton"
        />
        <StatTile
          label={t("anl_metric_human_decisions" as TKey)}
          value={metrics.pendingDecisions}
          unit={t("anl_unit_items" as TKey)}
          variant={metrics.pendingDecisions > 0 ? "or" : "default"}
        />
        <StatTile
          label={t("anl_metric_ext_approvals" as TKey)}
          value={metrics.extApprovals}
          unit={t("anl_unit_items" as TKey)}
        />
      </div>

      {/* ── Verification ─────────────────────────────────────────────────────── */}
      <SectionHeader label={t("anl_section_verification" as TKey)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={t("anl_metric_verify_fail_rate" as TKey)}
          value={metrics.verifyFailRate}
          unit={t("anl_unit_pct" as TKey)}
          variant={
            metrics.verifyFailRate > 20 ? "err" : metrics.verifyFailRate > 10 ? "warn" : "ok"
          }
        />
        <StatTile
          label={t("anl_metric_automations_deployed" as TKey)}
          value={metrics.deployedAutomations}
          unit={t("anl_unit_items" as TKey)}
          variant="ok"
        />
      </div>

      {/* ── Blockers ─────────────────────────────────────────────────────────── */}
      <SectionHeader label={t("anl_section_blockers" as TKey)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={t("anl_metric_blockers_local_resolved" as TKey)}
          value={metrics.localResolved}
          unit={t("anl_unit_items" as TKey)}
          variant="ok"
        />
        <StatTile
          label={t("anl_metric_global_blockers" as TKey)}
          value={metrics.globalActive}
          unit={t("anl_unit_items" as TKey)}
          variant={metrics.globalActive > 0 ? "err" : "ok"}
        />
      </div>

      {/* ── Cost & value ─────────────────────────────────────────────────────── */}
      <SectionHeader label={t("anl_section_cost" as TKey)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={t("anl_metric_ai_cost_day" as TKey)}
          value={metrics.aiCostPerDay}
          unit={t("anl_unit_cad" as TKey)}
          estimation
          variant="laiton"
        />
        <StatTile
          label={t("anl_metric_human_time_saved" as TKey)}
          value={metrics.savedHoursPerMonth}
          unit={t("anl_unit_hours" as TKey)}
          estimation
          variant="ok"
        />
        <StatTile
          label={t("anl_metric_operational_value" as TKey)}
          value={metrics.operationalValue}
          unit={t("anl_unit_cad" as TKey)}
          estimation
          variant="ok"
        />
      </div>

      <p className="mt-6 text-[11px] text-tx-3">
        {t("anl_estimation_badge" as TKey)} — toutes les métriques sont dérivées du store local.
      </p>
    </div>
  );
}

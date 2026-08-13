import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { WorkStatus, Policy } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

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

const STATUS_BADGE: Record<WorkStatus, "default" | "ok" | "warn" | "err" | "info" | "or" | "laiton"> = {
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

const POLICY_VARIANT = {
  auto: "ok",
  approval_required: "warn",
  human_only: "or",
  forbidden: "err",
} as const;

const POLICY_LABEL: Record<Policy["rule"], TKey> = {
  auto: "cli_policy_auto",
  approval_required: "cli_policy_approval",
  human_only: "cli_policy_human",
  forbidden: "cli_policy_forbidden",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-tx-3">{children}</p>
  );
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const navigate = useNavigate();
  const { actors, providers, workItems, policies } = useAppStore();

  const actor = actors.find((a) => a.id === id && a.type === "ai_agent");

  if (!actor) {
    return <Navigate to="/agents" replace />;
  }

  const provider = actor.providerId ? providers.find((p) => p.id === actor.providerId) : undefined;

  const assignedItems = workItems.filter((wi) => wi.assignedActorId === actor.id);
  const activeItems = assignedItems.filter((wi) => !["done", "failed"].includes(wi.status));
  const failedItems = assignedItems.filter((wi) => wi.status === "failed");

  const initials = actor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const healthVariant =
    actor.health === "ok" ? "ok" : actor.health === "degraded" ? "warn" : "err";
  const healthKey: TKey =
    actor.health === "ok"
      ? "agent_health_ok"
      : actor.health === "degraded"
        ? "agent_health_degraded"
        : "agent_health_down";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <button
          className="mb-3 flex items-center gap-1.5 font-mono text-[11px] text-tx-3 transition-colors hover:text-tx-1 focus-visible:outline-2 focus-visible:outline-or"
          onClick={() => navigate("/agents")}
          type="button"
          aria-label={t("agent_back")}
        >
          <ChevronLeft size={13} aria-hidden />
          {t("agent_back")}
        </button>

        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl bg-laiton/20 font-mono text-[12px] font-semibold text-laiton"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-tx-1">{actor.name}</h1>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-tx-3">{actor.role}</span>
              {provider && (
                <>
                  <span className="text-tx-3">·</span>
                  <span className="font-mono text-[11px] text-laiton">{provider.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {actor.health && (
              <Badge variant={healthVariant} className="text-[10px]">
                {t(healthKey)}
              </Badge>
            )}
            <Badge variant="laiton" className="font-mono text-[10px]">
              {t("home_mock_badge")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-widest text-tx-3">
            {t("actor_workload")}
          </p>
          <p
            className={cn(
              "mt-1.5 font-mono text-2xl font-semibold leading-none",
              actor.workloadPct >= 80
                ? "text-err"
                : actor.workloadPct >= 60
                  ? "text-warn"
                  : "text-laiton",
            )}
          >
            {actor.workloadPct}%
          </p>
        </div>

        {actor.successRatePct !== undefined && (
          <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-tx-3">
              {t("agent_success_rate")}
            </p>
            <p className="mt-1.5 font-mono text-2xl font-semibold leading-none text-ok">
              {actor.successRatePct}%
            </p>
          </div>
        )}

        {actor.verificationPassRatePct !== undefined && (
          <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-tx-3">
              {t("agent_verify_rate")}
            </p>
            <p className="mt-1.5 font-mono text-2xl font-semibold leading-none text-ok">
              {actor.verificationPassRatePct}%
            </p>
          </div>
        )}

        {actor.costPerHour !== undefined && (
          <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-tx-3">
              {t("actor_cost_hour")}
            </p>
            <p className="mt-1.5 font-mono text-2xl font-semibold leading-none text-tx-1">
              {actor.costPerHour.toFixed(2)}$
            </p>
          </div>
        )}
      </div>

      {/* Provider */}
      {provider && (
        <section aria-label={t("actor_provider")}>
          <SectionLabel>{t("actor_provider")}</SectionLabel>
          <div className="rounded-card border border-laiton/25 bg-laiton/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-tx-1">{provider.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-tx-3">{provider.category}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={provider.health === "ok" ? "ok" : provider.health === "degraded" ? "warn" : "err"}
                  className="text-[10px]"
                >
                  {provider.health ?? "—"}
                </Badge>
                <Badge variant="laiton" className="text-[10px]">
                  {provider.state}
                </Badge>
              </div>
            </div>
            {actor.lastRunAt && (
              <div className="mt-2 flex items-center gap-1.5 border-t border-laiton/15 pt-2">
                <Clock size={10} className="text-tx-3" aria-hidden />
                <span className="font-mono text-[10px] text-tx-3">
                  {t("agent_last_run")} {new Date(actor.lastRunAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Current assignment */}
      <section aria-label={t("agent_current_assign")}>
        <SectionLabel>{t("agent_current_assign")}</SectionLabel>
        {activeItems.length === 0 ? (
          <p className="font-mono text-[12px] text-tx-3">{t("actor_no_assigned")}</p>
        ) : (
          <div className="space-y-1.5">
            {activeItems.map((wi) => (
              <button
                key={wi.id}
                className="flex w-full items-center gap-2.5 rounded-ctl border border-line bg-bg-0/50 px-3 py-2 text-left transition-colors hover:border-laiton/30 hover:bg-bg-1 focus-visible:outline-2 focus-visible:outline-or"
                onClick={() => navigate("/work")}
                type="button"
                aria-label={wi.title}
              >
                <Badge variant={STATUS_BADGE[wi.status]} className="shrink-0 font-mono text-[9px]">
                  {t(STATUS_KEY[wi.status])}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-[12px] text-tx-1">{wi.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-tx-3">{wi.id}</span>
                <ArrowRight size={11} className="shrink-0 text-tx-3" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Capabilities + Policies */}
      <section aria-label={t("actor_capabilities")}>
        <div className="mb-3 flex items-center gap-2">
          <SectionLabel>{t("actor_capabilities")}</SectionLabel>
        </div>
        <div className="space-y-1.5">
          {actor.capabilities.map((cap) => {
            const pol = policies.find((p) => p.capability === cap);
            return (
              <div
                key={cap}
                className="flex items-center justify-between rounded-ctl border border-line bg-bg-1 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Shield size={10} className="shrink-0 text-tx-3" aria-hidden />
                  <span className="font-mono text-[11px] text-tx-1">{cap}</span>
                </div>
                {pol ? (
                  <Badge
                    variant={POLICY_VARIANT[pol.rule]}
                    className="shrink-0 text-[9px]"
                  >
                    {t(POLICY_LABEL[pol.rule])}
                  </Badge>
                ) : (
                  <Badge variant="default" className="shrink-0 text-[9px]">
                    —
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent failures */}
      <section aria-label={t("agent_recent_failures")}>
        <SectionLabel>{t("agent_recent_failures")}</SectionLabel>
        {failedItems.length === 0 ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-ok" aria-hidden />
            <p className="font-mono text-[12px] text-tx-3">{t("agent_no_failures")}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {failedItems.map((wi) => (
              <div
                key={wi.id}
                className="flex items-start gap-2 rounded-ctl border border-err/25 bg-err/5 px-3 py-2.5"
              >
                <AlertTriangle size={11} className="mt-0.5 shrink-0 text-err" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-err">{wi.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-tx-3">{wi.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

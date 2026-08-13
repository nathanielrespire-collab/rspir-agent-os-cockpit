import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/hooks";
import type { Actor, Provider, WorkItem, Policy } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

const AVAIL_DOT: Record<Actor["availability"], string> = {
  available: "bg-ok",
  busy: "bg-warn",
  offline: "bg-tx-3",
};

const AVAIL_KEY: Record<Actor["availability"], TKey> = {
  available: "actor_avail_available",
  busy: "actor_avail_busy",
  offline: "actor_avail_offline",
};

const HEALTH_VARIANT = {
  ok: "ok",
  degraded: "warn",
  down: "err",
} as const;

const HEALTH_KEY: Record<NonNullable<Actor["health"]>, TKey> = {
  ok: "agent_health_ok",
  degraded: "agent_health_degraded",
  down: "agent_health_down",
};

export interface ActorCardProps {
  actor: Actor;
  provider?: Provider;
  assignedItems: WorkItem[];
  policies: Policy[];
  onClick?: () => void;
}

function CardInner({
  actor,
  provider,
  assignedItems,
  policies,
  isButton,
}: ActorCardProps & { isButton: boolean }) {
  const t = useT();

  const isAgent = actor.type === "ai_agent";
  const initials = actor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const displayedCaps = actor.capabilities.slice(0, 3);
  const extraCaps = actor.capabilities.length - 3;

  const activeItems = assignedItems.filter((wi) => !["done", "failed"].includes(wi.status));

  return (
    <>
      {/* Header */}
      <div className="mb-3 flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-ctl font-mono text-[10px] font-semibold",
            isAgent ? "bg-laiton/20 text-laiton" : "bg-tx-3/20 text-tx-2",
          )}
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-tx-1">{actor.name}</span>
            <Badge variant={isAgent ? "laiton" : "default"} className="shrink-0 text-[9px]">
              {t(isAgent ? "actor_type_agent" : "actor_type_human")}
            </Badge>
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <span className="font-mono text-[11px] text-tx-3">{actor.role}</span>
            {provider && (
              <>
                <span className="text-[10px] text-tx-3">·</span>
                <span className="font-mono text-[11px] text-laiton">{provider.name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={cn("h-1.5 w-1.5 rounded-full", AVAIL_DOT[actor.availability])} aria-hidden />
          <span className="font-mono text-[10px] text-tx-3">{t(AVAIL_KEY[actor.availability])}</span>
          {isButton && (
            <ArrowRight
              size={11}
              className="ml-0.5 text-tx-3 transition-transform group-hover:translate-x-0.5 group-hover:text-laiton"
              aria-hidden
            />
          )}
        </div>
      </div>

      {/* Workload */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
            {t("actor_workload")}
          </span>
          <span
            className={cn(
              "font-mono text-[10px] font-semibold",
              actor.workloadPct >= 80
                ? "text-err"
                : actor.workloadPct >= 60
                  ? "text-warn"
                  : "text-laiton",
            )}
          >
            {actor.workloadPct}%
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-bg-0">
          <div
            className={cn(
              "h-full rounded-full",
              actor.workloadPct >= 80
                ? "bg-err"
                : actor.workloadPct >= 60
                  ? "bg-warn"
                  : "bg-laiton",
            )}
            style={{ width: `${actor.workloadPct}%` }}
            role="progressbar"
            aria-valuenow={actor.workloadPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Agent metrics row */}
      {isAgent && (actor.successRatePct !== undefined || actor.health) && (
        <div className="mb-3 flex items-center gap-3">
          {actor.successRatePct !== undefined && (
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] text-tx-3">{t("agent_success_rate")}</span>
              <span className="font-mono text-[10px] font-semibold text-ok">
                {actor.successRatePct}%
              </span>
            </div>
          )}
          {actor.verificationPassRatePct !== undefined && (
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] text-tx-3">{t("agent_verify_rate")}</span>
              <span className="font-mono text-[10px] font-semibold text-ok">
                {actor.verificationPassRatePct}%
              </span>
            </div>
          )}
          {actor.health && (
            <Badge
              variant={HEALTH_VARIANT[actor.health]}
              className="ml-auto shrink-0 text-[9px]"
            >
              {t(HEALTH_KEY[actor.health])}
            </Badge>
          )}
        </div>
      )}

      {/* Capabilities */}
      <div className="mb-3">
        <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-tx-3">
          {t("actor_capabilities")}
        </p>
        <div className="flex flex-wrap gap-1">
          {displayedCaps.map((cap) => {
            const pol = policies.find((p) => p.capability === cap);
            return (
              <span
                key={cap}
                className={cn(
                  "inline-flex items-center rounded-ctl border px-1.5 py-0.5 font-mono text-[9px]",
                  pol?.rule === "auto"
                    ? "border-ok/30 bg-ok/10 text-ok"
                    : pol?.rule === "approval_required"
                      ? "border-warn/30 bg-warn/10 text-warn"
                      : pol?.rule === "human_only"
                        ? "border-or/30 bg-or/10 text-or"
                        : pol?.rule === "forbidden"
                          ? "border-err/30 bg-err/10 text-err"
                          : "border-line bg-bg-0/60 text-tx-3",
                )}
              >
                {cap}
              </span>
            );
          })}
          {extraCaps > 0 && (
            <span className="inline-flex items-center rounded-ctl border border-line bg-bg-0/60 px-1.5 py-0.5 font-mono text-[9px] text-tx-3">
              +{extraCaps}
            </span>
          )}
        </div>
      </div>

      {/* Assigned work */}
      <div>
        <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-tx-3">
          {t("actor_assigned_work")}
        </p>
        {activeItems.length === 0 ? (
          <p className="font-mono text-[11px] text-tx-3">{t("actor_no_assigned")}</p>
        ) : (
          <div className="space-y-1">
            {activeItems.slice(0, 2).map((wi) => (
              <div
                key={wi.id}
                className="flex items-center gap-1.5 rounded-ctl border border-line bg-bg-0/60 px-2 py-1"
              >
                <span className="font-mono text-[9px] text-tx-3">{wi.id}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-tx-2">
                  {wi.title}
                </span>
              </div>
            ))}
            {activeItems.length > 2 && (
              <p className="font-mono text-[10px] text-tx-3">+{activeItems.length - 2}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {(actor.costPerHour !== undefined || actor.lastRunAt) && (
        <div className="mt-3 flex items-center gap-3 border-t border-line pt-2.5">
          {actor.costPerHour !== undefined && (
            <span className="font-mono text-[10px] text-tx-3">
              {t("actor_cost_hour")} {actor.costPerHour.toFixed(2)}$
            </span>
          )}
          {actor.lastRunAt && (
            <div className="flex items-center gap-1">
              <Clock size={9} className="shrink-0 text-tx-3" aria-hidden />
              <span className="font-mono text-[10px] text-tx-3">
                {t("agent_last_run")} {new Date(actor.lastRunAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function ActorCard(props: ActorCardProps) {
  const { onClick } = props;

  if (onClick) {
    return (
      <button
        className="group w-full rounded-card border border-line bg-bg-1 p-4 text-left transition-colors hover:border-laiton/40 hover:bg-bg-2 focus-visible:outline-2 focus-visible:outline-or"
        onClick={onClick}
        type="button"
        aria-label={props.actor.name}
      >
        <CardInner {...props} isButton />
      </button>
    );
  }

  return (
    <div className="rounded-card border border-line bg-bg-1 p-4">
      <CardInner {...props} isButton={false} />
    </div>
  );
}

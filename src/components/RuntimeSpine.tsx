import { Fragment } from "react";
import { cn } from "@/components/ui/utils";
import { useT } from "@/lib/hooks";
import type { RuntimeStage } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

const STAGES: RuntimeStage[] = [
  "reconcile",
  "select",
  "claim",
  "context",
  "policy",
  "execute",
  "verify",
  "update",
  "continue",
];

const STAGE_ABBR: Record<RuntimeStage, string> = {
  reconcile: "REC",
  select: "SEL",
  claim: "CLM",
  context: "CTX",
  policy: "POL",
  execute: "EXE",
  verify: "VER",
  update: "UPD",
  continue: "CON",
};

const STAGE_KEY: Record<RuntimeStage, TKey> = {
  reconcile: "home_stage_reconcile",
  select: "home_stage_select",
  claim: "home_stage_claim",
  context: "home_stage_context",
  policy: "home_stage_policy",
  execute: "home_stage_execute",
  verify: "home_stage_verify",
  update: "home_stage_update",
  continue: "home_stage_continue",
};

export type SpineNodeState = "idle" | "done" | "active" | "active-human" | "error";

export interface RuntimeSpineProps {
  /** Per-item: which stage is currently active */
  activeStage?: RuntimeStage;
  /** Per-item: visual state for the active stage node */
  stageState?: SpineNodeState;
  /** Aggregate: item count per stage (policy stage renders as active-human) */
  stageCounts?: Partial<Record<RuntimeStage, number>>;
  size?: "sm" | "md";
  /** Show abbreviated labels below dots */
  showLabels?: boolean;
  className?: string;
}

export function RuntimeSpine({
  activeStage,
  stageState = "active",
  stageCounts,
  size = "sm",
  showLabels = false,
  className,
}: RuntimeSpineProps) {
  const t = useT();
  const activeIdx = activeStage !== undefined ? STAGES.indexOf(activeStage) : -1;

  function resolveNodeState(stage: RuntimeStage, idx: number): SpineNodeState {
    if (stageCounts !== undefined) {
      const count = stageCounts[stage] ?? 0;
      if (count > 0) return stage === "policy" ? "active-human" : "active";
      return "idle";
    }
    if (activeIdx < 0) return "idle";
    if (idx < activeIdx) return "done";
    if (idx === activeIdx) return stageState;
    return "idle";
  }

  const dotSz = size === "sm" ? "h-2 w-2" : "h-3 w-3";

  return (
    <div
      className={cn("flex w-full items-center", className)}
      role="group"
      aria-label={t("home_spine_label")}
    >
      {STAGES.map((stage, idx) => {
        const nodeState = resolveNodeState(stage, idx);
        const count = stageCounts?.[stage];
        const isLast = idx === STAGES.length - 1;

        return (
          <Fragment key={stage}>
            {/* Stage node */}
            <div className="flex flex-col items-center" style={{ minWidth: size === "sm" ? 26 : 40 }}>
              <div className="relative">
                <div
                  className={cn(
                    "rounded-full transition-colors",
                    dotSz,
                    nodeState === "idle" && "border border-line bg-bg-2",
                    nodeState === "done" && "bg-ok",
                    nodeState === "active" &&
                      "bg-laiton ring-2 ring-laiton/20 animate-pulse motion-reduce:animate-none",
                    nodeState === "active-human" &&
                      "bg-or ring-2 ring-or/20 animate-pulse motion-reduce:animate-none",
                    nodeState === "error" && "bg-err",
                  )}
                  title={t(STAGE_KEY[stage])}
                />
                {count !== undefined && count > 1 && (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-line bg-bg-1 font-mono text-[8px] leading-none text-tx-3">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>

              {showLabels && (
                <span
                  className={cn(
                    "mt-1 font-mono text-[8px] uppercase tracking-wide leading-none",
                    nodeState === "idle" && "text-tx-3/50",
                    nodeState === "done" && "text-ok/70",
                    nodeState === "active" && "text-laiton",
                    nodeState === "active-human" && "text-or",
                    nodeState === "error" && "text-err",
                  )}
                >
                  {STAGE_ABBR[stage]}
                </span>
              )}
            </div>

            {/* Connector */}
            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-px transition-colors",
                  nodeState === "done" ? "bg-ok/30" : "bg-line",
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

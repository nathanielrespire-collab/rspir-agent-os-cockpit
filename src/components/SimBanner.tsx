import { useEffect } from "react";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useSimStore, SCENARIO_STEPS, TOTAL_STEPS } from "@/lib/simulation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

// Auto-advance interval in ms
const PLAY_INTERVAL_MS = 2200;

export function SimBanner() {
  const t = useT();
  const { active, paused, step, resetting, pause, resume, advance, resetSim } = useSimStore();

  const isDone = step >= TOTAL_STEPS;
  const currentStep = SCENARIO_STEPS[step] ?? null;

  // Auto-play: advance every interval when not paused and not done
  useEffect(() => {
    if (!active || paused || isDone) return;
    const id = setInterval(() => {
      void useSimStore.getState().advance();
    }, PLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, paused, isDone]);

  if (!active) return null;

  const dayLabel = currentStep
    ? t(`sim_day_${currentStep.day}` as Parameters<typeof t>[0])
    : t("sim_done_label");

  const stepLabel = currentStep ? currentStep.labelFr : t("sim_done_label");

  const stepCount = t("sim_step_of")
    .replace("{n}", String(Math.min(step, TOTAL_STEPS)))
    .replace("{total}", String(TOTAL_STEPS));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t("sim_banner_label")}
      className="flex items-center gap-3 border-b border-or/30 bg-or/8 px-4 py-2"
    >
      {/* Badge */}
      <Badge variant="or" className="shrink-0 font-mono text-[10px] tracking-widest">
        {t("sim_banner_label")}
      </Badge>

      {/* Day marker */}
      <span
        className={cn(
          "shrink-0 rounded-ctl border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
          isDone ? "border-ok/40 text-ok" : "border-or/40 text-or",
        )}
      >
        {dayLabel}
      </span>

      {/* Step description */}
      <p className="min-w-0 flex-1 truncate font-mono text-[12px] text-tx-2">{stepLabel}</p>

      {/* Step counter */}
      <span className="shrink-0 font-mono text-[11px] text-tx-3">{stepCount}</span>

      {/* Controls */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Play / Pause */}
        {!isDone && (
          <button
            onClick={paused ? resume : pause}
            aria-label={paused ? t("sim_play") : t("sim_pause")}
            className="rounded-ctl p-1.5 text-tx-2 transition-colors hover:bg-or/15 hover:text-or focus-visible:outline-2 focus-visible:outline-or"
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
        )}

        {/* Step */}
        {!isDone && (
          <button
            onClick={() => void advance()}
            aria-label={t("sim_step")}
            disabled={resetting}
            className="rounded-ctl p-1.5 text-tx-2 transition-colors hover:bg-or/15 hover:text-or focus-visible:outline-2 focus-visible:outline-or disabled:opacity-40"
          >
            <SkipForward size={13} />
          </button>
        )}

        {/* Reset */}
        <button
          onClick={() => void resetSim()}
          aria-label={t("sim_reset")}
          disabled={resetting}
          className="rounded-ctl p-1.5 text-tx-3 transition-colors hover:bg-bg-2 hover:text-tx-1 focus-visible:outline-2 focus-visible:outline-or disabled:opacity-40"
        >
          {resetting ? (
            <span className="font-mono text-[10px]">…</span>
          ) : (
            <RotateCcw size={13} />
          )}
        </button>
      </div>
    </div>
  );
}

// Compact controls for embedding in page headers (e.g. Home)
export function SimControls({ className }: { className?: string }) {
  const t = useT();
  const { active, paused, step, resetting, pause, resume, advance } = useSimStore();

  if (!active) return null;

  const isDone = step >= TOTAL_STEPS;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Badge variant="or" className="font-mono text-[10px] tracking-widest">
        {t("sim_banner_label")}
      </Badge>
      {!isDone && (
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={paused ? resume : pause}
            aria-label={paused ? t("sim_play") : t("sim_pause")}
            className="h-6 px-2"
          >
            {paused ? <Play size={11} /> : <Pause size={11} />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void advance()}
            disabled={resetting}
            aria-label={t("sim_step")}
            className="h-6 px-2"
          >
            <SkipForward size={11} />
          </Button>
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import { Settings as SettingsIcon, RotateCcw, Play, SkipForward, Pause } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { useSimStore, SCENARIO_STEPS, TOTAL_STEPS } from "@/lib/simulation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const t = useT();
  const role = useUIStore((s) => s.role);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const { active, paused, step, resetting, start, pause, resume, advance, resetSim } =
    useSimStore();

  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const simDone = step >= TOTAL_STEPS;
  const currentStep = SCENARIO_STEPS[step] ?? null;

  async function handleReset() {
    setPending(true);
    await resetDemo();
    setPending(false);
    setShowConfirm(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-2">
        <SettingsIcon size={16} className="text-tx-3" />
        <h1 className="text-sm font-semibold">{t("nav_settings")}</h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* ── Simulation section ──────────────────────────────────────── */}
        <section className="rounded-card border border-or/30 bg-bg-1 p-4">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-or">
              {t("sim_section_title")}
            </h2>
            {active && (
              <Badge variant="or" className="font-mono text-[10px] tracking-widest">
                {t("sim_banner_label")}
              </Badge>
            )}
          </div>
          <p className="mb-4 text-[13px] text-tx-2">{t("sim_section_desc")}</p>

          {/* Evidence: requested by / executed by / policy */}
          <dl className="mb-4 space-y-2 rounded-ctl border border-line bg-bg-0 p-3 font-mono text-xs">
            <div className="flex gap-2">
              <dt className="text-tx-3">{t("sim_requested_by")}</dt>
              <dd className="text-tx-1">{role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-tx-3">{t("sim_executed_by")}</dt>
              <dd className="text-laiton">RSPIR Agent OS · store actions</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-tx-3">{t("sim_policy_label")}</dt>
              <dd className="text-or">{t("sim_policy_value")}</dd>
            </div>
          </dl>

          {!active ? (
            <Button variant="secondary" size="sm" onClick={start} aria-label={t("sim_start_btn")}>
              <Play size={13} />
              {t("sim_start_btn")}
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* Step counter */}
              <span className="font-mono text-[11px] text-tx-3">
                {t("sim_step_of")
                  .replace("{n}", String(Math.min(step, TOTAL_STEPS)))
                  .replace("{total}", String(TOTAL_STEPS))}
              </span>

              {/* Current step label */}
              {currentStep && (
                <span className="font-mono text-[12px] text-tx-2">
                  {t(`sim_day_${currentStep.day}` as Parameters<typeof t>[0])} —{" "}
                  {currentStep.labelFr}
                </span>
              )}
              {simDone && (
                <span className="font-mono text-[12px] text-ok">{t("sim_done_label")}</span>
              )}

              <div className="ml-auto flex gap-2">
                {/* Play / Pause */}
                {!simDone && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={paused ? resume : pause}
                    aria-label={paused ? t("sim_play") : t("sim_pause")}
                  >
                    {paused ? <Play size={13} /> : <Pause size={13} />}
                    {paused ? t("sim_play") : t("sim_pause")}
                  </Button>
                )}

                {/* Step */}
                {!simDone && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void advance()}
                    disabled={resetting}
                    aria-label={t("sim_step")}
                  >
                    <SkipForward size={13} />
                    {t("sim_step")}
                  </Button>
                )}

                {/* Reset */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void resetSim()}
                  disabled={resetting}
                  aria-label={t("sim_reset")}
                >
                  <RotateCcw size={13} />
                  {resetting ? t("sim_resetting") : t("sim_reset")}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* ── Demo data section ────────────────────────────────────────── */}
        <section className="rounded-card border border-line bg-bg-1 p-4">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-tx-3">
            {t("settings_demo_section")}
          </h2>
          <p className="mb-4 text-[13px] text-tx-2">{t("settings_demo_reset_desc")}</p>
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              size="sm"
              aria-label={t("settings_demo_reset_label")}
              onClick={() => setShowConfirm(true)}
            >
              <RotateCcw size={13} />
              {t("settings_demo_reset_label")}
            </Button>
            {done && (
              <span className="font-mono text-xs text-ok" role="status">
                {t("settings_demo_success")}
              </span>
            )}
          </div>
        </section>
      </div>

      <Dialog open={showConfirm} onClose={() => !pending && setShowConfirm(false)}>
        <div className="p-5">
          <h3 id="reset-dialog-title" className="mb-2 text-sm font-semibold text-tx-1">
            {t("settings_demo_confirm_title")}
          </h3>
          <p className="mb-4 text-[13px] text-tx-2">{t("settings_demo_confirm_body")}</p>

          <dl className="mb-5 space-y-2 rounded-ctl border border-line bg-bg-0 p-3 font-mono text-xs">
            <div className="flex gap-2">
              <dt className="text-tx-3">{t("settings_demo_requested_by")}</dt>
              <dd className="text-tx-1">{role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-tx-3">{t("settings_demo_executed_by")}</dt>
              <dd className="text-tx-1">{t("settings_demo_executed_by_value")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-tx-3">{t("settings_demo_policy")}</dt>
              <dd className="text-laiton">{t("settings_demo_policy_value")}</dd>
            </div>
          </dl>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirm(false)}
              disabled={pending}
            >
              {t("settings_demo_cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReset}
              disabled={pending}
              aria-label={t("settings_demo_confirm")}
            >
              {pending ? "…" : t("settings_demo_confirm")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

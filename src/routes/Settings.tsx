import { useState } from "react";
import { Settings as SettingsIcon, RotateCcw } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export default function Settings() {
  const t = useT();
  const role = useUIStore((s) => s.role);
  const resetDemo = useAppStore((s) => s.resetDemo);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

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

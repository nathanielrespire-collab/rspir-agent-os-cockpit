import { Zap } from "lucide-react";
import { useT } from "@/lib/hooks";

export default function Automations() {
  const t = useT();
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-2">
        <Zap size={16} className="text-tx-3" />
        <h1 className="text-sm font-semibold">{t("nav_automations")}</h1>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
        <p className="text-[13px] text-tx-2">{t("empty_automations")}</p>
        <p className="font-mono text-xs text-tx-3">{t("action_automations")}</p>
      </div>
    </div>
  );
}

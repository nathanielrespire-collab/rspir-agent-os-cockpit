import { RefreshCw, CheckCircle2, AlertTriangle, BookOpen } from "lucide-react";
import { useT } from "@/lib/hooks";
import { cn } from "@/components/ui/utils";

export type ChainPhase =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "done"; brokenSeq: number | null; checkedAt: string };

function fmt(iso: string): string {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function ChainStatusBar({
  chainState,
  onVerify,
}: {
  chainState: ChainPhase;
  onVerify: () => void;
}) {
  const t = useT();
  const chainOk = chainState.phase === "done" && chainState.brokenSeq === null;
  const chainBroken = chainState.phase === "done" && chainState.brokenSeq !== null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-ctl border px-3 py-2",
        chainBroken
          ? "border-err/40 bg-err/5"
          : chainOk
            ? "border-ok/30 bg-ok/5"
            : "border-line bg-bg-1/50",
      )}
    >
      {chainState.phase === "checking" ? (
        <>
          <RefreshCw size={12} className="animate-spin text-tx-3" aria-hidden />
          <span className="font-mono text-[11px] text-tx-3">{t("ledger_verifying")}</span>
        </>
      ) : chainOk ? (
        <>
          <CheckCircle2 size={12} className="text-ok" aria-hidden />
          <span className="font-mono text-[11px] text-ok">{t("ledger_chain_intact")}</span>
        </>
      ) : chainBroken ? (
        <>
          <AlertTriangle size={12} className="text-err" aria-hidden />
          <span className="font-mono text-[11px] text-err">
            {t("ledger_chain_broken")} — {t("ledger_broken_from")}·{chainState.brokenSeq}
          </span>
        </>
      ) : (
        <>
          <BookOpen size={12} className="text-tx-3" aria-hidden />
          <span className="font-mono text-[11px] text-tx-3">{t("ledger_never_checked")}</span>
        </>
      )}

      <div className="ml-auto flex items-center gap-3">
        {chainState.phase === "done" && (
          <span className="font-mono text-[10px] text-tx-3">
            {t("ledger_verified_at")} {fmt(chainState.checkedAt)}
          </span>
        )}
        <button
          onClick={onVerify}
          disabled={chainState.phase === "checking"}
          className="flex items-center gap-1.5 rounded-ctl border border-line bg-bg-0 px-2.5 py-1 font-mono text-[11px] text-tx-2 transition-colors hover:bg-bg-1 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-or"
          type="button"
          aria-label={t("ledger_verify_btn")}
        >
          <RefreshCw size={11} aria-hidden />
          {t("ledger_verify_btn")}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Zap,
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronRight,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore, AUTOMATION_VALID_TRANSITIONS } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { AutomationStage } from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const STAGES: AutomationStage[] = ["draft", "test", "verified", "approved", "deployed"];

const STAGE_COLORS: Record<AutomationStage, string> = {
  draft: "border-line bg-bg-1 text-tx-2",
  test: "border-laiton/40 bg-laiton/10 text-laiton",
  verified: "border-ok/40 bg-ok/10 text-ok",
  approved: "border-or/40 bg-or/10 text-or",
  deployed: "border-ok/60 bg-ok/15 text-ok font-semibold",
};

const STAGE_DOT: Record<AutomationStage, string> = {
  draft: "bg-tx-3",
  test: "bg-laiton",
  verified: "bg-ok",
  approved: "bg-or",
  deployed: "bg-ok",
};

const APPROVAL_REQUIRED_STAGES: AutomationStage[] = ["deployed"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Lifecycle Visualizer ────────────────────────────────────────────────────

function LifecycleViz({ stage }: { stage: AutomationStage }) {
  const t = useT();
  const currentIdx = STAGES.indexOf(stage);

  const stageKey = (s: AutomationStage) =>
    `atm_stage_${s}` as
      | "atm_stage_draft"
      | "atm_stage_test"
      | "atm_stage_verified"
      | "atm_stage_approved"
      | "atm_stage_deployed";

  return (
    <div
      className="flex items-stretch gap-0 overflow-x-auto rounded-card border border-line bg-bg-1"
      role="list"
      aria-label={t("atm_lifecycle_label")}
    >
      {STAGES.map((s, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;
        const isLast = i === STAGES.length - 1;
        const needsApproval = APPROVAL_REQUIRED_STAGES.includes(s);

        return (
          <div key={s} className="flex items-stretch" role="listitem">
            <div
              className={cn(
                "flex min-w-[100px] flex-col gap-1.5 px-3 py-3 transition-colors",
                isCurrent && "bg-bg-2/60",
                isPast && "opacity-60",
                isFuture && !isCurrent && "opacity-40",
              )}
            >
              <div className="flex items-center gap-1.5">
                {isPast ? (
                  <CheckCircle2 size={12} className="shrink-0 text-ok" />
                ) : isCurrent ? (
                  <div
                    className={cn("h-2.5 w-2.5 shrink-0 rounded-full", STAGE_DOT[s])}
                    aria-hidden
                  />
                ) : (
                  <Circle size={12} className="shrink-0 text-tx-3/30" />
                )}
                <span
                  className={cn(
                    "font-mono text-[10px] font-semibold uppercase tracking-wide",
                    isCurrent ? "text-tx-1" : isPast ? "text-tx-3" : "text-tx-3/40",
                  )}
                >
                  {t(stageKey(s))}
                </span>
                {needsApproval && (
                  <Shield size={10} className={cn(isCurrent ? "text-or" : "text-tx-3/30")} />
                )}
              </div>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 font-mono text-[9px]",
                  isCurrent ? STAGE_COLORS[s] : "border-line bg-bg-0 text-tx-3/30",
                )}
              >
                {isCurrent ? t("atm_lifecycle_current") : isPast ? "✓" : "—"}
              </span>
            </div>
            {!isLast && (
              <div className="flex items-center px-0">
                <ChevronRight
                  size={12}
                  className={cn("shrink-0", i < currentIdx ? "text-tx-3" : "text-tx-3/20")}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Transition Dialog ───────────────────────────────────────────────────────

function TransitionDialog({
  automationId,
  currentStage,
  onClose,
}: {
  automationId: string;
  currentStage: AutomationStage;
  onClose: () => void;
}) {
  const t = useT();
  const { role } = useUIStore();
  const { transitionAutomationStage } = useAppStore();
  const [selected, setSelected] = useState<AutomationStage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validNext = AUTOMATION_VALID_TRANSITIONS[currentStage];

  const actorId =
    role === "Nathaniel"
      ? "act-nathaniel"
      : role === "Manny"
        ? "act-manny"
        : role === "Antoine"
          ? "act-antoine"
          : "act-aria";

  const needsApproval = selected !== null && APPROVAL_REQUIRED_STAGES.includes(selected);

  const stageKey = (s: AutomationStage) =>
    `atm_stage_${s}` as
      | "atm_stage_draft"
      | "atm_stage_test"
      | "atm_stage_verified"
      | "atm_stage_approved"
      | "atm_stage_deployed";

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await transitionAutomationStage(automationId, selected, actorId);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-ctl border border-ok/40 bg-ok/10 px-3 py-2">
          <CheckCircle2 size={14} className="text-ok" />
          <span className="text-[13px] text-ok">
            {selected && t(stageKey(selected))} {t("atm_transition_recorded")}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-ctl border border-line px-3 py-1.5 text-[13px] text-tx-2 hover:bg-bg-2"
        >
          {t("atm_cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <h3 className="text-[13px] font-semibold text-tx-1">{t("atm_transition_title")}</h3>

      {/* Current stage */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-tx-3">{t("atm_transition_current")}</span>
        <span
          className={cn(
            "rounded border px-1.5 py-0.5 font-mono text-[10px]",
            STAGE_COLORS[currentStage],
          )}
        >
          {t(stageKey(currentStage))}
        </span>
      </div>

      {/* Target selection */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] text-tx-3">{t("atm_transition_next")}</span>
        <div className="flex flex-col gap-1">
          {validNext.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={cn(
                "flex items-center gap-2 rounded-ctl border px-3 py-2 text-left text-[13px] transition-colors",
                selected === s
                  ? "border-or/60 bg-or/10 text-or"
                  : "border-line bg-bg-1 text-tx-2 hover:bg-bg-2",
              )}
            >
              <ArrowRight size={12} />
              {t(stageKey(s))}
              {APPROVAL_REQUIRED_STAGES.includes(s) && (
                <Shield size={11} className="ml-auto text-or/60" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Policy */}
      {selected !== null && (
        <div className="rounded-ctl border border-line bg-bg-0 px-3 py-2 font-mono text-[11px] text-tx-3">
          <div className="mb-1 font-semibold text-tx-2">{t("atm_transition_policy")}</div>
          {needsApproval ? (
            <div className="flex flex-col gap-1">
              <span className="text-or">{t("atm_transition_policy_approval")}</span>
              <div className="flex items-start gap-1 text-warn">
                <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                <span>{t("atm_transition_approval_note")}</span>
              </div>
            </div>
          ) : (
            <span>{t("atm_transition_policy_auto")}</span>
          )}
        </div>
      )}

      {/* Provenance */}
      {selected !== null && (
        <div className="grid grid-cols-2 gap-2 rounded-ctl border border-line bg-bg-1 px-3 py-2 font-mono text-[11px] text-tx-3">
          <span>
            <span className="mr-1 text-tx-2">{t("atm_requested_by")}</span>
            {role}
          </span>
          <span>
            <span className="mr-1 text-tx-2">{t("atm_executed_by")}</span>
            {role}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-ctl border border-line px-3 py-1.5 text-[13px] text-tx-2 hover:bg-bg-2"
        >
          {t("atm_cancel")}
        </button>
        <button
          onClick={handleConfirm}
          disabled={selected === null || submitting}
          className="rounded-ctl border border-or/40 bg-or/10 px-3 py-1.5 text-[13px] text-or hover:bg-or/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("atm_transition_confirm")}
        </button>
      </div>
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────

export default function AutomationDetail() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { automations, clients, providers, evidence } = useAppStore();
  const [showTransition, setShowTransition] = useState(false);

  const atm = automations.find((a) => a.id === id);

  if (!atm) {
    return (
      <div className="flex h-full flex-col gap-4">
        <button
          onClick={() => navigate("/automations")}
          className="flex w-fit items-center gap-1 font-mono text-[11px] text-tx-3 hover:text-tx-2"
        >
          <ArrowLeft size={12} />
          {t("atm_back")}
        </button>
        <div className="flex flex-1 items-center justify-center text-[13px] text-tx-3">
          {t("empty_automations")}
        </div>
      </div>
    );
  }

  const provider = providers.find((p) => p.id === atm.providerId);
  const client = atm.clientId ? clients.find((c) => c.id === atm.clientId) : undefined;
  const atmEvidence = evidence.filter((e) => atm.evidenceIds.includes(e.id));
  const validNext = AUTOMATION_VALID_TRANSITIONS[atm.stage];
  const canAdvance = validNext.length > 0;

  const stageKey = (s: AutomationStage) =>
    `atm_stage_${s}` as
      | "atm_stage_draft"
      | "atm_stage_test"
      | "atm_stage_verified"
      | "atm_stage_approved"
      | "atm_stage_deployed";

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Back + header */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate("/automations")}
          className="flex w-fit items-center gap-1 font-mono text-[11px] text-tx-3 hover:text-tx-2"
        >
          <ArrowLeft size={12} />
          {t("atm_back")}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Zap size={16} className="text-laiton" />
          <h1 className="text-sm font-semibold text-tx-1">{atm.name}</h1>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 font-mono text-[10px]",
              STAGE_COLORS[atm.stage],
            )}
          >
            {t(stageKey(atm.stage))}
          </span>
          {provider && (
            <Badge className="border-line bg-bg-1 font-mono text-[9px] text-tx-3">
              {t("atm_mock_badge")}
            </Badge>
          )}
          {canAdvance && (
            <button
              onClick={() => setShowTransition(true)}
              className="ml-auto flex items-center gap-1 rounded-ctl border border-or/40 bg-or/10 px-3 py-1 text-[12px] font-medium text-or hover:bg-or/20"
            >
              {t("atm_advance_btn")}
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle visualizer */}
      <section aria-label={t("atm_lifecycle_label")}>
        <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3">
          {t("atm_lifecycle_label")}
        </h2>
        <LifecycleViz stage={atm.stage} />
      </section>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("atm_provider_label"), value: provider?.name ?? atm.providerId },
          { label: t("atm_form_client_label"), value: client?.name ?? "—" },
          { label: t("atm_version_label"), value: atm.version },
          {
            label: t("atm_last_run_label"),
            value: atm.lastRunAt ? fmtDate(atm.lastRunAt) : t("atm_no_run"),
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-ctl border border-line bg-bg-1 px-3 py-2">
            <div className="font-mono text-[10px] text-tx-3">{label}</div>
            <div className="mt-0.5 font-mono text-[12px] text-tx-1">{value}</div>
          </div>
        ))}
      </div>

      {/* Trigger */}
      <section>
        <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3">
          {t("atm_trigger_label")}
        </h2>
        <div className="rounded-ctl border border-line bg-bg-1 px-3 py-2 font-mono text-[12px] text-tx-2">
          {atm.trigger}
        </div>
      </section>

      {/* Inputs + Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {atm.inputs.length > 0 && (
          <section>
            <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3">
              {t("atm_section_inputs")}
            </h2>
            <div className="flex flex-col gap-1 rounded-card border border-line bg-bg-1 p-3">
              {atm.inputs.map((inp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-laiton/60" />
                  <span className="font-mono text-[12px] text-tx-2">{inp}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        {atm.actions.length > 0 && (
          <section>
            <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3">
              {t("atm_section_actions")}
            </h2>
            <div className="flex flex-col gap-1 rounded-card border border-line bg-bg-1 p-3">
              {atm.actions.map((act, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="font-mono text-[10px] text-tx-3">{i + 1}.</div>
                  <span className="font-mono text-[12px] text-tx-2">{act}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Evidence */}
      <section>
        <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3">
          {t("atm_section_evidence")}
        </h2>
        {atmEvidence.length === 0 ? (
          <div className="rounded-ctl border border-line bg-bg-1 px-3 py-2 font-mono text-[12px] text-tx-3">
            {t("atm_no_evidence")}
          </div>
        ) : (
          <div className="flex flex-col gap-1 rounded-card border border-line bg-bg-1 p-3">
            {atmEvidence.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-2 border-b border-line/50 py-1.5 last:border-0"
              >
                <div
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    ev.result === "pass" ? "bg-ok" : ev.result === "fail" ? "bg-err" : "bg-tx-3",
                  )}
                />
                <span className="flex-1 font-mono text-[11px] text-tx-2">{ev.label}</span>
                <span className="font-mono text-[9px] text-tx-3">seq {ev.seq}</span>
                <span className="font-mono text-[9px] text-tx-3">{fmtDate(ev.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transition dialog (inline) */}
      {showTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-line bg-bg-1 p-5 shadow-xl">
            <TransitionDialog
              automationId={atm.id}
              currentStage={atm.stage}
              onClose={() => setShowTransition(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

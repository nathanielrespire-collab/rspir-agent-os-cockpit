import { useState } from "react";
import { Lightbulb, CheckCircle2, XCircle, Search } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/components/ui/utils";
import type { ImprovementProposal } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

// ─── Role → actorId ──────────────────────────────────────────────────────────

const ROLE_ACTOR: Record<string, string> = {
  Nathaniel: "act-nathaniel",
  Manny: "act-manny",
  Antoine: "act-antoine",
  Agent: "act-builder",
};

// ─── Status badge ─────────────────────────────────────────────────────────────

type ProposalStatus = ImprovementProposal["status"];

function StatusBadge({ status }: { status: ProposalStatus }) {
  const t = useT();
  const labelKey: Record<ProposalStatus, TKey> = {
    proposed: "prop_status_proposed",
    investigating: "prop_status_investigating",
    approved: "prop_status_approved",
    rejected: "prop_status_rejected",
    building: "prop_status_building",
    deployed: "prop_status_deployed",
  };
  const variant =
    status === "proposed"
      ? "laiton"
      : status === "investigating"
        ? "warn"
        : status === "approved" || status === "building" || status === "deployed"
          ? "ok"
          : ("err" as const);
  return (
    <Badge variant={variant} className="font-mono text-[10px]">
      {t(labelKey[status])}
    </Badge>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

type DialogAction = "investigate" | "approve" | "reject";

interface ConfirmDialogProps {
  open: boolean;
  action: DialogAction | null;
  proposal: ImprovementProposal | null;
  actorName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  open,
  action,
  proposal,
  actorName,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useT();
  if (!proposal || !action) return null;

  const titleKey: Record<DialogAction, TKey> = {
    investigate: "prop_investigate_confirm_title",
    approve: "prop_approve_confirm_title",
    reject: "prop_reject_confirm_title",
  };
  const bodyKey: Record<DialogAction, TKey> = {
    investigate: "prop_investigate_confirm_body",
    approve: "prop_approve_confirm_body",
    reject: "prop_reject_confirm_body",
  };

  return (
    <Dialog open={open} onClose={onCancel}>
      <div className="p-5 space-y-4">
        <h2 className="text-sm font-semibold">{t(titleKey[action])}</h2>

        <div className="rounded-ctl border border-line bg-bg-2 px-3 py-2">
          <p className="text-[13px] font-medium text-tx-1 line-clamp-2">{proposal.observation}</p>
        </div>

        <p className={cn("text-[13px]", action === "reject" ? "text-err" : "text-tx-2")}>
          {t(bodyKey[action])}
        </p>

        {action === "approve" && (
          <div className="rounded-ctl border border-laiton/30 bg-laiton/10 px-3 py-2">
            <p className="font-mono text-[11px] text-laiton">
              {t("prop_pipeline_trace" as TKey)} · {t("prop_pipeline_phases" as TKey)}
            </p>
          </div>
        )}

        <div className="rounded-ctl border border-line/60 bg-bg-2/50 px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-3 text-[12px]">
            <span className="text-tx-3 w-28 shrink-0">{t("prop_requested_by" as TKey)}</span>
            <span className="font-mono text-tx-2">{actorName}</span>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <span className="text-tx-3 w-28 shrink-0">{t("prop_executed_by" as TKey)}</span>
            <span className="font-mono text-tx-2">{actorName}</span>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <span className="text-tx-3 w-28 shrink-0">{t("prop_policy_label" as TKey)}</span>
            <Badge variant="or" className="font-mono text-[10px]">
              approval_required
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[12px] col-span-2">
            <span className="text-tx-3 w-28 shrink-0"></span>
            <span className="text-[11px] text-tx-3 italic">{t("prop_policy_value" as TKey)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {t("prop_cancel" as TKey)}
          </Button>
          <Button
            variant={action === "reject" ? "ghost" : "default"}
            size="sm"
            className={cn(action === "reject" && "text-err border-err/40 hover:bg-err/10")}
            onClick={onConfirm}
          >
            {t("prop_confirm" as TKey)}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Proposal card ────────────────────────────────────────────────────────────

interface ProposalCardProps {
  proposal: ImprovementProposal;
  onInvestigate: (p: ImprovementProposal) => void;
  onApprove: (p: ImprovementProposal) => void;
  onReject: (p: ImprovementProposal) => void;
  proposalEvents: number;
}

function ProposalCard({
  proposal,
  onInvestigate,
  onApprove,
  onReject,
  proposalEvents,
}: ProposalCardProps) {
  const t = useT();

  const canInvestigate = proposal.status === "proposed";
  const canApprove =
    proposal.status === "proposed" || proposal.status === "investigating";
  const canReject =
    proposal.status === "proposed" ||
    proposal.status === "investigating" ||
    proposal.status === "building";

  return (
    <div className="rounded-card border border-line bg-bg-1 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <StatusBadge status={proposal.status} />
            {proposal.status === "building" && proposalEvents > 0 && (
              <span className="font-mono text-[10px] text-laiton">
                {t("prop_events_trace" as TKey)}: {proposalEvents}
              </span>
            )}
          </div>
          <p className="text-[13px] font-medium text-tx-1">{proposal.observation}</p>
        </div>
        <div className="shrink-0 text-right space-y-1">
          <div>
            <p className="text-[10px] text-tx-3">{t("prop_setup_label" as TKey)}</p>
            <p className="font-mono text-sm font-semibold text-or">
              {t("prop_setup_hours" as TKey).replace("{n}", String(proposal.estimatedSetupHours))}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-tx-3">{t("prop_saved_label" as TKey)}</p>
            <p className="font-mono text-sm font-semibold text-ok">
              {t("prop_saved_hours" as TKey).replace(
                "{n}",
                String(proposal.estimatedSavedHoursPerMonth),
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-ctl border border-line/60 bg-bg-0/50 px-3 py-2">
        <p className="text-[11px] font-medium text-tx-3 mb-0.5">
          {t("prop_proposal_label" as TKey)}
        </p>
        <p className="text-[13px] text-tx-2">{proposal.proposal}</p>
      </div>

      {(canInvestigate || canApprove || canReject) && (
        <div className="flex items-center gap-2 pt-1">
          {canInvestigate && (
            <Button variant="ghost" size="sm" onClick={() => onInvestigate(proposal)}>
              <Search size={12} className="mr-1" />
              {t("prop_btn_investigate" as TKey)}
            </Button>
          )}
          {canApprove && (
            <Button variant="default" size="sm" onClick={() => onApprove(proposal)}>
              <CheckCircle2 size={12} className="mr-1" />
              {t("prop_btn_approve" as TKey)}
            </Button>
          )}
          {canReject && (
            <Button
              variant="ghost"
              size="sm"
              className="text-err border-err/40 hover:bg-err/10"
              onClick={() => onReject(proposal)}
            >
              <XCircle size={12} className="mr-1" />
              {t("prop_btn_reject" as TKey)}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TERMINAL_STATUSES: ProposalStatus[] = ["rejected", "deployed"];

export default function Proposals() {
  const t = useT();
  const role = useUIStore((s) => s.role);
  const actorId = ROLE_ACTOR[role] ?? "act-nathaniel";
  const actorName = role;

  const { proposals, events, investigateProposal, approveProposal, rejectProposal, activeWorkspaceId } =
    useAppStore();

  const [pending, setPending] = useState<{
    action: DialogAction;
    proposal: ImprovementProposal;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const wsProposals = proposals.filter((p) => p.workspaceId === activeWorkspaceId);
  const active = wsProposals.filter((p) => !TERMINAL_STATUSES.includes(p.status));
  const history = wsProposals.filter((p) => TERMINAL_STATUSES.includes(p.status));

  function countEvents(proposalId: string) {
    return events.filter(
      (e) =>
        e.targetId === proposalId &&
        (e.action === "proposal.build" ||
          e.action === "proposal.test" ||
          e.action === "proposal.security" ||
          e.action === "proposal.verify"),
    ).length;
  }

  function openDialog(action: DialogAction, proposal: ImprovementProposal) {
    setPending({ action, proposal });
  }

  async function handleConfirm() {
    if (!pending) return;
    const { action, proposal } = pending;
    if (action === "investigate") await investigateProposal(proposal.id, actorId);
    else if (action === "approve") await approveProposal(proposal.id, actorId);
    else await rejectProposal(proposal.id, actorId);
    setPending(null);
    setToast(t("prop_action_done" as TKey));
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-tx-3" />
          <h1 className="text-sm font-semibold">{t("prop_page_title" as TKey)}</h1>
          <span className="font-mono text-[11px] text-tx-3">
            · {wsProposals.length} {t("prop_count" as TKey)}
          </span>
        </div>
        <Badge variant="or" className="font-mono text-[10px]">
          {t("prop_mock_badge" as TKey)}
        </Badge>
      </div>

      {/* ── Active ────────────────────────────────────────────────────────────── */}
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-tx-3">
        {t("prop_section_active" as TKey)}
      </p>
      {active.length === 0 ? (
        <p className="text-[13px] text-tx-3 mb-6">{t("prop_no_active" as TKey)}</p>
      ) : (
        <div className="mb-6 flex flex-col gap-3">
          {active.map((prop) => (
            <ProposalCard
              key={prop.id}
              proposal={prop}
              onInvestigate={(p) => openDialog("investigate", p)}
              onApprove={(p) => openDialog("approve", p)}
              onReject={(p) => openDialog("reject", p)}
              proposalEvents={countEvents(prop.id)}
            />
          ))}
        </div>
      )}

      {/* ── History ───────────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-tx-3">
            {t("prop_section_history" as TKey)}
          </p>
          <div className="flex flex-col gap-3">
            {history.map((prop) => (
              <div
                key={prop.id}
                className="rounded-card border border-line/60 bg-bg-1/50 p-4 opacity-70 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={prop.status} />
                </div>
                <p className="text-[13px] text-tx-2">{prop.observation}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {history.length === 0 && active.length > 0 && (
        <p className="text-[13px] text-tx-3">{t("prop_no_history" as TKey)}</p>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-ctl border border-ok/40 bg-ok/10 px-4 py-2 font-mono text-[12px] text-ok shadow-lg">
          {toast}
        </div>
      )}

      {/* ── Confirm dialog ────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!pending}
        action={pending?.action ?? null}
        proposal={pending?.proposal ?? null}
        actorName={actorName}
        onCancel={() => setPending(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

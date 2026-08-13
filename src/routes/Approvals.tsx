import { useState } from "react";
import { CheckSquare, Clock, FileText, Shield, ChevronDown, ChevronUp, User } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/components/ui/utils";
import type { Approval } from "@/lib/types";

// ─── Role → actor mapping ────────────────────────────────────────────────────

const ROLE_ACTOR: Record<string, string> = {
  Nathaniel: "act-nathaniel",
  Manny: "act-manny",
  Antoine: "act-antoine",
  Agent: "act-claude-code",
};

// ─── Confirm dialog ──────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  decision: "approve" | "reject" | null;
  approval: Approval | null;
  actorName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({ open, decision, approval, actorName, onCancel, onConfirm }: ConfirmDialogProps) {
  const t = useT();
  if (!approval || !decision) return null;

  const isApprove = decision === "approve";

  return (
    <Dialog open={open} onClose={onCancel}>
      <div className="p-5 space-y-4">
        <h2 className="text-sm font-semibold">
          {isApprove ? t("apr_confirm_approve_title") : t("apr_confirm_reject_title")}
        </h2>

        <div className="rounded-ctl border border-line bg-bg-2 px-3 py-2">
          <p className="text-[13px] font-medium text-tx-1">{approval.title}</p>
        </div>

        <p className={cn("text-[13px]", isApprove ? "text-tx-2" : "text-err")}>
          {isApprove ? t("apr_confirm_approve_body") : t("apr_confirm_reject_body")}
        </p>

        {/* Evidence pattern per CLAUDE.md */}
        <div className="rounded-ctl border border-line/60 bg-bg-2/50 px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-3 text-[12px]">
            <span className="text-tx-3 w-28 shrink-0">{t("apr_requested_by")}</span>
            <span className="font-mono text-tx-2">{actorName}</span>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <span className="text-tx-3 w-28 shrink-0">{t("apr_executed_by")}</span>
            <span className="font-mono text-tx-2">{actorName}</span>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <span className="text-tx-3 w-28 shrink-0">{t("apr_policy_label")}</span>
            <Badge variant="or">approval_required</Badge>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {t("apr_cancel")}
          </Button>
          <Button
            variant={isApprove ? "default" : "ghost"}
            size="sm"
            className={cn(!isApprove && "text-err border-err/40 hover:bg-err/10")}
            onClick={onConfirm}
          >
            {t("apr_confirm_btn")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Pending card ────────────────────────────────────────────────────────────

interface PendingCardProps {
  approval: Approval;
  actorName: (id: string | undefined) => string;
  workItemTitle: (id: string | undefined) => string | undefined;
  evidenceLabel: (id: string) => string;
  onApprove: (apr: Approval) => void;
  onReject: (apr: Approval) => void;
}

function PendingCard({
  approval,
  actorName,
  workItemTitle,
  evidenceLabel,
  onApprove,
  onReject,
}: PendingCardProps) {
  const t = useT();

  return (
    <div className="rounded-card border border-line bg-bg-1 overflow-hidden">
      {/* Gold left accent — human decision */}
      <div className="flex">
        <div className="w-1 shrink-0 bg-or/70" />
        <div className="flex-1 p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-tx-1 leading-snug">{approval.title}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock size={11} className="text-tx-3" />
              <span className="font-mono text-[11px] text-tx-3">
                {approval.estimatedReviewMinutes} {t("apr_min_est")}
              </span>
            </div>
          </div>

          {/* Why human */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-tx-3 mb-1">{t("apr_why_human")}</p>
            <p className="font-mono text-[12px] text-tx-2 leading-relaxed">{approval.whyHuman}</p>
          </div>

          {/* Effects */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-ctl border border-ok/25 bg-ok/8 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-ok/70 mb-1">{t("apr_if_approved")}</p>
              <p className="text-[12px] text-ok/90 leading-snug">{approval.ifApproved}</p>
            </div>
            <div className="rounded-ctl border border-err/25 bg-err/8 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-err/70 mb-1">{t("apr_if_rejected")}</p>
              <p className="text-[12px] text-err/90 leading-snug">{approval.ifRejected}</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
            {approval.evidenceIds.length > 0 && (
              <div className="flex items-center gap-1.5">
                <FileText size={11} className="text-tx-3" />
                <span className="text-tx-3">{t("apr_evidence_label")}:</span>
                <div className="flex gap-1">
                  {approval.evidenceIds.map((eid) => (
                    <Badge key={eid} variant="default" className="font-mono text-[10px]">
                      {evidenceLabel(eid)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {approval.workItemId && (
              <div className="flex items-center gap-1.5">
                <span className="text-tx-3">{t("apr_work_item")}:</span>
                <Badge variant="laiton" className="text-[10px]">
                  {workItemTitle(approval.workItemId) ?? approval.workItemId}
                </Badge>
              </div>
            )}
          </div>

          {/* Policy */}
          <div className="flex items-center gap-2">
            <Shield size={11} className="text-or/70" />
            <span className="text-[11px] text-tx-3">{t("apr_policy_label")}:</span>
            <Badge variant="or">approval_required</Badge>
            <span className="text-[11px] text-tx-3">· {t("apr_policy_value")}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-line/40">
            <Button
              variant="ghost"
              size="sm"
              className="text-err border-err/30 hover:bg-err/10 hover:text-err"
              onClick={() => onReject(approval)}
            >
              {t("apr_reject_btn")}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-ok/15 text-ok border border-ok/30 hover:bg-ok/25"
              onClick={() => onApprove(approval)}
            >
              {t("apr_approve_btn")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── History row ─────────────────────────────────────────────────────────────

interface HistoryRowProps {
  approval: Approval;
  actorName: (id: string | undefined) => string;
}

function HistoryRow({ approval, actorName }: HistoryRowProps) {
  const t = useT();
  const isApproved = approval.status === "approved";

  return (
    <div className="flex items-center gap-3 rounded-ctl border border-line/50 bg-bg-1 px-3 py-2">
      <Badge variant={isApproved ? "ok" : "err"}>
        {isApproved ? t("apr_status_approved") : t("apr_status_rejected")}
      </Badge>
      <span className="flex-1 text-[13px] text-tx-2 truncate">{approval.title}</span>
      {approval.decidedByActorId && (
        <div className="flex items-center gap-1 text-[11px] text-tx-3 shrink-0">
          <User size={10} className="text-tx-3" />
          <span className="font-mono">{actorName(approval.decidedByActorId)}</span>
        </div>
      )}
      {approval.decidedAt && (
        <span className="font-mono text-[11px] text-tx-3 shrink-0">
          {new Date(approval.decidedAt).toLocaleDateString("fr-CA")}
        </span>
      )}
    </div>
  );
}

// ─── Main route ──────────────────────────────────────────────────────────────

type Tab = "pending" | "history";

export default function Approvals() {
  const t = useT();
  const role = useUIStore((s) => s.role);
  const actors = useAppStore((s) => s.actors);
  const approvals = useAppStore((s) => s.approvals);
  const workItems = useAppStore((s) => s.workItems);
  const evidence = useAppStore((s) => s.evidence);
  const approveApproval = useAppStore((s) => s.approveApproval);
  const rejectApproval = useAppStore((s) => s.rejectApproval);

  const [tab, setTab] = useState<Tab>("pending");
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    decision: "approve" | "reject" | null;
    approval: Approval | null;
  }>({ open: false, decision: null, approval: null });
  const [historyOpen, setHistoryOpen] = useState(false);

  const actorId = ROLE_ACTOR[role] ?? "act-nathaniel";
  const actorName = (id: string | undefined) => {
    if (!id) return "—";
    return actors.find((a) => a.id === id)?.name ?? id;
  };
  const workItemTitle = (id: string | undefined) => {
    if (!id) return undefined;
    return workItems.find((w) => w.id === id)?.title;
  };
  const evidenceLabel = (eid: string) => {
    const ev = evidence.find((e) => e.id === eid);
    return ev ? ev.id : eid;
  };

  const pending = approvals.filter((a) => a.status === "pending");
  const history = approvals.filter((a) => a.status !== "pending");

  function handleDecide(decision: "approve" | "reject", approval: Approval) {
    setConfirmState({ open: true, decision, approval });
  }

  async function handleConfirm() {
    const { decision, approval } = confirmState;
    if (!decision || !approval) return;
    if (decision === "approve") {
      await approveApproval(approval.id, actorId);
    } else {
      await rejectApproval(approval.id, actorId);
    }
    setConfirmState({ open: false, decision: null, approval: null });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-or" />
          <h1 className="text-sm font-semibold">{t("nav_approvals")}</h1>
          {pending.length > 0 && (
            <Badge variant="or">
              {pending.length} {t("apr_count_pending")}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-line/50 pb-0">
        <button
          onClick={() => setTab("pending")}
          className={cn(
            "px-3 pb-2 text-[13px] font-medium transition-colors",
            tab === "pending"
              ? "text-tx-1 border-b-2 border-or -mb-px"
              : "text-tx-3 hover:text-tx-2",
          )}
        >
          {t("apr_pending_section")}
          {pending.length > 0 && (
            <span className="ml-1.5 font-mono text-[11px] text-or">({pending.length})</span>
          )}
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "px-3 pb-2 text-[13px] font-medium transition-colors",
            tab === "history"
              ? "text-tx-1 border-b-2 border-or -mb-px"
              : "text-tx-3 hover:text-tx-2",
          )}
        >
          {t("apr_history_section")}
          {history.length > 0 && (
            <span className="ml-1.5 font-mono text-[11px] text-tx-3">({history.length})</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto space-y-3">
        {tab === "pending" &&
          (pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
              <p className="text-[13px] text-tx-2">{t("apr_no_pending")}</p>
            </div>
          ) : (
            pending.map((apr) => (
              <PendingCard
                key={apr.id}
                approval={apr}
                actorName={actorName}
                workItemTitle={workItemTitle}
                evidenceLabel={evidenceLabel}
                onApprove={(a) => handleDecide("approve", a)}
                onReject={(a) => handleDecide("reject", a)}
              />
            ))
          ))}

        {tab === "history" &&
          (history.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
              <p className="text-[13px] text-tx-2">{t("apr_no_history")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((apr) => (
                <HistoryRow key={apr.id} approval={apr} actorName={actorName} />
              ))}
            </div>
          ))}
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmState.open}
        decision={confirmState.decision}
        approval={confirmState.approval}
        actorName={actorName(actorId)}
        onCancel={() => setConfirmState({ open: false, decision: null, approval: null })}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

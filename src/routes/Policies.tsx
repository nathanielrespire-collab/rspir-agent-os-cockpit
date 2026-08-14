import { useState } from "react";
import { ScrollText, CheckCircle2, AlertTriangle } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Policy, PolicyRule } from "@/lib/types";

const ROLE_ACTOR_MAP: Record<string, string> = {
  Nathaniel: "act-nathaniel",
  Manny: "act-manny",
  Antoine: "act-antoine",
  Agent: "act-clio",
};

const RULE_ORDER: PolicyRule[] = ["auto", "approval_required", "forbidden", "human_only"];

function ruleBadgeVariant(rule: PolicyRule): "ok" | "or" | "err" | "warn" {
  if (rule === "auto") return "ok";
  if (rule === "approval_required") return "or";
  if (rule === "forbidden") return "err";
  return "warn";
}

function RuleLabel({ rule }: { rule: PolicyRule }) {
  const t = useT();
  const labels: Record<PolicyRule, string> = {
    auto: t("pol_rule_auto"),
    approval_required: t("pol_rule_approval"),
    forbidden: t("pol_rule_forbidden"),
    human_only: t("pol_rule_human"),
  };
  return (
    <Badge variant={ruleBadgeVariant(rule)} className="font-mono text-[11px]">
      {labels[rule]}
    </Badge>
  );
}

interface ChangePending {
  policy: Policy;
  nextRule: PolicyRule;
}

interface ConfirmDialogProps {
  pending: ChangePending;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

function ConfirmDialog({ pending, onConfirm, onCancel }: ConfirmDialogProps) {
  const t = useT();
  const { lang } = useUIStore();
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);

  const ruleLabels: Record<PolicyRule, string> = {
    auto: t("pol_rule_auto"),
    approval_required: t("pol_rule_approval"),
    forbidden: t("pol_rule_forbidden"),
    human_only: t("pol_rule_human"),
  };

  async function handleConfirm() {
    setExecuting(true);
    try {
      await onConfirm();
      setDone(true);
      setTimeout(onCancel, 900);
    } finally {
      setExecuting(false);
    }
  }

  const body = t("pol_change_confirm_body")
    .replace("{cap}", pending.policy.capability)
    .replace("{from}", ruleLabels[pending.policy.rule])
    .replace("{to}", ruleLabels[pending.nextRule]);

  return (
    <Dialog open onClose={onCancel}>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-[13px] font-medium text-tx-1">{t("pol_change_confirm_title")}</p>
          <p className="mt-1 font-mono text-[12px] text-tx-2">{body}</p>
        </div>

        <dl className="space-y-1.5 rounded border border-line bg-bg-0 p-3">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-mono text-[11px] text-tx-3">{t("pol_capability")}</dt>
            <dd className="font-mono text-[11px] text-laiton">{pending.policy.capability}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-mono text-[11px] text-tx-3">{t("pol_rule")}</dt>
            <dd className="flex items-center gap-2">
              <RuleLabel rule={pending.policy.rule} />
              <span className="font-mono text-[11px] text-tx-3">→</span>
              <RuleLabel rule={pending.nextRule} />
            </dd>
          </div>
          {pending.policy.condition && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-mono text-[11px] text-tx-3">
                {t("pol_condition")}
              </dt>
              <dd className="font-mono text-[11px] text-tx-2">{pending.policy.condition[lang]}</dd>
            </div>
          )}
        </dl>

        <div className="flex items-start gap-2 rounded border border-or/30 bg-or/5 px-3 py-2">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-or" />
          <p className="font-mono text-[11px] text-or">{t("pol_change_confirm_note")}</p>
        </div>

        {done && (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-ok" />
            <span className="font-mono text-[12px] text-ok">{t("pol_change_done")}</span>
          </div>
        )}

        {!done && (
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleConfirm} disabled={executing}>
              {t("pol_change_execute")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onCancel}
              disabled={executing}
            >
              {t("pol_change_cancel")}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

export default function Policies() {
  const t = useT();
  const { role, lang } = useUIStore();
  const { policies, activeWorkspaceId, updatePolicy } = useAppStore();

  const [pending, setPending] = useState<ChangePending | null>(null);

  const actorId = ROLE_ACTOR_MAP[role] ?? "act-nathaniel";

  const wsPolicies = policies
    .filter((p) => p.workspaceId === activeWorkspaceId)
    .sort((a, b) => a.capability.localeCompare(b.capability));

  const otherPolicies = policies
    .filter((p) => p.workspaceId !== activeWorkspaceId)
    .sort((a, b) => a.capability.localeCompare(b.capability));

  function handleRuleChange(policy: Policy, nextRule: PolicyRule) {
    if (nextRule === policy.rule) return;
    setPending({ policy, nextRule });
  }

  async function executeChange() {
    if (!pending) return;
    await updatePolicy(pending.policy.id, pending.nextRule, actorId);
  }

  const ruleLabels: Record<PolicyRule, string> = {
    auto: t("pol_rule_auto"),
    approval_required: t("pol_rule_approval"),
    forbidden: t("pol_rule_forbidden"),
    human_only: t("pol_rule_human"),
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <ScrollText size={18} className="mt-0.5 shrink-0 text-laiton" />
          <div>
            <h1 className="text-[15px] font-semibold text-tx-1">{t("pol_page_title")}</h1>
            <p className="mt-0.5 font-mono text-[12px] text-tx-3">{t("pol_page_subtitle")}</p>
          </div>
        </div>

        {/* Rule legend */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {RULE_ORDER.map((r) => (
            <div key={r} className="flex items-center gap-1.5">
              <RuleLabel rule={r} />
              <span className="font-mono text-[11px] text-tx-3">
                {r === "auto" && t("pol_rule_desc_auto")}
                {r === "approval_required" && t("pol_rule_desc_approval")}
                {r === "forbidden" && t("pol_rule_desc_forbidden")}
                {r === "human_only" && t("pol_rule_desc_human")}
              </span>
            </div>
          ))}
        </div>

        {/* Current workspace policies */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-tx-1">
              {t("pol_workspace_label")}: {activeWorkspaceId}
            </h2>
            <span className="font-mono text-[11px] text-tx-3">
              {t("pol_count").replace("{n}", String(wsPolicies.length))}
            </span>
          </div>

          {wsPolicies.length === 0 ? (
            <div className="rounded border border-line bg-bg-1 px-4 py-8 text-center">
              <p className="font-mono text-[12px] text-tx-3">{t("pol_empty")}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded border border-line">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-bg-0">
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                      {t("pol_capability")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                      {t("pol_rule")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                      {t("pol_condition")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                      {t("pol_change_to")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wsPolicies.map((policy, i) => (
                    <tr
                      key={policy.id}
                      className={`border-b border-line last:border-0 ${i % 2 === 0 ? "bg-bg-1" : "bg-bg-0"}`}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[12px] text-laiton">
                          {policy.capability}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <RuleLabel rule={policy.rule} />
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] text-tx-3">
                          {policy.condition ? policy.condition[lang] : t("pol_no_condition")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {RULE_ORDER.filter((r) => r !== policy.rule).map((r) => (
                            <button
                              key={r}
                              onClick={() => handleRuleChange(policy, r)}
                              className={`rounded border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                                r === "forbidden"
                                  ? "border-err/40 bg-err/5 text-err hover:bg-err/15"
                                  : r === "auto"
                                    ? "border-ok/40 bg-ok/5 text-ok hover:bg-ok/15"
                                    : r === "approval_required"
                                      ? "border-or/40 bg-or/5 text-or hover:bg-or/15"
                                      : "border-warn/40 bg-warn/5 text-warn hover:bg-warn/15"
                              }`}
                              aria-label={`${t("pol_change_to")} ${ruleLabels[r]}`}
                            >
                              {ruleLabels[r]}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Other workspace policies */}
        {otherPolicies.length > 0 && (
          <section>
            <h2 className="mb-3 text-[13px] font-medium text-tx-2">{t("pol_other_workspaces")}</h2>
            <div className="overflow-hidden rounded border border-line opacity-60">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-bg-0">
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                      {t("pol_workspace_label")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                      {t("pol_capability")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                      {t("pol_rule")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {otherPolicies.map((policy, i) => (
                    <tr
                      key={policy.id}
                      className={`border-b border-line last:border-0 ${i % 2 === 0 ? "bg-bg-1" : "bg-bg-0"}`}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] text-tx-3">
                          {policy.workspaceId}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[12px] text-laiton">
                          {policy.capability}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <RuleLabel rule={policy.rule} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Chat integration notice */}
        <div className="mt-6 flex items-start gap-2 rounded border border-laiton/20 bg-laiton/5 px-4 py-3">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-laiton" />
          <p className="font-mono text-[11px] text-tx-2">{t("pol_chat_notice")}</p>
        </div>
      </div>

      {pending && (
        <ConfirmDialog
          pending={pending}
          onConfirm={executeChange}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Plus, Clock } from "lucide-react";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Create Draft Form ───────────────────────────────────────────────────────

function CreateForm({ onDone }: { onDone: () => void }) {
  const t = useT();
  const { role } = useUIStore();
  const { activeWorkspaceId, clients, createAutomation } = useAppStore();
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [event, setEvent] = useState("");
  const [evidenceLabel, setEvidenceLabel] = useState("");
  const [clientId, setClientId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const wsClients = clients.filter((c) => c.workspaceId === activeWorkspaceId);

  const actorId =
    role === "Nathaniel"
      ? "act-nathaniel"
      : role === "Manny"
        ? "act-manny"
        : role === "Antoine"
          ? "act-antoine"
          : "act-aria";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !trigger.trim()) return;
    setSubmitting(true);
    try {
      const evLabel = evidenceLabel.trim()
        ? `Event: ${event.trim() || "—"} · Evidence: ${evidenceLabel.trim()}`
        : `Brouillon créé: ${name.trim()}`;
      await createAutomation(
        {
          name: name.trim(),
          trigger: trigger.trim(),
          clientId: clientId || undefined,
          workspaceId: activeWorkspaceId,
          evidenceLabel: evLabel,
        },
        actorId,
      );
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Policy */}
      <div className="rounded-ctl border border-line bg-bg-0 px-3 py-2 font-mono text-[11px] text-tx-3">
        <span className="mr-2 text-tx-2">{t("atm_form_policy")}</span>
        {t("atm_form_policy_value")}
      </div>

      {/* Provenance */}
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

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[11px] text-tx-3">{t("atm_form_name_label")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("atm_form_name_ph")}
          required
          className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5 text-[13px] text-tx-1 placeholder:text-tx-3 focus:border-or/60 focus:outline-none focus:ring-1 focus:ring-or/40"
        />
      </div>

      {/* Trigger */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[11px] text-tx-3">{t("atm_form_trigger_label")}</label>
        <input
          type="text"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          placeholder={t("atm_form_trigger_ph")}
          required
          className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5 text-[13px] text-tx-1 placeholder:text-tx-3 focus:border-or/60 focus:outline-none focus:ring-1 focus:ring-or/40"
        />
      </div>

      {/* Event */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[11px] text-tx-3">{t("atm_form_event_label")}</label>
        <input
          type="text"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          placeholder={t("atm_form_event_ph")}
          className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5 text-[13px] text-tx-1 placeholder:text-tx-3 focus:border-or/60 focus:outline-none focus:ring-1 focus:ring-or/40"
        />
      </div>

      {/* Evidence */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[11px] text-tx-3">{t("atm_form_evidence_label")}</label>
        <input
          type="text"
          value={evidenceLabel}
          onChange={(e) => setEvidenceLabel(e.target.value)}
          placeholder={t("atm_form_evidence_ph")}
          className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5 text-[13px] text-tx-1 placeholder:text-tx-3 focus:border-or/60 focus:outline-none focus:ring-1 focus:ring-or/40"
        />
      </div>

      {/* Client */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[11px] text-tx-3">{t("atm_form_client_label")}</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5 text-[13px] text-tx-1 focus:border-or/60 focus:outline-none focus:ring-1 focus:ring-or/40"
        >
          <option value="">{t("atm_form_none")}</option>
          {wsClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-ctl border border-line px-3 py-1.5 text-[13px] text-tx-2 hover:bg-bg-2"
        >
          {t("atm_cancel")}
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim() || !trigger.trim()}
          className="rounded-ctl border border-or/40 bg-or/10 px-3 py-1.5 text-[13px] text-or hover:bg-or/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("atm_form_submit")}
        </button>
      </div>
    </form>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────

type TabId = "list" | "new";

export default function Automations() {
  const t = useT();
  const navigate = useNavigate();
  const { activeClientId } = useUIStore();
  const { activeWorkspaceId, automations, clients, providers, integrations } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("list");

  const autoIntegration = integrations.find(
    (i) => i.workspaceId === activeWorkspaceId && i.category === "automation",
  );
  const provider = autoIntegration
    ? providers.find((p) => p.id === autoIntegration.providerId)
    : undefined;

  const wsAutomations = automations.filter((a) => a.workspaceId === activeWorkspaceId);
  const filtered = activeClientId
    ? wsAutomations.filter((a) => a.clientId === activeClientId)
    : wsAutomations;

  const clientName = (id: string | undefined) =>
    id ? (clients.find((c) => c.id === id)?.name ?? id) : "—";

  const stageCounts = STAGES.reduce<Record<AutomationStage, number>>(
    (acc, s) => {
      acc[s] = filtered.filter((a) => a.stage === s).length;
      return acc;
    },
    { draft: 0, test: 0, verified: 0, approved: 0, deployed: 0 },
  );

  const stageKey = (s: AutomationStage) =>
    `atm_stage_${s}` as
      | "atm_stage_draft"
      | "atm_stage_test"
      | "atm_stage_verified"
      | "atm_stage_approved"
      | "atm_stage_deployed";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Zap size={16} className="text-laiton" />
        <h1 className="text-sm font-semibold">{t("nav_automations")}</h1>
        {provider && (
          <>
            <span className="text-tx-3">·</span>
            <span className="font-mono text-[11px] text-tx-3">
              {t("atm_provider_label")} {provider.name}
            </span>
            <Badge className="border-line bg-bg-1 font-mono text-[9px] text-tx-3">
              {t("atm_mock_badge")}
            </Badge>
          </>
        )}
        <span className="ml-auto font-mono text-[11px] text-tx-3">
          {filtered.length} {t("atm_count")}
        </span>
      </div>

      {/* Stage stats */}
      <div className="mb-4 flex gap-3 overflow-x-auto">
        {STAGES.map((s) => (
          <div
            key={s}
            className="flex flex-col items-center rounded-ctl border border-line bg-bg-1 px-3 py-1.5"
          >
            <span className="font-mono text-[18px] font-semibold text-tx-1">{stageCounts[s]}</span>
            <span className={cn("rounded px-1.5 font-mono text-[9px]", STAGE_COLORS[s])}>
              {t(stageKey(s))}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="mb-4 flex gap-0 overflow-x-auto border-b border-line"
        role="tablist"
        aria-label={t("nav_automations")}
      >
        <button
          role="tab"
          aria-selected={activeTab === "list"}
          onClick={() => setActiveTab("list")}
          className={cn(
            "shrink-0 px-3 py-2 text-[12px] font-medium transition-colors",
            activeTab === "list"
              ? "-mb-px border-b-2 border-or text-or"
              : "text-tx-3 hover:text-tx-2",
          )}
        >
          {t("nav_automations")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "new"}
          onClick={() => setActiveTab("new")}
          className={cn(
            "flex shrink-0 items-center gap-1 px-3 py-2 text-[12px] font-medium transition-colors",
            activeTab === "new"
              ? "-mb-px border-b-2 border-or text-or"
              : "text-tx-3 hover:text-tx-2",
          )}
        >
          <Plus size={12} />
          {t("atm_new_btn")}
        </button>
      </div>

      {/* Tab: List */}
      {activeTab === "list" && (
        <div role="tabpanel" className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
              <p className="text-[13px] text-tx-2">{t("empty_automations")}</p>
              <p className="font-mono text-xs text-tx-3">{t("action_automations")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-card border border-line">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-line bg-bg-1">
                    {(
                      [
                        "atm_col_name",
                        "atm_col_stage",
                        "atm_col_client",
                        "atm_col_trigger",
                        "atm_col_version",
                        "atm_col_last_run",
                      ] as const
                    ).map((k) => (
                      <th
                        key={k}
                        className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3"
                      >
                        {t(k)}
                      </th>
                    ))}
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((atm) => {
                    const hasNext = AUTOMATION_VALID_TRANSITIONS[atm.stage].length > 0;
                    return (
                      <tr
                        key={atm.id}
                        className="cursor-pointer border-b border-line/50 transition-colors last:border-0 hover:bg-bg-2/60"
                        onClick={() => navigate(`/automations/${atm.id}`)}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-medium text-tx-1">{atm.name}</span>
                            <span className="font-mono text-[10px] text-tx-3">{atm.id}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                              STAGE_COLORS[atm.stage],
                            )}
                          >
                            {t(stageKey(atm.stage))}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-tx-2">
                          {clientName(atm.clientId)}
                        </td>
                        <td className="px-3 py-2.5 max-w-[200px]">
                          <span className="font-mono text-[11px] text-tx-2 line-clamp-1">
                            {atm.trigger}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-tx-3">
                          {atm.version}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            {atm.lastRunAt ? (
                              <>
                                <span className="font-mono text-[11px] text-tx-2">
                                  {fmtDate(atm.lastRunAt)}
                                </span>
                                {atm.lastRunResult && (
                                  <span
                                    className={cn(
                                      "font-mono text-[10px]",
                                      atm.lastRunResult === "pass" ? "text-ok" : "text-err",
                                    )}
                                  >
                                    {atm.lastRunResult === "pass"
                                      ? t("atm_result_pass")
                                      : t("atm_result_fail")}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="font-mono text-[11px] text-tx-3">
                                {t("atm_no_run")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {hasNext && (
                            <span className="flex items-center gap-1 justify-end font-mono text-[10px] text-laiton">
                              <Clock size={10} />
                              {t("atm_advance_btn")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: New */}
      {activeTab === "new" && (
        <div role="tabpanel" className="flex-1 overflow-auto">
          <div className="max-w-lg rounded-card border border-line bg-bg-1 p-5">
            <h2 className="mb-4 text-[13px] font-semibold text-tx-1">{t("atm_create_title")}</h2>
            <CreateForm onDone={() => setActiveTab("list")} />
          </div>
        </div>
      )}
    </div>
  );
}

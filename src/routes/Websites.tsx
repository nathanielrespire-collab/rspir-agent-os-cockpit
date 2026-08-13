import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Plus, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isFullyVerified(dep: {
  httpCheck?: string;
  formCheck?: string;
  integrationCheck?: string;
  verified: boolean;
}): boolean {
  return (
    dep.verified &&
    dep.httpCheck === "pass" &&
    dep.formCheck === "pass" &&
    dep.integrationCheck === "pass"
  );
}

// ─── Create Draft Form ───────────────────────────────────────────────────────

function CreateForm({ onDone }: { onDone: () => void }) {
  const t = useT();
  const { role } = useUIStore();
  const { activeWorkspaceId, clients, createWebsite } = useAppStore();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createWebsite(
        {
          name: name.trim(),
          clientId: clientId || undefined,
          workspaceId: activeWorkspaceId,
          initialUrl: url.trim() || undefined,
        },
        actorId,
      );
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
          <span className="text-[13px] text-ok">{t("web_draft_created")}</span>
        </div>
        <button
          onClick={onDone}
          className="rounded-ctl border border-line px-3 py-1.5 text-[13px] text-tx-2 hover:bg-bg-2"
        >
          {t("web_cancel")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Policy */}
      <div className="rounded-ctl border border-line bg-bg-0 px-3 py-2 font-mono text-[11px] text-tx-3">
        <span className="mr-2 text-tx-2">{t("web_form_policy")}</span>
        {t("web_form_policy_value")}
      </div>

      {/* Provenance */}
      <div className="grid grid-cols-2 gap-2 rounded-ctl border border-line bg-bg-1 px-3 py-2 font-mono text-[11px] text-tx-3">
        <span>
          <span className="mr-1 text-tx-2">{t("web_requested_by")}</span>
          {role}
        </span>
        <span>
          <span className="mr-1 text-tx-2">{t("web_executed_by")}</span>
          {role}
        </span>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[11px] text-tx-3">{t("web_form_name_label")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("web_form_name_ph")}
          required
          className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5 text-[13px] text-tx-1 placeholder:text-tx-3 focus:border-or/60 focus:outline-none focus:ring-1 focus:ring-or/40"
        />
      </div>

      {/* URL */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[11px] text-tx-3">{t("web_form_url_label")}</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("web_form_url_ph")}
          className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5 text-[13px] text-tx-1 placeholder:text-tx-3 focus:border-or/60 focus:outline-none focus:ring-1 focus:ring-or/40"
        />
      </div>

      {/* Client */}
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[11px] text-tx-3">{t("web_form_client_label")}</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5 text-[13px] text-tx-1 focus:border-or/60 focus:outline-none focus:ring-1 focus:ring-or/40"
        >
          <option value="">{t("web_form_none")}</option>
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
          {t("web_cancel")}
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-ctl border border-or/40 bg-or/10 px-3 py-1.5 text-[13px] text-or hover:bg-or/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("web_form_submit")}
        </button>
      </div>
    </form>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────

type TabId = "list" | "new";

export default function Websites() {
  const t = useT();
  const navigate = useNavigate();
  const { activeClientId } = useUIStore();
  const { activeWorkspaceId, websites, clients, providers, integrations } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("list");

  const webIntegration = integrations.find(
    (i) => i.workspaceId === activeWorkspaceId && i.category === "website",
  );
  const provider = webIntegration
    ? providers.find((p) => p.id === webIntegration.providerId)
    : undefined;

  const wsWebsites = websites.filter((w) => w.workspaceId === activeWorkspaceId);
  const filtered = activeClientId
    ? wsWebsites.filter((w) => w.clientId === activeClientId)
    : wsWebsites;

  const clientName = (id: string | undefined) =>
    id ? (clients.find((c) => c.id === id)?.name ?? id) : "—";

  function latestDeployment(w: (typeof filtered)[0]) {
    if (w.deployments.length === 0) return null;
    return [...w.deployments].sort((a, b) => (a.at < b.at ? 1 : -1))[0];
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Globe size={16} className="text-laiton" />
        <h1 className="text-sm font-semibold">{t("nav_websites")}</h1>
        {provider && (
          <>
            <span className="text-tx-3">·</span>
            <span className="font-mono text-[11px] text-tx-3">
              {t("web_provider_label")} {provider.name}
            </span>
            <Badge className="border-line bg-bg-1 font-mono text-[9px] text-tx-3">
              {t("web_mock_badge")}
            </Badge>
          </>
        )}
        <span className="ml-auto font-mono text-[11px] text-tx-3">
          {filtered.length} {t("web_count")}
        </span>
      </div>

      {/* Tabs */}
      <div
        className="mb-4 flex gap-0 overflow-x-auto border-b border-line"
        role="tablist"
        aria-label={t("nav_websites")}
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
          {t("nav_websites")}
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
          {t("web_new_btn")}
        </button>
      </div>

      {/* Tab: List */}
      {activeTab === "list" && (
        <div role="tabpanel" className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
              <p className="text-[13px] text-tx-2">{t("empty_websites")}</p>
              <p className="font-mono text-xs text-tx-3">{t("action_websites")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-card border border-line">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-line bg-bg-1">
                    {(
                      [
                        "web_col_name",
                        "web_col_client",
                        "web_col_pages",
                        "web_col_deployments",
                        "web_col_issues",
                      ] as const
                    ).map((k) => (
                      <th
                        key={k}
                        className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3"
                      >
                        {t(k)}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3">
                      {t("web_dep_status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((web) => {
                    const latest = latestDeployment(web);
                    const verified = latest ? isFullyVerified(latest) : null;
                    return (
                      <tr
                        key={web.id}
                        className="cursor-pointer border-b border-line/50 transition-colors last:border-0 hover:bg-bg-2/60"
                        onClick={() => navigate(`/websites/${web.id}`)}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-medium text-tx-1">{web.name}</span>
                            <span className="font-mono text-[10px] text-tx-3">{web.id}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-tx-2">
                          {clientName(web.clientId)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-tx-3">
                          {web.pages.length}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-tx-3">
                          {web.deployments.length}
                        </td>
                        <td className="px-3 py-2.5">
                          {web.openIssues.length > 0 ? (
                            <div className="flex items-center gap-1 font-mono text-[11px] text-warn">
                              <AlertCircle size={11} />
                              {web.openIssues.length}
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-tx-3">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {latest === null ? (
                            <span className="font-mono text-[10px] text-tx-3">—</span>
                          ) : verified ? (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-ok">
                              <CheckCircle2 size={11} />
                              {t("web_verified_yes")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-err">
                              <XCircle size={11} />
                              {t("web_verified_no")}
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
            <h2 className="mb-4 text-[13px] font-semibold text-tx-1">{t("web_create_title")}</h2>
            <CreateForm onDone={() => setActiveTab("list")} />
          </div>
        </div>
      )}
    </div>
  );
}

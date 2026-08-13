import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { WebsiteDeployment } from "@/lib/types";

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

function isFullyVerified(dep: WebsiteDeployment): boolean {
  return (
    dep.verified &&
    dep.httpCheck === "pass" &&
    dep.formCheck === "pass" &&
    dep.integrationCheck === "pass"
  );
}

// ─── Check Cell ──────────────────────────────────────────────────────────────

function CheckCell({ value }: { value?: "pass" | "fail" }) {
  const t = useT();
  if (value === "pass") {
    return (
      <span className="flex items-center gap-1 font-mono text-[10px] text-ok">
        <CheckCircle2 size={11} />
        {t("web_check_pass")}
      </span>
    );
  }
  if (value === "fail") {
    return (
      <span className="flex items-center gap-1 font-mono text-[10px] text-err">
        <XCircle size={11} />
        {t("web_check_fail")}
      </span>
    );
  }
  return <span className="font-mono text-[10px] text-tx-3">{t("web_check_pending")}</span>;
}

// ─── Deployment Row ──────────────────────────────────────────────────────────

function DeploymentRow({ dep }: { dep: WebsiteDeployment }) {
  const t = useT();
  const verified = isFullyVerified(dep);

  return (
    <div
      className={cn(
        "rounded-card border p-4",
        verified ? "border-ok/30 bg-ok/5" : "border-err/30 bg-err/5",
      )}
    >
      {/* Status badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {verified ? (
            <>
              <CheckCircle2 size={14} className="text-ok" />
              <span className="font-mono text-[11px] font-semibold text-ok">
                {t("web_verified_yes")}
              </span>
            </>
          ) : (
            <>
              <XCircle size={14} className="text-err" />
              <span className="font-mono text-[11px] font-semibold text-err">
                {t("web_verified_no")}
              </span>
            </>
          )}
        </div>
        <span className="font-mono text-[10px] text-tx-3">{fmtDate(dep.at)}</span>
      </div>

      {/* Grid of checks */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Deployment ID */}
        <div className="rounded-ctl border border-line bg-bg-0 px-2 py-1.5">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wide text-tx-3">
            {t("web_dep_id")}
          </div>
          <div className="font-mono text-[11px] text-tx-1">{dep.deploymentId}</div>
        </div>

        {/* Live URL */}
        <div className="col-span-1 rounded-ctl border border-line bg-bg-0 px-2 py-1.5 sm:col-span-1">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wide text-tx-3">
            {t("web_dep_url")}
          </div>
          <div className="flex items-center gap-1 overflow-hidden">
            <ExternalLink size={9} className="shrink-0 text-laiton" />
            <span className="truncate font-mono text-[11px] text-laiton">{dep.liveUrl}</span>
          </div>
        </div>

        {/* HTTP check */}
        <div className="rounded-ctl border border-line bg-bg-0 px-2 py-1.5">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wide text-tx-3">
            {t("web_dep_http")}
          </div>
          <CheckCell value={dep.httpCheck} />
        </div>

        {/* Form check */}
        <div className="rounded-ctl border border-line bg-bg-0 px-2 py-1.5">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wide text-tx-3">
            {t("web_dep_form")}
          </div>
          <CheckCell value={dep.formCheck} />
        </div>
      </div>

      {/* Integration check — full row */}
      <div className="mt-2 rounded-ctl border border-line bg-bg-0 px-2 py-1.5">
        <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wide text-tx-3">
          {t("web_dep_integration")}
        </div>
        <CheckCell value={dep.integrationCheck} />
      </div>
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────

export default function WebsiteDetail() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { websites, clients, providers } = useAppStore();

  const web = websites.find((w) => w.id === id);

  if (!web) {
    return (
      <div className="flex h-full flex-col gap-4">
        <button
          onClick={() => navigate("/websites")}
          className="flex w-fit items-center gap-1 font-mono text-[11px] text-tx-3 hover:text-tx-2"
        >
          <ArrowLeft size={12} />
          {t("web_back")}
        </button>
        <div className="flex flex-1 items-center justify-center text-[13px] text-tx-3">
          {t("empty_websites")}
        </div>
      </div>
    );
  }

  const provider = providers.find((p) => p.id === web.providerId);
  const client = web.clientId ? clients.find((c) => c.id === web.clientId) : undefined;

  const sortedDeployments = [...web.deployments].sort((a, b) => (a.at < b.at ? 1 : -1));

  const verifiedCount = web.deployments.filter(isFullyVerified).length;
  const totalCount = web.deployments.length;

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Back + header */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate("/websites")}
          className="flex w-fit items-center gap-1 font-mono text-[11px] text-tx-3 hover:text-tx-2"
        >
          <ArrowLeft size={12} />
          {t("web_back")}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Globe size={16} className="text-laiton" />
          <h1 className="text-sm font-semibold text-tx-1">{web.name}</h1>
          {provider && (
            <>
              <span className="font-mono text-[11px] text-tx-3">
                {t("web_provider_label")} {provider.name}
              </span>
              <Badge className="border-line bg-bg-1 font-mono text-[9px] text-tx-3">
                {t("web_mock_badge")}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("web_col_client"), value: client?.name ?? "—" },
          { label: t("web_col_pages"), value: String(web.pages.length) },
          { label: t("web_col_deployments"), value: String(totalCount) },
          {
            label: t("web_verified_yes"),
            value: `${verifiedCount}/${totalCount}`,
            highlight: verifiedCount === totalCount && totalCount > 0,
          },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="rounded-ctl border border-line bg-bg-1 px-3 py-2">
            <div className="font-mono text-[10px] text-tx-3">{label}</div>
            <div
              className={cn(
                "mt-0.5 font-mono text-[12px]",
                highlight ? "text-ok" : "text-tx-1",
              )}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Pages */}
      {web.pages.length > 0 && (
        <section>
          <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3">
            {t("web_section_pages")}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {web.pages.map((page) => (
              <div
                key={page}
                className="flex items-center gap-1.5 rounded-ctl border border-line bg-bg-1 px-2.5 py-1"
              >
                <FileText size={10} className="text-tx-3" />
                <span className="font-mono text-[11px] text-tx-2">{page}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Deployments */}
      <section>
        <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3">
          {t("web_section_deployments")}
        </h2>
        {sortedDeployments.length === 0 ? (
          <div className="rounded-ctl border border-line bg-bg-1 px-3 py-3 font-mono text-[12px] text-tx-3">
            {t("web_no_deployments")}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedDeployments.map((dep) => (
              <DeploymentRow key={dep.id} dep={dep} />
            ))}
          </div>
        )}
      </section>

      {/* Open issues */}
      <section>
        <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-tx-3">
          {t("web_section_issues")}
        </h2>
        {web.openIssues.length === 0 ? (
          <div className="flex items-center gap-2 rounded-ctl border border-line bg-bg-1 px-3 py-2">
            <CheckCircle2 size={12} className="text-ok" />
            <span className="font-mono text-[12px] text-tx-3">{t("web_no_issues")}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 rounded-card border border-warn/30 bg-warn/5 p-3">
            {web.openIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertCircle size={12} className="mt-0.5 shrink-0 text-warn" />
                <span className="font-mono text-[12px] text-tx-2">{issue}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { useState, type ElementType } from "react";
import {
  ShieldAlert,
  Users,
  Key,
  Plug,
  Search,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import type { CapabilityId, PolicyRule, FindingSeverity, FindingCategory } from "@/lib/types";

type Tab = "identities" | "permissions" | "secrets" | "providers" | "findings" | "audit";

function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  const t = useT();
  const labels: Record<FindingSeverity, string> = {
    HIGH: t("sec_finding_severity_HIGH"),
    MEDIUM: t("sec_finding_severity_MEDIUM"),
    LOW: t("sec_finding_severity_LOW"),
  };
  const variant = severity === "HIGH" ? "err" : severity === "MEDIUM" ? "warn" : ("info" as const);
  return (
    <Badge variant={variant} className="font-mono text-[10px] uppercase">
      {labels[severity]}
    </Badge>
  );
}

function ConnectionStateBadge({ state }: { state: "mock" | "connected" | "not_configured" }) {
  const t = useT();
  if (state === "connected") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-ok/30 bg-ok/10 px-1.5 py-0.5 font-mono text-[10px] text-ok">
        {t("sec_badge_connected")}
      </span>
    );
  }
  if (state === "mock") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-laiton/30 bg-laiton/10 px-1.5 py-0.5 font-mono text-[10px] text-laiton">
        {t("sec_badge_mock")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-tx-3/30 bg-bg-0 px-1.5 py-0.5 font-mono text-[10px] text-tx-3">
      {t("sec_badge_not_configured")}
    </span>
  );
}

function RuleBadge({ rule }: { rule: PolicyRule }) {
  const t = useT();
  const variant =
    rule === "auto"
      ? "ok"
      : rule === "approval_required"
        ? "or"
        : rule === "forbidden"
          ? "err"
          : ("warn" as const);
  const labels: Record<PolicyRule, string> = {
    auto: t("pol_rule_auto"),
    approval_required: t("pol_rule_approval"),
    forbidden: t("pol_rule_forbidden"),
    human_only: t("pol_rule_human"),
  };
  return (
    <Badge variant={variant} className="font-mono text-[10px]">
      {labels[rule]}
    </Badge>
  );
}

const HIGH_RISK_CAPS: CapabilityId[] = [
  "spend_money",
  "contract_commitment",
  "automation.deploy",
  "website.deploy",
  "email.send",
];

// Simulated secrets state — never real values, only status
const SECRETS = [
  {
    name: "Pipedrive API Key",
    provider: "prv-pipedrive",
    status: "rotation_due" as const,
    ageDays: 97,
  },
  { name: "Gmail OAuth Token", provider: "prv-gmail", status: "ok" as const, ageDays: 12 },
  { name: "Google Calendar OAuth", provider: "prv-gcal", status: "ok" as const, ageDays: 12 },
  { name: "Google Drive OAuth", provider: "prv-gdrive", status: "ok" as const, ageDays: 12 },
  { name: "Fireflies API Key", provider: "prv-fireflies", status: "ok" as const, ageDays: 45 },
  { name: "Make API Key", provider: "prv-make", status: "ok" as const, ageDays: 31 },
  { name: "Webflow API Key", provider: "prv-webflow", status: "ok" as const, ageDays: 31 },
  { name: "Notion Integration Token", provider: "prv-notion", status: "ok" as const, ageDays: 22 },
  { name: "GitHub Personal Token", provider: "prv-github", status: "ok" as const, ageDays: 18 },
  { name: "Claude API Key", provider: "prv-claude-code", status: "ok" as const, ageDays: 8 },
  { name: "Slack Bot Token", provider: "prv-slack", status: "configured" as const, ageDays: 0 },
];

// ── Posture summary ─────────────────────────────────────────────────────────

function PostureSummary() {
  const t = useT();
  const checks = [
    {
      label: t("sec_least_privilege"),
      ok: false,
      note: t("sec_posture_note_least_privilege"),
    },
    {
      label: t("sec_workspace_isolation"),
      ok: true,
      note: t("sec_posture_note_workspace_isolation"),
    },
    {
      label: t("sec_prompt_injection_protection"),
      ok: false,
      note: t("sec_posture_note_prompt_injection"),
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {checks.map((c) => (
        <div
          key={c.label}
          className={`rounded border p-3 ${c.ok ? "border-ok/30 bg-ok/5" : "border-err/30 bg-err/5"}`}
        >
          <div className="mb-1 flex items-center gap-2">
            {c.ok ? (
              <CheckCircle2 size={13} className="text-ok" />
            ) : (
              <XCircle size={13} className="text-err" />
            )}
            <span className="text-[12px] font-medium text-tx-1">{c.label}</span>
          </div>
          <p className="font-mono text-[11px] text-tx-3">{c.note}</p>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Identities ─────────────────────────────────────────────────────────

function IdentitiesTab() {
  const t = useT();
  const { actors, providers } = useAppStore();
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-bg-0">
              <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                {t("sec_identity_name")}
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                {t("sec_identity_role")}
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                {t("sec_identity_type")}
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                {t("sec_identity_provider")}
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                {t("sec_identity_capabilities")}
              </th>
            </tr>
          </thead>
          <tbody>
            {actors.map((actor, i) => {
              const prov = actor.providerId ? providerMap.get(actor.providerId) : undefined;
              const hasHighRisk = actor.capabilities.some((c) => HIGH_RISK_CAPS.includes(c));
              return (
                <tr
                  key={actor.id}
                  className={`border-b border-line last:border-0 ${i % 2 === 0 ? "bg-bg-1" : "bg-bg-0"}`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-tx-1">{actor.name}</span>
                      {hasHighRisk && (
                        <AlertTriangle
                          size={11}
                          className="text-warn"
                          aria-label={t("sec_high_risk_caps")}
                        />
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-tx-3">{actor.id}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-tx-2">{actor.role}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={actor.type === "human" ? "info" : "laiton"}
                      className="font-mono text-[10px]"
                    >
                      {actor.type === "human" ? t("sec_identity_human") : t("sec_identity_agent")}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-tx-3">
                    {prov ? prov.name : t("sec_identity_no_provider")}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {actor.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className={`rounded px-1 py-0.5 font-mono text-[10px] ${
                            HIGH_RISK_CAPS.includes(cap)
                              ? "bg-warn/10 text-warn"
                              : "bg-bg-0 text-tx-3"
                          }`}
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-start gap-2 rounded border border-warn/20 bg-warn/5 px-3 py-2">
        <AlertTriangle size={12} className="mt-0.5 shrink-0 text-warn" />
        <p className="font-mono text-[11px] text-tx-2">
          {t("sec_high_risk_caps")}: spend_money, contract_commitment, automation.deploy,
          website.deploy, email.send — {t("sec_high_risk_caps_marked")}{" "}
          <span className="text-warn">⚠</span>
        </p>
      </div>
    </div>
  );
}

// ── Tab: Permissions ────────────────────────────────────────────────────────

function PermissionsTab() {
  const t = useT();
  const { actors, policies, activeWorkspaceId } = useAppStore();

  const allCaps = Array.from(new Set(actors.flatMap((a) => a.capabilities))).sort();

  const policyMap = new Map(
    policies.filter((p) => p.workspaceId === activeWorkspaceId).map((p) => [p.capability, p]),
  );

  return (
    <div className="overflow-hidden rounded border border-line">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line bg-bg-0">
            <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
              {t("sec_perm_capability")}
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
              {t("sec_perm_policy")}
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
              {t("sec_perm_actors")}
            </th>
          </tr>
        </thead>
        <tbody>
          {allCaps.map((cap, i) => {
            const pol = policyMap.get(cap as CapabilityId);
            const authorized = actors.filter((a) => a.capabilities.includes(cap as CapabilityId));
            const isHighRisk = HIGH_RISK_CAPS.includes(cap as CapabilityId);
            return (
              <tr
                key={cap}
                className={`border-b border-line last:border-0 ${i % 2 === 0 ? "bg-bg-1" : "bg-bg-0"}`}
              >
                <td className="px-4 py-2.5">
                  <span
                    className={`font-mono text-[12px] ${isHighRisk ? "text-warn" : "text-laiton"}`}
                  >
                    {cap}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {pol ? (
                    <RuleBadge rule={pol.rule} />
                  ) : (
                    <span className="font-mono text-[11px] text-tx-3">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {authorized.map((a) => (
                      <span
                        key={a.id}
                        className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-tx-2"
                      >
                        {a.name}
                      </span>
                    ))}
                    {authorized.length === 0 && (
                      <span className="font-mono text-[11px] text-tx-3">—</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab: Secrets ─────────────────────────────────────────────────────────────

function SecretsTab() {
  const t = useT();

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded border border-line bg-bg-0 px-3 py-2">
        <Key size={12} className="mt-0.5 shrink-0 text-tx-3" />
        <p className="font-mono text-[11px] text-tx-3">{t("sec_secrets_note")}</p>
      </div>
      <div className="overflow-hidden rounded border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-bg-0">
              <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                {t("sec_secret_name")}
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                {t("sec_secret_status")}
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                {t("sec_secret_age")}
              </th>
            </tr>
          </thead>
          <tbody>
            {SECRETS.map((s, i) => (
              <tr
                key={s.name}
                className={`border-b border-line last:border-0 ${i % 2 === 0 ? "bg-bg-1" : "bg-bg-0"}`}
              >
                <td className="px-4 py-2.5">
                  <p className="font-mono text-[12px] text-tx-1">{s.name}</p>
                  <p className="font-mono text-[10px] text-tx-3">{s.provider}</p>
                </td>
                <td className="px-4 py-2.5">
                  {s.status === "rotation_due" ? (
                    <span className="inline-flex items-center gap-1 rounded border border-err/30 bg-err/10 px-1.5 py-0.5 font-mono text-[10px] text-err">
                      <AlertTriangle size={10} />
                      {t("sec_secret_rotation_due")}
                    </span>
                  ) : s.status === "ok" ? (
                    <span className="inline-flex items-center gap-1 rounded border border-ok/30 bg-ok/10 px-1.5 py-0.5 font-mono text-[10px] text-ok">
                      <CheckCircle2 size={10} />
                      {t("sec_secret_ok")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded border border-laiton/30 bg-laiton/10 px-1.5 py-0.5 font-mono text-[10px] text-laiton">
                      {t("sec_secret_configured")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-tx-2">
                  {s.ageDays > 0 ? `${s.ageDays}j` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Providers ─────────────────────────────────────────────────────────

function ProvidersTab() {
  const t = useT();
  const { providers } = useAppStore();

  return (
    <div className="overflow-hidden rounded border border-line">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line bg-bg-0">
            <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
              {t("sec_provider_name")}
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
              {t("sec_provider_state")}
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
              {t("sec_provider_health")}
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
              {t("sec_provider_capabilities")}
            </th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p, i) => (
            <tr
              key={p.id}
              className={`border-b border-line last:border-0 ${i % 2 === 0 ? "bg-bg-1" : "bg-bg-0"}`}
            >
              <td className="px-4 py-2.5">
                <p className="text-[13px] font-medium text-tx-1">{p.name}</p>
                <p className="font-mono text-[10px] text-tx-3">{p.category}</p>
              </td>
              <td className="px-4 py-2.5">
                <ConnectionStateBadge state={p.state} />
              </td>
              <td className="px-4 py-2.5">
                {p.health === "ok" ? (
                  <CheckCircle2 size={13} className="text-ok" />
                ) : p.health === "degraded" ? (
                  <AlertTriangle size={13} className="text-warn" />
                ) : (
                  <XCircle size={13} className="text-err" />
                )}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {p.capabilities.slice(0, 4).map((cap) => (
                    <span
                      key={cap}
                      className="rounded bg-bg-0 px-1 py-0.5 font-mono text-[10px] text-tx-3"
                    >
                      {cap}
                    </span>
                  ))}
                  {p.capabilities.length > 4 && (
                    <span className="font-mono text-[10px] text-tx-3">
                      +{p.capabilities.length - 4}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab: Findings ─────────────────────────────────────────────────────────

function FindingsTab() {
  const t = useT();
  const { securityFindings, actors } = useAppStore();
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  const CATEGORY_LABELS: Record<FindingCategory, string> = {
    prompt_injection: t("sec_finding_category_prompt_injection"),
    credential: t("sec_finding_category_credential"),
    permission: t("sec_finding_category_permission"),
    isolation: t("sec_finding_category_isolation"),
    privacy: t("sec_finding_category_privacy"),
    supply_chain: t("sec_finding_category_supply_chain"),
  };

  const STATUS_LABELS: Record<"open" | "acknowledged" | "resolved", string> = {
    open: t("sec_finding_status_open"),
    acknowledged: t("sec_finding_status_acknowledged"),
    resolved: t("sec_finding_status_resolved"),
  };

  const categoryLabel = (cat: FindingCategory): string => CATEGORY_LABELS[cat];
  const statusLabel = (s: "open" | "acknowledged" | "resolved"): string => STATUS_LABELS[s];

  const open = securityFindings.filter((f) => f.status !== "resolved");
  const resolved = securityFindings.filter((f) => f.status === "resolved");

  return (
    <div className="space-y-4">
      {open.length === 0 && (
        <p className="font-mono text-[12px] text-tx-3">{t("sec_findings_empty")}</p>
      )}
      {open.map((finding) => (
        <div
          key={finding.id}
          className={`rounded border p-4 ${
            finding.severity === "HIGH"
              ? "border-err/30 bg-err/5"
              : finding.severity === "MEDIUM"
                ? "border-warn/30 bg-warn/5"
                : "border-line bg-bg-1"
          }`}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-tx-3">
                {categoryLabel(finding.category)}
              </span>
            </div>
            <span
              className={`font-mono text-[10px] ${
                finding.status === "open"
                  ? "text-err"
                  : finding.status === "acknowledged"
                    ? "text-warn"
                    : "text-ok"
              }`}
            >
              {statusLabel(finding.status)}
            </span>
          </div>
          <p className="mb-1 text-[13px] font-medium text-tx-1">{finding.title}</p>
          <p className="font-mono text-[12px] text-tx-2">{finding.description}</p>
          {finding.affectedActorIds && finding.affectedActorIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {finding.affectedActorIds.map((id) => (
                <span
                  key={id}
                  className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-tx-3"
                >
                  {actorMap.get(id)?.name ?? id}
                </span>
              ))}
            </div>
          )}
          {finding.affectedCapabilities && finding.affectedCapabilities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {finding.affectedCapabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded bg-bg-0 px-1 py-0.5 font-mono text-[10px] text-laiton"
                >
                  {cap}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 font-mono text-[10px] text-tx-3">
            {t("sec_finding_detected_at").replace("{date}", finding.detectedAt.slice(0, 10))}
          </p>
        </div>
      ))}
      {resolved.length > 0 && (
        <details className="rounded border border-line">
          <summary className="cursor-pointer px-4 py-2.5 font-mono text-[12px] text-tx-3">
            {t("sec_findings_resolved_count").replace("{n}", String(resolved.length))}
          </summary>
          <div className="space-y-2 p-4 pt-0">
            {resolved.map((finding) => (
              <div key={finding.id} className="rounded border border-line bg-bg-0 p-3 opacity-60">
                <div className="mb-1 flex items-center gap-2">
                  <SeverityBadge severity={finding.severity} />
                  <CheckCircle2 size={12} className="text-ok" />
                </div>
                <p className="text-[12px] text-tx-2">{finding.title}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ── Tab: Audit ─────────────────────────────────────────────────────────────

function AuditTab() {
  const t = useT();
  const { events, actors, activeWorkspaceId } = useAppStore();
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  const securityEvents = events
    .filter(
      (e) =>
        e.workspaceId === activeWorkspaceId &&
        (e.capability != null ||
          e.policyResult != null ||
          e.action.startsWith("policy.") ||
          e.action.startsWith("approval.") ||
          e.action.startsWith("feature.") ||
          e.action.startsWith("provider.")),
    )
    .slice()
    .reverse();

  return (
    <div>
      {securityEvents.length === 0 ? (
        <p className="font-mono text-[12px] text-tx-3">{t("sec_audit_empty")}</p>
      ) : (
        <div className="overflow-hidden rounded border border-line">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-bg-0">
                <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                  {t("sec_audit_at")}
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                  {t("sec_audit_action")}
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                  {t("sec_audit_actor")}
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                  {t("sec_audit_capability")}
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                  {t("sec_audit_policy")}
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium text-tx-3">
                  {t("sec_audit_result")}
                </th>
              </tr>
            </thead>
            <tbody>
              {securityEvents.map((ev, i) => (
                <tr
                  key={ev.id}
                  className={`border-b border-line last:border-0 ${i % 2 === 0 ? "bg-bg-1" : "bg-bg-0"}`}
                >
                  <td className="px-4 py-2 font-mono text-[10px] text-tx-3">
                    {ev.at.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] text-tx-2">{ev.action}</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-tx-2">
                    {ev.requestedByActorId
                      ? (actorMap.get(ev.requestedByActorId)?.name ?? ev.requestedByActorId)
                      : "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] text-laiton">
                    {ev.capability ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    {ev.policyResult ? (
                      <RuleBadge rule={ev.policyResult} />
                    ) : (
                      <span className="font-mono text-[11px] text-tx-3">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {ev.result === "ok" ? (
                      <CheckCircle2 size={13} className="text-ok" />
                    ) : ev.result === "refused" ? (
                      <XCircle size={13} className="text-err" />
                    ) : (
                      <AlertTriangle size={13} className="text-warn" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function Security() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<Tab>("findings");

  const tabs: { id: Tab; labelKey: string; icon: ElementType }[] = [
    { id: "findings", labelKey: t("sec_tab_findings"), icon: Search },
    { id: "identities", labelKey: t("sec_tab_identities"), icon: Users },
    { id: "permissions", labelKey: t("sec_tab_permissions"), icon: Key },
    { id: "secrets", labelKey: t("sec_tab_secrets"), icon: Key },
    { id: "providers", labelKey: t("sec_tab_providers"), icon: Plug },
    { id: "audit", labelKey: t("sec_tab_audit"), icon: ScrollText },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-err" />
          <div>
            <h1 className="text-[15px] font-semibold text-tx-1">{t("sec_page_title")}</h1>
            <p className="mt-0.5 font-mono text-[12px] text-tx-3">{t("sec_page_subtitle")}</p>
          </div>
        </div>

        {/* Posture summary */}
        <PostureSummary />

        {/* Tabs */}
        <div className="mb-5 flex border-b border-line">
          {tabs.map(({ id, labelKey }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 font-mono text-[12px] transition-colors ${
                activeTab === id ? "border-b-2 border-tx-1 text-tx-1" : "text-tx-3 hover:text-tx-2"
              }`}
              aria-selected={activeTab === id}
              role="tab"
            >
              {labelKey}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div role="tabpanel">
          {activeTab === "identities" && <IdentitiesTab />}
          {activeTab === "permissions" && <PermissionsTab />}
          {activeTab === "secrets" && <SecretsTab />}
          {activeTab === "providers" && <ProvidersTab />}
          {activeTab === "findings" && <FindingsTab />}
          {activeTab === "audit" && <AuditTab />}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Plug, CheckCircle2, AlertTriangle, Circle, Activity, ArrowRightLeft } from "lucide-react";
import { useT, useFeatureStatus, type FeatureStatus } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import type { CapabilityId, Provider, ProviderCategory } from "@/lib/types";
import type { Lang, TKey } from "@/lib/i18n";

type Tab = "providers" | "doctor" | "swap";

const CATEGORY_ORDER: ProviderCategory[] = [
  "email",
  "calendar",
  "files",
  "contacts",
  "transcripts",
  "crm",
  "automation",
  "website",
  "knowledge",
  "source_control",
  "worker_code",
  "worker_ops",
  "reasoning",
  "notifications",
];

const CAT_LABEL_KEYS: Record<ProviderCategory, TKey> = {
  email: "int_cat_email",
  calendar: "int_cat_calendar",
  files: "int_cat_files",
  contacts: "int_cat_contacts",
  transcripts: "int_cat_transcripts",
  crm: "int_cat_crm",
  automation: "int_cat_automation",
  website: "int_cat_website",
  knowledge: "int_cat_knowledge",
  source_control: "int_cat_source_control",
  worker_code: "int_cat_worker_code",
  worker_ops: "int_cat_worker_ops",
  reasoning: "int_cat_reasoning",
  notifications: "int_cat_notifications",
};

const ALL_CAPABILITIES: CapabilityId[] = [
  "email.read",
  "email.draft",
  "email.send",
  "calendar.read",
  "calendar.create",
  "files.read",
  "files.write",
  "files.search",
  "contacts.read",
  "transcripts.read",
  "transcripts.search",
  "meeting.read",
  "meeting.process",
  "crm.read",
  "crm.search",
  "crm.write",
  "crm.create_activity",
  "crm.add_note",
  "automation.inspect",
  "automation.build",
  "automation.edit",
  "automation.test",
  "automation.deploy",
  "automation.run",
  "website.inspect",
  "website.build",
  "website.edit",
  "website.test",
  "website.deploy",
  "website.verify",
  "knowledge.publish",
  "source_control.read",
  "source_control.change_request",
  "source_control.status",
  "worker.code",
  "worker.ops",
  "worker.research",
  "worker.review",
  "notification.internal",
  "spend_money",
  "contract_commitment",
];

// ── Sub-component: Provider card ───────────────────────────────────────────

interface ProviderCardProps {
  t: (key: TKey) => string;
  category: ProviderCategory;
  provider: Provider;
  integrationId: string;
  isDisabled: boolean;
  onToggle: (id: string) => void;
}

function ProviderCard({
  t,
  category,
  provider,
  integrationId,
  isDisabled,
  onToggle,
}: ProviderCardProps) {
  const stateVariant = {
    mock: "laiton",
    connected: "ok",
    not_configured: "warn",
  } as const;

  const stateLabel: Record<string, TKey> = {
    mock: "int_state_mock",
    connected: "int_state_connected",
    not_configured: "int_state_not_configured",
  };

  const authLabel: Record<string, TKey> = {
    oauth: "int_auth_oauth",
    api_key: "int_auth_api_key",
    none: "int_auth_none",
  };

  const healthIcon = {
    ok: <Circle size={6} className="fill-ok text-ok" />,
    degraded: <Circle size={6} className="fill-warn text-warn" />,
    down: <Circle size={6} className="fill-err text-err" />,
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={`flex flex-col gap-3 rounded-card border p-4 transition-colors ${
        isDisabled ? "border-line/40 bg-bg-0/50 opacity-60" : "border-line bg-bg-1"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-tx-1">{provider.name}</span>
          <span className="text-[11px] text-tx-3">{t(CAT_LABEL_KEYS[category])}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isDisabled && (
            <Badge variant="err" className="text-[10px]">
              {t("int_disabled_badge")}
            </Badge>
          )}
          <Badge variant={stateVariant[provider.state]}>
            {t(stateLabel[provider.state] as TKey)}
          </Badge>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 font-mono text-[11px] text-tx-3">
        {provider.health && (
          <span className="flex items-center gap-1">
            {healthIcon[provider.health]}
            {t(
              provider.health === "ok"
                ? "int_health_ok"
                : provider.health === "degraded"
                  ? "int_health_degraded"
                  : "int_health_down",
            )}
          </span>
        )}
        {provider.auth && <span>{t(authLabel[provider.auth] as TKey)}</span>}
        {provider.lastCheckAt && (
          <span>
            {t("int_last_check")} {fmt(provider.lastCheckAt)}
          </span>
        )}
      </div>

      {/* Capabilities */}
      <div>
        <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-tx-3">
          {t("int_capabilities")}
        </span>
        <div className="flex flex-wrap gap-1">
          {provider.capabilities.map((cap) => (
            <span
              key={cap}
              className="rounded-ctl bg-bg-2 px-1.5 py-0.5 font-mono text-[10px] text-tx-3"
            >
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onToggle(integrationId)}
          aria-pressed={isDisabled}
          className={`rounded-ctl border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or ${
            isDisabled
              ? "border-ok/30 bg-ok/10 text-ok hover:bg-ok/20"
              : "border-line bg-bg-2 text-tx-2 hover:bg-bg-3 hover:text-err"
          }`}
        >
          {isDisabled ? t("int_enable_btn") : t("int_disable_btn")}
        </button>
        <button
          disabled
          title={t("int_replace_stub")}
          className="cursor-not-allowed rounded-ctl border border-line/40 px-3 py-1 text-[11px] font-medium text-tx-3/40"
        >
          {t("int_replace_btn")}
        </button>
      </div>

      {/* Policy note */}
      <span className="font-mono text-[10px] text-tx-3/60">{t("int_policy_toggle")}</span>
    </div>
  );
}

// ── Sub-component: Doctor tab ──────────────────────────────────────────────

interface CapRow {
  cap: CapabilityId;
  integ: { id: string; category: ProviderCategory } | undefined;
  prv: Provider | undefined;
  isDisabled: boolean;
}

interface DoctorTabProps {
  t: (key: TKey) => string;
  lang: Lang;
  coreOk: boolean;
  stateOk: boolean;
  capRows: CapRow[];
  featureStatus: FeatureStatus[];
}

function DoctorTab({ t, lang, coreOk, stateOk, capRows, featureStatus }: DoctorTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Status banner */}
      <div className="flex items-center gap-3">
        <StatusPill ok={coreOk} okLabel={t("int_core_ok")} warnLabel={t("int_core_warn")} />
        <StatusPill
          ok={stateOk}
          okLabel={t("int_state_ok_label")}
          warnLabel={t("int_state_warn")}
        />
      </div>

      {/* Capability table */}
      <section>
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-tx-3">
          {t("int_cap_col_capability")}
        </h2>
        <div className="overflow-hidden rounded-card border border-line">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-bg-0">
                <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-tx-3">
                  {t("int_cap_col_capability")}
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-tx-3">
                  {t("int_cap_col_provider")}
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-tx-3">
                  {t("int_cap_col_status")}
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-tx-3">
                  {t("int_cap_col_health")}
                </th>
              </tr>
            </thead>
            <tbody>
              {capRows.map(({ cap, prv, isDisabled }, idx) => (
                <tr
                  key={cap}
                  className={`border-b border-line/50 last:border-0 ${
                    idx % 2 === 0 ? "bg-bg-1" : "bg-bg-0"
                  } ${isDisabled ? "opacity-50" : ""}`}
                >
                  <td className="px-3 py-1.5 font-mono text-[11px] text-tx-2">{cap}</td>
                  <td className="px-3 py-1.5 text-[12px] text-tx-2">
                    {prv ? prv.name : <span className="text-tx-3">{t("int_no_provider")}</span>}
                  </td>
                  <td className="px-3 py-1.5">
                    {prv && !isDisabled ? (
                      <Badge
                        variant={
                          prv.state === "connected"
                            ? "ok"
                            : prv.state === "mock"
                              ? "laiton"
                              : "warn"
                        }
                      >
                        {prv.state === "connected"
                          ? t("int_state_connected")
                          : prv.state === "mock"
                            ? t("int_state_mock")
                            : t("int_state_not_configured")}
                      </Badge>
                    ) : isDisabled ? (
                      <Badge variant="err">{t("int_disabled_badge")}</Badge>
                    ) : (
                      <Badge variant="default">{t("int_cap_not_covered")}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {prv && !isDisabled ? (
                      <HealthDot health={prv.health} t={t} />
                    ) : (
                      <span className="text-[11px] text-tx-3">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Features section */}
      <section>
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-tx-3">
          {t("int_features_section")}
        </h2>
        <div className="flex flex-col gap-2">
          {featureStatus.map(({ feature, missingCaps }) => {
            const ready = missingCaps.length === 0;
            return (
              <div
                key={feature.id}
                className="flex items-start justify-between gap-3 rounded-card border border-line bg-bg-1 px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-tx-1">{feature.name[lang]}</span>
                  <span className="text-[11px] text-tx-3">{feature.description[lang]}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className="font-mono text-[10px] text-tx-3">
                      {t("int_requires_label")}:
                    </span>
                    {feature.requires.map((cap) => (
                      <span
                        key={cap}
                        className={`rounded-ctl px-1.5 py-0.5 font-mono text-[10px] ${
                          missingCaps.includes(cap) ? "bg-err/15 text-err" : "bg-bg-2 text-tx-3"
                        }`}
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {ready ? (
                    <Badge variant="ok">{t("int_feature_ready")}</Badge>
                  ) : (
                    <Badge variant="err">{t("int_feature_missing")}</Badge>
                  )}
                  <span className="font-mono text-[10px] text-tx-3">v{feature.version}</span>
                  <span
                    className={`font-mono text-[10px] ${
                      feature.acceptanceStatus === "pass"
                        ? "text-ok"
                        : feature.acceptanceStatus === "fail"
                          ? "text-err"
                          : "text-warn"
                    }`}
                  >
                    {t("int_acceptance_label")}: {feature.acceptanceStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function StatusPill({
  ok,
  okLabel,
  warnLabel,
}: {
  ok: boolean;
  okLabel: string;
  warnLabel: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-card border px-3 py-1.5 ${
        ok ? "border-ok/30 bg-ok/10 text-ok" : "border-warn/30 bg-warn/10 text-warn"
      }`}
    >
      {ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
      <span className="font-mono text-[11px] font-semibold">{ok ? okLabel : warnLabel}</span>
    </div>
  );
}

function HealthDot({
  health,
  t,
}: {
  health?: "ok" | "degraded" | "down";
  t: (key: TKey) => string;
}) {
  if (!health) return <span className="text-[11px] text-tx-3">—</span>;
  const colors = { ok: "text-ok", degraded: "text-warn", down: "text-err" };
  const labels: Record<string, TKey> = {
    ok: "int_health_ok",
    degraded: "int_health_degraded",
    down: "int_health_down",
  };
  return (
    <span className={`flex items-center gap-1 font-mono text-[11px] ${colors[health]}`}>
      <Circle size={6} className="fill-current" />
      {t(labels[health] as TKey)}
    </span>
  );
}

// ── Sub-component: Swap tab ────────────────────────────────────────────────

const SWAP_CAPS: CapabilityId[] = [
  "transcripts.read",
  "transcripts.search",
  "meeting.read",
  "meeting.process",
];

const SWAP_FEATURES = [
  { name: "Préparation de réunion", key: "feat-meeting-prep" },
  { name: "Capture de connaissances", key: "feat-knowledge-capture" },
];

const SWAP_ACCEPTANCE_TESTS = [
  "Transcription de réunion accessible",
  "Recherche dans les transcriptions",
  "Brief de réunion généré",
  "Connaissances capturées",
  "Pipeline meeting-prep opérationnel",
  "Pipeline knowledge-capture opérationnel",
  "Doctor reflète le nouveau provider",
];

function SwapTab({
  t,
  swapped,
  onSwap,
}: {
  t: (key: TKey) => string;
  swapped: boolean;
  onSwap: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ArrowRightLeft size={14} className="text-or" />
        <h2 className="text-[13px] font-semibold text-tx-1">{t("swap_title")}</h2>
        <Badge variant="laiton">{t("bld_mock_badge")}</Badge>
      </div>

      {/* Source → Target */}
      <div className="flex items-stretch gap-3">
        <div className="flex flex-1 flex-col gap-1 rounded-card border border-line bg-bg-1 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-tx-3">
            {t("swap_from")}
          </span>
          <span className="font-mono text-[14px] font-semibold text-tx-1">Fireflies.ai</span>
          <span className="font-mono text-[11px] text-tx-3">transcripts · api_key</span>
          {swapped && <Badge variant="err" className="self-start text-[10px] mt-1">Remplacé</Badge>}
        </div>
        <div className="flex items-center">
          <ArrowRightLeft size={16} className="text-or" aria-hidden="true" />
        </div>
        <div className="flex flex-1 flex-col gap-1 rounded-card border border-ok/40 bg-ok/5 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-tx-3">
            {t("swap_to")}
          </span>
          <span className="font-mono text-[14px] font-semibold text-tx-1">Google Meet</span>
          <span className="font-mono text-[11px] text-tx-3">transcripts · oauth</span>
          {swapped && <Badge variant="ok" className="self-start text-[10px] mt-1">Actif</Badge>}
        </div>
      </div>

      {/* Capability compatibility */}
      <section>
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-tx-3">
          {t("swap_compatibility")}
        </h3>
        <div className="overflow-hidden rounded-card border border-line">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-bg-0">
                <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-tx-3">
                  {t("swap_cap_col")}
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-tx-3">
                  {t("swap_result_col")}
                </th>
              </tr>
            </thead>
            <tbody>
              {SWAP_CAPS.map((cap, i) => (
                <tr
                  key={cap}
                  className={`border-b border-line/40 last:border-0 ${i % 2 === 0 ? "bg-bg-1" : "bg-bg-0"}`}
                >
                  <td className="px-3 py-1.5 font-mono text-[11px] text-tx-2">{cap}</td>
                  <td className="px-3 py-1.5">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ok">
                      <CheckCircle2 size={11} aria-hidden="true" />
                      {t("swap_pass")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Features affected */}
      <section>
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-tx-3">
          {t("swap_features_affected")}
        </h3>
        <div className="flex flex-col gap-2">
          {SWAP_FEATURES.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between rounded-card border border-line bg-bg-1 px-4 py-2.5"
            >
              <span className="text-[13px] font-medium text-tx-1">{f.name}</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ok">
                <CheckCircle2 size={11} aria-hidden="true" />
                {t("swap_pass")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Acceptance tests */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-tx-3">
            {t("swap_acceptance")}
          </h3>
          <Badge variant="ok" className="text-[10px]">
            {t("swap_acceptance_count")
              .replace("{n}", String(SWAP_ACCEPTANCE_TESTS.length))
              .replace("{total}", String(SWAP_ACCEPTANCE_TESTS.length))}
          </Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          {SWAP_ACCEPTANCE_TESTS.map((test, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-ctl border border-line/60 bg-bg-1 px-3 py-2"
            >
              <CheckCircle2 size={13} className="shrink-0 text-ok" aria-hidden="true" />
              <span className="text-[12px] text-tx-1">{test}</span>
              <Badge variant="ok" className="ml-auto text-[10px]">{t("swap_pass")}</Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Switch button */}
      {!swapped ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={onSwap}
            className="flex items-center justify-center gap-2 rounded-card border border-or/40 bg-or/10 px-6 py-3 text-[13px] font-semibold text-or transition-colors hover:bg-or/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            <ArrowRightLeft size={14} />
            {t("swap_switch_btn")}
          </button>
          <p className="text-center font-mono text-[10px] text-tx-3">{t("swap_simulation_note")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-card border border-ok/30 bg-ok/10 px-4 py-2.5">
            <CheckCircle2 size={14} className="text-ok" />
            <span className="font-mono text-[12px] font-semibold text-ok">{t("swap_switched")}</span>
          </div>
          <p className="font-mono text-[10px] text-tx-3">{t("swap_doctor_note")}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Integrations() {
  const t = useT();
  const { lang } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>("providers");
  const [swapped, setSwapped] = useState(false);

  const { providers, integrations, activeWorkspaceId, disabledIntegrationIds, toggleIntegration, swapProvider } =
    useAppStore();
  const { role } = useUIStore();

  const featureStatus = useFeatureStatus();

  const handleSwap = async () => {
    const actorId = `act-${role.toLowerCase()}`;
    await swapProvider("int-transcripts", "prv-google-meet", actorId);
    setSwapped(true);
  };

  const wsIntegrations = useMemo(
    () => integrations.filter((i) => i.workspaceId === activeWorkspaceId),
    [integrations, activeWorkspaceId],
  );

  const providerMap = useMemo(() => {
    const m = new Map<string, Provider>();
    providers.forEach((p) => m.set(p.id, p));
    return m;
  }, [providers]);

  const intProviderMap = useMemo(() => {
    const m = new Map<string, Provider>();
    wsIntegrations.forEach((i) => {
      const p = providerMap.get(i.providerId);
      if (p) m.set(i.id, p);
    });
    return m;
  }, [wsIntegrations, providerMap]);

  const coreOk = useMemo(
    () =>
      wsIntegrations
        .filter((i) => !disabledIntegrationIds.includes(i.id))
        .every((i) => intProviderMap.get(i.id)?.health !== "down"),
    [wsIntegrations, disabledIntegrationIds, intProviderMap],
  );

  const stateOk = useMemo(
    () =>
      disabledIntegrationIds.length === 0 &&
      wsIntegrations.every((i) => intProviderMap.get(i.id)?.health === "ok"),
    [wsIntegrations, disabledIntegrationIds, intProviderMap],
  );

  const capRows: CapRow[] = useMemo(() => {
    return ALL_CAPABILITIES.map((cap) => {
      const integ = wsIntegrations.find((i) =>
        intProviderMap.get(i.id)?.capabilities.includes(cap),
      );
      const prv = integ ? intProviderMap.get(integ.id) : undefined;
      const isDisabled = integ ? disabledIntegrationIds.includes(integ.id) : false;
      return { cap, integ, prv, isDisabled };
    });
  }, [wsIntegrations, intProviderMap, disabledIntegrationIds]);

  // Build ordered list of (category, integration, provider) for the providers tab
  const providerCards = useMemo(() => {
    return CATEGORY_ORDER.flatMap((cat) => {
      const integ = wsIntegrations.find((i) => i.category === cat);
      if (!integ) return [];
      const prv = intProviderMap.get(integ.id);
      if (!prv) return [];
      return [{ cat, integ, prv }];
    });
  }, [wsIntegrations, intProviderMap]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Plug size={16} className="text-tx-3" />
        <h1 className="text-sm font-semibold">{t("nav_integrations")}</h1>
        <Badge variant="laiton" className="ml-1">
          {t("int_state_mock")}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-0 border-b border-line">
        {(["providers", "doctor", "swap"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            className={`px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or ${
              activeTab === tab
                ? "-mb-px border-b-2 border-or text-tx-1"
                : "text-tx-3 hover:text-tx-2"
            }`}
          >
            {tab === "providers"
              ? t("int_tab_providers")
              : tab === "doctor"
              ? t("int_tab_doctor")
              : t("swap_tab")}
          </button>
        ))}
        {/* Doctor badge: warn if any integration disabled */}
        {activeTab === "providers" && disabledIntegrationIds.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5 pb-1">
            <Activity size={11} className="text-warn" />
            <span className="font-mono text-[10px] text-warn">
              {disabledIntegrationIds.length}{" "}
              {t(
                disabledIntegrationIds.length === 1
                  ? "int_badge_disabled_one"
                  : "int_badge_disabled_many",
              )}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "providers" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providerCards.map(({ cat, integ, prv }) => (
              <ProviderCard
                key={integ.id}
                t={t}
                category={cat}
                provider={prv}
                integrationId={integ.id}
                isDisabled={disabledIntegrationIds.includes(integ.id)}
                onToggle={toggleIntegration}
              />
            ))}
          </div>
        ) : activeTab === "doctor" ? (
          <DoctorTab
            t={t}
            lang={lang}
            coreOk={coreOk}
            stateOk={stateOk}
            capRows={capRows}
            featureStatus={featureStatus}
          />
        ) : (
          <SwapTab t={t} swapped={swapped} onSwap={handleSwap} />
        )}
      </div>
    </div>
  );
}

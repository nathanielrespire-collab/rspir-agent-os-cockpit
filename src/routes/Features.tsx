import { useMemo, useState } from "react";
import { Layers, CheckCircle2, XCircle, X } from "lucide-react";
import { useT, useFeatureStatus, type FeatureStatus } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import type { CapabilityId, Provider } from "@/lib/types";

const ACTOR_MAP: Record<string, string> = {
  Nathaniel: "act-nathaniel",
  Manny: "act-manny",
  Antoine: "act-antoine",
  Agent: "act-aria",
};

// ── Feature detail dialog ──────────────────────────────────────────────────

interface FeatureDetailProps {
  status: FeatureStatus;
  onClose: () => void;
}

function FeatureDetail({ status, onClose }: FeatureDetailProps) {
  const t = useT();
  const { lang, role } = useUIStore();
  const { providers, integrations, clients, activeWorkspaceId, disabledIntegrationIds, toggleFeature } =
    useAppStore();

  const actorId = ACTOR_MAP[role] ?? "act-nathaniel";
  const { feature, missingCaps } = status;
  const ready = missingCaps.length === 0;

  const providerMap = useMemo(
    () => new Map(providers.map((p) => [p.id, p])),
    [providers],
  );

  const wsIntegrations = useMemo(
    () => integrations.filter((i) => i.workspaceId === activeWorkspaceId),
    [integrations, activeWorkspaceId],
  );

  // For each required cap, find the covering provider (non-disabled integrations only)
  const capProviders = useMemo(() => {
    const map = new Map<CapabilityId, Provider | undefined>();
    feature.requires.forEach((cap) => {
      const integ = wsIntegrations.find(
        (i) =>
          !disabledIntegrationIds.includes(i.id) &&
          (providerMap.get(i.providerId)?.capabilities ?? []).includes(cap),
      );
      map.set(cap, integ ? providerMap.get(integ.providerId) : undefined);
    });
    return map;
  }, [feature.requires, wsIntegrations, providerMap, disabledIntegrationIds]);

  const wsClients = useMemo(
    () => clients.filter((c) => c.workspaceId === activeWorkspaceId),
    [clients, activeWorkspaceId],
  );

  return (
    <div className="flex max-h-[80vh] flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-tx-1">{feature.name[lang]}</span>
            <span className="font-mono text-[11px] text-tx-3">v{feature.version}</span>
            <Badge
              variant={
                feature.acceptanceStatus === "pass"
                  ? "ok"
                  : feature.acceptanceStatus === "pending"
                    ? "warn"
                    : "err"
              }
              className="text-[9px]"
            >
              {t("int_acceptance_label")}: {feature.acceptanceStatus}
            </Badge>
          </div>
          <span className="text-[12px] text-tx-3">{feature.description[lang]}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ready ? (
            <Badge variant="ok">{t("int_feature_ready")}</Badge>
          ) : (
            <Badge variant="err">{t("int_feature_missing")}</Badge>
          )}
          <button
            onClick={onClose}
            aria-label={t("home_close")}
            className="rounded-ctl p-1 text-tx-3 transition-colors hover:text-tx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-col gap-5 overflow-y-auto p-5">
        {/* Capabilities */}
        <section>
          <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-tx-3">
            {t("int_requires_label")}
          </h3>
          <div className="flex flex-col gap-1.5">
            {feature.requires.map((cap) => {
              const prv = capProviders.get(cap);
              const isMissing = missingCaps.includes(cap);
              return (
                <div
                  key={cap}
                  className="flex items-center justify-between gap-3 rounded-ctl border border-line/50 bg-bg-0 px-3 py-2"
                >
                  <span
                    className={`font-mono text-[11px] ${isMissing ? "text-err" : "text-tx-2"}`}
                  >
                    {cap}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {prv ? (
                      <>
                        <span className="text-[10px] text-tx-3">{t("feat_covered_by")}</span>
                        <span className="font-mono text-[11px] text-tx-2">{prv.name}</span>
                        <Badge variant="ok" className="text-[9px]">
                          {t("int_feature_ready")}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="err" className="text-[9px]">
                        {t("int_feature_missing")}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Produces */}
        {feature.produces.length > 0 && (
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-tx-3">
              {t("feat_produces_label")}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {feature.produces.map((p, i) => (
                <span
                  key={i}
                  className="rounded-ctl bg-bg-2 px-2 py-0.5 font-mono text-[11px] text-tx-2"
                >
                  {p}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Clients */}
        <section>
          <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-tx-3">
            {t("feat_clients_section")}
          </h3>
          {wsClients.length === 0 ? (
            <span className="font-mono text-[11px] text-tx-3">{t("feat_no_features")}</span>
          ) : (
            <div className="flex flex-col gap-1.5">
              {wsClients.map((client) => {
                const enabled = client.enabledFeatureIds.includes(feature.id);
                return (
                  <div
                    key={client.id}
                    className={`flex items-center justify-between gap-3 rounded-ctl border px-3 py-2 transition-colors ${
                      enabled ? "border-laiton/25 bg-laiton/5" : "border-line bg-bg-1"
                    }`}
                  >
                    <span className="text-[12px] text-tx-2">{client.name}</span>
                    <div className="flex items-center gap-2">
                      {enabled && (
                        <span className="font-mono text-[10px] text-tx-3/60">
                          {t("cli_feature_policy_note")}
                        </span>
                      )}
                      <button
                        onClick={() => void toggleFeature(client.id, feature.id, !enabled, actorId)}
                        aria-pressed={enabled}
                        aria-label={`${client.name}: ${enabled ? t("cli_feature_enabled") : t("cli_feature_disabled")}`}
                        className={`flex items-center gap-1.5 rounded-ctl border px-2.5 py-1 font-mono text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or ${
                          enabled
                            ? "border-laiton/30 text-laiton hover:border-err/30 hover:text-err"
                            : "border-line text-tx-3 hover:border-laiton/30 hover:text-laiton"
                        }`}
                      >
                        {enabled ? (
                          <CheckCircle2 size={10} aria-hidden />
                        ) : (
                          <XCircle size={10} aria-hidden />
                        )}
                        {enabled ? t("cli_feature_enabled") : t("cli_feature_disabled")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-2 font-mono text-[10px] text-tx-3/60">{t("feat_toggle_policy")}</p>
        </section>
      </div>
    </div>
  );
}

// ── Main catalogue ─────────────────────────────────────────────────────────

export default function Features() {
  const t = useT();
  const { lang } = useUIStore();
  const { clients, activeWorkspaceId } = useAppStore();
  const featureStatus = useFeatureStatus();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const wsClients = useMemo(
    () => clients.filter((c) => c.workspaceId === activeWorkspaceId),
    [clients, activeWorkspaceId],
  );

  const selectedStatus = featureStatus.find((fs) => fs.feature.id === selectedFeatureId) ?? null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Layers size={16} className="text-tx-3" />
        <h1 className="text-sm font-semibold">{t("nav_features")}</h1>
        <Badge variant="laiton" className="ml-1">
          {t("int_state_mock")}
        </Badge>
      </div>

      {/* Catalogue */}
      <div className="flex-1 overflow-y-auto">
        {featureStatus.length === 0 ? (
          <p className="font-mono text-[12px] text-tx-3">{t("feat_no_features")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {featureStatus.map(({ feature, missingCaps }) => {
              const ready = missingCaps.length === 0;
              const enabledCount = wsClients.filter((c) =>
                c.enabledFeatureIds.includes(feature.id),
              ).length;

              return (
                <button
                  key={feature.id}
                  onClick={() => setSelectedFeatureId(feature.id)}
                  className="flex w-full items-start justify-between gap-4 rounded-card border border-line bg-bg-1 px-4 py-3 text-left transition-colors hover:bg-bg-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
                >
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-tx-1">
                        {feature.name[lang]}
                      </span>
                      <span className="font-mono text-[11px] text-tx-3">v{feature.version}</span>
                      <Badge
                        variant={
                          feature.acceptanceStatus === "pass"
                            ? "ok"
                            : feature.acceptanceStatus === "pending"
                              ? "warn"
                              : "err"
                        }
                        className="text-[9px]"
                      >
                        {t("int_acceptance_label")}: {feature.acceptanceStatus}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-tx-3">{feature.description[lang]}</span>
                    {/* Required capabilities with READY/MISSING coloring */}
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {feature.requires.map((cap) => (
                        <span
                          key={cap}
                          className={`rounded-ctl px-1.5 py-0.5 font-mono text-[10px] ${
                            missingCaps.includes(cap)
                              ? "bg-err/15 text-err"
                              : "bg-bg-2 text-tx-3"
                          }`}
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right column: READY/MISSING + client count */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {ready ? (
                      <Badge variant="ok">{t("int_feature_ready")}</Badge>
                    ) : (
                      <Badge variant="err">{t("int_feature_missing")}</Badge>
                    )}
                    <span className="font-mono text-[10px] text-tx-3">
                      {enabledCount}/{wsClients.length} {t("feat_clients_active")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature detail dialog */}
      <Dialog
        open={!!selectedFeatureId}
        onClose={() => setSelectedFeatureId(null)}
        className="max-w-xl"
      >
        {selectedStatus && (
          <FeatureDetail status={selectedStatus} onClose={() => setSelectedFeatureId(null)} />
        )}
      </Dialog>
    </div>
  );
}

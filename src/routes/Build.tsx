import { Code2 } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { AgentRole } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

// ─── Pipeline stage ───────────────────────────────────────────────────────────

const PIPELINE_STAGES = ["spec", "build", "test", "verify", "review", "deploy"] as const;
type PipelinePhase = (typeof PIPELINE_STAGES)[number];

const PHASE_KEYS: Record<PipelinePhase, TKey> = {
  spec: "bz_pipeline_spec",
  build: "bz_pipeline_build",
  test: "bz_pipeline_test",
  verify: "bz_pipeline_verify",
  review: "bz_pipeline_review",
  deploy: "bz_pipeline_deploy",
};

function PipelineBar({
  completedPhases,
  currentPhase,
}: {
  completedPhases: PipelinePhase[];
  currentPhase: PipelinePhase | undefined;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-0 rounded-card border border-line overflow-hidden">
      {PIPELINE_STAGES.map((phase, i) => {
        const done = completedPhases.includes(phase);
        const current = phase === currentPhase;
        return (
          <div
            key={phase}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-center",
              i > 0 && "border-l border-line",
              done && "bg-ok/10",
              current && !done && "bg-or/10",
              !done && !current && "bg-bg-1/50",
            )}
          >
            <span
              className={cn(
                "font-mono text-[10px] font-semibold uppercase tracking-wide",
                done ? "text-ok" : current ? "text-or" : "text-tx-3",
              )}
            >
              {t(PHASE_KEYS[phase])}
            </span>
            {current && (
              <span className="font-mono text-[9px] text-or">
                {t("bz_pipeline_current" as TKey)}
              </span>
            )}
            {done && <span className="font-mono text-[9px] text-ok">✓</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Agent role label ─────────────────────────────────────────────────────────

const ROLE_LABEL_KEYS: Record<AgentRole, TKey> = {
  architect: "bz_agent_role_architect",
  code_builder: "bz_agent_role_code_builder",
  ops_worker: "bz_agent_role_ops_worker",
  researcher: "bz_agent_role_researcher",
  reviewer: "bz_agent_role_reviewer",
  security_reviewer: "bz_agent_role_reviewer",
  website_builder: "bz_agent_role_code_builder",
  automation_builder: "bz_agent_role_automation_builder",
};

// ─── Health badge ─────────────────────────────────────────────────────────────

function HealthBadge({ health }: { health: "ok" | "degraded" | "down" | undefined }) {
  const t = useT();
  if (!health) return null;
  const variant = health === "ok" ? "ok" : health === "degraded" ? "warn" : "err";
  const label =
    health === "ok"
      ? t("bz_health_ok" as TKey)
      : health === "degraded"
        ? t("bz_health_degraded" as TKey)
        : t("bz_health_down" as TKey);
  return (
    <Badge variant={variant} className="font-mono text-[10px]">
      {label}
    </Badge>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Build() {
  const t = useT();
  const { build, actors, providers, features } = useAppStore();

  const aiAgents = actors.filter((a) => a.type === "ai_agent");
  const wsProviders = providers;
  const featuresInDev = features.filter(
    (f) => f.acceptanceStatus === "pending" || f.acceptanceStatus === "fail",
  );

  // Derive current pipeline phase: last in completed list
  const completedPhases = build.pipeline as PipelinePhase[];
  const lastCompleted = completedPhases[completedPhases.length - 1];
  const lastIdx = PIPELINE_STAGES.indexOf(lastCompleted as PipelinePhase);
  const currentPhase =
    lastIdx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[lastIdx + 1] : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-tx-3" />
          <h1 className="text-sm font-semibold">{t("bz_page_title" as TKey)}</h1>
        </div>
        <Badge variant="laiton" className="font-mono text-[10px]">
          {t("bz_mock_badge" as TKey)}
        </Badge>
      </div>

      {/* ── Version + Units ───────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
          <p className="text-[11px] text-tx-3">{t("bz_version_label" as TKey)}</p>
          <p className="font-mono text-xl font-semibold text-tx-1">{build.version}</p>
        </div>
        <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
          <p className="text-[11px] text-tx-3">{t("bz_units_label" as TKey)}</p>
          <p className="font-mono text-xl font-semibold text-laiton">
            {t("bz_units_done" as TKey)
              .replace("{done}", String(build.unitsDone))
              .replace("{total}", String(build.unitsTotal))}
          </p>
        </div>
        <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
          <p className="text-[11px] text-tx-3">{t("bz_ci_label" as TKey)}</p>
          <p className="font-mono text-sm font-medium text-ok">{t("bz_ci_value" as TKey)}</p>
        </div>
      </div>

      {/* ── Pipeline ─────────────────────────────────────────────────────────── */}
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-tx-3">
        {t("bz_pipeline_label" as TKey)}
      </p>
      <PipelineBar completedPhases={completedPhases} currentPhase={currentPhase} />

      {/* ── Builders ─────────────────────────────────────────────────────────── */}
      <p className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-tx-3">
        {t("bz_builders_label" as TKey)}
      </p>
      <div className="rounded-card border border-line overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-bg-1/80">
              <th className="px-3 py-2 text-left text-[11px] font-medium text-tx-3">
                {t("bz_role_label" as TKey)}
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-tx-3">Nom</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-tx-3">
                {t("bz_provider_label" as TKey)}
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-tx-3">
                {t("bz_acceptance_label" as TKey)}
              </th>
            </tr>
          </thead>
          <tbody>
            {aiAgents.map((agent) => {
              const provider = wsProviders.find((p) => p.id === agent.providerId);
              const roleKey =
                ROLE_LABEL_KEYS[agent.role as AgentRole] ?? ("bz_agent_role_code_builder" as TKey);
              return (
                <tr
                  key={agent.id}
                  className="border-b border-line/60 last:border-0 hover:bg-bg-1/30"
                >
                  <td className="px-3 py-2 text-[11px] text-tx-3">{t(roleKey)}</td>
                  <td className="px-3 py-2 font-medium text-tx-1">{agent.name}</td>
                  <td className="px-3 py-2 font-mono text-[12px] text-laiton">
                    {provider?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <HealthBadge health={agent.health} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── System health ─────────────────────────────────────────────────────── */}
      <p className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-tx-3">
        {t("bz_health_label" as TKey)}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {wsProviders.slice(0, 8).map((prov) => (
          <div
            key={prov.id}
            className="flex items-center justify-between gap-2 rounded-ctl border border-line bg-bg-1 px-3 py-2"
          >
            <span className="text-[12px] font-medium text-tx-2 truncate">{prov.name}</span>
            <HealthBadge health={prov.health} />
          </div>
        ))}
      </div>

      {/* ── Features in development ───────────────────────────────────────────── */}
      <p className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-tx-3">
        {t("bz_features_dev_label" as TKey)}
      </p>
      {featuresInDev.length === 0 ? (
        <p className="text-[13px] text-tx-3">{t("bz_no_features_dev" as TKey)}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {featuresInDev.map((feat) => (
            <div
              key={feat.id}
              className="flex items-center justify-between gap-3 rounded-ctl border border-line bg-bg-1 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-tx-1 truncate">{feat.name.fr}</p>
                <p className="font-mono text-[11px] text-tx-3">
                  {feat.key} · v{feat.version}
                </p>
              </div>
              <Badge
                variant={feat.acceptanceStatus === "pending" ? "warn" : "err"}
                className="font-mono text-[10px] shrink-0"
              >
                {feat.acceptanceStatus.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

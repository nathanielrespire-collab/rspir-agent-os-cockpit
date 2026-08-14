import { useState } from "react";
import {
  Wrench,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Building2,
  Users,
  Plug,
  Zap,
  Shield,
  Layers,
  Bot,
  Lock,
  FlaskConical,
  Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import type { Lang, TKey } from "@/lib/i18n";

// ─── Pre-filled Microsoft configuration data ──────────────────────────────

const MS_COMPANY = {
  name: "Microsoft Canada",
  sector: "Technologie",
  contact: "deploy@microsoft.ca",
};

const MS_TEAM_HUMANS = [
  { name: "Nathaniel", role: "owner" },
  { name: "Manny", role: "ops" },
  { name: "Antoine", role: "reviewer" },
];

const MS_TEAM_AGENTS = [
  { name: "Aria", role: "architect", provider: "Claude Opus" },
  { name: "Bâtisseur", role: "code_builder", provider: "Claude Code" },
  { name: "Orbite", role: "ops_worker", provider: "Claude Haiku" },
  { name: "Clio", role: "researcher", provider: "Claude Opus" },
  { name: "Revue", role: "reviewer", provider: "Claude Opus" },
  { name: "Méca", role: "automation_builder", provider: "Power Automate" },
];

const MS_PROVIDERS = [
  { name: "Outlook", category: "email" },
  { name: "M365 Calendar", category: "calendar" },
  { name: "OneDrive", category: "files" },
  { name: "M365 Contacts", category: "contacts" },
  { name: "Microsoft Teams", category: "transcripts" },
  { name: "HubSpot", category: "crm" },
  { name: "Power Automate", category: "automation" },
  { name: "SharePoint", category: "website" },
  { name: "SharePoint Notes", category: "knowledge" },
  { name: "GitHub", category: "source_control" },
  { name: "Claude Code", category: "worker_code" },
  { name: "Claude Haiku", category: "worker_ops" },
  { name: "Claude Opus", category: "reasoning" },
  { name: "Teams Channels", category: "notifications" },
];

const MS_CAPABILITIES = [
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
];

const MS_POLICIES = [
  { capability: "email.send", rule: "approval_required" },
  { capability: "crm.write", rule: "auto" },
  { capability: "crm.create_activity", rule: "auto" },
  { capability: "crm.add_note", rule: "auto" },
  { capability: "spend_money", rule: "human_only" },
  { capability: "contract_commitment", rule: "human_only" },
  { capability: "automation.deploy", rule: "approval_required" },
  { capability: "website.deploy", rule: "approval_required" },
  { capability: "knowledge.publish", rule: "auto" },
];

const MS_FEATURES: {
  name: Record<Lang, string>;
  key: string;
  version: string;
  acceptance: string;
}[] = [
  {
    name: { fr: "Préparation de réunion", en: "Meeting preparation" },
    key: "feat-meeting-prep",
    version: "1.2.0",
    acceptance: "pass",
  },
  {
    name: { fr: "Enrichissement CRM", en: "CRM enrichment" },
    key: "feat-crm-enrich",
    version: "1.0.0",
    acceptance: "pass",
  },
  {
    name: { fr: "Constructeur d'automatisations", en: "Automation builder" },
    key: "feat-auto-builder",
    version: "0.9.0",
    acceptance: "pass",
  },
  {
    name: { fr: "Constructeur de site web", en: "Website builder" },
    key: "feat-website-builder",
    version: "1.1.0",
    acceptance: "pass",
  },
  {
    name: { fr: "Capture de connaissances", en: "Knowledge capture" },
    key: "feat-knowledge-capture",
    version: "1.0.0",
    acceptance: "pass",
  },
  {
    name: { fr: "Rédaction d'emails", en: "Email drafting" },
    key: "feat-email-drafter",
    version: "0.5.0",
    acceptance: "pending",
  },
];

const MS_PERMISSIONS = [
  { actor: "Aria", caps: ["worker.research", "worker.review"] },
  { actor: "Bâtisseur", caps: ["worker.code", "source_control.change_request"] },
  { actor: "Orbite", caps: ["crm.write", "crm.create_activity", "crm.add_note", "worker.ops"] },
  { actor: "Clio", caps: ["transcripts.read", "crm.read", "knowledge.publish"] },
  { actor: "Revue", caps: ["worker.review", "source_control.status"] },
  { actor: "Méca", caps: ["automation.build", "automation.deploy", "automation.run"] },
  { actor: "Nathaniel", caps: ["email.send", "spend_money", "contract_commitment"] },
  { actor: "Manny", caps: ["crm.write", "automation.deploy", "website.deploy"] },
  { actor: "Antoine", caps: ["knowledge.publish", "website.deploy"] },
];

const MS_ACCEPTANCE_TESTS: { label: Record<Lang, string>; status: string }[] = [
  {
    label: { fr: "Email sortant → approbation requise", en: "Outbound email → approval required" },
    status: "pass",
  },
  {
    label: { fr: "CRM enrichi en automatique", en: "CRM enriched automatically" },
    status: "pass",
  },
  {
    label: { fr: "Brief de réunion Teams généré", en: "Teams meeting brief generated" },
    status: "pass",
  },
  {
    label: { fr: "Automatisation déployée sur approbation", en: "Automation deployed on approval" },
    status: "pass",
  },
  {
    label: { fr: "Site SharePoint mis à jour", en: "SharePoint site updated" },
    status: "pass",
  },
  {
    label: {
      fr: "Connaissances capturées → SharePoint Notes",
      en: "Knowledge captured → SharePoint Notes",
    },
    status: "pass",
  },
  {
    label: {
      fr: "Isolation ws-rspir / ws-ms confirmée",
      en: "ws-rspir / ws-ms isolation confirmed",
    },
    status: "pass",
  },
];

const MS_MISSING_CREDS = [
  "Outlook OAuth",
  "M365 Calendar OAuth",
  "OneDrive OAuth",
  "M365 Contacts OAuth",
  "Microsoft Teams OAuth",
  "HubSpot API Key",
  "Power Automate OAuth",
  "SharePoint OAuth",
  "SharePoint Notes OAuth",
  "GitHub OAuth",
  "Claude Code API Key",
  "Claude Haiku API Key",
  "Claude Opus API Key",
  "Teams Channels OAuth",
];

// ─── Step icons ───────────────────────────────────────────────────────────

const STEP_ICONS = [Building2, Users, Plug, Zap, Shield, Layers, Bot, Lock, FlaskConical, Rocket];

const STEP_TITLE_KEYS: TKey[] = [
  "bld_step1_title",
  "bld_step2_title",
  "bld_step3_title",
  "bld_step4_title",
  "bld_step5_title",
  "bld_step6_title",
  "bld_step7_title",
  "bld_step8_title",
  "bld_step9_title",
  "bld_step10_title",
];

// ─── Step content components ─────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-tx-3">
      {label}
    </span>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line/40 py-2 last:border-0">
      <span className="w-36 shrink-0 text-[12px] text-tx-3">{label}</span>
      <span className="font-mono text-[13px] text-tx-1">{value}</span>
    </div>
  );
}

function StepCompany({ t }: { t: (key: TKey) => string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
        <FieldRow label={t("bld_company_name")} value={MS_COMPANY.name} />
        <FieldRow label={t("bld_company_sector")} value={MS_COMPANY.sector} />
        <FieldRow label={t("bld_company_contact")} value={MS_COMPANY.contact} />
      </div>
      <Badge variant="laiton" className="self-start">
        {t("bld_prefilled_badge")}
      </Badge>
    </div>
  );
}

function StepTeam({ t }: { t: (key: TKey) => string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <SectionLabel label={`${t("bld_team_humans")} (${MS_TEAM_HUMANS.length})`} />
        <div className="flex flex-col gap-1">
          {MS_TEAM_HUMANS.map((h) => (
            <div
              key={h.name}
              className="flex items-center justify-between rounded-ctl border border-line/60 bg-bg-1 px-3 py-2"
            >
              <span className="text-[13px] font-medium text-tx-1">{h.name}</span>
              <span className="font-mono text-[11px] text-tx-3">{h.role}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel label={`${t("bld_team_agents")} (${MS_TEAM_AGENTS.length})`} />
        <div className="flex flex-col gap-1">
          {MS_TEAM_AGENTS.map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between rounded-ctl border border-line/60 bg-bg-1 px-3 py-2"
            >
              <span className="text-[13px] font-medium text-tx-1">{a.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-tx-3">{a.role}</span>
                <Badge variant="laiton" className="text-[10px]">
                  {a.provider}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepProviders({ t }: { t: (key: TKey) => string }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel label={`${t("bld_providers_selected")} (${MS_PROVIDERS.length})`} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MS_PROVIDERS.map((p) => (
          <div
            key={p.name}
            className="flex flex-col gap-0.5 rounded-card border border-line bg-bg-1 px-3 py-2"
          >
            <span className="text-[13px] font-medium text-tx-1">{p.name}</span>
            <span className="font-mono text-[10px] text-tx-3">{p.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCapabilities({ t }: { t: (key: TKey) => string }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel label={`${t("bld_capabilities_covered")} (${MS_CAPABILITIES.length})`} />
      <div className="flex flex-wrap gap-1.5">
        {MS_CAPABILITIES.map((cap) => (
          <span
            key={cap}
            className="rounded-ctl bg-laiton/10 px-2 py-0.5 font-mono text-[11px] text-laiton"
          >
            {cap}
          </span>
        ))}
      </div>
    </div>
  );
}

function StepPolicies({ t }: { t: (key: TKey) => string }) {
  const ruleVariant: Record<string, "ok" | "warn" | "err" | "laiton" | "or"> = {
    auto: "laiton",
    approval_required: "warn",
    human_only: "or",
    forbidden: "err",
  };
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel label={`${t("bld_policies_configured")} (${MS_POLICIES.length})`} />
      <div className="overflow-hidden rounded-card border border-line">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line bg-bg-0">
              <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-tx-3">
                {t("bld_cap_label")}
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-tx-3">
                {t("bld_rule_label")}
              </th>
            </tr>
          </thead>
          <tbody>
            {MS_POLICIES.map((p, i) => (
              <tr
                key={p.capability}
                className={`border-b border-line/40 last:border-0 ${i % 2 === 0 ? "bg-bg-1" : "bg-bg-0"}`}
              >
                <td className="px-3 py-1.5 font-mono text-[11px] text-tx-2">{p.capability}</td>
                <td className="px-3 py-1.5">
                  <Badge variant={ruleVariant[p.rule] ?? "default"}>{p.rule}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepFeatures({ t, lang }: { t: (key: TKey) => string; lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel label={`${t("bld_features_enabled")} (${MS_FEATURES.length})`} />
      <div className="flex flex-col gap-2">
        {MS_FEATURES.map((f) => (
          <div
            key={f.key}
            className="flex items-center justify-between rounded-card border border-line bg-bg-1 px-4 py-2.5"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-tx-1">{f.name[lang]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-tx-3">v{f.version}</span>
              <Badge variant={f.acceptance === "pass" ? "ok" : "warn"}>{f.acceptance}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepAgents({ t }: { t: (key: TKey) => string }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel label={`${t("bld_agents_configured")} (${MS_TEAM_AGENTS.length})`} />
      <div className="flex flex-col gap-2">
        {MS_TEAM_AGENTS.map((a) => (
          <div
            key={a.name}
            className="flex items-center justify-between rounded-card border border-line bg-bg-1 px-4 py-2.5"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-tx-1">{a.name}</span>
              <span className="font-mono text-[11px] text-tx-3">{a.role}</span>
            </div>
            <Badge variant="laiton">{a.provider}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepPermissions({ t }: { t: (key: TKey) => string }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel label={t("bld_permissions_matrix")} />
      <div className="flex flex-col gap-2">
        {MS_PERMISSIONS.map((p) => (
          <div key={p.actor} className="rounded-card border border-line bg-bg-1 px-4 py-2.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[13px] font-semibold text-tx-1">{p.actor}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {p.caps.map((cap) => (
                <span
                  key={cap}
                  className="rounded-ctl bg-bg-2 px-1.5 py-0.5 font-mono text-[10px] text-tx-3"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepAcceptance({ t, lang }: { t: (key: TKey) => string; lang: Lang }) {
  const passCount = MS_ACCEPTANCE_TESTS.filter((test) => test.status === "pass").length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <SectionLabel label={t("bld_acceptance_tests")} />
        <Badge variant="ok" className="self-start text-[11px]">
          {passCount}/{MS_ACCEPTANCE_TESTS.length} PASS
        </Badge>
      </div>
      <div className="flex flex-col gap-1.5">
        {MS_ACCEPTANCE_TESTS.map((test, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-ctl border border-line/60 bg-bg-1 px-3 py-2"
          >
            <CheckCircle2 size={14} className="shrink-0 text-ok" aria-hidden="true" />
            <span className="text-[13px] text-tx-1">{test.label[lang]}</span>
            <Badge variant="ok" className="ml-auto text-[10px]">
              {t("swap_pass")}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDeployment({
  t,
  deploying,
  deployed,
  onDeploy,
  onSwitch,
}: {
  t: (key: TKey) => string;
  deploying: boolean;
  deployed: boolean;
  onDeploy: () => void;
  onSwitch: () => void;
}) {
  const passCount = MS_ACCEPTANCE_TESTS.filter((test) => test.status === "pass").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Plan summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PlanCard label={t("bld_plan_workspace")} value="ws-ms — Microsoft" />
        <PlanCard
          label={t("bld_plan_providers_label")}
          value={t("bld_plan_providers_count").replace("{n}", String(MS_PROVIDERS.length))}
        />
        <PlanCard
          label={t("bld_plan_agents_label")}
          value={t("bld_plan_agents_count").replace("{n}", String(MS_TEAM_AGENTS.length))}
        />
        <PlanCard
          label={t("bld_plan_policies_label")}
          value={t("bld_plan_policies_count").replace("{n}", String(MS_POLICIES.length))}
        />
        <PlanCard
          label={t("bld_plan_features_label")}
          value={t("bld_plan_features_count").replace("{n}", String(MS_FEATURES.length))}
        />
        <PlanCard
          label={t("bld_plan_missing_creds")}
          value={t("bld_plan_creds_count").replace("{n}", String(MS_MISSING_CREDS.length))}
          warn
        />
        <PlanCard
          label={t("bld_plan_acceptance")}
          value={`${passCount}/${MS_ACCEPTANCE_TESTS.length} PASS`}
          ok
        />
        <PlanCard
          label={t("bld_plan_status")}
          value={deployed ? t("bld_deployed") : t("bld_plan_ready")}
          ok={deployed}
        />
      </div>

      {/* Missing credentials list */}
      <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
        <SectionLabel label={t("bld_plan_missing_creds")} />
        <div className="flex flex-wrap gap-1.5">
          {MS_MISSING_CREDS.map((cred) => (
            <span
              key={cred}
              className="rounded-ctl border border-warn/40 bg-warn/10 px-2 py-0.5 font-mono text-[10px] text-warn"
            >
              {cred}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      {!deployed ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={onDeploy}
            disabled={deploying}
            className="flex items-center justify-center gap-2 rounded-card border border-or/40 bg-or/10 px-6 py-3 text-[13px] font-semibold text-or transition-colors hover:bg-or/20 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            {deploying ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("bld_deploying")}
              </>
            ) : (
              <>
                <Rocket size={14} />
                {t("bld_deploy_btn")}
              </>
            )}
          </button>
          <p className="text-center font-mono text-[10px] text-tx-3">{t("bld_provision_note")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 rounded-card border border-ok/30 bg-ok/10 px-4 py-2.5">
            <CheckCircle2 size={16} className="text-ok" />
            <span className="font-mono text-[13px] font-semibold text-ok">{t("bld_deployed")}</span>
            <Badge variant="laiton">{t("bld_mock_badge")}</Badge>
          </div>
          <button
            onClick={onSwitch}
            className="flex items-center gap-2 rounded-card border border-laiton/40 bg-laiton/10 px-5 py-2 text-[12px] font-medium text-laiton transition-colors hover:bg-laiton/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            <ChevronRight size={13} />
            {t("bld_switch_workspace_btn")}
          </button>
        </div>
      )}
    </div>
  );
}

function PlanCard({
  label,
  value,
  ok,
  warn,
}: {
  label: string;
  value: string;
  ok?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-card border border-line bg-bg-1 px-4 py-3">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-tx-3">
        {label}
      </span>
      <span
        className={`font-mono text-[13px] font-semibold ${
          ok ? "text-ok" : warn ? "text-warn" : "text-tx-1"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function AgentBuilder() {
  const t = useT();
  const { lang } = useUIStore();
  const { setActiveWorkspace } = useAppStore();

  const [step, setStep] = useState<number>(1);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeployed(true);
    }, 1500);
  };

  const handleSwitch = () => {
    setActiveWorkspace("ws-ms");
  };

  const StepIcon = STEP_ICONS[step - 1] ?? Wrench;

  const stepContent = () => {
    switch (step) {
      case 1:
        return <StepCompany t={t} />;
      case 2:
        return <StepTeam t={t} />;
      case 3:
        return <StepProviders t={t} />;
      case 4:
        return <StepCapabilities t={t} />;
      case 5:
        return <StepPolicies t={t} />;
      case 6:
        return <StepFeatures t={t} lang={lang} />;
      case 7:
        return <StepAgents t={t} />;
      case 8:
        return <StepPermissions t={t} />;
      case 9:
        return <StepAcceptance t={t} lang={lang} />;
      case 10:
        return (
          <StepDeployment
            t={t}
            deploying={deploying}
            deployed={deployed}
            onDeploy={handleDeploy}
            onSwitch={handleSwitch}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <Wrench size={16} className="text-tx-3" />
        <h1 className="text-sm font-semibold">{t("nav_agent_builder")}</h1>
        <Badge variant="laiton" className="ml-1">
          {t("bld_mock_badge")}
        </Badge>
        <span className="ml-auto font-mono text-[11px] text-tx-3">
          {t("bld_step_of").replace("{n}", String(step))}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mb-5 flex items-center gap-1"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={10}
      >
        {STEP_TITLE_KEYS.map((_, i) => {
          const n = i + 1;
          const Icon = STEP_ICONS[i] ?? Wrench;
          return (
            <button
              key={n}
              onClick={() => setStep(n)}
              aria-current={n === step ? "step" : undefined}
              title={t(STEP_TITLE_KEYS[i])}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or ${
                n === step
                  ? "border-or bg-or/20 text-or"
                  : n < step
                    ? "border-ok/40 bg-ok/10 text-ok"
                    : "border-line bg-bg-1 text-tx-3"
              }`}
            >
              {n < step ? <CheckCircle2 size={12} /> : <Icon size={12} />}
            </button>
          );
        })}
        <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-bg-2">
          <div
            className="h-full rounded-full bg-or transition-all duration-300"
            style={{ width: `${((step - 1) / 9) * 100}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Step title */}
      <div className="mb-4 flex items-center gap-2">
        <StepIcon size={14} className="text-or" aria-hidden="true" />
        <h2 className="text-[13px] font-semibold text-tx-1">{t(STEP_TITLE_KEYS[step - 1])}</h2>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">{stepContent()}</div>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="rounded-ctl border border-line bg-bg-1 px-4 py-1.5 text-[12px] font-medium text-tx-2 transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
        >
          {t("bld_back")}
        </button>
        <span className="font-mono text-[11px] text-tx-3">{step} / 10</span>
        {step < 10 ? (
          <button
            onClick={() => setStep((s) => Math.min(10, s + 1))}
            className="flex items-center gap-1 rounded-ctl border border-or/40 bg-or/10 px-4 py-1.5 text-[12px] font-medium text-or transition-colors hover:bg-or/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            {t("bld_next")}
            <ChevronRight size={13} />
          </button>
        ) : (
          <button
            onClick={() => setStep(1)}
            className="rounded-ctl border border-line bg-bg-1 px-4 py-1.5 text-[12px] font-medium text-tx-2 transition-colors hover:bg-bg-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            {t("bld_finish")}
          </button>
        )}
      </div>
    </div>
  );
}

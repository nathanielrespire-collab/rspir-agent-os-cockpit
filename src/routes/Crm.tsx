import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Building2, Users, Bot, Phone, Mail, Calendar, FileText } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { Deal, Contact, Company, Actor } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type CrmTab = "pipeline" | "deals" | "contacts" | "companies" | "activities" | "actions";

type CrmActivity = {
  id: string;
  dealId: string;
  type: "call" | "email" | "meeting" | "note";
  summary: string;
  byActorId: string;
  at: string;
};

// ─── Mock activities — SIMULATION ────────────────────────────────────────────

const MOCK_ACTIVITIES: CrmActivity[] = [
  {
    id: "cact-001",
    dealId: "deal-001",
    type: "meeting",
    summary: "Réunion de clôture — validation des livrables du site V2.",
    byActorId: "act-nathaniel",
    at: "2026-04-02T10:00:00Z",
  },
  {
    id: "cact-002",
    dealId: "deal-001",
    type: "call",
    summary: "Appel de suivi post-livraison. Client satisfait.",
    byActorId: "act-manny",
    at: "2026-04-01T14:00:00Z",
  },
  {
    id: "cact-003",
    dealId: "deal-002",
    type: "email",
    summary: "Envoi du rapport de déploiement Make — 3 scénarios actifs.",
    byActorId: "act-clio",
    at: "2026-03-04T11:00:00Z",
  },
  {
    id: "cact-004",
    dealId: "deal-003",
    type: "note",
    summary: "Import CSV terminé. 347 contacts. Taux de complétude: 87%.",
    byActorId: "act-clio",
    at: "2026-02-20T09:00:00Z",
  },
  {
    id: "cact-005",
    dealId: "deal-004",
    type: "email",
    summary: "Envoi de la proposition de formation Webflow.",
    byActorId: "act-clio",
    at: "2026-08-10T14:00:00Z",
  },
  {
    id: "cact-006",
    dealId: "deal-005",
    type: "call",
    summary: "Appel de négociation — confirmation du périmètre de maintenance.",
    byActorId: "act-manny",
    at: "2026-08-05T11:00:00Z",
  },
];

// ─── Constants ───────────────────────────────────────────────────────────────

const STAGES: Deal["stage"][] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];

const STAGE_COLORS: Record<Deal["stage"], string> = {
  lead: "border-line bg-bg-1 text-tx-2",
  qualified: "border-laiton/40 bg-laiton/10 text-laiton",
  proposal: "border-laiton/40 bg-laiton/10 text-laiton",
  negotiation: "border-warn/40 bg-warn/10 text-warn",
  won: "border-ok/40 bg-ok/10 text-ok",
  lost: "border-err/40 bg-err/10 text-err",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCad(n: number) {
  return n.toLocaleString("fr-CA") + " $";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ActivityIcon({ type, className }: { type: CrmActivity["type"]; className?: string }) {
  if (type === "call") return <Phone size={12} className={className} aria-hidden />;
  if (type === "email") return <Mail size={12} className={className} aria-hidden />;
  if (type === "meeting") return <Calendar size={12} className={className} aria-hidden />;
  return <FileText size={12} className={className} aria-hidden />;
}

// ─── Pipeline tab ─────────────────────────────────────────────────────────────

function PipelineTab({ deals, companies }: { deals: Deal[]; companies: Company[] }) {
  const t = useT();

  function stageName(stage: Deal["stage"]) {
    if (stage === "lead") return t("crm_stage_lead");
    if (stage === "qualified") return t("crm_stage_qualified");
    if (stage === "proposal") return t("crm_stage_proposal");
    if (stage === "negotiation") return t("crm_stage_negotiation");
    if (stage === "won") return t("crm_stage_won");
    return t("crm_stage_lost");
  }

  return (
    <div className="overflow-x-auto pb-2" aria-label={t("crm_pipeline_label")}>
      <div className="flex min-w-max gap-3">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          const totalValue = stageDeals.reduce((sum, d) => sum + d.valueCad, 0);
          return (
            <div key={stage} className="flex w-48 flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-tx-3">
                  {stageName(stage)}
                </span>
                <span className="font-mono text-[9px] text-tx-3">{stageDeals.length}</span>
              </div>
              {totalValue > 0 && (
                <span className="font-mono text-[9px] text-laiton">{fmtCad(totalValue)}</span>
              )}
              <div
                className={cn("h-0.5 w-full rounded-full opacity-50", {
                  "bg-tx-3": stage === "lead",
                  "bg-laiton": stage === "qualified" || stage === "proposal",
                  "bg-warn": stage === "negotiation",
                  "bg-ok": stage === "won",
                  "bg-err": stage === "lost",
                })}
              />
              {stageDeals.length === 0 ? (
                <div className="py-3 text-center font-mono text-[10px] text-tx-3">—</div>
              ) : (
                stageDeals.map((deal) => {
                  const company = companies.find((c) => c.id === deal.companyId);
                  return (
                    <Link
                      key={deal.id}
                      to={`/crm/${deal.id}`}
                      className="group rounded-ctl border border-line bg-bg-1 p-2.5 hover:border-laiton/40 hover:bg-laiton/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
                    >
                      <p className="text-[12px] font-medium leading-snug text-tx-1 group-hover:text-or">
                        {deal.title}
                      </p>
                      {company && (
                        <p className="mt-0.5 font-mono text-[10px] text-tx-3">{company.name}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-tx-2">
                          {fmtCad(deal.valueCad)}
                        </span>
                        {deal.lastAgentAction && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-laiton"
                            aria-label={t("crm_agent_action_badge")}
                          />
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Deals tab ────────────────────────────────────────────────────────────────

function DealsTab({ deals, companies }: { deals: Deal[]; companies: Company[] }) {
  const t = useT();

  function stageName(stage: Deal["stage"]) {
    if (stage === "lead") return t("crm_stage_lead");
    if (stage === "qualified") return t("crm_stage_qualified");
    if (stage === "proposal") return t("crm_stage_proposal");
    if (stage === "negotiation") return t("crm_stage_negotiation");
    if (stage === "won") return t("crm_stage_won");
    return t("crm_stage_lost");
  }

  if (deals.length === 0) {
    return <p className="font-mono text-[13px] text-tx-3">{t("crm_no_deals")}</p>;
  }

  return (
    <div className="space-y-1.5">
      {deals.map((deal) => {
        const company = companies.find((c) => c.id === deal.companyId);
        return (
          <Link
            key={deal.id}
            to={`/crm/${deal.id}`}
            className="group flex items-center gap-3 rounded-ctl border border-line bg-bg-1 px-3 py-2 hover:border-laiton/40 hover:bg-laiton/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-tx-1 group-hover:text-or">
                {deal.title}
              </p>
              {company && <p className="font-mono text-[10px] text-tx-3">{company.name}</p>}
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px]",
                STAGE_COLORS[deal.stage],
              )}
            >
              {stageName(deal.stage)}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-tx-2">
              {fmtCad(deal.valueCad)}
            </span>
            {deal.lastAgentAction && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-laiton"
                aria-label={t("crm_agent_action_badge")}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Contacts tab ─────────────────────────────────────────────────────────────

function ContactsTab({ contacts, companies }: { contacts: Contact[]; companies: Company[] }) {
  const t = useT();

  if (contacts.length === 0) {
    return <p className="font-mono text-[13px] text-tx-3">{t("crm_no_contacts")}</p>;
  }

  return (
    <div className="space-y-1.5">
      {contacts.map((contact) => {
        const company = contact.companyId
          ? companies.find((c) => c.id === contact.companyId)
          : undefined;
        return (
          <div
            key={contact.id}
            className="flex items-center gap-3 rounded-ctl border border-line bg-bg-1 px-3 py-2"
          >
            <Users size={12} className="shrink-0 text-tx-3" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-tx-1">{contact.name}</p>
              {contact.role && <p className="font-mono text-[10px] text-tx-3">{contact.role}</p>}
            </div>
            {company && (
              <span className="shrink-0 font-mono text-[10px] text-tx-2">{company.name}</span>
            )}
            {contact.email && (
              <span className="shrink-0 font-mono text-[10px] text-tx-3">{contact.email}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Companies tab ────────────────────────────────────────────────────────────

function CompaniesTab({ companies, deals }: { companies: Company[]; deals: Deal[] }) {
  const t = useT();

  if (companies.length === 0) {
    return <p className="font-mono text-[13px] text-tx-3">{t("crm_no_companies")}</p>;
  }

  return (
    <div className="space-y-1.5">
      {companies.map((company) => {
        const companyDeals = deals.filter((d) => d.companyId === company.id);
        const totalValue = companyDeals.reduce((sum, d) => sum + d.valueCad, 0);
        return (
          <div
            key={company.id}
            className="flex items-center gap-3 rounded-ctl border border-line bg-bg-1 px-3 py-2"
          >
            <Building2 size={12} className="shrink-0 text-tx-3" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-tx-1">{company.name}</p>
              <p className="font-mono text-[10px] text-tx-3">
                {companyDeals.length} {t("crm_deal_count")}
              </p>
            </div>
            {totalValue > 0 && (
              <span className="shrink-0 font-mono text-[11px] text-laiton">
                {fmtCad(totalValue)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Activities tab ───────────────────────────────────────────────────────────

function ActivitiesTab({
  activities,
  actors,
  deals,
}: {
  activities: CrmActivity[];
  actors: Actor[];
  deals: Deal[];
}) {
  const t = useT();

  function activityTypeName(type: CrmActivity["type"]) {
    if (type === "call") return t("crm_activity_call");
    if (type === "email") return t("crm_activity_email");
    if (type === "meeting") return t("crm_activity_meeting");
    return t("crm_activity_note");
  }

  if (activities.length === 0) {
    return <p className="font-mono text-[13px] text-tx-3">{t("crm_no_activities")}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="warn" className="font-mono text-[9px]">
          {t("crm_simulation_badge")}
        </Badge>
      </div>
      {activities.map((act) => {
        const actor = actors.find((a) => a.id === act.byActorId);
        const deal = deals.find((d) => d.id === act.dealId);
        return (
          <div key={act.id} className="flex gap-3 rounded-ctl border border-line bg-bg-1 px-3 py-2">
            <ActivityIcon type={act.type} className="mt-0.5 shrink-0 text-tx-3" />
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                  {activityTypeName(act.type)}
                </span>
                {deal && (
                  <Link
                    to={`/crm/${deal.id}`}
                    className="truncate font-mono text-[9px] text-info hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-or"
                  >
                    {deal.title}
                  </Link>
                )}
              </div>
              <p className="font-mono text-[11px] text-tx-2">{act.summary}</p>
              <p className="mt-1 font-mono text-[9px] text-tx-3">
                {t("crm_by_actor")} {actor?.name ?? act.byActorId} · {fmtDate(act.at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Agent actions tab ────────────────────────────────────────────────────────

function AgentActionsTab({
  deals,
  companies,
  actors,
}: {
  deals: Deal[];
  companies: Company[];
  actors: Actor[];
}) {
  const t = useT();
  const dealsWithActions = deals.filter((d) => d.lastAgentAction);

  if (dealsWithActions.length === 0) {
    return <p className="font-mono text-[13px] text-tx-3">{t("crm_no_agent_action")}</p>;
  }

  return (
    <div className="space-y-3">
      {dealsWithActions.map((deal) => {
        const company = companies.find((c) => c.id === deal.companyId);
        const action = deal.lastAgentAction!;
        const proposed = actors.find((a) => a.id === action.proposedByActorId);
        const executed = actors.find((a) => a.id === action.executedByActorId);
        const verified = action.verifiedByActorId
          ? actors.find((a) => a.id === action.verifiedByActorId)
          : undefined;

        return (
          <div key={deal.id} className="rounded-ctl border border-laiton/30 bg-laiton/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Bot size={11} className="text-laiton" aria-hidden />
              <Link
                to={`/crm/${deal.id}`}
                className="text-[12px] font-medium text-tx-1 hover:text-or focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-or"
              >
                {deal.title}
              </Link>
              {company && <span className="font-mono text-[10px] text-tx-3">· {company.name}</span>}
              <span className="ml-auto font-mono text-[9px] text-tx-3">{fmtDate(action.at)}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                  {t("crm_proposed_by")}
                </dt>
                <dd className="font-mono text-[11px] text-tx-1">
                  {proposed?.name ?? action.proposedByActorId}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                  {t("crm_executed_by")}
                </dt>
                <dd className="font-mono text-[11px] text-tx-1">
                  {executed?.name ?? action.executedByActorId}
                </dd>
              </div>
              {verified && (
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                    {t("crm_verified_by")}
                  </dt>
                  <dd className="font-mono text-[11px] text-ok">{verified.name}</dd>
                </div>
              )}
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                  {t("crm_external_id")}
                </dt>
                <dd className="font-mono text-[11px] text-laiton">{action.externalRecordId}</dd>
              </div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS: {
  id: CrmTab;
  labelKey:
    | "crm_tab_pipeline"
    | "crm_tab_deals"
    | "crm_tab_contacts"
    | "crm_tab_companies"
    | "crm_tab_activities"
    | "crm_tab_actions";
}[] = [
  { id: "pipeline", labelKey: "crm_tab_pipeline" },
  { id: "deals", labelKey: "crm_tab_deals" },
  { id: "contacts", labelKey: "crm_tab_contacts" },
  { id: "companies", labelKey: "crm_tab_companies" },
  { id: "activities", labelKey: "crm_tab_activities" },
  { id: "actions", labelKey: "crm_tab_actions" },
];

export default function Crm() {
  const t = useT();
  const { activeClientId } = useUIStore();
  const { activeWorkspaceId, deals, companies, contacts, actors, providers, integrations } =
    useAppStore();
  const [activeTab, setActiveTab] = useState<CrmTab>("pipeline");

  const crmIntegration = integrations.find(
    (i) => i.workspaceId === activeWorkspaceId && i.category === "crm",
  );
  const crmProvider = crmIntegration
    ? providers.find((p) => p.id === crmIntegration.providerId)
    : undefined;

  const wsDeals = deals.filter((d) => d.workspaceId === activeWorkspaceId);
  const wsContacts = contacts.filter((c) => c.workspaceId === activeWorkspaceId);
  const wsCompanies = companies.filter((c) => c.workspaceId === activeWorkspaceId);

  const filteredDeals = activeClientId
    ? wsDeals.filter((d) => d.clientId === activeClientId)
    : wsDeals;
  const filteredContacts = activeClientId
    ? wsContacts.filter((c) => c.clientId === activeClientId)
    : wsContacts;
  const filteredCompanies = activeClientId
    ? wsCompanies.filter((c) => c.clientId === activeClientId)
    : wsCompanies;

  const filteredActivities = activeClientId
    ? MOCK_ACTIVITIES.filter((a) => filteredDeals.some((d) => d.id === a.dealId))
    : MOCK_ACTIVITIES;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 size={15} className="shrink-0 text-tx-3" aria-hidden />
        <h1 className="text-sm font-semibold text-tx-1">{t("nav_crm")}</h1>
        {crmProvider && (
          <span className="ml-1 font-mono text-[10px] text-tx-3">
            {t("crm_provider_label")} {crmProvider.name}
          </span>
        )}
        <div className="ml-auto">
          <Badge variant="warn" className="font-mono text-[9px]">
            {t("crm_mock_badge")}
          </Badge>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 flex gap-3">
        <div className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5">
          <p className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
            {t("crm_deal_count")}
          </p>
          <p className="font-mono text-[13px] font-semibold text-tx-1">{filteredDeals.length}</p>
        </div>
        <div className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5">
          <p className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
            {t("crm_total_value")}
          </p>
          <p className="font-mono text-[13px] font-semibold text-laiton">
            {fmtCad(filteredDeals.reduce((s, d) => s + d.valueCad, 0))}
          </p>
        </div>
        <div className="rounded-ctl border border-line bg-bg-1 px-3 py-1.5">
          <p className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
            {t("crm_tab_contacts")}
          </p>
          <p className="font-mono text-[13px] font-semibold text-tx-1">{filteredContacts.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="mb-4 flex gap-0 overflow-x-auto border-b border-line"
        role="tablist"
        aria-label={t("nav_crm")}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 px-3 py-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or",
              activeTab === tab.id
                ? "-mb-px border-b-2 border-or text-or"
                : "text-tx-3 hover:text-tx-2",
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "pipeline" && (
          <div role="tabpanel" aria-label={t("crm_tab_pipeline")}>
            <PipelineTab deals={filteredDeals} companies={wsCompanies} />
          </div>
        )}
        {activeTab === "deals" && (
          <div role="tabpanel" aria-label={t("crm_tab_deals")}>
            <DealsTab deals={filteredDeals} companies={wsCompanies} />
          </div>
        )}
        {activeTab === "contacts" && (
          <div role="tabpanel" aria-label={t("crm_tab_contacts")}>
            <ContactsTab contacts={filteredContacts} companies={wsCompanies} />
          </div>
        )}
        {activeTab === "companies" && (
          <div role="tabpanel" aria-label={t("crm_tab_companies")}>
            <CompaniesTab companies={filteredCompanies} deals={filteredDeals} />
          </div>
        )}
        {activeTab === "activities" && (
          <div role="tabpanel" aria-label={t("crm_tab_activities")}>
            <ActivitiesTab activities={filteredActivities} actors={actors} deals={filteredDeals} />
          </div>
        )}
        {activeTab === "actions" && (
          <div role="tabpanel" aria-label={t("crm_tab_actions")}>
            <AgentActionsTab deals={filteredDeals} companies={wsCompanies} actors={actors} />
          </div>
        )}
      </div>
    </div>
  );
}

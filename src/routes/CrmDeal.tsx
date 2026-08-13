import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Users,
  Bot,
  Phone,
  Mail,
  Calendar,
  FileText,
} from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { Deal } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type DealTab = "overview" | "contacts" | "activities" | "actions";

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function CrmDeal() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deals, companies, contacts, clients, actors } = useAppStore();
  const [activeTab, setActiveTab] = useState<DealTab>("overview");

  const deal = deals.find((d) => d.id === id);

  if (!deal) {
    return (
      <div className="flex h-full flex-col">
        <button
          onClick={() => navigate("/crm")}
          className="mb-4 flex items-center gap-1.5 text-[11px] text-tx-3 hover:text-tx-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
        >
          <ArrowLeft size={12} aria-hidden />
          {t("crm_back")}
        </button>
        <div className="flex flex-1 items-center justify-center">
          <p className="font-mono text-[13px] text-tx-3">—</p>
        </div>
      </div>
    );
  }

  const company = companies.find((c) => c.id === deal.companyId);
  const client = deal.clientId ? clients.find((c) => c.id === deal.clientId) : undefined;
  const dealContacts = contacts.filter(
    (c) => c.companyId === deal.companyId || c.clientId === deal.clientId,
  );
  const dealActivities = MOCK_ACTIVITIES.filter((a) => a.dealId === deal.id);
  const action = deal.lastAgentAction;

  function stageName(stage: Deal["stage"]) {
    if (stage === "lead") return t("crm_stage_lead");
    if (stage === "qualified") return t("crm_stage_qualified");
    if (stage === "proposal") return t("crm_stage_proposal");
    if (stage === "negotiation") return t("crm_stage_negotiation");
    if (stage === "won") return t("crm_stage_won");
    return t("crm_stage_lost");
  }

  function actTypeName(type: CrmActivity["type"]) {
    if (type === "call") return t("crm_activity_call");
    if (type === "email") return t("crm_activity_email");
    if (type === "meeting") return t("crm_activity_meeting");
    return t("crm_activity_note");
  }

  const tabLabel: Record<DealTab, string> = {
    overview: t("crm_tab_overview"),
    contacts: t("crm_tab_contacts"),
    activities: t("crm_tab_activities"),
    actions: t("crm_tab_actions"),
  };

  return (
    <div className="flex h-full flex-col">
      {/* Back */}
      <button
        onClick={() => navigate("/crm")}
        className="mb-3 flex items-center gap-1.5 text-[11px] text-tx-3 hover:text-tx-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
      >
        <ArrowLeft size={12} aria-hidden />
        {t("crm_back")}
      </button>

      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-wrap items-start gap-2">
          <h1 className="flex-1 text-sm font-semibold text-tx-1">{deal.title}</h1>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px]",
              STAGE_COLORS[deal.stage],
            )}
          >
            {stageName(deal.stage)}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[13px] font-semibold text-laiton">
            {fmtCad(deal.valueCad)}
          </span>
          {company && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-tx-2">
              <Building2 size={11} aria-hidden />
              {company.name}
            </span>
          )}
          {action && (
            <Badge variant="laiton" className="font-mono text-[9px]">
              {t("crm_agent_action_badge")}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-0 border-b border-line" role="tablist">
        {(["overview", "contacts", "activities", "actions"] as DealTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "shrink-0 px-3 py-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or",
              activeTab === tab
                ? "-mb-px border-b-2 border-or text-or"
                : "text-tx-3 hover:text-tx-2",
            )}
          >
            {tabLabel[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 space-y-3 overflow-auto">
        {/* Overview */}
        {activeTab === "overview" && (
          <div role="tabpanel" className="space-y-3">
            <div className="rounded-ctl border border-line bg-bg-1 p-3">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-tx-3">
                {t("crm_deal_label")}
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                    {t("crm_company_label")}
                  </dt>
                  <dd className="font-mono text-[12px] text-tx-1">{company?.name ?? "—"}</dd>
                </div>
                {client && (
                  <div>
                    <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                      {t("crm_client_label")}
                    </dt>
                    <dd className="font-mono text-[12px] text-tx-1">{client.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                    {t("crm_stage_label")}
                  </dt>
                  <dd className="font-mono text-[12px] text-tx-1">{stageName(deal.stage)}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                    {t("crm_value_label")}
                  </dt>
                  <dd className="font-mono text-[12px] font-semibold text-laiton">
                    {fmtCad(deal.valueCad)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Contacts */}
        {activeTab === "contacts" && (
          <div role="tabpanel">
            {dealContacts.length === 0 ? (
              <p className="font-mono text-[13px] text-tx-3">{t("crm_no_contacts")}</p>
            ) : (
              <div className="space-y-1.5">
                {dealContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 rounded-ctl border border-line bg-bg-1 px-3 py-2"
                  >
                    <Users size={12} className="shrink-0 text-tx-3" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-tx-1">{contact.name}</p>
                      {contact.role && (
                        <p className="font-mono text-[10px] text-tx-3">{contact.role}</p>
                      )}
                    </div>
                    {contact.email && (
                      <span className="shrink-0 font-mono text-[10px] text-tx-3">
                        {contact.email}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activities */}
        {activeTab === "activities" && (
          <div role="tabpanel">
            <div className="mb-2">
              <Badge variant="warn" className="font-mono text-[9px]">
                {t("crm_simulation_badge")}
              </Badge>
            </div>
            {dealActivities.length === 0 ? (
              <p className="font-mono text-[13px] text-tx-3">{t("crm_no_activities")}</p>
            ) : (
              <div className="space-y-2">
                {dealActivities.map((act) => {
                  const actor = actors.find((a) => a.id === act.byActorId);
                  return (
                    <div
                      key={act.id}
                      className="flex gap-3 rounded-ctl border border-line bg-bg-1 px-3 py-2"
                    >
                      <ActivityIcon type={act.type} className="mt-0.5 shrink-0 text-tx-3" />
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                          {actTypeName(act.type)}
                        </span>
                        <p className="font-mono text-[11px] text-tx-2">{act.summary}</p>
                        <p className="mt-1 font-mono text-[9px] text-tx-3">
                          {t("crm_by_actor")} {actor?.name ?? act.byActorId} · {fmtDate(act.at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Agent Actions */}
        {activeTab === "actions" && (
          <div role="tabpanel">
            {!action ? (
              <p className="font-mono text-[13px] text-tx-3">{t("crm_no_agent_action")}</p>
            ) : (
              <div className="rounded-ctl border border-laiton/30 bg-laiton/5 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Bot size={11} className="text-laiton" aria-hidden />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-laiton">
                    {t("crm_agent_action_badge")}
                  </span>
                  <span className="ml-auto font-mono text-[9px] text-tx-3">
                    {fmtDate(action.at)}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                      {t("crm_proposed_by")}
                    </dt>
                    <dd className="mt-0.5 font-mono text-[12px] text-tx-1">
                      {actors.find((a) => a.id === action.proposedByActorId)?.name ??
                        action.proposedByActorId}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                      {t("crm_executed_by")}
                    </dt>
                    <dd className="mt-0.5 font-mono text-[12px] text-tx-1">
                      {actors.find((a) => a.id === action.executedByActorId)?.name ??
                        action.executedByActorId}
                    </dd>
                  </div>
                  {action.verifiedByActorId && (
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                        {t("crm_verified_by")}
                      </dt>
                      <dd className="mt-0.5 font-mono text-[12px] text-ok">
                        {actors.find((a) => a.id === action.verifiedByActorId)?.name ??
                          action.verifiedByActorId}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                      {t("crm_external_id")}
                    </dt>
                    <dd className="mt-0.5 font-mono text-[12px] text-laiton">
                      {action.externalRecordId}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

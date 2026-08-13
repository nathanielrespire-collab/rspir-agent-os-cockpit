import { Users, ArrowRight, Building2, Star, Zap, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import type { Client } from "@/lib/types";

function ClientCard({ client }: { client: Client }) {
  const t = useT();
  const navigate = useNavigate();
  const { contacts, projects, features } = useAppStore();

  const clientContacts = contacts.filter((c) => c.clientId === client.id);
  const clientProjects = projects.filter((p) => p.clientId === client.id);
  const enabledFeatures = features.filter((f) => client.enabledFeatureIds.includes(f.id));

  return (
    <button
      className="group w-full rounded-card border border-line bg-bg-1 p-4 text-left transition-colors hover:border-laiton/40 hover:bg-bg-2 focus-visible:outline-2 focus-visible:outline-or"
      onClick={() => navigate(`/clients/${client.id}`)}
      aria-label={client.name}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-tx-1">{client.name}</h3>
          {client.sector && (
            <p className="mt-0.5 font-mono text-[11px] text-tx-3">{client.sector}</p>
          )}
        </div>
        <ArrowRight
          size={13}
          className="mt-0.5 shrink-0 text-tx-3 transition-transform group-hover:translate-x-0.5 group-hover:text-laiton"
          aria-hidden
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-ctl border border-line bg-bg-0/60 px-2.5 py-2">
          <div className="mb-1 flex items-center gap-1">
            <FolderKanban size={10} className="text-tx-3" aria-hidden />
            <p className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
              {t("nav_projects")}
            </p>
          </div>
          <p className="font-mono text-base font-semibold leading-none text-tx-1">
            {clientProjects.length}
          </p>
        </div>

        <div className="rounded-ctl border border-line bg-bg-0/60 px-2.5 py-2">
          <div className="mb-1 flex items-center gap-1">
            <Users size={10} className="text-tx-3" aria-hidden />
            <p className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
              {t("cli_tab_contacts")}
            </p>
          </div>
          <p className="font-mono text-base font-semibold leading-none text-tx-1">
            {clientContacts.length}
          </p>
        </div>

        <div className="rounded-ctl border border-line bg-bg-0/60 px-2.5 py-2">
          <div className="mb-1 flex items-center gap-1">
            <Zap size={10} className="text-tx-3" aria-hidden />
            <p className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
              {t("cli_tab_features")}
            </p>
          </div>
          <p className="font-mono text-base font-semibold leading-none text-laiton">
            {enabledFeatures.length}
          </p>
        </div>
      </div>

      {clientProjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {clientProjects.map((p) => (
            <Badge key={p.id} variant="default" className="text-[9px]">
              <Building2 size={9} className="mr-1" aria-hidden />
              {p.name}
            </Badge>
          ))}
        </div>
      )}

      {enabledFeatures.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {enabledFeatures.map((f) => (
            <span
              key={f.id}
              className="rounded-ctl border border-laiton/20 bg-laiton/10 px-1.5 py-0.5 font-mono text-[9px] text-laiton"
            >
              <Star size={8} className="mr-0.5 inline" aria-hidden />
              {f.key}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export default function Clients() {
  const t = useT();
  const { clients, activeWorkspaceId } = useAppStore();

  const wsClients = clients.filter((c) => c.workspaceId === activeWorkspaceId);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-2">
        <Users size={16} className="text-tx-3" aria-hidden="true" />
        <h1 className="text-sm font-semibold">{t("nav_clients")}</h1>
        <Badge variant="laiton" className="ml-auto font-mono text-[10px]">
          {t("home_mock_badge")}
        </Badge>
      </div>

      {wsClients.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
          <p className="text-[13px] text-tx-2">{t("empty_clients")}</p>
          <p className="font-mono text-xs text-tx-3">{t("action_clients")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {wsClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}

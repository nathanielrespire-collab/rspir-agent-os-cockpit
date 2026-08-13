import { FolderKanban, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { Project } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

const STATUS_KEY: Record<Project["status"], TKey> = {
  active: "proj_status_active",
  paused: "proj_status_paused",
  delivered: "proj_status_delivered",
};

const STATUS_VARIANT: Record<Project["status"], "ok" | "warn" | "info"> = {
  active: "ok",
  paused: "warn",
  delivered: "info",
};

function Triptych({ project }: { project: Project }) {
  const t = useT();
  const { lang } = useUIStore();
  const tasks = project.taskCompletionPct;
  const ops = project.operationalPct;
  const transferable = project.transferable;

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Tasks % */}
      <div className="rounded-ctl border border-line bg-bg-0/60 px-3 py-2">
        <p className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
          {t("proj_tasks_pct")}
        </p>
        <p
          className={cn(
            "mt-1 font-mono text-lg font-semibold leading-none",
            tasks === 100 ? "text-ok" : tasks >= 75 ? "text-laiton" : "text-tx-1",
          )}
        >
          {tasks}%
        </p>
      </div>

      {/* Operational % */}
      <div className="rounded-ctl border border-line bg-bg-0/60 px-3 py-2">
        <p className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
          {t("proj_operational_pct")}
        </p>
        <p
          className={cn(
            "mt-1 font-mono text-lg font-semibold leading-none",
            ops >= 80 ? "text-ok" : ops >= 60 ? "text-laiton" : "text-warn",
          )}
        >
          {ops}%
        </p>
      </div>

      {/* Transferable */}
      <div
        className={cn(
          "rounded-ctl border px-3 py-2",
          transferable
            ? "border-ok/25 bg-ok/5"
            : "border-err/25 bg-err/5",
        )}
      >
        <p className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
          {t("proj_transferable")}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          {transferable ? (
            <CheckCircle2 size={13} className="text-ok" aria-hidden />
          ) : (
            <AlertCircle size={13} className="text-err" aria-hidden />
          )}
          <span
            className={cn(
              "font-mono text-sm font-semibold leading-none",
              transferable ? "text-ok" : "text-err",
            )}
          >
            {transferable ? t("proj_transferable_yes") : t("proj_transferable_no")}
          </span>
        </div>
        {!transferable && project.transferableReason && (
          <p className="mt-1 font-mono text-[10px] leading-tight text-tx-3">
            {project.transferableReason[lang]}
          </p>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, clientName }: { project: Project; clientName: string }) {
  const t = useT();
  const navigate = useNavigate();

  return (
    <button
      className="group w-full rounded-card border border-line bg-bg-1 p-4 text-left transition-colors hover:border-laiton/40 hover:bg-bg-2 focus-visible:outline-2 focus-visible:outline-or"
      onClick={() => navigate(`/projects/${project.id}`)}
      aria-label={project.name}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-tx-1">{project.name}</h3>
          <p className="mt-0.5 font-mono text-[11px] text-tx-3">{clientName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant={STATUS_VARIANT[project.status]} className="text-[10px]">
            {t(STATUS_KEY[project.status])}
          </Badge>
          <ArrowRight
            size={13}
            className="text-tx-3 transition-transform group-hover:translate-x-0.5 group-hover:text-laiton"
            aria-hidden
          />
        </div>
      </div>
      <Triptych project={project} />
    </button>
  );
}

export default function Projects() {
  const t = useT();
  const { projects, clients, activeWorkspaceId } = useAppStore();

  const wsProjects = projects.filter((p) => p.workspaceId === activeWorkspaceId);

  // Group by client
  const byClient = wsProjects.reduce<Record<string, Project[]>>((acc, p) => {
    if (!acc[p.clientId]) acc[p.clientId] = [];
    acc[p.clientId].push(p);
    return acc;
  }, {});

  const clientOrder = Array.from(new Set(wsProjects.map((p) => p.clientId)));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-2">
        <FolderKanban size={16} className="text-tx-3" aria-hidden="true" />
        <h1 className="text-sm font-semibold">{t("nav_projects")}</h1>
        <Badge variant="laiton" className="ml-auto font-mono text-[10px]">
          {t("home_mock_badge")}
        </Badge>
      </div>

      {wsProjects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
          <p className="text-[13px] text-tx-2">{t("empty_projects")}</p>
          <p className="font-mono text-xs text-tx-3">{t("action_projects")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {clientOrder.map((clientId) => {
            const client = clients.find((c) => c.id === clientId);
            const clientProjects = byClient[clientId] ?? [];
            return (
              <section key={clientId} aria-label={client?.name ?? clientId}>
                <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-tx-3">
                  {client?.name ?? clientId}
                </h2>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {clientProjects.map((p) => (
                    <ProjectCard key={p.id} project={p} clientName={client?.name ?? clientId} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

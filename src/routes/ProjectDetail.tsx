import {
  FolderKanban,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Bot,
  Zap,
  GitBranch,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import type { WorkItem, WorkStatus, Project } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

// ─── Sub-components ──────────────────────────────────────────────────────────

const STATUS_KEY: Record<WorkStatus, TKey> = {
  todo: "work_status_todo",
  ready: "work_status_ready",
  claimed: "work_status_claimed",
  running: "work_status_running",
  verification: "work_status_verification",
  a_valider: "work_status_a_valider",
  blocked: "work_status_blocked",
  failed: "work_status_failed",
  done: "work_status_done",
};

type BadgeVariant = "default" | "ok" | "warn" | "err" | "info" | "or" | "laiton";

const STATUS_BADGE: Record<WorkStatus, BadgeVariant> = {
  todo: "default",
  ready: "info",
  claimed: "laiton",
  running: "laiton",
  verification: "warn",
  a_valider: "or",
  blocked: "err",
  failed: "err",
  done: "ok",
};

const PROJ_STATUS_KEY: Record<Project["status"], TKey> = {
  active: "proj_status_active",
  paused: "proj_status_paused",
  delivered: "proj_status_delivered",
};

const PROJ_STATUS_VARIANT: Record<Project["status"], BadgeVariant> = {
  active: "ok",
  paused: "warn",
  delivered: "info",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-tx-3">{children}</p>
  );
}

function WorkRow({ item, onClick }: { item: WorkItem; onClick: () => void }) {
  const t = useT();
  return (
    <button
      className="flex w-full items-center gap-2.5 rounded-ctl border border-line bg-bg-0/50 px-3 py-2 text-left transition-colors hover:border-laiton/30 hover:bg-bg-1 focus-visible:outline-2 focus-visible:outline-or"
      onClick={onClick}
      aria-label={item.title}
    >
      <Badge variant={STATUS_BADGE[item.status]} className="shrink-0 font-mono text-[9px]">
        {t(STATUS_KEY[item.status])}
      </Badge>
      <span className="min-w-0 flex-1 truncate text-[12px] text-tx-1">{item.title}</span>
      <span className="shrink-0 font-mono text-[10px] text-tx-3">{item.id}</span>
      <ArrowRight size={11} className="shrink-0 text-tx-3" aria-hidden />
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const { lang } = useUIStore();
  const navigate = useNavigate();
  const { projects, clients, workItems, actors, blockers, automations } = useAppStore();

  const project = projects.find((p) => p.id === id);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  const client = clients.find((c) => c.id === project.clientId);
  const projectItems = workItems.filter((wi) => wi.projectId === project.id);

  const verified = projectItems.filter((wi) => wi.status === "done");
  const nextWork = projectItems.filter((wi) => wi.status === "ready");
  const activeItems = projectItems.filter((wi) =>
    ["claimed", "running", "verification", "a_valider"].includes(wi.status),
  );

  // Dependencies: items that have dependsOn pointing to other items in this project
  const withDeps = projectItems.filter(
    (wi) => wi.dependsOn.length > 0 && wi.dependsOn.some((dep) => projectItems.find((pi) => pi.id === dep)),
  );

  // Blockers: those whose workItemIds intersect with this project's items
  const projectItemIds = new Set(projectItems.map((wi) => wi.id));
  const activeBlockers = blockers.filter(
    (b) => !b.resolved && b.workItemIds.some((wid) => projectItemIds.has(wid)),
  );

  // Team actors
  const team = project.teamActorIds.flatMap((aid) => {
    const a = actors.find((ac) => ac.id === aid);
    return a ? [a] : [];
  });

  // Automations for this client
  const clientAutomations = automations.filter(
    (a) => a.workspaceId === project.workspaceId && a.clientId === project.clientId,
  );

  function goToWork(projectId: string) {
    // Navigate to /work — the filter in Work.tsx supports projectIds
    navigate(`/work?project=${projectId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <button
          className="mb-3 flex items-center gap-1.5 font-mono text-[11px] text-tx-3 transition-colors hover:text-tx-1 focus-visible:outline-2 focus-visible:outline-or"
          onClick={() => navigate("/projects")}
          aria-label={t("proj_back")}
        >
          <ChevronLeft size={13} aria-hidden />
          {t("proj_back")}
        </button>

        <div className="flex items-start gap-3">
          <FolderKanban size={16} className="mt-0.5 shrink-0 text-tx-3" aria-hidden />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-tx-1">{project.name}</h1>
            <p className="mt-0.5 font-mono text-[11px] text-tx-3">{client?.name ?? project.clientId}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={PROJ_STATUS_VARIANT[project.status]} className="text-[10px]">
              {t(PROJ_STATUS_KEY[project.status])}
            </Badge>
            <Badge variant="laiton" className="font-mono text-[10px]">
              {t("home_mock_badge")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Triptych */}
      <div className="grid grid-cols-3 gap-3">
        {/* Tasks % */}
        <div className="rounded-card border border-line bg-bg-1 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-tx-3">
            {t("proj_tasks_pct")}
          </p>
          <p
            className={cn(
              "mt-2 font-mono text-3xl font-semibold leading-none",
              project.taskCompletionPct === 100
                ? "text-ok"
                : project.taskCompletionPct >= 75
                  ? "text-laiton"
                  : "text-tx-1",
            )}
          >
            {project.taskCompletionPct}%
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-tx-3">
            {verified.length}&nbsp;/&nbsp;{projectItems.length}
          </p>
        </div>

        {/* Operational % */}
        <div className="rounded-card border border-line bg-bg-1 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-tx-3">
            {t("proj_operational_pct")}
          </p>
          <p
            className={cn(
              "mt-2 font-mono text-3xl font-semibold leading-none",
              project.operationalPct >= 80
                ? "text-ok"
                : project.operationalPct >= 60
                  ? "text-laiton"
                  : "text-warn",
            )}
          >
            {project.operationalPct}%
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-tx-3">{client?.sector ?? "—"}</p>
        </div>

        {/* Transferable */}
        <div
          className={cn(
            "rounded-card border p-4",
            project.transferable ? "border-ok/30 bg-ok/5" : "border-err/30 bg-err/5",
          )}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-tx-3">
            {t("proj_transferable")}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {project.transferable ? (
              <CheckCircle2 size={18} className="shrink-0 text-ok" aria-hidden />
            ) : (
              <AlertCircle size={18} className="shrink-0 text-err" aria-hidden />
            )}
            <span
              className={cn(
                "font-mono text-xl font-semibold leading-none",
                project.transferable ? "text-ok" : "text-err",
              )}
            >
              {project.transferable ? t("proj_transferable_yes") : t("proj_transferable_no")}
            </span>
          </div>
          {!project.transferable && project.transferableReason && (
            <div className="mt-2.5 rounded-ctl border border-err/20 bg-bg-0/40 px-2.5 py-2">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-tx-3">
                {t("proj_transferable_reason")}
              </p>
              <p className="font-mono text-[11px] leading-snug text-err/80">
                {project.transferableReason[lang]}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verified deliverables */}
      <section aria-label={t("proj_deliverables")}>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>{t("proj_deliverables")}</SectionLabel>
          {projectItems.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => goToWork(project.id)}
              className="h-6 px-2 text-[11px]"
              aria-label={t("proj_view_work")}
            >
              {t("proj_view_work")}
              <ArrowRight size={11} className="ml-1" aria-hidden />
            </Button>
          )}
        </div>
        {verified.length === 0 ? (
          <p className="font-mono text-[12px] text-tx-3">{t("proj_no_deliverables")}</p>
        ) : (
          <div className="space-y-1.5">
            {verified.map((wi) => (
              <WorkRow key={wi.id} item={wi} onClick={() => navigate(`/work`)} />
            ))}
          </div>
        )}
      </section>

      {/* Active work */}
      {activeItems.length > 0 && (
        <section aria-label={t("nav_work")}>
          <SectionLabel>{t("nav_work")}</SectionLabel>
          <div className="space-y-1.5">
            {activeItems.map((wi) => (
              <WorkRow key={wi.id} item={wi} onClick={() => navigate(`/work`)} />
            ))}
          </div>
        </section>
      )}

      {/* Blockers */}
      <section aria-label={t("proj_blockers")}>
        <SectionLabel>{t("proj_blockers")}</SectionLabel>
        {activeBlockers.length === 0 ? (
          <p className="font-mono text-[12px] text-tx-3">{t("proj_no_blockers")}</p>
        ) : (
          <div className="space-y-2">
            {activeBlockers.map((b) => (
              <div
                key={b.id}
                className="rounded-ctl border border-err/25 bg-err/5 px-3 py-2.5"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0 text-err" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-mono text-[12px] text-err">{b.question}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-tx-3">{b.blockingDependency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dependencies */}
      {withDeps.length > 0 && (
        <section aria-label={t("proj_dependencies")}>
          <SectionLabel>{t("proj_dependencies")}</SectionLabel>
          <div className="space-y-2">
            {withDeps.map((wi) => {
              const depItems = wi.dependsOn.flatMap((depId) => {
                const dep = workItems.find((w) => w.id === depId);
                return dep ? [dep] : [];
              });
              return (
                <div key={wi.id} className="rounded-ctl border border-line bg-bg-1 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_BADGE[wi.status]} className="font-mono text-[9px]">
                      {t(STATUS_KEY[wi.status])}
                    </Badge>
                    <span className="text-[12px] font-medium text-tx-1">{wi.title}</span>
                  </div>
                  {depItems.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-line pt-2">
                      {depItems.map((dep) => (
                        <div key={dep.id} className="flex items-center gap-2">
                          <GitBranch size={10} className="text-tx-3" aria-hidden />
                          <span className="font-mono text-[11px] text-tx-3">{dep.title}</span>
                          <Badge variant={STATUS_BADGE[dep.status]} className="font-mono text-[9px]">
                            {t(STATUS_KEY[dep.status])}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Next admissible work */}
      <section aria-label={t("proj_next_work")}>
        <SectionLabel>{t("proj_next_work")}</SectionLabel>
        {nextWork.length === 0 ? (
          <p className="font-mono text-[12px] text-tx-3">{t("proj_no_next_work")}</p>
        ) : (
          <div className="space-y-1.5">
            {nextWork.map((wi) => (
              <WorkRow key={wi.id} item={wi} onClick={() => navigate(`/work`)} />
            ))}
          </div>
        )}
      </section>

      {/* Team */}
      <section aria-label={t("proj_team")}>
        <SectionLabel>{t("proj_team")}</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {team.map((actor) => (
            <div
              key={actor.id}
              className="flex items-center gap-2 rounded-ctl border border-line bg-bg-1 px-2.5 py-1.5"
            >
              {actor.type === "ai_agent" ? (
                <Bot size={12} className="text-laiton" aria-hidden />
              ) : (
                <User size={12} className="text-tx-2" aria-hidden />
              )}
              <span className="text-[12px] text-tx-1">{actor.name}</span>
              <Badge
                variant={actor.type === "ai_agent" ? "laiton" : "default"}
                className="text-[9px]"
              >
                {actor.role}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Automation activity */}
      <section aria-label={t("proj_automations_activity")}>
        <SectionLabel>{t("proj_automations_activity")}</SectionLabel>
        {clientAutomations.length === 0 ? (
          <p className="font-mono text-[12px] text-tx-3">{t("proj_no_automations")}</p>
        ) : (
          <div className="space-y-2">
            {clientAutomations.map((atm) => (
              <div
                key={atm.id}
                className="rounded-ctl border border-line bg-bg-1 px-3 py-2.5"
              >
                <div className="flex items-start gap-2">
                  <Zap size={12} className="mt-0.5 shrink-0 text-laiton" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-tx-1">{atm.name}</span>
                      <Badge
                        variant={
                          atm.stage === "deployed"
                            ? "ok"
                            : atm.stage === "test"
                              ? "warn"
                              : "default"
                        }
                        className="font-mono text-[9px]"
                      >
                        {atm.stage}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-tx-3">{atm.trigger}</p>
                    {atm.lastRunAt && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Clock size={10} className="text-tx-3" aria-hidden />
                        <span className="font-mono text-[10px] text-tx-3">
                          {t("proj_last_run")}&nbsp;
                          {new Date(atm.lastRunAt).toLocaleDateString()}
                        </span>
                        {atm.lastRunResult && (
                          <Badge
                            variant={atm.lastRunResult === "pass" ? "ok" : "err"}
                            className="font-mono text-[9px]"
                          >
                            {atm.lastRunResult}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

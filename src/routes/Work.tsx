import { useState, useMemo, useRef, useEffect } from "react";
import {
  ListTodo,
  X,
  Plus,
  Search,
  LayoutGrid,
  AlignLeft,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Shield,
  Bot,
  User,
  FileText,
  Hash,
  Terminal,
  Camera,
  Clock,
  Zap,
  GitBranch,
} from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore, VALID_TRANSITIONS, validateTransition } from "@/lib/store";
import { RuntimeSpine } from "@/components/RuntimeSpine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/components/ui/utils";
import type { WorkItem, WorkStatus, RuntimeStage, Evidence } from "@/lib/types";
import type { TKey } from "@/lib/i18n";

// ─── Types ──────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "ok" | "warn" | "err" | "info" | "or" | "laiton";
type View = "table" | "kanban";
type SortField = "title" | "status" | "priority" | "updatedAt";

interface Filters {
  search: string;
  statuses: WorkStatus[];
  clientIds: string[];
  projectIds: string[];
  actorIds: string[];
  priorities: WorkItem["priority"][];
  risks: WorkItem["risk"][];
  externalEffect: boolean | null;
}

const INIT_FILTERS: Filters = {
  search: "",
  statuses: [],
  clientIds: [],
  projectIds: [],
  actorIds: [],
  priorities: [],
  risks: [],
  externalEffect: null,
};

// ─── Status / priority / risk constants ─────────────────────────────────────

const STATUSES: WorkStatus[] = [
  "todo",
  "ready",
  "claimed",
  "running",
  "verification",
  "a_valider",
  "blocked",
  "failed",
  "done",
];

const STATUS_ABBR: Record<WorkStatus, string> = {
  todo: "TODO",
  ready: "RDY",
  claimed: "CLM",
  running: "RUN",
  verification: "VER",
  a_valider: "AVL",
  blocked: "BLK",
  failed: "ERR",
  done: "DNE",
};

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

const PRIORITY_ORDER: Record<WorkItem["priority"], number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

const PRIORITY_BADGE: Record<WorkItem["priority"], BadgeVariant> = {
  P0: "err",
  P1: "warn",
  P2: "default",
  P3: "default",
};

const RISK_BADGE: Record<WorkItem["risk"], BadgeVariant> = {
  low: "ok",
  medium: "warn",
  high: "err",
};

const RISK_KEY: Record<WorkItem["risk"], TKey> = {
  low: "work_risk_low",
  medium: "work_risk_medium",
  high: "work_risk_high",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEffectiveStage(wi: WorkItem): RuntimeStage | undefined {
  if (wi.stage) return wi.stage;
  const map: Partial<Record<WorkStatus, RuntimeStage>> = {
    ready: "select",
    claimed: "claim",
    running: "execute",
    verification: "verify",
    a_valider: "policy",
    done: "continue",
  };
  return map[wi.status];
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-CA", { month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function hasFilters(f: Filters): boolean {
  return (
    f.search !== "" ||
    f.statuses.length > 0 ||
    f.clientIds.length > 0 ||
    f.projectIds.length > 0 ||
    f.actorIds.length > 0 ||
    f.priorities.length > 0 ||
    f.risks.length > 0 ||
    f.externalEffect !== null
  );
}

// ─── Small atoms ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkStatus }) {
  const t = useT();
  return (
    <Badge variant={STATUS_BADGE[status]} className="text-[10px]">
      {t(STATUS_KEY[status])}
    </Badge>
  );
}

function PriorityBadge({ p }: { p: WorkItem["priority"] }) {
  return (
    <Badge variant={PRIORITY_BADGE[p]} className="font-mono text-[10px]">
      {p}
    </Badge>
  );
}

function RiskBadge({ risk }: { risk: WorkItem["risk"] }) {
  const t = useT();
  return (
    <Badge variant={RISK_BADGE[risk]} className="text-[10px]">
      {t(RISK_KEY[risk])}
    </Badge>
  );
}

function EvidIcon({ kind, result }: { kind: Evidence["kind"]; result?: Evidence["result"] }) {
  const cls = "shrink-0 mt-0.5";
  if (kind === "screenshot")
    return <Camera size={13} className={cn(cls, "text-info")} aria-hidden />;
  if (kind === "artifact")
    return <FileText size={13} className={cn(cls, "text-laiton")} aria-hidden />;
  if (kind === "external_id")
    return <Hash size={13} className={cn(cls, "text-tx-2")} aria-hidden />;
  if (kind === "log") return <Terminal size={13} className={cn(cls, "text-tx-3")} aria-hidden />;
  return (
    <CheckCircle2
      size={13}
      className={cn(
        cls,
        result === "pass" ? "text-ok" : result === "fail" ? "text-err" : "text-tx-2",
      )}
      aria-hidden
    />
  );
}

function FChip({
  label,
  active,
  variant,
  title,
  onClick,
}: {
  label: string;
  active: boolean;
  variant?: BadgeVariant;
  title?: string;
  onClick: () => void;
}) {
  const activeClass = (() => {
    if (!active) return "border-line/40 text-tx-3/60 hover:border-line/60 hover:text-tx-2";
    switch (variant) {
      case "info":
        return "border-info bg-info/10 text-info";
      case "laiton":
        return "border-laiton bg-laiton/10 text-laiton";
      case "warn":
        return "border-warn bg-warn/10 text-warn";
      case "or":
        return "border-or bg-or/10 text-or";
      case "err":
        return "border-err bg-err/10 text-err";
      case "ok":
        return "border-ok bg-ok/10 text-ok";
      default:
        return "border-line bg-bg-2 text-tx-1";
    }
  })();
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-ctl border px-1.5 py-0.5 font-mono text-[10px] leading-none transition-all focus-visible:outline-2 focus-visible:outline-or",
        activeClass,
      )}
    >
      {label}
    </button>
  );
}

function SortHead({
  field,
  sort,
  onSort,
  children,
}: {
  field: SortField;
  sort: { field: SortField; dir: "asc" | "desc" };
  onSort: (f: SortField) => void;
  children: React.ReactNode;
}) {
  const active = sort.field === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-tx-3 hover:text-tx-1"
    >
      {children}
      {active ? (
        sort.dir === "asc" ? (
          <ChevronUp size={10} className="text-or" />
        ) : (
          <ChevronDown size={10} className="text-or" />
        )
      ) : (
        <ChevronsUpDown size={10} className="opacity-30" />
      )}
    </button>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-wide text-tx-3">{label}</span>
      <div className="text-[13px] text-tx-1">{children}</div>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 w-full rounded-ctl border border-line bg-bg-1 px-3 py-1 font-mono text-[13px] text-tx-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or disabled:opacity-50",
        className,
      )}
    >
      {children}
    </select>
  );
}

// ─── Work Table ───────────────────────────────────────────────────────────────

interface WorkTableProps {
  items: WorkItem[];
  sort: { field: SortField; dir: "asc" | "desc" };
  onSort: (f: SortField) => void;
  onSelect: (item: WorkItem) => void;
  actors: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

function WorkTable({ items, sort, onSort, onSelect, actors, clients, projects }: WorkTableProps) {
  const t = useT();
  return (
    <Table>
      <TableHeader>
        <tr className="border-b border-line">
          <TableHead>
            <SortHead field="priority" sort={sort} onSort={onSort}>
              {t("work_col_priority")}
            </SortHead>
          </TableHead>
          <TableHead>
            <SortHead field="status" sort={sort} onSort={onSort}>
              {t("work_col_status")}
            </SortHead>
          </TableHead>
          <TableHead>
            <SortHead field="title" sort={sort} onSort={onSort}>
              {t("work_col_title")}
            </SortHead>
          </TableHead>
          <TableHead>{t("work_col_client")}</TableHead>
          <TableHead>{t("work_col_project")}</TableHead>
          <TableHead>{t("work_col_owner")}</TableHead>
          <TableHead>{t("work_col_assigned")}</TableHead>
          <TableHead>{t("work_col_risk")}</TableHead>
          <TableHead>{t("work_col_ext")}</TableHead>
          <TableHead>
            <SortHead field="updatedAt" sort={sort} onSort={onSort}>
              {t("work_col_updated")}
            </SortHead>
          </TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {items.map((wi) => {
          const owner = actors.find((a) => a.id === wi.ownerActorId);
          const assigned = wi.assignedActorId
            ? actors.find((a) => a.id === wi.assignedActorId)
            : null;
          const client = wi.clientId ? clients.find((c) => c.id === wi.clientId) : null;
          const project = wi.projectId ? projects.find((p) => p.id === wi.projectId) : null;

          return (
            <TableRow
              key={wi.id}
              className="cursor-pointer hover:bg-bg-2/60"
              onClick={() => onSelect(wi)}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(wi)}
              role="button"
              aria-label={wi.title}
            >
              <TableCell>
                <PriorityBadge p={wi.priority} />
              </TableCell>
              <TableCell>
                <StatusBadge status={wi.status} />
              </TableCell>
              <TableCell className="max-w-[240px]">
                <span className="line-clamp-1 text-[13px] text-tx-1">{wi.title}</span>
                {wi.evidenceIds.length > 0 && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-tx-3">
                    <Shield size={9} aria-hidden /> {wi.evidenceIds.length}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="font-mono text-[11px] text-tx-2">{client?.name ?? "—"}</span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-[11px] text-tx-2">{project?.name ?? "—"}</span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-[11px] text-tx-2">
                  {owner?.name ?? wi.ownerActorId}
                </span>
              </TableCell>
              <TableCell>
                {assigned ? (
                  <span className="font-mono text-[11px] text-laiton">{assigned.name}</span>
                ) : (
                  <span className="font-mono text-[11px] text-tx-3/40">—</span>
                )}
              </TableCell>
              <TableCell>
                <RiskBadge risk={wi.risk} />
              </TableCell>
              <TableCell>
                {wi.externalEffect ? (
                  <AlertTriangle size={13} className="text-warn" aria-label={t("work_ext_yes")} />
                ) : (
                  <span className="font-mono text-[11px] text-tx-3/40">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="font-mono text-[11px] text-tx-3">{fmtDate(wi.updatedAt)}</span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Work Kanban ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
  item: WorkItem;
  onClick: () => void;
  actors: { id: string; name: string; type: string }[];
}

function KanbanCard({ item, onClick, actors }: KanbanCardProps) {
  const assigned = item.assignedActorId ? actors.find((a) => a.id === item.assignedActorId) : null;
  const owner = actors.find((a) => a.id === item.ownerActorId);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-card border border-line bg-bg-1 px-3 py-2.5 text-left transition-colors hover:border-line/80 hover:bg-bg-2 focus-visible:outline-2 focus-visible:outline-or"
    >
      <div className="mb-1.5 flex items-start justify-between gap-1">
        <PriorityBadge p={item.priority} />
        {item.evidenceIds.length > 0 && (
          <span className="flex items-center gap-0.5 font-mono text-[9px] text-tx-3">
            <Shield size={8} aria-hidden /> {item.evidenceIds.length}
          </span>
        )}
      </div>
      <p className="mb-2 line-clamp-2 text-left text-[12px] leading-snug text-tx-1">{item.title}</p>
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[10px] text-tx-3">{owner?.name ?? "—"}</span>
        {assigned && <span className="font-mono text-[10px] text-laiton">{assigned.name}</span>}
      </div>
      {item.externalEffect && (
        <div className="mt-1.5">
          <AlertTriangle size={10} className="text-warn" aria-hidden />
        </div>
      )}
    </button>
  );
}

interface WorkKanbanProps {
  items: WorkItem[];
  onSelect: (item: WorkItem) => void;
  actors: { id: string; name: string; type: string }[];
}

function WorkKanban({ items, onSelect, actors }: WorkKanbanProps) {
  const t = useT();
  return (
    <div className="flex gap-3 overflow-x-auto pb-4" role="region" aria-label="Kanban">
      {STATUSES.map((status) => {
        const col = items.filter((wi) => wi.status === status);
        return (
          <div key={status} className="flex w-52 shrink-0 flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
              <Badge variant={STATUS_BADGE[status]} className="text-[10px]">
                {t(STATUS_KEY[status])}
              </Badge>
              <span className="ml-auto font-mono text-[10px] text-tx-3">{col.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {col.length === 0 ? (
                <div className="rounded-card border border-dashed border-line/30 px-3 py-4 text-center">
                  <span className="font-mono text-[10px] text-tx-3/40">—</span>
                </div>
              ) : (
                col.map((wi) => (
                  <KanbanCard key={wi.id} item={wi} onClick={() => onSelect(wi)} actors={actors} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Work Panel ───────────────────────────────────────────────────────────────

interface WorkPanelProps {
  item: WorkItem;
  onClose: () => void;
  onAssign: (item: WorkItem) => void;
  onTransition: (item: WorkItem) => void;
}

function WorkPanel({ item, onClose, onAssign, onTransition }: WorkPanelProps) {
  const t = useT();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { actors, evidence, executions, blockers, artifacts, workItems } = useAppStore();

  useEffect(() => {
    closeRef.current?.focus();
  }, [item.id]);

  const owner = actors.find((a) => a.id === item.ownerActorId);
  const assigned = item.assignedActorId ? actors.find((a) => a.id === item.assignedActorId) : null;
  const blocker = item.blockerId ? blockers.find((b) => b.id === item.blockerId) : null;
  const itemEvidence = item.evidenceIds.flatMap((id) => {
    const ev = evidence.find((e) => e.id === id);
    return ev ? [ev] : [];
  });
  const itemExecutions = executions.filter((ex) => ex.workItemId === item.id);
  const allSteps = itemExecutions.flatMap((ex) => ex.steps).sort((a, b) => a.seq - b.seq);
  const itemArtifacts = item.artifactIds.flatMap((id) => {
    const a = artifacts.find((art) => art.id === id);
    return a ? [a] : [];
  });
  const deps = item.dependsOn.flatMap((id) => {
    const dep = workItems.find((w) => w.id === id);
    return dep ? [dep] : [];
  });
  const stage = getEffectiveStage(item);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-bg-0/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col overflow-hidden border-l border-line bg-bg-1"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-tx-1">{item.title}</h3>
            <p className="mt-0.5 font-mono text-[11px] text-tx-3">{item.id}</p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="shrink-0 rounded-ctl p-1 text-tx-3 transition-colors hover:bg-bg-2 hover:text-tx-1 focus-visible:outline-2 focus-visible:outline-or"
            aria-label={t("home_close")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* OWNER vs ASSIGNED — key distinction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-ctl border border-line bg-bg-0/40 px-3 py-2.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <User size={11} className="text-tx-3" aria-hidden />
                <span className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                  {t("work_panel_owner_label")}
                </span>
              </div>
              <span className="text-[13px] font-medium text-tx-1">
                {owner?.name ?? item.ownerActorId}
              </span>
              {owner && (
                <div className="mt-1">
                  <Badge variant="default" className="text-[9px]">
                    {owner.type}
                  </Badge>
                </div>
              )}
            </div>
            <div className="rounded-ctl border border-laiton/25 bg-laiton/5 px-3 py-2.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Bot size={11} className="text-laiton/70" aria-hidden />
                <span className="font-mono text-[9px] uppercase tracking-wide text-tx-3">
                  {t("work_panel_assigned_label")}
                </span>
              </div>
              {assigned ? (
                <>
                  <span className="text-[13px] font-medium text-tx-1">{assigned.name}</span>
                  <div className="mt-1">
                    <Badge variant="laiton" className="text-[9px]">
                      {assigned.type}
                    </Badge>
                  </div>
                </>
              ) : (
                <span className="text-[13px] text-tx-3">{t("home_no_assignee")}</span>
              )}
            </div>
          </div>

          {/* Status + spine */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={item.status} />
              <PriorityBadge p={item.priority} />
              <RiskBadge risk={item.risk} />
              {item.externalEffect && (
                <Badge variant="warn" className="text-[10px]">
                  <AlertTriangle size={9} className="mr-0.5" aria-hidden />
                  {t("work_ext_yes")}
                </Badge>
              )}
            </div>
            {stage && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-tx-3">
                  {t("work_panel_stage")}
                </p>
                <RuntimeSpine activeStage={stage} stageState="active" size="sm" showLabels={true} />
              </div>
            )}
          </div>

          <div className="border-t border-line" />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {item.estimatedMinutes != null && (
              <MetaRow label={t("work_panel_estimated")}>
                <span className="font-mono text-[13px]">
                  {item.estimatedMinutes}&nbsp;{t("home_min_est")}
                </span>
              </MetaRow>
            )}
            <MetaRow label={t("work_panel_external_label")}>
              <span className="font-mono text-[13px]">
                {item.externalEffect ? t("work_ext_yes") : t("work_ext_no")}
              </span>
            </MetaRow>
          </div>

          {/* Capabilities */}
          {item.requiredCapabilities.length > 0 && (
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-tx-3">
                {t("work_panel_capabilities")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.requiredCapabilities.map((cap) => (
                  <Badge key={cap} variant="default" className="font-mono text-[10px]">
                    {cap}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {deps.length > 0 && (
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-tx-3">
                {t("work_panel_depends")}
              </p>
              <div className="flex flex-col gap-1">
                {deps.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-2">
                    <GitBranch size={11} className="text-tx-3" aria-hidden />
                    <span className="font-mono text-[12px] text-tx-2">{dep.title}</span>
                    <StatusBadge status={dep.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocker */}
          <MetaRow label={t("work_panel_blocker")}>
            {blocker ? (
              <div className="rounded-ctl border border-err/25 bg-err/5 px-2.5 py-1.5">
                <p className="font-mono text-[12px] text-err">{blocker.question}</p>
                {blocker.blockingDependency && (
                  <p className="mt-0.5 font-mono text-[10px] text-tx-3">
                    {blocker.blockingDependency}
                  </p>
                )}
              </div>
            ) : (
              <span className="font-mono text-[12px] text-tx-3">{t("work_panel_no_blocker")}</span>
            )}
          </MetaRow>

          {/* Acceptance criteria */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-tx-3">
              {t("work_panel_acceptance")}
            </p>
            {item.acceptanceCriteria.length === 0 ? (
              <p className="font-mono text-[12px] text-tx-3">{t("work_panel_no_criteria")}</p>
            ) : (
              <ul className="space-y-1" role="list">
                {item.acceptanceCriteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-ok" aria-hidden />
                    <span className="text-[12px] text-tx-2">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Artifacts */}
          {itemArtifacts.length > 0 && (
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-tx-3">
                {t("work_panel_artifacts")}
              </p>
              <div className="flex flex-col gap-1">
                {itemArtifacts.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <FileText size={11} className="text-laiton" aria-hidden />
                    <span className="font-mono text-[12px] text-tx-1">{a.name}</span>
                    <Badge variant="default" className="text-[9px]">
                      {a.kind}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-wide text-tx-3">
                {t("work_panel_evidence_label")}
              </p>
              <span className="font-mono text-[10px] text-tx-3">{itemEvidence.length}</span>
            </div>
            {itemEvidence.length === 0 ? (
              <p className="font-mono text-[12px] text-tx-3">{t("home_evidence_none")}</p>
            ) : (
              <ul className="space-y-1.5" role="list">
                {itemEvidence.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start gap-2.5 rounded-ctl border border-line bg-bg-0/50 px-3 py-2"
                  >
                    <EvidIcon kind={ev.kind} result={ev.result} />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[12px] text-tx-1">{ev.label}</p>
                      <p className="font-mono text-[9px] text-tx-3">
                        {ev.kind} · {ev.id}
                      </p>
                    </div>
                    {ev.result && (
                      <Badge
                        variant={ev.result === "pass" ? "ok" : "err"}
                        className="shrink-0 text-[9px]"
                      >
                        {ev.result}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activity history */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-tx-3">
              {t("work_panel_activity")}
            </p>
            {allSteps.length === 0 ? (
              <p className="font-mono text-[12px] text-tx-3">{t("work_panel_no_activity")}</p>
            ) : (
              <ol className="relative border-l border-line/40 pl-4" role="list">
                {allSteps.map((step) => {
                  const stepActor = step.actorId ? actors.find((a) => a.id === step.actorId) : null;
                  return (
                    <li key={step.seq} className="mb-3 last:mb-0">
                      <div className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full border border-line bg-bg-1" />
                      <p className="font-mono text-[11px] text-tx-1">{step.summary}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant="default" className="text-[9px]">
                          {step.stage}
                        </Badge>
                        {stepActor && (
                          <span className="font-mono text-[10px] text-laiton">
                            {stepActor.name}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-tx-3">{fmtDate(step.at)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Actions footer */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-tx-3" aria-hidden />
            <span className="font-mono text-[10px] text-tx-3">{fmtDate(item.updatedAt)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onAssign(item)}>
              <User size={12} aria-hidden />
              {t("work_action_assign")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onTransition(item)}>
              <Zap size={12} aria-hidden />
              {t("work_action_transition")}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Create Dialog ────────────────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  requestedByActorId: string;
  requestedByName: string;
  actors: { id: string; name: string; type: string }[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string }[];
}

function CreateDialog({
  open,
  onClose,
  workspaceId,
  requestedByActorId,
  requestedByName,
  actors,
  clients,
  projects,
}: CreateDialogProps) {
  const t = useT();
  const { createWorkItem } = useAppStore();

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<WorkItem["priority"]>("P2");
  const [ownerId, setOwnerId] = useState(requestedByActorId);
  const [estimated, setEstimated] = useState("");
  const [risk, setRisk] = useState<WorkItem["risk"]>("low");
  const [external, setExternal] = useState(false);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [criterionInput, setCriterionInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredProjects = clientId ? projects.filter((p) => p.clientId === clientId) : projects;

  function reset() {
    setTitle("");
    setClientId("");
    setProjectId("");
    setPriority("P2");
    setOwnerId(requestedByActorId);
    setEstimated("");
    setRisk("low");
    setExternal(false);
    setCriteria([]);
    setCriterionInput("");
  }

  function addCriterion() {
    const v = criterionInput.trim();
    if (!v) return;
    setCriteria((c) => [...c, v]);
    setCriterionInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !ownerId) return;
    setSubmitting(true);
    try {
      await createWorkItem(
        {
          workspaceId,
          clientId: clientId || undefined,
          projectId: projectId || undefined,
          title: title.trim(),
          status: "todo",
          priority,
          ownerActorId: ownerId,
          assignedActorId: undefined,
          requiredCapabilities: [],
          dependsOn: [],
          blockerId: undefined,
          estimatedMinutes: estimated ? parseInt(estimated, 10) : undefined,
          risk,
          externalEffect: external,
          acceptanceCriteria: criteria,
        },
        requestedByActorId,
      );
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-tx-1">{t("work_form_create_title")}</h2>
        </div>

        {/* Policy banner */}
        <div className="border-b border-line bg-bg-0/60 px-5 py-2">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-tx-3">
              {t("home_requested_by")}: <span className="text-tx-1">{requestedByName}</span>
            </span>
            <span className="font-mono text-[10px] text-tx-3">
              {t("work_form_policy")}:{" "}
              <span className="text-ok">{t("work_form_policy_value")}</span>
            </span>
          </div>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] text-tx-2">{t("work_form_title_label")}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("work_form_title_ph")}
              autoFocus
              required
            />
          </div>

          {/* Client + Project */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] text-tx-2">
                {t("work_form_client_label")}
              </label>
              <SelectField
                value={clientId}
                onChange={(v) => {
                  setClientId(v);
                  setProjectId("");
                }}
              >
                <option value="">{t("work_form_none_option")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] text-tx-2">
                {t("work_form_project_label")}
              </label>
              <SelectField value={projectId} onChange={setProjectId}>
                <option value="">{t("work_form_none_option")}</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          {/* Priority + Owner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] text-tx-2">
                {t("work_form_priority_label")}
              </label>
              <SelectField
                value={priority}
                onChange={(v) => setPriority(v as WorkItem["priority"])}
              >
                {(["P0", "P1", "P2", "P3"] as const).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] text-tx-2">
                {t("work_form_owner_label")}
              </label>
              <SelectField value={ownerId} onChange={setOwnerId}>
                <option value="">{t("work_form_none_option")}</option>
                {actors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          {/* Risk + Estimated */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] text-tx-2">{t("work_form_risk_label")}</label>
              <SelectField value={risk} onChange={(v) => setRisk(v as WorkItem["risk"])}>
                {(["low", "medium", "high"] as const).map((r) => (
                  <option key={r} value={r}>
                    {t(RISK_KEY[r])}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] text-tx-2">
                {t("work_form_estimated_label")}
              </label>
              <Input
                type="number"
                min="1"
                value={estimated}
                onChange={(e) => setEstimated(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>

          {/* External effect */}
          <div className="flex items-center gap-2">
            <input
              id="ext-effect"
              type="checkbox"
              checked={external}
              onChange={(e) => setExternal(e.target.checked)}
              className="h-4 w-4 rounded-ctl border-line accent-or"
            />
            <label htmlFor="ext-effect" className="font-mono text-[12px] text-tx-2">
              {t("work_form_external_label")}
            </label>
          </div>

          {/* Acceptance criteria */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] text-tx-2">
              {t("work_form_acceptance_label")}
            </label>
            <div className="flex gap-2">
              <Input
                value={criterionInput}
                onChange={(e) => setCriterionInput(e.target.value)}
                placeholder={t("work_form_acceptance_ph")}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCriterion())}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addCriterion}>
                {t("work_form_add_criterion")}
              </Button>
            </div>
            {criteria.length > 0 && (
              <ul className="space-y-1" role="list">
                {criteria.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="shrink-0 text-ok" aria-hidden />
                    <span className="flex-1 text-[12px] text-tx-2">{c}</span>
                    <button
                      type="button"
                      onClick={() => setCriteria((cr) => cr.filter((_, j) => j !== i))}
                      className="text-tx-3 hover:text-err"
                      aria-label={t("work_form_remove_criterion")}
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {t("work_cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={!title.trim() || !ownerId || submitting}>
            {t("work_form_submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Assign Dialog ────────────────────────────────────────────────────────────

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  item: WorkItem | null;
  requestedByName: string;
  requestedByActorId: string;
  actors: { id: string; name: string; type: string }[];
}

function AssignDialog({
  open,
  onClose,
  item,
  requestedByName,
  requestedByActorId,
  actors,
}: AssignDialogProps) {
  const t = useT();
  const { assignWorkItem } = useAppStore();
  const [selectedId, setSelectedId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && item) setSelectedId(item.assignedActorId ?? "");
  }, [open, item]);

  async function handleConfirm() {
    if (!item || !selectedId) return;
    setSubmitting(true);
    try {
      await assignWorkItem(item.id, selectedId, requestedByActorId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!item) return null;
  const currentAssigned = item.assignedActorId
    ? actors.find((a) => a.id === item.assignedActorId)
    : null;

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold text-tx-1">{t("work_assign_title")}</h2>
        <p className="mt-0.5 font-mono text-[11px] text-tx-3 line-clamp-1">{item.title}</p>
      </div>

      {/* Policy banner */}
      <div className="border-b border-line bg-bg-0/60 px-5 py-2">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-tx-3">
            {t("home_requested_by")}: <span className="text-tx-1">{requestedByName}</span>
          </span>
          <span className="font-mono text-[10px] text-tx-3">
            {t("work_assign_policy")}:{" "}
            <span className="text-ok">{t("work_assign_policy_value")}</span>
          </span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[10px] uppercase tracking-wide text-tx-3">
            {t("work_assign_current")}
          </p>
          <p className="text-[13px] text-tx-1">
            {currentAssigned?.name ?? <span className="text-tx-3">{t("work_assign_none")}</span>}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] text-tx-2">{t("work_assign_select")}</label>
          <SelectField value={selectedId} onChange={setSelectedId}>
            <option value="">{t("work_form_none_option")}</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type})
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {t("work_cancel")}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={!selectedId || submitting}
        >
          {t("work_assign_confirm")}
        </Button>
      </div>
    </Dialog>
  );
}

// ─── Transition Dialog ────────────────────────────────────────────────────────

interface TransitionDialogProps {
  open: boolean;
  onClose: () => void;
  item: WorkItem | null;
  requestedByName: string;
  requestedByActorId: string;
}

function TransitionDialog({
  open,
  onClose,
  item,
  requestedByName,
  requestedByActorId,
}: TransitionDialogProps) {
  const t = useT();
  const { transitionWorkItemStatus } = useAppStore();
  const [selected, setSelected] = useState<WorkStatus | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected("");
      setError(null);
    }
  }, [open]);

  const validTargets = item ? VALID_TRANSITIONS[item.status] : [];
  const hasEvidence = (item?.evidenceIds.length ?? 0) > 0;

  const doneBlocked = selected === "done" && !hasEvidence;
  const validation =
    item && selected ? validateTransition(item.status, selected as WorkStatus, hasEvidence) : null;

  async function handleConfirm() {
    if (!item || !selected) return;
    if (doneBlocked) return;
    setSubmitting(true);
    setError(null);
    try {
      await transitionWorkItemStatus(item.id, selected as WorkStatus, requestedByActorId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold text-tx-1">{t("work_transition_title")}</h2>
        <p className="mt-0.5 font-mono text-[11px] text-tx-3 line-clamp-1">{item.title}</p>
      </div>

      {/* Policy banner */}
      <div className="border-b border-line bg-bg-0/60 px-5 py-2">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-tx-3">
            {t("home_requested_by")}: <span className="text-tx-1">{requestedByName}</span>
          </span>
          <span className="font-mono text-[10px] text-tx-3">
            {t("work_transition_policy")}:{" "}
            <span className="text-ok">{t("work_transition_policy_value")}</span>
          </span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-tx-3">
              {t("work_transition_current")}
            </p>
            <StatusBadge status={item.status} />
          </div>
          {selected && (
            <>
              <ChevronDown size={14} className="shrink-0 rotate-[-90deg] text-tx-3" aria-hidden />
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-tx-3">
                  {t("work_transition_target")}
                </p>
                <StatusBadge status={selected as WorkStatus} />
              </div>
            </>
          )}
        </div>

        {validTargets.length === 0 ? (
          <p className="font-mono text-[12px] text-tx-3">{t("work_transition_no_options")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {validTargets.map((target) => {
              const isDone = target === "done";
              const blocked = isDone && !hasEvidence;
              return (
                <button
                  key={target}
                  type="button"
                  onClick={() => !blocked && setSelected(target)}
                  disabled={blocked}
                  className={cn(
                    "flex items-center gap-3 rounded-ctl border px-3 py-2.5 text-left transition-colors",
                    selected === target
                      ? "border-or bg-or/10"
                      : blocked
                        ? "cursor-not-allowed border-line/30 opacity-40"
                        : "border-line hover:border-line/80 hover:bg-bg-2",
                  )}
                >
                  <StatusBadge status={target} />
                  {blocked && (
                    <span className="ml-auto font-mono text-[10px] text-warn">
                      {t("work_transition_no_evidence_warn")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {doneBlocked && (
          <div className="flex items-start gap-2 rounded-ctl border border-warn/30 bg-warn/10 px-3 py-2">
            <AlertCircle size={13} className="mt-0.5 shrink-0 text-warn" aria-hidden />
            <p className="font-mono text-[12px] text-warn">
              {t("work_transition_no_evidence_warn")}
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-ctl border border-err/30 bg-err/10 px-3 py-2">
            <AlertCircle size={13} className="mt-0.5 shrink-0 text-err" aria-hidden />
            <p className="font-mono text-[12px] text-err">{error}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {t("work_cancel")}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={!selected || doneBlocked || submitting || validation?.ok === false}
        >
          {t("work_transition_confirm")}
        </Button>
      </div>
    </Dialog>
  );
}

// ─── Main Work component ──────────────────────────────────────────────────────

export default function Work() {
  const t = useT();
  const { role } = useUIStore();
  const { workItems, actors, clients, projects, activeWorkspaceId } = useAppStore();

  const [view, setView] = useState<View>("table");
  const [filters, setFilters] = useState<Filters>(INIT_FILTERS);
  const [sort, setSort] = useState<{ field: SortField; dir: "asc" | "desc" }>({
    field: "updatedAt",
    dir: "desc",
  });
  const [panelItem, setPanelItem] = useState<WorkItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignItem, setAssignItem] = useState<WorkItem | null>(null);
  const [transitionItem, setTransitionItem] = useState<WorkItem | null>(null);

  // Close panel on Escape
  useEffect(() => {
    if (!panelItem) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelItem(null);
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [panelItem]);

  // Current user actor
  const currentActor = useMemo(() => actors.find((a) => a.name === role), [actors, role]);
  const currentActorId = currentActor?.id ?? role;

  // Workspace-scoped data
  const wsItems = useMemo(
    () => workItems.filter((wi) => wi.workspaceId === activeWorkspaceId),
    [workItems, activeWorkspaceId],
  );

  const wsClients = useMemo(() => {
    const ids = new Set(wsItems.filter((wi) => wi.clientId).map((wi) => wi.clientId!));
    return clients.filter((c) => ids.has(c.id));
  }, [wsItems, clients]);

  const wsProjects = useMemo(() => {
    const ids = new Set(wsItems.filter((wi) => wi.projectId).map((wi) => wi.projectId!));
    return projects.filter((p) => ids.has(p.id));
  }, [wsItems, projects]);

  // Filtered + sorted items
  const filtered = useMemo(() => {
    let items = wsItems;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (wi) => wi.title.toLowerCase().includes(q) || wi.id.toLowerCase().includes(q),
      );
    }
    if (filters.statuses.length) {
      items = items.filter((wi) => filters.statuses.includes(wi.status));
    }
    if (filters.clientIds.length) {
      items = items.filter((wi) => wi.clientId && filters.clientIds.includes(wi.clientId));
    }
    if (filters.projectIds.length) {
      items = items.filter((wi) => wi.projectId && filters.projectIds.includes(wi.projectId));
    }
    if (filters.actorIds.length) {
      items = items.filter(
        (wi) =>
          filters.actorIds.includes(wi.ownerActorId) ||
          (wi.assignedActorId && filters.actorIds.includes(wi.assignedActorId)),
      );
    }
    if (filters.priorities.length) {
      items = items.filter((wi) => filters.priorities.includes(wi.priority));
    }
    if (filters.risks.length) {
      items = items.filter((wi) => filters.risks.includes(wi.risk));
    }
    if (filters.externalEffect !== null) {
      items = items.filter((wi) => wi.externalEffect === filters.externalEffect);
    }

    return [...items].sort((a, b) => {
      let cmp = 0;
      if (sort.field === "title") cmp = a.title.localeCompare(b.title);
      else if (sort.field === "status")
        cmp = STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      else if (sort.field === "priority")
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      else if (sort.field === "updatedAt") cmp = a.updatedAt.localeCompare(b.updatedAt);
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [wsItems, filters, sort]);

  function handleSort(field: SortField) {
    setSort((s) =>
      s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" },
    );
  }

  function handleSelect(item: WorkItem) {
    setPanelItem(item);
  }

  function handleAssign(item: WorkItem) {
    setPanelItem(null);
    setAssignItem(item);
  }

  function handleTransition(item: WorkItem) {
    setPanelItem(null);
    setTransitionItem(item);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ListTodo size={16} className="text-tx-3" aria-hidden="true" />
        <h1 className="text-sm font-semibold">{t("nav_work")}</h1>
        <Badge variant="laiton" className="ml-auto font-mono text-[10px]">
          {t("home_mock_badge")}
        </Badge>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={13} aria-hidden />
          {t("work_new_item")}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-bg-1 px-3 py-2.5">
        {/* Search */}
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tx-3"
            aria-hidden
          />
          <Input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder={t("work_search_placeholder")}
            className="h-7 w-40 pl-7 text-[12px]"
            aria-label={t("work_search_placeholder")}
          />
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-1 border-l border-line pl-2">
          {STATUSES.map((s) => (
            <FChip
              key={s}
              label={STATUS_ABBR[s]}
              active={filters.statuses.includes(s)}
              variant={STATUS_BADGE[s]}
              title={t(STATUS_KEY[s])}
              onClick={() => setFilters((f) => ({ ...f, statuses: toggle(f.statuses, s) }))}
            />
          ))}
        </div>

        {/* Priority chips */}
        <div className="flex items-center gap-1 border-l border-line pl-2">
          {(["P0", "P1", "P2", "P3"] as const).map((p) => (
            <FChip
              key={p}
              label={p}
              active={filters.priorities.includes(p)}
              variant={PRIORITY_BADGE[p]}
              onClick={() => setFilters((f) => ({ ...f, priorities: toggle(f.priorities, p) }))}
            />
          ))}
        </div>

        {/* Client */}
        <div className="border-l border-line pl-2">
          <SelectField
            value={filters.clientIds[0] ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, clientIds: v ? [v] : [] }))}
            className="h-7 w-32 text-[12px]"
          >
            <option value="">{t("work_col_client")}</option>
            {wsClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </div>

        {/* Project */}
        <div className="border-l border-line pl-2">
          <SelectField
            value={filters.projectIds[0] ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, projectIds: v ? [v] : [] }))}
            className="h-7 w-32 text-[12px]"
          >
            <option value="">{t("work_col_project")}</option>
            {wsProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
        </div>

        {/* Actor */}
        <div className="border-l border-line pl-2">
          <SelectField
            value={filters.actorIds[0] ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, actorIds: v ? [v] : [] }))}
            className="h-7 w-32 text-[12px]"
          >
            <option value="">{t("work_filter_actor")}</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </SelectField>
        </div>

        {/* Risk chips */}
        <div className="flex items-center gap-1 border-l border-line pl-2">
          {(["low", "medium", "high"] as const).map((r) => (
            <FChip
              key={r}
              label={r.slice(0, 1).toUpperCase()}
              active={filters.risks.includes(r)}
              variant={RISK_BADGE[r]}
              title={t(RISK_KEY[r])}
              onClick={() => setFilters((f) => ({ ...f, risks: toggle(f.risks, r) }))}
            />
          ))}
        </div>

        {/* External filter */}
        <div className="flex items-center gap-1 border-l border-line pl-2">
          <FChip
            label={t("work_ext_filter_all")}
            active={filters.externalEffect === null}
            onClick={() => setFilters((f) => ({ ...f, externalEffect: null }))}
          />
          <FChip
            label={t("work_ext_filter_yes")}
            active={filters.externalEffect === true}
            variant="warn"
            onClick={() => setFilters((f) => ({ ...f, externalEffect: true }))}
          />
          <FChip
            label={t("work_ext_filter_no")}
            active={filters.externalEffect === false}
            onClick={() => setFilters((f) => ({ ...f, externalEffect: false }))}
          />
        </div>

        {/* Clear */}
        {hasFilters(filters) && (
          <button
            type="button"
            onClick={() => setFilters(INIT_FILTERS)}
            className="ml-auto flex items-center gap-1 rounded-ctl px-2 py-0.5 font-mono text-[10px] text-tx-3 hover:bg-bg-2 hover:text-err"
          >
            <X size={10} aria-hidden />
            {t("work_clear_filters")}
          </button>
        )}
      </div>

      {/* Count + view toggle */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-tx-3">
          {filtered.length} {t("work_items_count")}
        </span>
        <div className="ml-auto flex items-center gap-1 rounded-ctl border border-line p-0.5">
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "rounded-ctl px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-or",
              view === "table" ? "bg-bg-2 text-tx-1" : "text-tx-3 hover:text-tx-2",
            )}
            aria-label={t("work_view_table")}
            aria-pressed={view === "table"}
          >
            <AlignLeft size={13} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn(
              "rounded-ctl px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-or",
              view === "kanban" ? "bg-bg-2 text-tx-1" : "text-tx-3 hover:text-tx-2",
            )}
            aria-label={t("work_view_kanban")}
            aria-pressed={view === "kanban"}
          >
            <LayoutGrid size={13} aria-hidden />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
          <p className="text-[13px] text-tx-2">{t("empty_work")}</p>
          <p className="font-mono text-xs text-tx-3">{t("action_work")}</p>
        </div>
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-card border border-line bg-bg-1">
          <WorkTable
            items={filtered}
            sort={sort}
            onSort={handleSort}
            onSelect={handleSelect}
            actors={actors}
            clients={clients}
            projects={projects}
          />
        </div>
      ) : (
        <WorkKanban items={filtered} onSelect={handleSelect} actors={actors} />
      )}

      {/* Detail panel */}
      {panelItem && (
        <WorkPanel
          item={panelItem}
          onClose={() => setPanelItem(null)}
          onAssign={handleAssign}
          onTransition={handleTransition}
        />
      )}

      {/* Dialogs */}
      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaceId={activeWorkspaceId}
        requestedByActorId={currentActorId}
        requestedByName={role}
        actors={actors}
        clients={clients}
        projects={projects}
      />

      <AssignDialog
        open={!!assignItem}
        onClose={() => {
          setAssignItem(null);
        }}
        item={assignItem}
        requestedByName={role}
        requestedByActorId={currentActorId}
        actors={actors}
      />

      <TransitionDialog
        open={!!transitionItem}
        onClose={() => {
          setTransitionItem(null);
        }}
        item={transitionItem}
        requestedByName={role}
        requestedByActorId={currentActorId}
      />
    </div>
  );
}

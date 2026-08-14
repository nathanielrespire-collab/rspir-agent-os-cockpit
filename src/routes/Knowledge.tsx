import { useState, useCallback, useMemo } from "react";
import { Brain, Copy, Check, ArrowRight } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { verifyChain, shortHash } from "@/lib/signature";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import { ChainStatusBar, type ChainPhase } from "@/components/ChainStatusBar";
import type { KnowledgeItem, Decision } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "current" | "decisions" | "knowledge";

// ─── Mock Notion sync data ────────────────────────────────────────────────────

const NOTION_MOCK = {
  lastSync: "2026-08-13T07:30:00Z",
  pagesUpdated: 8,
  failures: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string): string {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

// ─── HashCell ────────────────────────────────────────────────────────────────

function HashCell({ hash }: { hash: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="flex items-center gap-1">
      <span className="font-mono text-[11px] text-tx-2" title={hash}>
        {shortHash(hash)}
      </span>
      <button
        onClick={copy}
        className="text-tx-3 transition-colors hover:text-tx-1"
        aria-label={t("ledger_copy_hash")}
        type="button"
      >
        {copied ? <Check size={9} className="text-ok" /> : <Copy size={9} />}
      </button>
    </span>
  );
}

// ─── ConfidenceBadge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: KnowledgeItem["confidence"] }) {
  const t = useT();
  const map: Record<
    KnowledgeItem["confidence"],
    { label: () => string; variant: "ok" | "warn" | "err" }
  > = {
    high: { label: () => t("kn_conf_high"), variant: "ok" },
    medium: { label: () => t("kn_conf_medium"), variant: "warn" },
    low: { label: () => t("kn_conf_low"), variant: "err" },
  };
  const { label, variant } = map[confidence];
  return (
    <Badge variant={variant} className="text-[9px]">
      {label()}
    </Badge>
  );
}

// ─── FreshnessBadge ──────────────────────────────────────────────────────────

function FreshnessBadge({ freshness }: { freshness: KnowledgeItem["freshness"] }) {
  const t = useT();
  const map: Record<
    KnowledgeItem["freshness"],
    { label: () => string; variant: "ok" | "warn" | "err" }
  > = {
    fresh: { label: () => t("kn_fresh_fresh"), variant: "ok" },
    aging: { label: () => t("kn_fresh_aging"), variant: "warn" },
    stale: { label: () => t("kn_fresh_stale"), variant: "err" },
  };
  const { label, variant } = map[freshness];
  return (
    <Badge variant={variant} className="text-[9px]">
      {label()}
    </Badge>
  );
}

// ─── KnowledgeCard ───────────────────────────────────────────────────────────

function KnowledgeCard({ item, clientName }: { item: KnowledgeItem; clientName?: string }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-bg-1/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-tx-1">{item.title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <ConfidenceBadge confidence={item.confidence} />
          <FreshnessBadge freshness={item.freshness} />
        </div>
      </div>

      <p className="font-mono text-[12px] leading-relaxed text-tx-2">{item.content}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line/40 pt-2">
        <span className="font-mono text-[10px] text-tx-3">
          <span className="text-tx-3">{t("kn_source")}: </span>
          <span className="text-tx-2">{item.source}</span>
        </span>
        {clientName && (
          <span className="font-mono text-[10px] text-tx-3">
            <span className="text-tx-3">{t("kn_client_label")}: </span>
            <span className="text-tx-2">{clientName}</span>
          </span>
        )}
        <span className="font-mono text-[10px] text-tx-3">{fmt(item.createdAt)}</span>
        {item.relatedIds.length > 0 && (
          <span className="font-mono text-[10px] text-tx-3">
            <span className="text-tx-3">{t("kn_related")}: </span>
            <span className="text-tx-2">{item.relatedIds.join(", ")}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── DecisionRow ─────────────────────────────────────────────────────────────

function DecisionRow({
  decision,
  actorName,
  broken,
}: {
  decision: Decision;
  actorName: string | undefined;
  broken: boolean;
}) {
  const t = useT();
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-line/30 px-4 py-3 last:border-b-0",
        broken && "border-l-2 border-l-err bg-err/5",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="w-14 shrink-0 font-mono text-[10px] text-tx-3">
          ·{String(decision.seq).padStart(3, "0")}
        </span>
        <HashCell hash={decision.hash} />
        <span className="min-w-0 flex-1 text-[13px] font-medium text-tx-1">{decision.title}</span>
        <Badge variant="default" className="shrink-0 text-[9px]">
          {t("kn_dec_immutable")}
        </Badge>
      </div>

      <div className="ml-[3.5rem] flex flex-col gap-1">
        <p className="font-mono text-[12px] leading-relaxed text-tx-2">{decision.rationale}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
          <span className="font-mono text-[10px] text-tx-3">
            <span className="text-tx-3">{t("kn_dec_by")}: </span>
            <span className="text-tx-2">{actorName ?? decision.byActorId}</span>
          </span>
          <span className="font-mono text-[10px] text-tx-3">{fmt(decision.at)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── NotionPanel ─────────────────────────────────────────────────────────────

function NotionPanel() {
  const t = useT();
  return (
    <div className="flex w-64 shrink-0 flex-col gap-3 rounded-card border border-line bg-bg-1/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-tx-1">{t("kn_notion_title")}</span>
        <Badge variant="laiton" className="text-[9px]">
          {t("kn_notion_mock_badge")}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-ctl border border-laiton/30 bg-laiton/5 px-2.5 py-1.5">
          <span className="font-mono text-[10px] text-tx-3">{t("kn_notion_direction")}</span>
          <div className="flex flex-1 items-center justify-end gap-1 font-mono text-[10px] text-laiton">
            <span>{t("kn_notion_src")}</span>
            <ArrowRight size={10} aria-hidden />
            <span>{t("kn_notion_dest")}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-line/40 pt-2">
          <Row label={t("kn_notion_last_sync")} value={fmt(NOTION_MOCK.lastSync)} />
          <Row label={t("kn_notion_pages")} value={String(NOTION_MOCK.pagesUpdated)} ok />
          <Row
            label={t("kn_notion_failures")}
            value={String(NOTION_MOCK.failures)}
            ok={NOTION_MOCK.failures === 0}
            err={NOTION_MOCK.failures > 0}
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  ok,
  err,
}: {
  label: string;
  value: string;
  ok?: boolean;
  err?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] text-tx-3">{label}</span>
      <span
        className={cn("font-mono text-[11px]", ok ? "text-ok" : err ? "text-err" : "text-tx-2")}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Knowledge() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("current");
  const [chainState, setChainState] = useState<ChainPhase>({ phase: "idle" });

  const { knowledge, decisions, actors, clients, activeWorkspaceId } = useAppStore();

  const actorMap = useMemo(() => new Map(actors.map((a) => [a.id, a])), [actors]);
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const wsDecisions = useMemo(
    () =>
      decisions.filter((d) => d.workspaceId === activeWorkspaceId).sort((a, b) => a.seq - b.seq),
    [decisions, activeWorkspaceId],
  );

  const currentItems = useMemo(
    () =>
      knowledge.filter((k) => k.workspaceId === activeWorkspaceId && k.layer === "current_state"),
    [knowledge, activeWorkspaceId],
  );

  const knowledgeItems = useMemo(
    () => knowledge.filter((k) => k.workspaceId === activeWorkspaceId && k.layer === "knowledge"),
    [knowledge, activeWorkspaceId],
  );

  const runVerify = useCallback(async () => {
    setChainState({ phase: "checking" });
    const idx = await verifyChain(wsDecisions);
    const brokenSeq = idx !== null ? (wsDecisions[idx]?.seq ?? null) : null;
    setChainState({ phase: "done", brokenSeq, checkedAt: new Date().toISOString() });
  }, [wsDecisions]);

  const isDecisionBroken = (seq: number): boolean => {
    if (chainState.phase !== "done" || chainState.brokenSeq === null) return false;
    return seq >= chainState.brokenSeq;
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "current", label: t("kn_tab_current") },
    { id: "decisions", label: t("kn_tab_decisions") },
    { id: "knowledge", label: t("kn_tab_knowledge") },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <Brain size={16} className="text-tx-3" aria-hidden />
        <h1 className="text-sm font-semibold">{t("nav_knowledge")}</h1>
      </div>

      {/* ── Content: tabs + Notion panel ── */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Tab area */}
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {/* Tab bar */}
          <div
            className="flex gap-1 border-b border-line"
            role="tablist"
            aria-label={t("nav_knowledge")}
          >
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                type="button"
                className={cn(
                  "px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-or",
                  tab === id ? "border-b-2 border-or text-tx-1" : "text-tx-3 hover:text-tx-2",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel">
            {tab === "current" && (
              <div className="flex flex-col gap-3">
                {currentItems.length === 0 ? (
                  <p className="py-8 text-center font-mono text-[12px] text-tx-3">
                    {t("kn_no_items")}
                  </p>
                ) : (
                  currentItems.map((item) => (
                    <KnowledgeCard
                      key={item.id}
                      item={item}
                      clientName={item.clientId ? clientMap.get(item.clientId)?.name : undefined}
                    />
                  ))
                )}
              </div>
            )}

            {tab === "decisions" && (
              <div className="flex flex-col gap-3">
                {/* Chain integrity indicator */}
                <ChainStatusBar chainState={chainState} onVerify={runVerify} />

                {/* Decision list */}
                <div className="rounded-card border border-line">
                  {wsDecisions.length === 0 ? (
                    <p className="py-8 text-center font-mono text-[12px] text-tx-3">
                      {t("kn_no_decisions")}
                    </p>
                  ) : (
                    wsDecisions.map((dec) => (
                      <DecisionRow
                        key={dec.id}
                        decision={dec}
                        actorName={actorMap.get(dec.byActorId)?.name}
                        broken={isDecisionBroken(dec.seq)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {tab === "knowledge" && (
              <div className="flex flex-col gap-3">
                {knowledgeItems.length === 0 ? (
                  <p className="py-8 text-center font-mono text-[12px] text-tx-3">
                    {t("kn_no_items")}
                  </p>
                ) : (
                  knowledgeItems.map((item) => (
                    <KnowledgeCard
                      key={item.id}
                      item={item}
                      clientName={item.clientId ? clientMap.get(item.clientId)?.name : undefined}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notion sync panel */}
        <NotionPanel />
      </div>
    </div>
  );
}

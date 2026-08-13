import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Mic,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ListTodo,
  MessageSquareQuote,
} from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";

// ─── Flux step ───────────────────────────────────────────────────────────────

type FluxStep = {
  key: string;
  labelKey:
    | "mtg_flux_calendar"
    | "mtg_flux_prep"
    | "mtg_flux_meeting"
    | "mtg_flux_transcript"
    | "mtg_flux_extractions"
    | "mtg_flux_crm"
    | "mtg_flux_suivi";
  done: boolean;
};

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-tx-3">{label}</p>;
}

// ─── Bullet list ─────────────────────────────────────────────────────────────

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 font-mono text-[11px] text-tx-2">
          <span className="shrink-0 text-tx-3">·</span>
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-ctl border border-line bg-bg-1 p-3">
      <SectionLabel label={label} />
      {children}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function MeetingDetail() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { meetings, transcripts, clients, contacts, providers, workItems, blockers } =
    useAppStore();

  const [activeTab, setActiveTab] = useState<"avant" | "apres">("avant");

  const meeting = meetings.find((m) => m.id === id);

  if (!meeting) {
    return (
      <div className="flex h-full flex-col">
        <button
          onClick={() => navigate("/meetings")}
          className="mb-4 flex items-center gap-1.5 text-[11px] text-tx-3 hover:text-tx-2"
        >
          <ArrowLeft size={12} />
          {t("mtg_back")}
        </button>
        <div className="flex flex-1 items-center justify-center">
          <p className="font-mono text-[13px] text-tx-3">—</p>
        </div>
      </div>
    );
  }

  const client = clients.find((c) => c.id === meeting.clientId);
  const transcript = meeting.transcriptId
    ? transcripts.find((tr) => tr.id === meeting.transcriptId)
    : undefined;
  const transcriptProvider = transcript
    ? providers.find((p) => p.id === transcript.providerId)
    : undefined;
  const attendees = contacts.filter((c) => meeting.attendeeContactIds.includes(c.id));

  const createdWorkItems = meeting.outcomes?.createdWorkItemIds
    ? workItems.filter((wi) => meeting.outcomes!.createdWorkItemIds.includes(wi.id))
    : [];

  const meetingBlockers = meeting.outcomes?.blockerIds
    ? blockers.filter((b) => meeting.outcomes!.blockerIds.includes(b.id))
    : [];

  const meetingDate = new Date(meeting.at).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasOutcomes = !!meeting.outcomes;
  const hasPrep = !!meeting.prep;

  const fluxSteps: FluxStep[] = [
    { key: "calendar", labelKey: "mtg_flux_calendar", done: true },
    { key: "prep", labelKey: "mtg_flux_prep", done: hasPrep },
    { key: "meeting", labelKey: "mtg_flux_meeting", done: hasOutcomes || !!transcript },
    { key: "transcript", labelKey: "mtg_flux_transcript", done: !!transcript },
    { key: "extractions", labelKey: "mtg_flux_extractions", done: hasOutcomes },
    { key: "crm", labelKey: "mtg_flux_crm", done: hasOutcomes },
    { key: "suivi", labelKey: "mtg_flux_suivi", done: hasOutcomes },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/meetings")}
          className="mb-3 flex items-center gap-1.5 text-[11px] text-tx-3 hover:text-tx-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
        >
          <ArrowLeft size={12} aria-hidden />
          {t("mtg_back")}
        </button>

        <div className="flex flex-wrap items-start gap-2">
          <CalendarDays size={15} className="mt-0.5 shrink-0 text-tx-3" aria-hidden />
          <h1 className="flex-1 text-sm font-semibold text-tx-1">{meeting.title}</h1>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 pl-[23px]">
          <span className="font-mono text-[11px] text-tx-3">{meetingDate}</span>
          {client && (
            <Link
              to={`/clients/${client.id}`}
              className="font-mono text-[11px] text-info hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-or"
            >
              {client.name}
            </Link>
          )}
          {transcript ? (
            <Badge variant="laiton" className="text-[9px]">
              {t("mtg_has_transcript")}
            </Badge>
          ) : (
            <Badge variant="default" className="text-[9px]">
              {t("mtg_no_transcript")}
            </Badge>
          )}
          <Badge variant="warn" className="font-mono text-[9px]">
            {t("mtg_mock_badge")}
          </Badge>
        </div>
      </div>

      {/* Flux pipeline */}
      <div className="mb-5 overflow-x-auto">
        <div
          className="flex min-w-max items-center gap-0"
          role="list"
          aria-label={t("mtg_flux_label")}
        >
          {fluxSteps.map((step, idx) => (
            <div key={step.key} className="flex items-center" role="listitem">
              <div
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-1.5 rounded-ctl border text-center",
                  step.done
                    ? "border-laiton/40 bg-laiton/10 text-laiton"
                    : "border-line bg-bg-1 text-tx-3",
                )}
              >
                <span className="font-mono text-[9px] uppercase tracking-wide leading-none">
                  {t(step.labelKey)}
                </span>
                <div
                  className={cn("h-1 w-1 rounded-full", step.done ? "bg-laiton" : "bg-tx-3/40")}
                />
              </div>
              {idx < fluxSteps.length - 1 && (
                <ChevronRight size={10} className="shrink-0 text-tx-3/50" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Attendees */}
      {attendees.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Users size={12} className="shrink-0 text-tx-3" aria-hidden />
          <span className="font-mono text-[10px] text-tx-3 uppercase tracking-wide">
            {t("mtg_attendees")}
          </span>
          {attendees.map((a) => (
            <span
              key={a.id}
              className="rounded-ctl border border-line bg-bg-2 px-2 py-0.5 font-mono text-[10px] text-tx-2"
            >
              {a.name}
              {a.role && <span className="ml-1 text-tx-3">· {a.role}</span>}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-0 border-b border-line" role="tablist">
        {(["avant", "apres"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or",
              activeTab === tab
                ? "border-b-2 border-or text-or -mb-px"
                : "text-tx-3 hover:text-tx-2",
            )}
          >
            {tab === "avant" ? t("mtg_tab_avant") : t("mtg_tab_apres")}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "avant" && (
          <div role="tabpanel" aria-label={t("mtg_tab_avant")}>
            {!hasPrep ? (
              <p className="font-mono text-[13px] text-tx-3">{t("mtg_no_prep")}</p>
            ) : (
              <div className="space-y-3">
                {/* Context */}
                <Section label={t("mtg_section_context")}>
                  <p className="font-mono text-[11px] leading-relaxed text-tx-2">
                    {meeting.prep!.context}
                  </p>
                </Section>

                {/* Recent comms */}
                {meeting.prep!.recentComms.length > 0 && (
                  <Section label={t("mtg_section_comms")}>
                    <BulletList items={meeting.prep!.recentComms} />
                  </Section>
                )}

                {/* Previous commitments */}
                {meeting.prep!.previousCommitments.length > 0 && (
                  <Section label={t("mtg_section_prev_commitments")}>
                    <BulletList items={meeting.prep!.previousCommitments} />
                  </Section>
                )}

                {/* Open questions */}
                {meeting.prep!.openQuestions.length > 0 && (
                  <Section label={t("mtg_section_questions")}>
                    <ul className="space-y-1">
                      {meeting.prep!.openQuestions.map((q, i) => (
                        <li key={i} className="flex gap-2 font-mono text-[11px] text-or">
                          <span className="shrink-0">?</span>
                          <span className="leading-snug">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Suggested agenda */}
                {meeting.prep!.suggestedAgenda.length > 0 && (
                  <Section label={t("mtg_section_agenda")}>
                    <BulletList items={meeting.prep!.suggestedAgenda} />
                  </Section>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "apres" && (
          <div role="tabpanel" aria-label={t("mtg_tab_apres")}>
            {!hasOutcomes ? (
              <p className="font-mono text-[13px] text-tx-3">{t("mtg_no_outcomes")}</p>
            ) : (
              <div className="space-y-3">
                {/* Transcript excerpt */}
                {transcript && (
                  <div className="rounded-ctl border border-laiton/30 bg-laiton/5 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Mic size={12} className="text-laiton" aria-hidden />
                      <span className="font-mono text-[9px] uppercase tracking-widest text-laiton">
                        {t("mtg_section_transcript")}
                      </span>
                      {transcriptProvider && (
                        <span className="ml-auto font-mono text-[9px] text-tx-3">
                          {t("mtg_transcript_source")}: {transcriptProvider.name}
                        </span>
                      )}
                    </div>
                    <blockquote className="border-l-2 border-laiton/40 pl-3 font-mono text-[11px] italic leading-relaxed text-tx-2">
                      {transcript.excerpt}
                    </blockquote>
                    {transcript.fullTextAvailable && (
                      <p className="mt-2 font-mono text-[9px] text-ok">· {t("mtg_full_text")}</p>
                    )}
                  </div>
                )}

                {/* Decisions */}
                {meeting.outcomes!.decisions.length > 0 && (
                  <div className="rounded-ctl border border-line bg-bg-1 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-ok" aria-hidden />
                      <SectionLabel label={t("mtg_section_decisions")} />
                    </div>
                    <BulletList items={meeting.outcomes!.decisions} />
                  </div>
                )}

                {/* Commitments */}
                {meeting.outcomes!.commitments.length > 0 && (
                  <Section label={t("mtg_section_commitments")}>
                    <BulletList items={meeting.outcomes!.commitments} />
                  </Section>
                )}

                {/* Created tasks — provenance visible */}
                {createdWorkItems.length > 0 && (
                  <div className="rounded-ctl border border-line bg-bg-1 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <ListTodo size={12} className="text-info" aria-hidden />
                      <SectionLabel label={t("mtg_section_tasks")} />
                    </div>
                    <ul className="space-y-1.5">
                      {createdWorkItems.map((wi) => (
                        <li key={wi.id}>
                          <Link
                            to={`/work?search=${wi.id}`}
                            className="group flex items-center gap-2 rounded border border-line/50 bg-bg-0/50 px-2.5 py-1.5 hover:border-info/40 hover:bg-info/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
                          >
                            <span className="flex-1 font-mono text-[11px] text-tx-2 group-hover:text-tx-1">
                              {wi.title}
                            </span>
                            <span className="shrink-0 font-mono text-[9px] text-tx-3">{wi.id}</span>
                            <span className="shrink-0 font-mono text-[9px] text-info">
                              {t("mtg_view_in_work")} →
                            </span>
                          </Link>
                          <p className="mt-0.5 pl-2.5 font-mono text-[9px] text-tx-3">
                            {t("mtg_created_from")}: {meeting.title}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Facts */}
                {meeting.outcomes!.facts.length > 0 && (
                  <div className="rounded-ctl border border-line bg-bg-1 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText size={12} className="text-tx-3" aria-hidden />
                      <SectionLabel label={t("mtg_section_facts")} />
                    </div>
                    <BulletList items={meeting.outcomes!.facts} />
                  </div>
                )}

                {/* Blockers */}
                {meetingBlockers.length > 0 && (
                  <div className="rounded-ctl border border-warn/30 bg-warn/5 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle size={12} className="text-warn" aria-hidden />
                      <SectionLabel label={t("mtg_section_blockers")} />
                    </div>
                    <ul className="space-y-1">
                      {meetingBlockers.map((b) => (
                        <li key={b.id}>
                          <Link
                            to="/blockers"
                            className="font-mono text-[11px] text-warn hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-or"
                          >
                            · {b.question}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested updates (transcript evidence citation) */}
                {transcript && (
                  <div className="rounded-ctl border border-line bg-bg-1 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquareQuote size={12} className="text-laiton" aria-hidden />
                      <SectionLabel label={t("mtg_provenance")} />
                    </div>
                    <p className="font-mono text-[10px] text-tx-3">
                      {t("mtg_transcript_source")}: {transcript.id} ·{" "}
                      {transcriptProvider?.name ?? "—"} ·{" "}
                      {transcript.fullTextAvailable ? t("mtg_full_text") : "—"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

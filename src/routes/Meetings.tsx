import { CalendarDays, Mic, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useT } from "@/lib/hooks";
import { useAppStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";

export default function Meetings() {
  const t = useT();
  const { meetings, clients, transcripts, activeWorkspaceId } = useAppStore();
  const { activeClientId } = useUIStore();

  const workspaceMeetings = meetings
    .filter((m) => m.workspaceId === activeWorkspaceId)
    .filter((m) => !activeClientId || m.clientId === activeClientId)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  if (workspaceMeetings.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader count={0} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
          <p className="text-[13px] text-tx-2">{t("empty_meetings")}</p>
          <p className="font-mono text-xs text-tx-3">{t("action_meetings")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader count={workspaceMeetings.length} />

      <div className="space-y-2">
        {workspaceMeetings.map((meeting) => {
          const client = clients.find((c) => c.id === meeting.clientId);
          const hasTranscript = !!meeting.transcriptId;
          const transcript = meeting.transcriptId
            ? transcripts.find((tr) => tr.id === meeting.transcriptId)
            : undefined;
          const hasOutcomes = !!meeting.outcomes;
          const taskCount = meeting.outcomes?.createdWorkItemIds.length ?? 0;

          const meetingDate = new Date(meeting.at).toLocaleDateString("fr-CA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          return (
            <Link
              key={meeting.id}
              to={`/meetings/${meeting.id}`}
              className="group flex items-start gap-3 rounded-card border border-line bg-bg-1 p-4 hover:border-laiton/40 hover:bg-bg-2/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or transition-colors"
            >
              <CalendarDays
                size={14}
                className={cn(
                  "mt-0.5 shrink-0 transition-colors",
                  hasOutcomes ? "text-laiton" : "text-tx-3",
                )}
                aria-hidden
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-2">
                  <p className="flex-1 text-[13px] font-semibold text-tx-1 group-hover:text-tx-1">
                    {meeting.title}
                  </p>
                  {hasTranscript && (
                    <Mic size={11} className="mt-0.5 shrink-0 text-laiton" aria-hidden />
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-tx-3">{meetingDate}</span>
                  {client && <span className="font-mono text-[10px] text-info">{client.name}</span>}
                  {hasOutcomes && taskCount > 0 && (
                    <Badge variant="laiton" className="text-[9px]">
                      {taskCount} {t("mtg_section_tasks").toLowerCase()}
                    </Badge>
                  )}
                  {hasOutcomes && !hasTranscript && (
                    <Badge variant="default" className="text-[9px]">
                      {t("mtg_no_transcript")}
                    </Badge>
                  )}
                </div>

                {meeting.prep?.context && !hasOutcomes && (
                  <p className="mt-1.5 font-mono text-[10px] leading-snug text-tx-3 line-clamp-2">
                    {meeting.prep.context}
                  </p>
                )}

                {transcript?.excerpt && (
                  <p className="mt-1.5 font-mono text-[10px] leading-snug text-tx-3 line-clamp-2 italic">
                    "{transcript.excerpt.slice(0, 120)}…"
                  </p>
                )}
              </div>

              <ChevronRight
                size={13}
                className="mt-0.5 shrink-0 text-tx-3 group-hover:text-tx-2"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PageHeader({ count }: { count: number }) {
  const t = useT();
  return (
    <div className="mb-5 flex items-center gap-2">
      <CalendarDays size={16} className="text-tx-3" aria-hidden />
      <h1 className="text-sm font-semibold">{t("nav_meetings")}</h1>
      {count > 0 && (
        <span className="font-mono text-[11px] text-tx-3">
          {count} {t("mtg_count")}
        </span>
      )}
    </div>
  );
}

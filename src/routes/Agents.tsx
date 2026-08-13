import { Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { ActorCard } from "@/components/actors/ActorCard";

export default function Agents() {
  const t = useT();
  const navigate = useNavigate();
  const { actors, providers, workItems, policies } = useAppStore();

  const agents = actors.filter((a) => a.type === "ai_agent");

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-2">
        <Bot size={16} className="text-tx-3" aria-hidden />
        <h1 className="text-sm font-semibold">{t("nav_agents")}</h1>
        <Badge variant="laiton" className="ml-1 font-mono text-[10px]">
          {agents.length} {t("agent_count")}
        </Badge>
        <span className="ml-2 font-mono text-[11px] text-tx-3">{t("agent_control_center")}</span>
        <Badge variant="laiton" className="ml-auto font-mono text-[10px]">
          {t("home_mock_badge")}
        </Badge>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
          <p className="text-[13px] text-tx-2">{t("empty_agents")}</p>
          <p className="font-mono text-xs text-tx-3">{t("action_agents")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {agents.map((actor) => {
            const provider = actor.providerId
              ? providers.find((p) => p.id === actor.providerId)
              : undefined;
            const assigned = workItems.filter((wi) => wi.assignedActorId === actor.id);
            return (
              <ActorCard
                key={actor.id}
                actor={actor}
                provider={provider}
                assignedItems={assigned}
                policies={policies}
                onClick={() => navigate(`/agents/${actor.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

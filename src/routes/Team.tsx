import { UserCog } from "lucide-react";
import { useT } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { ActorCard } from "@/components/actors/ActorCard";

export default function Team() {
  const t = useT();
  const { actors, providers, workItems, policies } = useAppStore();

  const humans = actors.filter((a) => a.type === "human");

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-2">
        <UserCog size={16} className="text-tx-3" aria-hidden />
        <h1 className="text-sm font-semibold">{t("nav_team")}</h1>
        <Badge variant="default" className="ml-1 font-mono text-[10px]">
          {humans.length} {t("team_count")}
        </Badge>
        <Badge variant="laiton" className="ml-auto font-mono text-[10px]">
          {t("home_mock_badge")}
        </Badge>
      </div>

      {humans.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-line/50 bg-bg-1/50 py-16">
          <p className="text-[13px] text-tx-2">{t("empty_team")}</p>
          <p className="font-mono text-xs text-tx-3">{t("action_team")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {humans.map((actor) => {
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

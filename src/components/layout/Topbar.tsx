import { Moon, Sun, Command, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore, useAppStore, type Role } from "@/lib/store";
import { useT } from "@/lib/hooks";
import type { Lang } from "@/lib/i18n";
import { dispatchChatOpen } from "@/components/ChatPanel";

const ROLES: Role[] = ["Nathaniel", "Manny", "Antoine", "Agent"];

export function Topbar() {
  const t = useT();
  const { lang, theme, role, activeClientId, setLang, setTheme, setRole } = useUIStore();
  const { clients } = useAppStore();
  const activeClient = activeClientId ? clients.find((c) => c.id === activeClientId) : null;

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-line bg-bg-1 px-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-tx-3">{t("workspace_label")}</span>
        <span className="font-mono text-[13px] text-tx-2">RSPIR</span>
        {activeClient ? (
          <>
            <span className="font-mono text-[11px] text-tx-3">·</span>
            <span className="font-mono text-[13px] text-or" aria-label={t("cli_active_client")}>
              {activeClient.name}
            </span>
          </>
        ) : null}
        <span className="font-mono text-[11px] text-tx-3">MOCK</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-tx-3">{t("role_label")}</span>
        {ROLES.map((r) => (
          <Button
            key={r}
            variant={role === r ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRole(r)}
            aria-pressed={role === r}
            className="h-7 text-xs"
          >
            {r}
          </Button>
        ))}

        <div className="mx-2 h-4 w-px bg-line" aria-hidden="true" />

        {(["fr", "en"] as Lang[]).map((l) => (
          <Button
            key={l}
            variant={lang === l ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className="h-7 font-mono text-xs uppercase"
          >
            {t(l === "fr" ? "lang_fr" : "lang_en")}
          </Button>
        ))}

        <div className="mx-1 h-4 w-px bg-line" aria-hidden="true" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? t("theme_light") : t("theme_dark")}
          className="h-7 w-7"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 font-mono text-[11px] text-tx-3"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
            );
          }}
          aria-label={t("cmd_label")}
        >
          <Command size={12} />
          <span>{t("cmd_hint")}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 font-mono text-[11px] text-tx-3"
          onClick={dispatchChatOpen}
          aria-label={t("chat_open")}
        >
          <MessageSquare size={12} />
          <span>{t("chat_open")}</span>
        </Button>
      </div>
    </header>
  );
}

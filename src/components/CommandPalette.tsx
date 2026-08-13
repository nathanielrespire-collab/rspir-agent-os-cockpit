import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/hooks";
import type { TKey } from "@/lib/i18n";

interface NavItem {
  labelKey: TKey;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav_home", path: "/" },
  { labelKey: "nav_work", path: "/work" },
  { labelKey: "nav_projects", path: "/projects" },
  { labelKey: "nav_clients", path: "/clients" },
  { labelKey: "nav_team", path: "/team" },
  { labelKey: "nav_agents", path: "/agents" },
  { labelKey: "nav_approvals", path: "/approvals" },
  { labelKey: "nav_blockers", path: "/blockers" },
  { labelKey: "nav_meetings", path: "/meetings" },
  { labelKey: "nav_crm", path: "/crm" },
  { labelKey: "nav_automations", path: "/automations" },
  { labelKey: "nav_websites", path: "/websites" },
  { labelKey: "nav_knowledge", path: "/knowledge" },
  { labelKey: "nav_integrations", path: "/integrations" },
  { labelKey: "nav_evidence", path: "/evidence" },
  { labelKey: "nav_analytics", path: "/analytics" },
  { labelKey: "nav_agent_builder", path: "/agent-builder" },
  { labelKey: "nav_settings", path: "/settings" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = NAV_ITEMS.filter((item) =>
    t(item.labelKey).toLowerCase().includes(query.toLowerCase()),
  );

  function select(path: string) {
    navigate(path);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) select(filtered[active].path);
    }
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <div className="p-2">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={t("cmd_placeholder")}
          className="border-0 bg-transparent text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label={t("cmd_label")}
          autoComplete="off"
        />
      </div>
      <div className="border-t border-line" role="listbox" aria-label={t("cmd_label")}>
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center font-mono text-[13px] text-tx-3">
            {t("cmd_no_results")}
          </p>
        ) : (
          <ul className="max-h-64 overflow-auto py-1">
            {filtered.map((item, i) => (
              <li key={item.path} role="option" aria-selected={i === active}>
                <button
                  className={`flex w-full items-center px-3 py-2 text-left text-[13px] transition-colors ${
                    i === active ? "bg-bg-2 text-tx-1" : "text-tx-2 hover:bg-bg-2 hover:text-tx-1"
                  }`}
                  onClick={() => select(item.path)}
                  onMouseEnter={() => setActive(i)}
                >
                  {t(item.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

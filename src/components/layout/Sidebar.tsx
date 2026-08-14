import { NavLink } from "react-router-dom";
import {
  Home,
  ListTodo,
  FolderKanban,
  Users,
  UserCog,
  Bot,
  CheckSquare,
  AlertTriangle,
  CalendarDays,
  BarChart3,
  Zap,
  Globe,
  BookOpen,
  Plug,
  Shield,
  ShieldAlert,
  ScrollText,
  LineChart,
  Wrench,
  Settings,
  Layers,
  Code2,
  Lightbulb,
  X,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/hooks";
import type { TKey } from "@/lib/i18n";

interface NavItem {
  labelKey: TKey;
  path: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { labelKey: "nav_home", path: "/", icon: Home },
  { labelKey: "nav_work", path: "/work", icon: ListTodo },
  { labelKey: "nav_projects", path: "/projects", icon: FolderKanban },
  { labelKey: "nav_clients", path: "/clients", icon: Users },
  { labelKey: "nav_team", path: "/team", icon: UserCog },
  { labelKey: "nav_agents", path: "/agents", icon: Bot },
  { labelKey: "nav_approvals", path: "/approvals", icon: CheckSquare },
  { labelKey: "nav_blockers", path: "/blockers", icon: AlertTriangle },
  { labelKey: "nav_meetings", path: "/meetings", icon: CalendarDays },
  { labelKey: "nav_crm", path: "/crm", icon: BarChart3 },
  { labelKey: "nav_automations", path: "/automations", icon: Zap },
  { labelKey: "nav_websites", path: "/websites", icon: Globe },
  { labelKey: "nav_knowledge", path: "/knowledge", icon: BookOpen },
  { labelKey: "nav_integrations", path: "/integrations", icon: Plug },
  { labelKey: "nav_features", path: "/features", icon: Layers },
  { labelKey: "nav_policies", path: "/policies", icon: ScrollText },
  { labelKey: "nav_security", path: "/security", icon: ShieldAlert },
  { labelKey: "nav_evidence", path: "/evidence", icon: Shield },
  { labelKey: "nav_analytics", path: "/analytics", icon: LineChart },
  { labelKey: "nav_build", path: "/build", icon: Code2 },
  { labelKey: "nav_proposals", path: "/proposals", icon: Lightbulb },
  { labelKey: "nav_agent_builder", path: "/agent-builder", icon: Wrench },
  { labelKey: "nav_settings", path: "/settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const t = useT();

  return (
    <nav
      aria-label={t("nav_home")}
      className="flex h-full w-52 shrink-0 flex-col border-r border-line bg-bg-1"
    >
      <div className="flex h-11 items-center justify-between border-b border-line px-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-laiton">rspir</span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label={t("mobile_menu_close")}
            className="md:hidden rounded p-0.5 text-tx-3 hover:text-tx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <ul className="flex-1 overflow-y-auto py-1" role="list">
        {NAV.map(({ labelKey, path, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors ${
                  isActive ? "bg-bg-2 text-tx-1" : "text-tx-3 hover:bg-bg-2/60 hover:text-tx-2"
                }`
              }
            >
              <Icon size={14} className="shrink-0" aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

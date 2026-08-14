import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/CommandPalette";
import { ChatPanel } from "@/components/ChatPanel";
import { SimBanner } from "@/components/SimBanner";

export function Shell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-0">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <SimBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <ChatPanel />
    </div>
  );
}

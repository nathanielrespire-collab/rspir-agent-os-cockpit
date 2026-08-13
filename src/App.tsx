import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import Home from "@/routes/Home";
import Work from "@/routes/Work";
import Projects from "@/routes/Projects";
import Clients from "@/routes/Clients";
import Team from "@/routes/Team";
import Agents from "@/routes/Agents";
import Approvals from "@/routes/Approvals";
import Blockers from "@/routes/Blockers";
import Meetings from "@/routes/Meetings";
import Crm from "@/routes/Crm";
import Automations from "@/routes/Automations";
import Websites from "@/routes/Websites";
import Knowledge from "@/routes/Knowledge";
import Integrations from "@/routes/Integrations";
import Evidence from "@/routes/Evidence";
import Analytics from "@/routes/Analytics";
import AgentBuilder from "@/routes/AgentBuilder";
import Settings from "@/routes/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="work" element={<Work />} />
          <Route path="projects" element={<Projects />} />
          <Route path="clients" element={<Clients />} />
          <Route path="team" element={<Team />} />
          <Route path="agents" element={<Agents />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="blockers" element={<Blockers />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="crm" element={<Crm />} />
          <Route path="automations" element={<Automations />} />
          <Route path="websites" element={<Websites />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="evidence" element={<Evidence />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="agent-builder" element={<AgentBuilder />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

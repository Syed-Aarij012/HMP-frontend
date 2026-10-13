"use client";

import RoleDashboard from "@/components/dashboard/overview/RoleDashboard";

/**
 * SRS §2 RBAC: the dashboard home is per role — the backend picks the persona from the
 * account's permissions (GET /dashboard/overview) and this renders its KPIs, action items,
 * charts and activity. Lists and tools live on their own pages in the sidebar.
 */
function Dashboard() {
  return <RoleDashboard />;
}

export default Dashboard;

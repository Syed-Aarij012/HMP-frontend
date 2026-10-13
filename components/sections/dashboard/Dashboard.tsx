"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RoleDashboard from "@/components/dashboard/overview/RoleDashboard";
import { hasRole, useAuth } from "@/contexts/AuthContext";

/**
 * SRS §2 RBAC: the dashboard home is per role — the backend picks the persona from the
 * account's permissions (GET /dashboard/overview) and this renders its KPIs, action items,
 * charts and activity. Lists and tools live on their own pages in the sidebar.
 *
 * A Super Admin's home is the Admin Panel overview (the same platform dashboard plus the
 * console's controls), so /dashboard sends them there rather than showing a second copy.
 */
function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const isSuperAdmin = hasRole(user, "super_admin");

  useEffect(() => {
    if (isSuperAdmin) router.replace("/admin");
  }, [isSuperAdmin, router]);

  if (isSuperAdmin) return null;

  return <RoleDashboard />;
}

export default Dashboard;

"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DashboardHeader from "@/components/headers/DashboardHeader";
import DashboardSidebar from "@/components/headers/DashboardSidebar";
import DashboardOverlay from "@/components/dashboard/DashboardOverlay";
import { DashboardSidebarProvider } from "@/components/dashboard/DashboardSidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/routeAccess";
import SupportAccessRequests from "@/components/dashboard/SupportAccessRequests";

type DashboardLayoutClientProps = {
  children: ReactNode;
};

export default function DashboardLayoutClient({
  children,
}: DashboardLayoutClientProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Sending a signed-out visitor to the public landing page (not /login) applies whether
    // they just logged out from here or landed on a dashboard URL without ever being signed
    // in — either way "/" is where they can sign back in from the header.
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <DashboardSidebarProvider>
      <DashboardOverlay />
      <DashboardSidebar />
      <div id="wrapper-dashboard">
        <div id="pagee" className="clearfix">
          <DashboardHeader />
        </div>
        <SupportAccessRequests />
        {/* SRS §2 RBAC route guard (UX only — the API refuses these regardless). */}
        {canAccessRoute(user, pathname) ? (
          children
        ) : (
          <div id="themesflat-content">
            <div className="container">
              <div className="tfcl-dashboard">
                <h1 className="admin-title mb-3">Not available</h1>
                <p className="tfcl-empty-data">
                  Your account doesn&apos;t have access to this page. <Link href="/dashboard">Back to your dashboard</Link>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardSidebarProvider>
  );
}

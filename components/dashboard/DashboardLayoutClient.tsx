"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DashboardHeader from "@/components/headers/DashboardHeader";
import DashboardSidebar from "@/components/headers/DashboardSidebar";
import { DashboardSidebarProvider, useDashboardSidebar } from "@/components/dashboard/DashboardSidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/routeAccess";
import SupportAccessRequests from "@/components/dashboard/SupportAccessRequests";
import { EmptyState } from "@/components/ui/kit";

type DashboardLayoutClientProps = {
  children: ReactNode;
};

// A plain child of DashboardSidebarProvider (not DashboardLayoutClient itself) purely so it can
// read the sidebar state the provider owns — DashboardLayoutClient is what renders the
// provider, so it can't consume its own context.
function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed, isOpen, close } = useDashboardSidebar();

  return (
    <div className={`hmp-ui hmp-dash${collapsed ? " is-collapsed" : ""}`}>
      <a href="#dashboard-content" className="ha-visually-hidden hd-skip">
        Skip to content
      </a>
      <DashboardSidebar />
      <button type="button" className={`hd-overlay${isOpen ? " is-open" : ""}`} onClick={close} aria-label="Close menu" tabIndex={isOpen ? 0 : -1} hidden={!isOpen} />
      <div className="hd-main">
        <DashboardHeader />
        <main id="dashboard-content" className="hd-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

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
      <DashboardShell>
        <SupportAccessRequests />
        {/* SRS §2 RBAC route guard (UX only — the API refuses these regardless). */}
        {canAccessRoute(user, pathname) ? (
          children
        ) : (
          <div className="ha-card">
            <EmptyState
              icon="icon-carus-shieldcheck"
              title="Not available"
              text="Your account doesn't have access to this page."
              action={
                <Link href="/dashboard" className="ha-btn is-primary">
                  Back to your dashboard
                </Link>
              }
            />
          </div>
        )}
      </DashboardShell>
    </DashboardSidebarProvider>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import AdminSidebar, { adminItemForPath, canOpenAdminItem, canUseAdminPanel, firstAdminPageFor } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/admin/ui";
import { DashboardSidebarProvider, useDashboardSidebar } from "@/components/dashboard/DashboardSidebarContext";
import { hasRole, useAuth } from "@/contexts/AuthContext";

function Topbar() {
  const { user } = useAuth();
  const { open } = useDashboardSidebar();
  const pathname = usePathname();
  const page = adminItemForPath(pathname);
  const initials = (user?.name ?? "A")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="ha-topbar">
      <button type="button" className="ha-menu-btn" onClick={open} aria-label="Open navigation">
        <i className="icon-carus-list" aria-hidden="true" />
      </button>
      <div className="ha-crumbs">
        Admin Panel{page && page.href !== "/admin" ? <> / <b>{page.label}</b></> : <> / <b>Overview</b></>}
      </div>
      <div className="ha-user">
        <div className="ha-user-meta">
          <div>{user?.name}</div>
          <div>{hasRole(user, "super_admin") ? "Global Super Admin" : (user?.roles ?? []).map((r) => r.name.replace(/_/g, " ")).join(", ")}</div>
        </div>
        <div className="ha-avatar" aria-hidden="true">
          {initials}
        </div>
      </div>
    </header>
  );
}

/**
 * The Admin Panel's shell — its own login, sidebar, top bar and look, separate from the user
 * dashboard. Only Super Admins get in. This guard is UX: every /api/admin endpoint behind it is
 * enforced server-side by the 'super-admin' middleware (SRS §2.2 P7).
 */
export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const isAdmin = canUseAdminPanel(user);
  const isSuperAdmin = hasRole(user, "super_admin");

  useEffect(() => {
    if (!isLoginPage && !loading && !user) {
      router.replace("/admin/login");
    }
    // The overview is Super Admin data; other staff land on their first page in the panel.
    if (!isLoginPage && !loading && isAdmin && !isSuperAdmin && pathname === "/admin") {
      router.replace(firstAdminPageFor(user) ?? "/dashboard");
    }
  }, [isLoginPage, loading, user, router, isAdmin, isSuperAdmin, pathname]);

  if (isLoginPage) return <>{children}</>;
  if (loading || !user) return <div className="hmp-admin" />;

  if (!isAdmin) {
    return (
      <div className="hmp-admin ha-login">
        <div className="ha-login-card" style={{ textAlign: "center" }}>
          <h1>Admins only</h1>
          <p className="ha-login-sub">
            You&apos;re signed in as {user.email}, which doesn&apos;t have access to the Admin Panel.
          </p>
          <div className="ha-actions" style={{ justifyContent: "center" }}>
            <Link href="/dashboard" className="ha-btn">
              My dashboard
            </Link>
            <button type="button" className="ha-btn is-primary" onClick={() => { logout(); router.replace("/admin/login"); }}>
              Sign in as an admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  const page = adminItemForPath(pathname);
  const embedded = page?.embedded ?? false;
  // Pages outside the nav (e.g. a listing's review page) inherit their section's rule.
  const allowed = canOpenAdminItem(user, page);

  return (
    <div className="hmp-admin">
      <ToastProvider>
        <DashboardSidebarProvider>
          <AdminSidebar />
          <div className="ha-main">
            <Topbar />
            <main className={`ha-content${embedded ? " ha-embedded" : ""}`}>
              {allowed ? (
                children
              ) : (
                <div className="ha-card ha-empty">
                  <b>Not available</b>
                  This part of the Admin Panel is for Super Admins.
                </div>
              )}
            </main>
          </div>
        </DashboardSidebarProvider>
      </ToastProvider>
    </div>
  );
}

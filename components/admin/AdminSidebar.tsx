"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDashboardSidebar } from "@/components/dashboard/DashboardSidebarContext";
import { can, hasRole, useAuth, type AuthUser } from "@/contexts/AuthContext";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import type { SuperAdminOverview } from "@/lib/superAdmin";

// `permission`: who besides a Super Admin may use the page (SRS §2.2 — e.g. Trust & Safety
// analysts moderate listings). Without it the page is Super Admin only.
export type AdminNavItem = { href: string; label: string; icon: string; badge?: "approvals" | "reviews"; embedded?: boolean; permission?: string };

/** The Admin Panel's own navigation — separate from the user dashboard's menu. */
export const ADMIN_NAV: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "Console",
    items: [
      { href: "/admin", label: "Overview", icon: "icon-carus-diamondsfour" },
      { href: "/admin/approvals", label: "Approvals", icon: "icon-carus-checkcircle", badge: "approvals" },
      { href: "/admin/audit-log", label: "Audit log", icon: "icon-carus-listings" },
    ],
  },
  {
    title: "People & tenants",
    items: [
      { href: "/admin/users", label: "Users & roles", icon: "icon-carus-profile" },
      { href: "/admin/organizations", label: "Organizations", icon: "icon-carus-usercheck" },
      { href: "/admin/dealer-groups", label: "Dealer groups", icon: "icon-carus-car" },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/admin/review", label: "Listing review", icon: "icon-carus-pending", badge: "reviews", permission: "moderate-listings" },
      { href: "/admin/listings", label: "All listings", icon: "icon-carus-car" },
      { href: "/admin/trust-safety", label: "Trust & Safety", icon: "icon-carus-shieldcheck", embedded: true, permission: "admin-fraud-actions" },
      { href: "/admin/bans", label: "Bans", icon: "icon-carus-close", permission: "manage-bans" },
    ],
  },
  {
    title: "Support & pricing",
    items: [
      { href: "/admin/support", label: "Support view", icon: "icon-carus-usercheck", permission: "impersonate-user-readonly" },
      { href: "/admin/pricing", label: "Pricing oversight", icon: "icon-carus-sliders", permission: "monitor-pricing" },
    ],
  },
  {
    title: "Catalog & auction",
    items: [
      { href: "/admin/taxonomy", label: "Taxonomy", icon: "icon-carus-list", embedded: true },
      { href: "/admin/inspections", label: "Inspection assignments", icon: "icon-carus-checkcircle", permission: "assign-inspections" },
      { href: "/admin/grading-matrix", label: "Grading matrix", icon: "icon-carus-sliders", embedded: true },
      { href: "/admin/routing-rules", label: "Auto-routing rules", icon: "icon-carus-arrowsleftright", embedded: true },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/admin/roles", label: "Role matrix", icon: "icon-carus-pencilline" },
      { href: "/admin/feature-flags", label: "Feature flags", icon: "icon-carus-power" },
      { href: "/admin/break-glass", label: "Break-glass", icon: "icon-carus-clock" },
    ],
  },
];

export function currentAdminNavItem(pathname: string): AdminNavItem | undefined {
  const all = ADMIN_NAV.flatMap((group) => group.items);
  return all.find((item) => item.href === pathname) ?? all.filter((item) => item.href !== "/admin" && pathname.startsWith(`${item.href}/`))[0];
}

/** Display only — every page's API enforces the same rule server-side. */
export function canOpenAdminItem(user: AuthUser | null, item: Pick<AdminNavItem, "permission"> | undefined): boolean {
  if (hasRole(user, "super_admin")) return true;
  return Boolean(item?.permission && can(user, item.permission));
}

/** Who gets into the panel at all: a Super Admin, or staff with any panel page of their own. */
export function canUseAdminPanel(user: AuthUser | null): boolean {
  return ADMIN_NAV.some((group) => group.items.some((item) => canOpenAdminItem(user, item)));
}

export function firstAdminPageFor(user: AuthUser | null): string | undefined {
  return ADMIN_NAV.flatMap((group) => group.items).find((item) => item.href !== "/admin" && canOpenAdminItem(user, item))?.href;
}

/** A listing's review page belongs with the review queue, whatever list it was opened from. */
export function adminItemForPath(pathname: string): AdminNavItem | undefined {
  if (pathname.startsWith("/admin/listings/")) {
    return ADMIN_NAV.flatMap((group) => group.items).find((item) => item.href === "/admin/review");
  }
  return currentAdminNavItem(pathname);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useDashboardSidebar();
  const { user, logout } = useAuth();
  const isSuperAdmin = hasRole(user, "super_admin");
  // The overview counts are Super Admin data; a moderator gets their queue size instead.
  const overview = useAdminResource<{ data: SuperAdminOverview }>(isSuperAdmin ? "/admin/overview" : null);
  const queue = useAdminResource<{ total?: number }>(!isSuperAdmin && can(user, "moderate-listings") ? "/moderation/listings" : null);
  const reload = isSuperAdmin ? overview.reload : queue.reload;
  const counts = {
    approvals: overview.data?.data.awaiting_my_approval ?? 0,
    reviews: overview.data?.data.listings.awaiting_review ?? queue.data?.total ?? 0,
  };
  const groups = ADMIN_NAV.map((group) => ({ ...group, items: group.items.filter((item) => canOpenAdminItem(user, item)) })).filter((group) => group.items.length > 0);

  // Keep the approvals count current as the admin moves around the panel (the first load is
  // already done by useAdminResource itself).
  const lastPath = useRef(pathname);
  useEffect(() => {
    close();
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      reload();
    }
  }, [pathname, close, reload]);

  const active = adminItemForPath(pathname)?.href;

  return (
    <>
      <div className={`ha-overlay${isOpen ? " is-open" : ""}`} onClick={close} aria-hidden="true" />
      <aside className={`ha-sidebar${isOpen ? " is-open" : ""}`} aria-label="Admin navigation">
        <Link href="/admin" className="ha-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png" alt="HMP" />
          <span>ADMIN PANEL</span>
        </Link>

        <nav className="ha-nav">
          {groups.map((group) => (
            <div key={group.title} className="ha-nav-group">
              <div className="ha-nav-title">{group.title}</div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`ha-nav-link${active === item.href ? " is-active" : ""}`}
                  aria-current={active === item.href ? "page" : undefined}
                >
                  <i className={item.icon} aria-hidden="true" />
                  {item.label}
                  {item.badge && counts[item.badge] > 0 && <span className="ha-nav-count">{counts[item.badge]}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="ha-sidebar-foot">
          <Link href="/" className="ha-nav-link">
            <i className="icon-carus-arrowsleftright" aria-hidden="true" />
            View main site
          </Link>
          <Link href="/admin/login" className="ha-nav-link" onClick={() => logout()}>
            <i className="icon-carus-signout" aria-hidden="true" />
            Sign out
          </Link>
        </div>
      </aside>
    </>
  );
}

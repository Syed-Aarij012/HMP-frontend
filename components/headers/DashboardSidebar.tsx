"use client";

import Image from "@/components/common/AppImage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDashboardSidebar } from "@/components/dashboard/DashboardSidebarContext";
import { can, canAny, hasRole, useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/components/common/MessagesContext";
import { isNavLinkActive } from "@/lib/navigation";
import { canAccessRoute } from "@/lib/routeAccess";
import { canUseAdminPanel, firstAdminPageFor } from "@/components/admin/AdminSidebar";

const DEFAULT_AVATAR = "/assets/images/dashboard/avatar.png";

type DashboardMenuItem = {
  id: string;
  href: string;
  className: string;
  iconClass: string;
  label: string;
};

const dashboardMenuItems: DashboardMenuItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    className: "menu-index-1",
    iconClass: "icon-carus-diamondsfour",
    label: "Dashboard",
  },
  {
    id: "add-listing",
    href: "/add-listing",
    className: "menu-index-2",
    iconClass: "icon-carus-icon1",
    label: "Add listing",
  },
  {
    id: "my-listing",
    href: "/my-listing",
    className: "menu-index-3",
    iconClass: "icon-carus-pencilline",
    label: "My listing",
  },
  {
    id: "my-favorite",
    href: "/my-favorite",
    className: "menu-index-4",
    iconClass: "icon-carus-heartstraight",
    label: "My favorite",
  },
  {
    id: "my-orders",
    href: "/my-orders",
    className: "menu-index-4",
    iconClass: "icon-carus-car",
    label: "My orders",
  },
  {
    id: "saved-searches",
    href: "/saved-searches",
    className: "menu-index-4",
    iconClass: "icon-carus-listings",
    label: "Saved searches",
  },
  {
    id: "my-offers",
    href: "/my-offers",
    className: "menu-index-4",
    iconClass: "icon-carus-pending",
    label: "My offers",
  },
  {
    id: "my-appointments",
    href: "/my-appointments",
    className: "menu-index-4",
    iconClass: "icon-carus-clock",
    label: "My appointments",
  },
  {
    id: "my-payouts",
    href: "/my-payouts",
    className: "menu-index-4",
    iconClass: "icon-carus-power",
    label: "My payouts",
  },
  {
    id: "my-transport",
    href: "/my-transport",
    className: "menu-index-4",
    iconClass: "icon-carus-map",
    label: "My transport",
  },
  {
    id: "my-transport-jobs",
    href: "/my-transport-jobs",
    className: "menu-index-4",
    iconClass: "icon-carus-map",
    label: "Transport jobs",
  },
  {
    id: "gate-release",
    href: "/gate-release",
    className: "menu-index-4",
    iconClass: "icon-carus-shieldcheck",
    label: "Vehicle release",
  },
  {
    id: "message",
    href: "/message",
    className: "menu-index-4",
    iconClass: "icon-carus-envelopesimple",
    label: "Message",
  },
  {
    id: "my-review",
    href: "/my-review",
    className: "menu-index-6",
    iconClass: "icon-carus-chatcircledots",
    label: "Review",
  },
  {
    id: "my-profile",
    href: "/my-profile",
    className: "menu-index-6",
    iconClass: "icon-carus-profile",
    label: "Profile",
  },
  {
    id: "logout",
    href: "/",
    className: "menu-index-7",
    iconClass: "icon-carus-signout",
    label: "Logout",
  },
];

// A trade buyer holds none of browse-retail-listings / manage-own-listings / manage-org-
// listings (see RolesAndPermissionsSeeder's P4 block), so the retail menu above — listing,
// favoriting, messaging a seller, reviewing a listing — has nothing real behind it for this
// persona. This is the auction-side menu instead (view-auction-catalog / place-bid /
// place-proxy-bid / consign-vehicle), sharing only Profile and Logout with the retail menu.
const tradeBuyerMenuItems: DashboardMenuItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    className: "menu-index-1",
    iconClass: "icon-carus-diamondsfour",
    label: "Dashboard",
  },
  {
    id: "auction",
    href: "/auction",
    className: "menu-index-2",
    iconClass: "icon-carus-listings",
    label: "Auction catalog",
  },
  {
    id: "consign-vehicle",
    href: "/consign-vehicle",
    className: "menu-index-3",
    iconClass: "icon-carus-car",
    label: "Consign a vehicle",
  },
  {
    id: "my-consigned-lots",
    href: "/my-consigned-lots",
    className: "menu-index-3",
    iconClass: "icon-carus-pencilline",
    label: "My consigned vehicles",
  },
  {
    id: "trade-marketplace",
    href: "/trade-marketplace",
    className: "menu-index-2",
    iconClass: "icon-carus-listings",
    label: "Trade marketplace (Buy Now)",
  },
  {
    id: "list-fixed-price",
    href: "/list-fixed-price",
    className: "menu-index-3",
    iconClass: "icon-carus-car",
    label: "List at fixed price",
  },
  {
    id: "my-fixed-price-listings",
    href: "/my-fixed-price-listings",
    className: "menu-index-3",
    iconClass: "icon-carus-pencilline",
    label: "My fixed-price listings",
  },
  {
    id: "my-bids",
    href: "/my-bids",
    className: "menu-index-4",
    iconClass: "icon-carus-checkcircle",
    label: "My bids",
  },
  {
    id: "my-exposure",
    href: "/my-exposure",
    className: "menu-index-4",
    iconClass: "icon-carus-shieldcheck",
    label: "My exposure",
  },
  {
    id: "trade-credit",
    href: "/trade-credit",
    className: "menu-index-6",
    iconClass: "icon-carus-power",
    label: "Trade credit",
  },
  {
    id: "bidding-deposits",
    href: "/bidding-deposits",
    className: "menu-index-6",
    iconClass: "icon-carus-power",
    label: "Bidding deposits",
  },
  {
    id: "my-proxy-bids",
    href: "/my-proxy-bids",
    className: "menu-index-4",
    iconClass: "icon-carus-sliders",
    label: "My proxy bids",
  },
  {
    id: "my-provisional-sales",
    href: "/my-provisional-sales",
    className: "menu-index-4",
    iconClass: "icon-carus-pending",
    label: "Provisional sales",
  },
  {
    id: "my-trade-orders",
    href: "/my-trade-orders",
    className: "menu-index-6",
    iconClass: "icon-carus-checkcircle",
    label: "My trade orders",
  },
  {
    id: "security",
    href: "/security",
    className: "menu-index-6",
    iconClass: "icon-carus-usercheck",
    label: "Security",
  },
  {
    id: "my-profile",
    href: "/my-profile",
    className: "menu-index-6",
    iconClass: "icon-carus-profile",
    label: "Profile",
  },
  {
    id: "logout",
    href: "/",
    className: "menu-index-7",
    iconClass: "icon-carus-signout",
    label: "Logout",
  },
];

const liveLanesItem: DashboardMenuItem = {
  id: "live-lanes",
  href: "/live-lanes",
  className: "menu-index-4",
  iconClass: "icon-carus-listings",
  label: "Live lanes",
};

const rostrumItem: DashboardMenuItem = {
  id: "rostrum",
  href: "/rostrum",
  className: "menu-index-4",
  iconClass: "icon-carus-sliders",
  label: "Rostrum console",
};

// Inserts before `beforeId`; menus without that item (the retail menu has no "security")
// fall back to just before Profile, then Logout, rather than silently dropping the item.
function insertBefore(items: DashboardMenuItem[], extra: DashboardMenuItem, beforeId: string): DashboardMenuItem[] {
  const index = [beforeId, "my-profile", "logout"]
    .map((id) => items.findIndex((item) => item.id === id))
    .find((i) => i !== -1);
  if (index === undefined) return [...items, extra];
  return [...items.slice(0, index), extra, ...items.slice(index)];
}

const dealerAnalyticsItem: DashboardMenuItem = {
  id: "dealer-analytics",
  href: "/dealer-analytics",
  className: "menu-index-4",
  iconClass: "icon-carus-checkcircle",
  label: "Dealer analytics",
};

// FR-C-032: the dealer lead inbox — enquiries routed by the org's lead routing rules.
const leadsItem: DashboardMenuItem = {
  id: "leads",
  href: "/leads",
  className: "menu-index-4",
  iconClass: "icon-carus-chattext",
  label: "Leads",
};

// FR-C-020: the org's package, slot usage and pro-rated plan changes — dealer accounts only.
const subscriptionItem: DashboardMenuItem = {
  id: "subscription",
  href: "/subscription",
  className: "menu-index-4",
  iconClass: "icon-carus-sliders",
  label: "Subscription",
};

// FR-A-031: bulk CSV stock ingestion — dealer accounts only.
const dealerStockFeedItem: DashboardMenuItem = {
  id: "dealer-stock-feed",
  href: "/dealer-stock-feed",
  className: "menu-index-4",
  iconClass: "icon-carus-upload",
  label: "Bulk stock upload",
};

// FR-A-013/020/022/025: inspector (or quality_supervisor / super_admin) condition-report
// tooling — a distinct internal persona, not gated by user_type like the retail/dealer/trade
// menus above, since quality_supervisor is an additional role rather than its own user_type.
const inspectionsItem: DashboardMenuItem = {
  id: "inspections",
  href: "/inspections",
  className: "menu-index-4",
  iconClass: "icon-carus-checkcircle",
  label: "Inspections",
};

// FR-A-021: dual-approval matrix authoring — quality_supervisor (or super_admin) only.
const gradingMatrixItem: DashboardMenuItem = {
  id: "grading-matrix",
  href: "/grading-matrix",
  className: "menu-index-4",
  iconClass: "icon-carus-sliders",
  label: "Grading matrix",
};

// FR-A-006: taxonomy version administration — super_admin only.
const taxonomyItem: DashboardMenuItem = {
  id: "taxonomy",
  href: "/taxonomy",
  className: "menu-index-4",
  iconClass: "icon-carus-list",
  label: "Taxonomy",
};

// FR-A-032: auto-routing rules administration — super_admin (or manage-run-list) only.
const routingRulesItem: DashboardMenuItem = {
  id: "routing-rules",
  href: "/routing-rules",
  className: "menu-index-4",
  iconClass: "icon-carus-arrowsleftright",
  label: "Auto-routing rules",
};

// FR-C-031: the queue of messages auto-flagged by the PII / off-platform-payment detector —
// trust_safety_analyst (or super_admin) only, an additional role like quality_supervisor.
const trustSafetyItem: DashboardMenuItem = {
  id: "trust-safety",
  href: "/trust-safety",
  className: "menu-index-4",
  iconClass: "icon-carus-checkcircle",
  label: "Trust & Safety",
};

// REQ RBAC-003: the Org Admin's delegated administration — staff, roles, rooftops, spending limits.
const teamItem: DashboardMenuItem = {
  id: "team",
  href: "/team",
  className: "menu-index-4",
  iconClass: "icon-carus-usercheck",
  label: "Team & roles",
};

// SRS §2.2 P7: Super Admins run the platform from the separate Admin Panel (/admin), which has
// its own sidebar — here they just get a way into it.
const adminPanelItem: DashboardMenuItem = {
  id: "admin-panel",
  href: "/admin",
  className: "menu-index-1",
  iconClass: "icon-carus-shieldcheck",
  label: "Admin Panel",
};

function menuFor(userType: string | undefined, organizationId: number | null): DashboardMenuItem[] {
  // FR-D-033: multi-lane viewing is a trade-buyer surface; FR-D-034: the rostrum is the
  // auctioneer's (and Super Admin's) console.
  if (userType === "trade_buyer") return insertBefore(tradeBuyerMenuItems, liveLanesItem, "my-bids");
  if (userType === "auctioneer" || userType === "super_admin") return insertBefore(dashboardMenuItems, rostrumItem, "security");

  // FR-C-022: self-serve performance analytics — dealer accounts only.
  if (organizationId !== null) {
    const dealerItems = [leadsItem, dealerAnalyticsItem, dealerStockFeedItem, subscriptionItem];
    return dealerItems.reduce((items, item) => insertBefore(items, item, "security"), dashboardMenuItems);
  }

  return dashboardMenuItems;
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useDashboardSidebar();
  const { user } = useAuth();
  const { unreadCount: unreadMessageCount } = useMessages();
  const organizationId = typeof user?.organization_id === "number" ? user.organization_id : null;
  const baseMenuItems = menuFor(user?.user_type, organizationId);
  // Extras are driven by permissions (SRS §2 RBAC), not by role names.
  const isInspectionPersona = canAny(user, ["create-condition-report", "countersign-condition-report"]);
  const isQualitySupervisorPersona = can(user, "publish-grading-matrix");
  let menuItems = isInspectionPersona && !baseMenuItems.some((item) => item.id === "inspections")
    ? insertBefore(baseMenuItems, inspectionsItem, "security")
    : baseMenuItems;
  if (isQualitySupervisorPersona && !menuItems.some((item) => item.id === "grading-matrix")) {
    menuItems = insertBefore(menuItems, gradingMatrixItem, "security");
  }
  // §2.2 P3 Org Admin / P4 trade buyer: trade credit application.
  if (can(user, "apply-trade-credit") && !menuItems.some((item) => item.id === "trade-credit")) {
    menuItems = insertBefore(menuItems, { id: "trade-credit", href: "/trade-credit", className: "menu-index-4", iconClass: "icon-carus-power", label: "Trade credit" }, "security");
  }
  // REQ RBAC-003: a Group Admin runs their dealer group's dealerships.
  if (can(user, "manage-dealer-group") && !menuItems.some((item) => item.id === "dealer-group")) {
    menuItems = insertBefore(menuItems, { id: "dealer-group", href: "/dealer-group", className: "menu-index-4", iconClass: "icon-carus-usercheck", label: "Dealer group" }, "security");
  }
  if (can(user, "manage-org-users") && !menuItems.some((item) => item.id === "team")) {
    menuItems = insertBefore(menuItems, teamItem, "security");
  }
  if (can(user, "manage-taxonomy") && !menuItems.some((item) => item.id === "taxonomy")) {
    menuItems = insertBefore(menuItems, taxonomyItem, "security");
  }
  if (can(user, "manage-run-list") && !menuItems.some((item) => item.id === "routing-rules")) {
    menuItems = insertBefore(menuItems, routingRulesItem, "security");
  }
  if (can(user, "admin-fraud-actions") && !menuItems.some((item) => item.id === "trust-safety")) {
    menuItems = insertBefore(menuItems, trustSafetyItem, "security");
  }

  // Only show what this account may open — the same map the route guard uses.
  menuItems = menuItems.filter((item) => canAccessRoute(user, item.href));

  // A Super Admin's operational tools (taxonomy, routing rules, Trust & Safety, grading matrix)
  // live in the Admin Panel; the dashboard just links to it, first.
  // Other staff with pages in the Admin Panel (Trust & Safety, Support, Data & Pricing) get a
  // link straight to their first one.
  const staffPanelHref = !hasRole(user, "super_admin") && canUseAdminPanel(user) ? firstAdminPageFor(user) : undefined;
  if (staffPanelHref) {
    menuItems = [{ ...adminPanelItem, label: "Staff panel", href: staffPanelHref }, ...menuItems];
  }
  if (hasRole(user, "super_admin")) {
    const inAdminPanel = ["taxonomy", "routing-rules", "trust-safety", "grading-matrix"];
    menuItems = [adminPanelItem, ...menuItems.filter((item) => !inAdminPanel.includes(item.id))];
  }

  useEffect(() => {
    close();
  }, [pathname, close]);

  const linkClass = (baseClass: string, href: string) =>
    isNavLinkActive(pathname, href) ? `${baseClass} active` : baseClass;

  return (
    <aside className={`sidebar-dashboard${isOpen ? " active" : ""}`}>
      <div className="db-content db-logo pad-30">
        <Link href="/" title="HMP">
          <Image
            className="site-logo"
            src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png"
            alt="HMP"
            width={200}
            height={100}
          />
        </Link>
      </div>
      <div className="db-content db-author pad-30">
        <h6 className="db-title">Profile</h6>
        <div className="author">
          <div className="avatar">
            <Image
              loading="lazy"
              id="tfre_avatar_thumbnail"
              src={typeof user?.avatar_url === "string" ? user.avatar_url : DEFAULT_AVATAR}
              alt={user?.name ?? "Account"}
              title={user?.name ?? "Account"}
              width={52}
              height={52}
              unoptimized={typeof user?.avatar_url === "string"}
            />
          </div>
          <div className="content">
            <div className="name">{user?.name ?? "Account"}</div>
            <div className="author-email">{user?.email ?? ""}</div>
          </div>
        </div>
      </div>
      <div className="db-content db-list-menu">
        <h6 className="db-title">Menu</h6>
        <div className="db-dashboard-menu">
          <ul>
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={linkClass(item.className, item.href)}
                  onClick={close}
                >
                  <i className={item.iconClass} />
                  {item.label}
                  {item.id === "message" && unreadMessageCount > 0 && (
                    <span className="count-page">{unreadMessageCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

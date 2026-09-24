"use client";

import Image from "@/components/common/AppImage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDashboardSidebar } from "@/components/dashboard/DashboardSidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/components/common/MessagesContext";
import { isNavLinkActive } from "@/lib/navigation";

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

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useDashboardSidebar();
  const { user } = useAuth();
  const { unreadCount: unreadMessageCount } = useMessages();
  const menuItems = user?.user_type === "trade_buyer" ? tradeBuyerMenuItems : dashboardMenuItems;

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

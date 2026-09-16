"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDashboardSidebar } from "@/components/dashboard/DashboardSidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { isNavLinkActive } from "@/lib/navigation";

const DEFAULT_AVATAR = "/assets/images/dashboard/avatar.png";

type DashboardMenuItem = {
  id: string;
  href: string;
  className: string;
  iconClass: string;
  label: string;
  badge?: number;
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
    badge: 7,
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

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useDashboardSidebar();
  const { user } = useAuth();

  useEffect(() => {
    close();
  }, [pathname, close]);

  const linkClass = (baseClass: string, href: string) =>
    isNavLinkActive(pathname, href) ? `${baseClass} active` : baseClass;

  return (
    <aside className={`sidebar-dashboard${isOpen ? " active" : ""}`}>
      <div className="db-content db-logo pad-30">
        <Link href="/" title="carus">
          <Image
            className="site-logo"
            src="/assets/images/dashboard/logo.png"
            alt="carus"
            width={329}
            height={64}
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
            {dashboardMenuItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={linkClass(item.className, item.href)}
                  onClick={close}
                >
                  <i className={item.iconClass} />
                  {item.label}
                  {item.badge != null && (
                    <span className="count-page">{item.badge}</span>
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

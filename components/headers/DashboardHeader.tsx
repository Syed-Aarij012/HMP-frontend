"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { HeaderSearchTrigger } from "./HeaderSearch";
import { canAny, useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/routeAccess";
import { useDashboardSidebar } from "@/components/dashboard/DashboardSidebarContext";
import { mainNavMenu } from "@/data/navigation";
import { humanize } from "@/components/ui/kit";
import Avatar from "@/components/ui/Avatar";
import type { NavMenuItem } from "@/types/navigation";

// The marketplace's own links, flattened (the top bar has no room for mega-menus).
function flatten(items: NavMenuItem[]): Array<{ id: string; label: string; href: string }> {
  return items.flatMap((item) => (item.children?.length ? flatten(item.children) : item.href ? [{ id: item.id, label: item.label, href: item.href }] : []));
}
const SITE_LINKS = flatten(mainNavMenu);

// Page names for the breadcrumb where the URL segment doesn't read well on its own.
const PAGE_NAMES: Record<string, string> = {
  dashboard: "Overview",
  "my-listing": "My listings",
  "my-favorite": "Favourites",
  message: "Messages",
  "my-review": "Reviews",
  "my-profile": "Profile",
  auction: "Auction catalogue",
  rostrum: "Rostrum console",
  "list-fixed-price": "List at fixed price",
  "dealer-stock-feed": "Bulk stock upload",
  "routing-rules": "Auto-routing rules",
  "trust-safety": "Trust & Safety",
  team: "Team & roles",
  "gate-release": "Vehicle release",
  "my-transport-jobs": "Transport jobs",
  "guided-capture": "Guided capture",
};

function pageName(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  return PAGE_NAMES[segment] ?? humanize(segment).replace(/^./, (c) => c.toUpperCase());
}

/** A down chevron (the icon font's caret glyph renders as a left-pointing arrow). */
function Chevron() {
  return (
    <svg className="hd-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * A small disclosure menu: Escape and outside clicks close it, focus returns to the button.
 * The parent re-keys it on navigation, so it always starts closed on a new page.
 */
function HeaderMenu({ className = "", buttonClassName, buttonLabel, buttonContent, children }: {
  className?: string;
  buttonClassName: string;
  buttonLabel?: string;
  buttonContent: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`hd-menu ${className}`} ref={ref}>
      <button ref={buttonRef} type="button" className={buttonClassName} aria-expanded={open} aria-controls={panelId} aria-label={buttonLabel} onClick={() => setOpen(!open)}>
        {buttonContent}
      </button>
      {open && (
        <div id={panelId} className="hd-menu-panel">
          {children}
        </div>
      )}
    </div>
  );
}

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { isOpen, open: openSidebar } = useDashboardSidebar();
  // SRS §2.2: selling is for seller accounts (P2/P3); guests see it and are asked to sign up.
  const canSell = !user || canAny(user, ["manage-own-listings", "manage-org-listings"]);
  const avatarUrl = typeof user?.avatar_url === "string" ? user.avatar_url : null;

  return (
    <header className="hd-topbar">
      <button
        type="button"
        className="ha-btn is-icon hd-menu-btn"
        onClick={openSidebar}
        aria-label="Open dashboard menu"
        aria-controls="dashboard-sidebar"
        aria-expanded={isOpen}
      >
        <i className="icon-carus-list" aria-hidden="true" />
      </button>

      <div className="hd-crumbs" aria-label="You are here">
        Dashboard{pathname !== "/dashboard" && <> / <b>{pageName(pathname)}</b></>}
      </div>

      <div className="hd-topbar-end">
        <nav className="hd-sitenav" aria-label="Marketplace">
          {SITE_LINKS.map((link) => (
            <Link key={link.id} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <HeaderMenu
          key={`site-${pathname}`}
          className="hd-sitenav-menu"
          buttonClassName="ha-btn is-ghost"
          buttonContent={
            <>
              Marketplace
              <Chevron />
            </>
          }
        >
          {SITE_LINKS.map((link) => (
            <Link key={link.id} href={link.href}>
              {link.label}
            </Link>
          ))}
        </HeaderMenu>

        <HeaderSearchTrigger className="ha-btn is-icon is-ghost" iconClassName="" />

        {canSell && (
          <Link className="ha-btn is-primary" href={`/add-listing`}>
            <i className="icon-carus-plus" aria-hidden="true" />
            <span className="hd-sell-label">Sell my car</span>
          </Link>
        )}

        <HeaderMenu
          key={`account-${pathname}`}
          buttonClassName="hd-account-btn"
          buttonLabel={`Account menu for ${user?.name ?? "your account"}`}
          buttonContent={
            <>
              <Avatar src={avatarUrl} name={user?.name} size={32} />
              <span className="hd-account-name">{user?.name?.split(" ")[0] ?? "Account"}</span>
              <Chevron />
            </>
          }
        >
          <div className="hd-menu-head">
            <b>{user?.name ?? "Account"}</b>
            <span>{user?.email ?? ""}</span>
          </div>
          {canAccessRoute(user, "/my-profile") && (
            <Link href="/my-profile">
              <i className="icon-carus-profile" aria-hidden="true" />
              Profile
            </Link>
          )}
          {canAccessRoute(user, "/security") && (
            <Link href="/security">
              <i className="icon-carus-usercheck" aria-hidden="true" />
              Security
            </Link>
          )}
          <hr />
          <Link href="/" onClick={() => logout()}>
            <i className="icon-carus-signout" aria-hidden="true" />
            Logout
          </Link>
        </HeaderMenu>
      </div>
    </header>
  );
}

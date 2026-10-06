"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useListingActions } from "@/components/common/ListingActionsContext";
import { hasRole, useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/routeAccess";

type Shortcut = { href: string; title: string; text: string };

// Every feature the dashboard can point to; each one is shown only when this account's role
// may open it (lib/routeAccess.ts — the same rules as the menu and the route guard).
const SHORTCUTS: Shortcut[] = [
  { href: "/listing-grid", title: "Browse cars", text: "Search and compare cars for sale." },
  { href: "/my-favorite", title: "My favourites", text: "Cars you've saved." },
  { href: "/saved-searches", title: "Saved searches", text: "Alerts when matching cars are listed." },
  { href: "/my-offers", title: "My offers", text: "Offers you've made and their status." },
  { href: "/my-appointments", title: "Test drives", text: "Your booked test drives." },
  { href: "/my-orders", title: "My orders", text: "Cars you've reserved or bought." },
  { href: "/message", title: "Messages", text: "Your conversations with sellers." },
  { href: "/my-review", title: "Reviews", text: "Reviews you've written." },
  { href: "/auction", title: "Auction catalog", text: "Trade stock coming up for sale." },
  { href: "/live-lanes", title: "Live lanes", text: "Watch and bid in live sales." },
  { href: "/my-bids", title: "My bids", text: "Lots you've bid on." },
  { href: "/my-exposure", title: "My exposure", text: "Funding committed across your bids." },
  { href: "/consign-vehicle", title: "Consign a vehicle", text: "Enter a vehicle into an auction." },
  { href: "/trade-credit", title: "Trade credit", text: "Apply for a credit line to bid against." },
  { href: "/trade-marketplace", title: "Trade marketplace", text: "Buy Now trade stock." },
  { href: "/my-payouts", title: "Payouts", text: "Money from your sales." },
  { href: "/inspections", title: "Inspections", text: "Condition reports and grading." },
  { href: "/rostrum", title: "Rostrum console", text: "Run your auction lane." },
  { href: "/trust-safety", title: "Trust & Safety", text: "Flagged-message queue." },
  { href: "/security", title: "Security", text: "Password and two-factor authentication." },
  { href: "/my-profile", title: "Profile", text: "Your name, phone and photo." },
];

export default function RoleHome() {
  const { user } = useAuth();
  const { favoriteIds, canFavorite } = useListingActions();
  const shortcuts = SHORTCUTS.filter((shortcut) => canAccessRoute(user, shortcut.href));
  const roleNames = (user?.roles ?? []).map((role) => role.name.replace(/_/g, " "));

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-1">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
                  <p className="text-color-2 mb-4" style={{ textTransform: "capitalize" }}>
                    {roleNames.length > 0 ? roleNames.join(" · ") : "Your account"}
                  </p>

                  {hasRole(user, "super_admin") && (
                    <div className="alert alert-info mb-4">
                      Platform administration lives in the <Link href="/admin">Admin Panel</Link>.
                    </div>
                  )}

                  {canFavorite && (
                    <div className="tfcl-card p-3 mb-4" style={{ maxWidth: 280 }}>
                      <div className="text-color-2">Favourites</div>
                      <div style={{ fontSize: 28, fontWeight: 700 }}>{favoriteIds.length}</div>
                    </div>
                  )}

                  <div className="row">
                    {shortcuts.map((shortcut) => (
                      <div key={shortcut.href} className="col-sm-6 col-xl-4 mb-3">
                        <Link href={shortcut.href} className="tfcl-card p-3 d-block h-100" style={{ color: "inherit" }}>
                          <h5 className="mb-1">{shortcut.title}</h5>
                          <div className="text-color-2">{shortcut.text}</div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

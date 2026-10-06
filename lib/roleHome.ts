import { can, hasRole, type AuthUser } from "@/contexts/AuthContext";
import { firstAdminPageFor } from "@/components/admin/AdminSidebar";
import { canAccessRoute } from "@/lib/routeAccess";

/**
 * Where each kind of account lands after signing in or signing up (SRS §2.2 personas):
 *   P7 Super Admin → Admin Panel · supporting staff with panel pages (Trust & Safety, Support,
 *   Data & Pricing) → their first panel page · P5 Auctioneer → rostrum · P6 Inspector →
 *   their inspection tasks · Dealer Group Admin → the group · everyone else (buyers, sellers,
 *   trade buyers, dealer staff, finance, logistics) → their dashboard, which is already role-aware.
 */
export function homeFor(user: AuthUser | null): string {
  if (!user) return "/";
  if (hasRole(user, "super_admin")) return "/admin";

  const staffPanel = firstAdminPageFor(user);
  if (staffPanel) return staffPanel;

  if (can(user, "hammer-lot")) return "/rostrum";
  if (can(user, "create-condition-report")) return "/inspections";
  if (can(user, "manage-dealer-group")) return "/dealer-group";

  return "/dashboard";
}

/**
 * After sign-in, honour a page the person was sent away from (`?next=/my-offers`) — but only an
 * internal path their role can actually open; otherwise fall back to their home.
 */
export function destinationAfterAuth(user: AuthUser | null, next: string | null | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") && !next.startsWith("/register")) {
    if (next.startsWith("/admin") ? hasRole(user, "super_admin") : canAccessRoute(user, next)) {
      return next;
    }
  }

  return homeFor(user);
}

/** A short "you're signed in as …" label for the role. */
export function roleSummary(user: AuthUser | null): string {
  const names = (user?.roles ?? []).map((role) => role.name.replace(/_/g, " "));
  return names.length ? names.join(", ") : "account";
}

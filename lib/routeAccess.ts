import { canAny, hasRole, type AuthUser } from "@/contexts/AuthContext";

/**
 * SRS §2 RBAC — which dashboard routes need what. One map drives both the route guard
 * (DashboardLayoutClient) and which sidebar items are shown (DashboardSidebar). This is the UX
 * layer only: every API behind these pages enforces the same permissions server-side.
 *
 * A requirement is met when the user holds ANY of `permissions`, or ANY of `roles`, or (with
 * `organization`) simply belongs to an organization.
 */
type RouteRequirement = { permissions?: string[]; roles?: string[]; organization?: boolean };

const ROUTE_REQUIREMENTS: [prefix: string, requirement: RouteRequirement][] = [
  ["/team", { permissions: ["manage-org-users"] }],
  ["/dealer-group", { permissions: ["manage-dealer-group"] }],
  ["/taxonomy", { permissions: ["manage-taxonomy"] }],
  ["/grading-matrix", { permissions: ["publish-grading-matrix"] }],
  ["/routing-rules", { permissions: ["manage-run-list"] }],
  ["/trust-safety", { permissions: ["admin-fraud-actions"] }],
  ["/inspections", { permissions: ["create-condition-report", "countersign-condition-report", "manage-vehicle-records"] }],
  ["/guided-capture", { permissions: ["create-condition-report", "manage-vehicle-records"] }],
  ["/rostrum", { permissions: ["hammer-lot", "manage-any-lane"] }],
  ["/live-lanes", { permissions: ["view-auction-catalog"] }],
  ["/auction", { permissions: ["view-auction-catalog"] }],
  ["/consign-vehicle", { permissions: ["consign-vehicle"] }],
  ["/my-consigned-lots", { permissions: ["consign-vehicle"] }],
  ["/list-fixed-price", { permissions: ["consign-vehicle"] }],
  ["/my-fixed-price-listings", { permissions: ["consign-vehicle"] }],
  ["/trade-marketplace", { permissions: ["view-auction-catalog"] }],
  ["/my-trade-orders", { permissions: ["place-bid"] }],
  ["/my-provisional-sales", { permissions: ["consign-vehicle"] }],
  ["/trade-credit", { permissions: ["apply-trade-credit"] }],
  ["/my-bids", { permissions: ["place-bid"] }],
  ["/my-proxy-bids", { permissions: ["place-proxy-bid"] }],
  ["/my-exposure", { permissions: ["place-bid"] }],
  ["/bidding-deposits", { permissions: ["place-bid"] }],
  // Retail buying (SRS §2.2 P1) vs selling (P2/P3). Pages that serve both sides — offers,
  // appointments, messages, reviews — open to either a buyer or someone who sells.
  ["/my-favorite", { permissions: ["save-searches-and-vehicles"] }],
  ["/saved-searches", { permissions: ["save-searches-and-vehicles"] }],
  ["/my-orders", { permissions: ["purchase-vehicles"] }],
  ["/my-payouts", { permissions: ["receive-payouts"] }],
  ["/my-offers", { permissions: ["make-offers", "manage-own-listings", "manage-org-listings"] }],
  ["/my-appointments", { permissions: ["book-test-drives", "manage-own-listings", "manage-org-listings"] }],
  ["/message", { permissions: ["message-sellers", "manage-own-listings", "manage-org-listings"] }],
  ["/my-review", { permissions: ["leave-reviews", "manage-own-listings", "manage-org-listings"] }],
  ["/add-listing", { permissions: ["manage-own-listings", "manage-org-listings"] }],
  ["/edit-listing", { permissions: ["manage-own-listings", "manage-org-listings"] }],
  ["/my-listing", { permissions: ["manage-own-listings", "manage-org-listings"] }],
  ["/dealer-stock-feed", { permissions: ["manage-org-listings"] }],
  ["/subscription", { permissions: ["manage-org-subscriptions"] }],
  ["/my-transport-jobs", { permissions: ["perform-transport", "manage-logistics"] }],
  ["/gate-release", { permissions: ["release-vehicle"] }],
  ["/my-transport", { permissions: ["place-bid", "purchase-vehicles"] }],
  ["/leads", { organization: true }],
  ["/dealer-analytics", { organization: true, permissions: ["view-dealer-analytics-any"] }],
];

function requirementFor(pathname: string): RouteRequirement | null {
  const match = ROUTE_REQUIREMENTS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? match[1] : null;
}

export function canAccessRoute(user: AuthUser | null, pathname: string): boolean {
  const requirement = requirementFor(pathname.replace(/\/$/, "") || "/");
  if (!requirement) return true;
  if (!user) return false;

  return (
    canAny(user, requirement.permissions ?? []) ||
    (requirement.roles ?? []).some((role) => hasRole(user, role)) ||
    (requirement.organization === true && typeof user.organization_id === "number")
  );
}

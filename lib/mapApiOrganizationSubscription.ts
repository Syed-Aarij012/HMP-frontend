import {
  mapApiSubscriptionPlanToPricingPlan,
  type ApiSubscriptionPlan,
  type MappedPricingPlan,
} from "@/lib/mapApiSubscriptionPlan";

export type ApiOrganizationSubscription = {
  id: number;
  organization_id: number;
  subscription_plan: ApiSubscriptionPlan;
  status: string;
  started_at: string | null;
  ends_at: string | null;
  usage_metrics: {
    active_listings: number;
    stock_slot_count: number;
    measured_at: string;
  } | null;
};

// FR-C-020: GET .../change-preview's data, and PATCH's `proration` (plus psp_reference).
export type ApiPlanChangeProration = {
  direction: "upgrade" | "downgrade" | "lateral";
  currency: string;
  credit: string;
  charge: string;
  net: string;
  remaining_days: number;
  cycle_days: number;
  cycle_ends_at: string;
  psp_reference?: string | null;
};

export type OrganizationSubscription = {
  id: number;
  plan: MappedPricingPlan;
  status: string;
  startedAt: string | null;
  endsAt: string | null;
  activeListings: number | null;
  stockSlotCount: number;
};

export type PlanChangeProration = {
  direction: ApiPlanChangeProration["direction"];
  currency: string;
  credit: number;
  charge: number;
  // Positive = charged to the dealer now, negative = refunded to them.
  net: number;
  remainingDays: number;
  cycleDays: number;
  cycleEndsAt: string;
};

export function mapApiOrganizationSubscription(subscription: ApiOrganizationSubscription): OrganizationSubscription {
  const plan = mapApiSubscriptionPlanToPricingPlan(subscription.subscription_plan);

  return {
    id: subscription.id,
    plan,
    status: subscription.status,
    startedAt: subscription.started_at,
    endsAt: subscription.ends_at,
    activeListings: subscription.usage_metrics?.active_listings ?? null,
    stockSlotCount: subscription.usage_metrics?.stock_slot_count ?? plan.entitlements.stock_slot_count,
  };
}

export function mapApiPlanChangeProration(proration: ApiPlanChangeProration): PlanChangeProration {
  return {
    direction: proration.direction,
    currency: proration.currency,
    credit: Number(proration.credit),
    charge: Number(proration.charge),
    net: Number(proration.net),
    remainingDays: proration.remaining_days,
    cycleDays: proration.cycle_days,
    cycleEndsAt: proration.cycle_ends_at,
  };
}

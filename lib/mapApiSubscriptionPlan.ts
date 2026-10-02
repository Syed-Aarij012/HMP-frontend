import type { PricingPlan } from "@/data/pricingPlans";

export type ApiSubscriptionPlan = {
  id: number;
  name: string;
  tier: "core" | "advanced" | "premium";
  // Raw, admin-authored bundle — render resolved_entitlements instead, which is what the
  // backend's gates actually enforce (it also folds in the legacy `video_media` flag).
  entitlements: Record<string, unknown>;
  resolved_entitlements: ApiResolvedEntitlements;
  price: string | number;
  billing_interval: "monthly" | "annual";
  is_active: boolean;
};

// FR-C-020: ranking_boost is a flag (platform default multiplier) or a plan's own multiplier.
export type ApiResolvedEntitlements = {
  stock_slot_count: number;
  media_video: boolean;
  media_360: boolean;
  ranking_boost: boolean | number;
};

export type ApiSubscriptionPlansResponse = {
  data: ApiSubscriptionPlan[];
};

const TIER_SUBTITLES: Record<ApiSubscriptionPlan["tier"], string> = {
  core: "For individual sellers",
  advanced: "For growing dealerships",
  premium: "For large showrooms",
};

export function entitlementFeatures(entitlements: ApiResolvedEntitlements): string[] {
  const features: string[] = [];

  features.push(`${entitlements.stock_slot_count} active listing slots`);
  if (entitlements.media_video && entitlements.media_360) {
    features.push("Video and 360° spin uploads");
  } else if (entitlements.media_video) {
    features.push("Video uploads");
  } else if (entitlements.media_360) {
    features.push("360° spin uploads");
  } else {
    features.push("Photo uploads only");
  }
  if (entitlements.ranking_boost) {
    features.push("Search ranking boost");
  }

  return features;
}

// A real plan's own id (numeric) is what the subscribe action needs — PricingPlan.id was
// designed as a display-only slug, so it's kept as the tier name and the real numeric id
// travels separately.
export type MappedPricingPlan = PricingPlan & {
  subscriptionPlanId: number;
  tier: string;
  // Exact (not the rounded display monthlyPrice) — what proration is computed from.
  price: number;
  billingInterval: ApiSubscriptionPlan["billing_interval"];
  entitlements: ApiResolvedEntitlements;
};

export function mapApiSubscriptionPlanToPricingPlan(plan: ApiSubscriptionPlan): MappedPricingPlan {
  return {
    id: plan.tier,
    title: plan.name,
    subtitle: TIER_SUBTITLES[plan.tier] ?? "",
    monthlyPrice: Math.round(Number(plan.price)),
    features: [
      ...entitlementFeatures(plan.resolved_entitlements),
      plan.billing_interval === "monthly" ? "Billed monthly" : "Billed annually",
    ],
    recommended: plan.tier === "advanced",
    subscriptionPlanId: plan.id,
    tier: plan.tier,
    price: Number(plan.price),
    billingInterval: plan.billing_interval,
    entitlements: plan.resolved_entitlements,
  };
}

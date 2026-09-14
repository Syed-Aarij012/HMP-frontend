import type { PricingPlan } from "@/data/pricingPlans";

export type ApiSubscriptionPlan = {
  id: number;
  name: string;
  tier: "core" | "advanced" | "premium";
  entitlements: {
    stock_slot_count?: number;
    video_media?: boolean;
    ranking_boost?: boolean;
  };
  price: string | number;
  billing_interval: "monthly" | "annual";
  is_active: boolean;
};

export type ApiSubscriptionPlansResponse = {
  data: ApiSubscriptionPlan[];
};

const TIER_SUBTITLES: Record<ApiSubscriptionPlan["tier"], string> = {
  core: "For individual sellers",
  advanced: "For growing dealerships",
  premium: "For large showrooms",
};

function entitlementFeatures(plan: ApiSubscriptionPlan): string[] {
  const features: string[] = [];

  if (plan.entitlements.stock_slot_count) {
    features.push(`${plan.entitlements.stock_slot_count} live listing slots`);
  }
  features.push(plan.entitlements.video_media ? "Video media uploads" : "Photo uploads only");
  if (plan.entitlements.ranking_boost) {
    features.push("Search ranking boost");
  }
  features.push(plan.billing_interval === "monthly" ? "Billed monthly" : "Billed annually");

  return features;
}

// A real plan's own id (numeric) is what the subscribe action needs — PricingPlan.id was
// designed as a display-only slug, so it's kept as the tier name and the real numeric id
// travels separately.
export type MappedPricingPlan = PricingPlan & { subscriptionPlanId: number; tier: string };

export function mapApiSubscriptionPlanToPricingPlan(plan: ApiSubscriptionPlan): MappedPricingPlan {
  return {
    id: plan.tier,
    title: plan.name,
    subtitle: TIER_SUBTITLES[plan.tier] ?? "",
    monthlyPrice: Math.round(Number(plan.price)),
    features: entitlementFeatures(plan),
    recommended: plan.tier === "advanced",
    subscriptionPlanId: plan.id,
    tier: plan.tier,
  };
}

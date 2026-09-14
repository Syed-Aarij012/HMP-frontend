"use client";

import { getPlanPrice, type PricingBilling } from "@/data/pricingPlans";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import PricingCard from "./PricingCard";

type PricingGridProps = {
  billing: PricingBilling;
};

export default function PricingGrid({ billing }: PricingGridProps) {
  const { plans, loading, error } = useSubscriptionPlans();

  if (loading) {
    return (
      <div className="grid-4 gap-48 pricing-wrap">
        <p>Loading pricing plans…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid-4 gap-48 pricing-wrap">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid-4 gap-48 pricing-wrap">
      {plans.map((plan) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          price={getPlanPrice(plan.monthlyPrice, billing)}
        />
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PricingCheckIcon from "./PricingCheckIcon";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { MappedPricingPlan } from "@/lib/mapApiSubscriptionPlan";

type PricingCardProps = {
  plan: MappedPricingPlan;
  price: number;
};

export default function PricingCard({ plan, price }: PricingCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organizationId =
    typeof user?.organization_id === "number" ? user.organization_id : null;

  async function handleSubscribe() {
    if (!organizationId) return;

    setError(null);
    setSubmitting(true);
    try {
      await apiFetch(`/organizations/${organizationId}/subscriptions`, {
        method: "POST",
        body: { subscription_plan_id: plan.subscriptionPlanId },
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not subscribe right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="widget-pricing pricing-card-equal">
      {plan.recommended ? (
        <div className="badge-table">
          <span>Recommended</span>
        </div>
      ) : null}
      <div className="pricing-heading">
        <h2 className="sub-title">{plan.title}</h2>
        <p className="text-sub">{plan.subtitle}</p>
      </div>
      <div className="title-price flex-three">
        <h2>$</h2>
        <div className="price fw-6 font text-color-2">{price}</div>
      </div>
      <ul className="check">
        {plan.features.map((feature, index) => (
          <li key={`${plan.id}-feature-${index}`} className="flex-three">
            <PricingCheckIcon />
            {feature}
          </li>
        ))}
      </ul>

      {error && <p className="text-danger fs-14">{error}</p>}

      <div className="button-pricing">
        {!user ? (
          <Link className="sc-button w-100" href="/login">
            <span>Log in to subscribe</span>
          </Link>
        ) : organizationId ? (
          <button
            type="button"
            className="sc-button w-100"
            onClick={handleSubscribe}
            disabled={submitting}
          >
            <span>{submitting ? "Subscribing..." : "Get started"}</span>
          </button>
        ) : (
          <p className="fs-14 text-center mb-0">Available for dealer accounts only.</p>
        )}
      </div>
    </div>
  );
}

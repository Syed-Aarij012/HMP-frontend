"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  mapApiSubscriptionPlanToPricingPlan,
  type ApiSubscriptionPlansResponse,
  type MappedPricingPlan,
} from "@/lib/mapApiSubscriptionPlan";

export type SubscriptionPlansResult = {
  plans: MappedPricingPlan[];
  loading: boolean;
  error: string | null;
};

/** FR-C-020: the real dealer subscription packages — anonymous browsing, same as pricing pages. */
export function useSubscriptionPlans(): SubscriptionPlansResult {
  const [plans, setPlans] = useState<MappedPricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiSubscriptionPlansResponse>("/subscription-plans", { auth: false })
      .then((response) => {
        if (!cancelled) {
          setPlans(
            response.data
              .filter((plan) => plan.is_active)
              .map(mapApiSubscriptionPlanToPricingPlan)
          );
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load subscription plans from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, loading, error };
}

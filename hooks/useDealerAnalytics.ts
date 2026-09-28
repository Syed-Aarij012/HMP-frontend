"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { mapApiDealerAnalytics, type ApiDealerAnalytics } from "@/lib/mapApiMarketplaceTools";
import type { DealerAnalytics } from "@/types/marketplaceTools";

/** FR-C-022: self-serve dealer performance analytics for the signed-in dealer's own org. */
export function useDealerAnalytics(days = 30) {
  const { user } = useAuth();
  const organizationId = typeof user?.organization_id === "number" ? user.organization_id : null;
  const [analytics, setAnalytics] = useState<DealerAnalytics | null>(null);
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!organizationId) {
      queueMicrotask(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiDealerAnalytics>(`/organizations/${organizationId}/analytics?days=${days}`)
      .then((response) => {
        if (!cancelled) {
          setAnalytics(mapApiDealerAnalytics(response));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your dealer analytics from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, days]);

  return { analytics, loading, error, isDealer: organizationId !== null };
}

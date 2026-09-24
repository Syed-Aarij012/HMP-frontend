"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiFeeEstimate, type ApiFeeEstimate } from "@/lib/mapApiAuction";
import type { FeeEstimate } from "@/types/auction";

/**
 * UX-021 (M): "The lot detail page shall present a total-cost calculator ... before any bid
 * can be placed — no fee surprises." Recomputes whenever the hypothetical amount changes.
 */
export function useFeeEstimate(lotId: string | undefined, amount: string) {
  const [estimate, setEstimate] = useState<FeeEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const parsed = Number(amount);
    if (!lotId || !amount || !Number.isFinite(parsed) || parsed <= 0) {
      queueMicrotask(() => {
        if (!cancelled) {
          setEstimate(null);
          setError(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    const handle = setTimeout(() => {
      queueMicrotask(() => {
        if (!cancelled) setLoading(true);
      });

      apiFetch<{ data: ApiFeeEstimate }>(`/auction/lots/${lotId}/fee-estimate?amount=${encodeURIComponent(amount)}`)
        .then((response) => {
          if (!cancelled) {
            setEstimate(mapApiFeeEstimate(response.data));
            setError(null);
          }
        })
        .catch(() => {
          if (!cancelled) setError("Could not calculate costs for this amount right now.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [lotId, amount]);

  return { estimate, loading, error };
}

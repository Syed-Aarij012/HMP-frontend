"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiDeposit, type ApiBiddingDeposit, type ApiListResponse } from "@/lib/mapApiAuction";
import type { BiddingDeposit } from "@/types/auction";

/** FR-E-010(a): a trade buyer's refundable bidding deposits — place, list, and refund. */
export function useBiddingDeposits() {
  const [deposits, setDeposits] = useState<BiddingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiListResponse<ApiBiddingDeposit>>("/bidding-deposits")
      .then((response) => {
        if (!cancelled) {
          setDeposits(response.data.map(mapApiDeposit));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your bidding deposits from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  const placeDeposit = useCallback(
    async (amount: string) => {
      setActionError(null);
      setSubmitting(true);
      try {
        await apiFetch("/bidding-deposits", { method: "POST", body: { amount } });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not place this deposit right now."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [load]
  );

  const refundDeposit = useCallback(
    async (depositId: number) => {
      setActionError(null);
      setSubmitting(true);
      try {
        await apiFetch(`/bidding-deposits/${depositId}/refund`, { method: "POST" });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not refund this deposit right now."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [load]
  );

  return { deposits, loading, error, actionError, submitting, placeDeposit, refundDeposit };
}

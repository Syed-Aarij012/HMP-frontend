"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiProvisionalSale, type ApiListResponse, type ApiProvisionalSale } from "@/lib/mapApiAuction";
import type { ProvisionalSale } from "@/types/auction";

/**
 * FR-D-040: a seller's pending/decided provisional sales (as="seller", the default) or a
 * buyer's own (as="buyer") — pending the seller, or awaiting the buyer's response to a
 * counter-offer.
 */
export function useProvisionalSales(as: "seller" | "buyer" = "seller") {
  const [sales, setSales] = useState<ProvisionalSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiListResponse<ApiProvisionalSale>>(`/my-provisional-sales?as=${as}`)
      .then((response) => {
        if (!cancelled) {
          setSales(response.data.map(mapApiProvisionalSale));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load provisional sales from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [as]);

  useEffect(() => load(), [load]);

  const decide = useCallback(
    async (provisionalSaleId: number, decision: "accept" | "decline" | "counter", counterAmount?: string) => {
      setActionError(null);
      setSubmitting(true);
      try {
        await apiFetch(`/provisional-sales/${provisionalSaleId}/decide`, {
          method: "POST",
          body: { decision, counter_amount: counterAmount },
        });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not record this decision right now."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [load]
  );

  const respond = useCallback(
    async (provisionalSaleId: number, response: "accepted" | "declined") => {
      setActionError(null);
      setSubmitting(true);
      try {
        await apiFetch(`/provisional-sales/${provisionalSaleId}/respond`, {
          method: "POST",
          body: { response },
        });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not record this response right now."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [load]
  );

  return { sales, loading, error, actionError, submitting, decide, respond };
}

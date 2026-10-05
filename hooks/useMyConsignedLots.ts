"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiLot, type ApiAuctionLot, type ApiListResponse } from "@/lib/mapApiAuction";
import type { AuctionLot } from "@/types/auction";

export function useMyConsignedLots() {
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiListResponse<ApiAuctionLot>>("/auction/my-lots")
      .then((response) => {
        if (!cancelled) {
          setLots(response.data.map(mapApiLot));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your consigned vehicles from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  /**
   * FR-E-032 / FR-F-011: complete a cataloged lot's VAT status, V5C status and (margin
   * scheme) acquisition cost. The response carries the lot's refreshed publish blockers, so
   * the row updates in place.
   */
  const updateCompliance = useCallback(
    async (
      lotId: string,
      details: { vatStatus?: string; v5cStatus?: string; acquisitionCost?: number },
    ): Promise<string | null> => {
      try {
        const response = await apiFetch<{ data: ApiAuctionLot }>(`/auction/lots/${lotId}/compliance`, {
          method: "PATCH",
          body: {
            vat_status: details.vatStatus,
            v5c_status: details.v5cStatus,
            dealer_acquisition_cost: details.acquisitionCost,
          },
        });
        const updated = mapApiLot(response.data);
        setLots((current) => current.map((lot) => (lot.id === lotId ? { ...lot, publishBlockers: updated.publishBlockers } : lot)));
        return null;
      } catch (err) {
        return describeApiError(err, "Could not save these details.");
      }
    },
    [],
  );

  return { lots, loading, error, reload: load, updateCompliance };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiPricingSuggestion, mapApiPhotoGuidance, type ApiPricingSuggestion, type ApiPhotoGuidance } from "@/lib/mapApiMarketplaceTools";
import type { PricingSuggestion, PhotoGuidance } from "@/types/marketplaceTools";

/** FR-C-003: a valuation-anchored asking-price suggestion for a specific vehicle. */
export function usePricingSuggestion() {
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async (vehiclePublicId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: ApiPricingSuggestion }>(
        `/listing-pricing-suggestion?vehicle_master_record_id=${encodeURIComponent(vehiclePublicId)}`
      );
      setSuggestion(mapApiPricingSuggestion(response.data));
    } catch (err) {
      setError(describeApiError(err, "Could not get a pricing suggestion right now."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggestion, loading, error, fetchSuggestion };
}

/** FR-C-003: the photo shot list sellers are guided to capture. */
export function usePhotoGuidance(vehiclePublicId?: string) {
  const [guidance, setGuidance] = useState<PhotoGuidance | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const query = vehiclePublicId ? `?vehicle_master_record_id=${encodeURIComponent(vehiclePublicId)}` : "";

    apiFetch<ApiPhotoGuidance>(`/listings/photo-guidance${query}`)
      .then((response) => setGuidance(mapApiPhotoGuidance(response)))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [vehiclePublicId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return { guidance, loading, load };
}

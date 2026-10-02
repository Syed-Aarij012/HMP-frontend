"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiValuation, type ApiValuation, type ApiValuationVehicle } from "@/lib/mapApiMarketplaceTools";
import type { ValuationResult } from "@/types/marketplaceTools";

/** FR-C-034: the free VRM + mileage valuation tool — anonymous browsing permitted. */
export function useValuation() {
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valuate = useCallback(async (vrm: string, mileage: number): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: ApiValuation; vehicle: ApiValuationVehicle }>("/valuations", {
        method: "POST",
        body: { vrm, mileage },
      });
      setResult(mapApiValuation(response.data, response.vehicle));
      return true;
    } catch (err) {
      setError(describeApiError(err, "Could not produce a valuation right now."));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { valuate, result, submitting, error };
}

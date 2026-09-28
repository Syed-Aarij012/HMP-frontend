"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiValuation, type ApiValuation } from "@/lib/mapApiMarketplaceTools";
import type { ValuationResult } from "@/types/marketplaceTools";

/** FR-C-034: the free VRM/VIN + mileage valuation tool — anonymous browsing permitted. */
export function useValuation() {
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valuate = useCallback(async (vin: string, mileage: number): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: ApiValuation }>("/valuations", {
        method: "POST",
        body: { vin: vin.toUpperCase(), mileage },
      });
      setResult(mapApiValuation(response.data));
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

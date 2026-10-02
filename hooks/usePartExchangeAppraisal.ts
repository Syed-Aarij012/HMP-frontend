"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

export type ApiPartExchangeAppraisal = {
  trade_in_value: string | null;
  trade_in_range: { low: string; high: string } | null;
  confidence: "insufficient_data" | "low" | "medium" | "high";
  mileage: number;
  outstanding_settlement_figure: string | null;
  settlement_quote_expires_at: string | null;
  equity: string | null;
  is_negative_equity: boolean | null;
};

export type PartExchangeResult = {
  vehicle: { id: number; vrm: string | null; make: string | null; model: string | null; colour: string | null; fuelType: string | null; year: number | null };
  appraisal: ApiPartExchangeAppraisal;
};

/**
 * FR-C-032: part-exchange declaration — the buyer's registration and mileage resolve to a
 * vehicle (DVLA lookup) and an instant trade-in range, before it's attached to an offer.
 */
export function usePartExchangeAppraisal() {
  const [result, setResult] = useState<PartExchangeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appraise = useCallback(async (vrm: string, mileage: number): Promise<PartExchangeResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{
        data: { vehicle: PartExchangeResult["vehicle"] & { fuel_type: string | null }; appraisal: ApiPartExchangeAppraisal };
      }>("/part-exchange/appraisals", { method: "POST", body: { vrm, mileage } });
      const { fuel_type: fuelType, ...vehicle } = response.data.vehicle;
      const appraised = { vehicle: { ...vehicle, fuelType }, appraisal: response.data.appraisal };
      setResult(appraised);
      return appraised;
    } catch (err) {
      setResult(null);
      setError(describeApiError(err, "Couldn't look up that registration."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, appraise, clear };
}

"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

/**
 * NFR-S-005 step-up authentication — a fresh TOTP/recovery code confirmed within the last
 * few minutes, required on top of a standing session for bids at/above
 * config('step_up.thresholds.bid_amount') (currently £10,000). See EnsureStepUpVerified on
 * the backend, which 428s a bid/proxy-bid at or above that threshold until this has run.
 */
export function useStepUp() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (code: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/step-up/verify", { method: "POST", body: { code } });
    } catch (err) {
      setError(describeApiError(err, "That code didn't match. Try again."));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, error, verify };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

export type IdentityVerificationStatus = {
  status: "unverified" | "pending" | "verified" | "rejected" | string;
  verifiedAt: string | null;
  requiredToList: boolean;
};

export type IdentityVerificationEvidence = {
  documentType: "passport" | "driving_licence";
  documentNumber: string;
  dateOfBirth: string;
};

/**
 * FR-C-003: "ID verification gate before go-live" — GET /identity-verification/
 * POST /identity-verification both existed with zero frontend caller anywhere (config's
 * require_id_verification gate defaults off, but when it's on a seller had no way to ever
 * clear it).
 */
export function useIdentityVerification() {
  const [status, setStatus] = useState<IdentityVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<{ data: { status: string; verified_at: string | null; required_to_list: boolean } }>(
      "/identity-verification",
    )
      .then((response) => {
        if (!cancelled) {
          setStatus({
            status: response.data.status,
            verifiedAt: response.data.verified_at,
            requiredToList: response.data.required_to_list,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your identity verification status.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => refresh(), [refresh]);

  const submit = useCallback(
    async (evidence: IdentityVerificationEvidence) => {
      setSubmitting(true);
      setError(null);
      try {
        await apiFetch("/identity-verification", {
          method: "POST",
          body: {
            document_type: evidence.documentType,
            document_number: evidence.documentNumber,
            date_of_birth: evidence.dateOfBirth,
          },
        });
        refresh();
        return null;
      } catch (err) {
        const message = describeApiError(err, "Could not verify your identity right now.");
        setError(message);
        return message;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh],
  );

  return { status, loading, submitting, error, submit };
}

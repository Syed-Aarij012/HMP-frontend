"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import type { AssuranceClaim, DocumentManifest, ReleaseNote } from "@/types/postSale";

/**
 * FR-F-010/012/020: the buyer's release note (code + QR), document vault manifest and
 * assurance claims for one trade order. Each piece loads independently so one missing record
 * (no release note yet) never blanks the rest.
 */
export function usePostSaleRecords(tradeOrderId: number, releaseNoteId: number | null) {
  const [release, setRelease] = useState<ReleaseNote | null>(null);
  const [documents, setDocuments] = useState<DocumentManifest | null>(null);
  const [claims, setClaims] = useState<AssuranceClaim[]>([]);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;

    if (releaseNoteId) {
      apiFetch<{ data: ReleaseNote }>(`/release-notes/${releaseNoteId}`)
        .then((r) => !cancelled && setRelease(r.data))
        .catch(() => undefined);
    }

    apiFetch<DocumentManifest>(`/trade-orders/${tradeOrderId}/documents`)
      .then((d) => !cancelled && setDocuments(d))
      .catch(() => undefined);

    apiFetch<{ data: { data: (AssuranceClaim & { trade_order_id: number })[] } }>("/assurance-claims")
      .then((r) => !cancelled && setClaims(r.data.data.filter((claim) => claim.trade_order_id === tradeOrderId)))
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [tradeOrderId, releaseNoteId]);

  useEffect(() => load(), [load]);

  const raiseClaim = useCallback(
    async (claimType: string, description: string): Promise<boolean> => {
      setClaimError(null);
      setSubmitting(true);
      try {
        await apiFetch(`/trade-orders/${tradeOrderId}/assurance-claims`, {
          method: "POST",
          body: { claim_type: claimType, description },
        });
        load();
        return true;
      } catch (err) {
        setClaimError(describeApiError(err, "Could not submit this claim."));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [tradeOrderId, load],
  );

  return { release, documents, claims, claimError, submitting, raiseClaim };
}

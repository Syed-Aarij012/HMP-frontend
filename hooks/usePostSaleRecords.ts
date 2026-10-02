"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { postSaleOrderPath, type AssuranceClaim, type DocumentManifest, type PostSaleOrderRef, type ReleaseNote } from "@/types/postSale";

/**
 * FR-F-010/012/020: the buyer's release note (code + QR), document vault manifest and — for a
 * trade order, the only kind HMP Assured covers — assurance claims. Each piece loads
 * independently so one missing record (no release note yet) never blanks the rest.
 */
export function usePostSaleRecords(order: PostSaleOrderRef, releaseNoteId: number | null) {
  const orderPath = postSaleOrderPath(order);
  const tradeOrderId = order.kind === "trade" ? order.id : null;
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

    apiFetch<DocumentManifest>(`${orderPath}/documents`)
      .then((d) => !cancelled && setDocuments(d))
      .catch(() => undefined);

    if (tradeOrderId === null) {
      return () => {
        cancelled = true;
      };
    }

    apiFetch<{ data: { data: (AssuranceClaim & { trade_order_id: number })[] } }>("/assurance-claims")
      .then((r) => !cancelled && setClaims(r.data.data.filter((claim) => claim.trade_order_id === tradeOrderId)))
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [orderPath, tradeOrderId, releaseNoteId]);

  useEffect(() => load(), [load]);

  const raiseClaim = useCallback(
    async (claimType: string, description: string): Promise<boolean> => {
      setClaimError(null);
      setSubmitting(true);
      try {
        if (tradeOrderId === null) return false;
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

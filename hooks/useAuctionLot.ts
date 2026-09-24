"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { getEcho } from "@/lib/echo";
import {
  mapApiBid,
  mapApiLot,
  type ApiAuctionBid,
  type ApiAuctionLot,
  type ApiListResponse,
} from "@/lib/mapApiAuction";
import type { AuctionBid, AuctionLot } from "@/types/auction";

/**
 * A single lot's detail plus its live bid feed and the bidder-facing mutations
 * (bid / proxy bid / retract) — FR-D-041's pseudonymized feed only ever makes sense
 * scoped to one lot at a time, unlike useAuctionLots' catalog browse.
 */
export function useAuctionLot(publicId: string | undefined) {
  const [lot, setLot] = useState<AuctionLot | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(Boolean(publicId));
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [live, setLive] = useState(false);

  const load = useCallback(() => {
    if (!publicId) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    Promise.all([
      apiFetch<{ data: ApiAuctionLot }>(`/auction/lots/${publicId}`),
      apiFetch<ApiListResponse<ApiAuctionBid>>(`/auction/lots/${publicId}/bids`),
    ])
      .then(([lotResponse, bidsResponse]) => {
        if (cancelled) return;
        setLot(mapApiLot(lotResponse.data));
        setBids(bidsResponse.data.map(mapApiBid));
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this lot from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicId]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  // FR-D-030..036: live state distribution — refetches on any push from the lot's private
  // Reverb channel instead of leaving the bidder to poll or manually refresh. A full
  // refetch (rather than patching individual fields) keeps this consistent with the same
  // REST shape `load()` already produces, at the cost of one extra round trip per event.
  useEffect(() => {
    if (!publicId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo
      .private(`lot.${publicId}`)
      .subscribed(() => setLive(true))
      .error(() => setLive(false))
      .listen(".bid.accepted", () => load())
      .listen(".lot.timer-extended", () => load())
      .listen(".lot.status-changed", () => load());

    return () => {
      setLive(false);
      channel.stopListening(".bid.accepted");
      channel.stopListening(".lot.timer-extended");
      channel.stopListening(".lot.status-changed");
      echo.leave(`lot.${publicId}`);
    };
  }, [publicId, load]);

  const placeBid = useCallback(
    async (amount: string) => {
      if (!publicId) return;
      setActionError(null);
      setSubmitting(true);
      try {
        await apiFetch(`/auction/lots/${publicId}/bids`, {
          method: "POST",
          body: { amount },
        });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not place this bid right now."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [publicId, load]
  );

  const placeProxyBid = useCallback(
    async (maxAmount: string) => {
      if (!publicId) return;
      setActionError(null);
      setSubmitting(true);
      try {
        await apiFetch(`/auction/lots/${publicId}/proxy-bids`, {
          method: "POST",
          body: { max_amount: maxAmount },
        });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not place this proxy bid right now."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [publicId, load]
  );

  const retractBid = useCallback(
    async (bidId: number, reasonCode: string) => {
      setActionError(null);
      setSubmitting(true);
      try {
        await apiFetch(`/auction/bids/${bidId}/retract`, {
          method: "POST",
          body: { reason_code: reasonCode },
        });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not retract this bid right now."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [load]
  );

  return { lot, bids, loading, error, actionError, submitting, live, placeBid, placeProxyBid, retractBid };
}

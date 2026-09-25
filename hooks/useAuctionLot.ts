"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiFetch, describeApiError } from "@/lib/api-client";
import { getEcho } from "@/lib/echo";
import {
  mapApiBid,
  mapApiLot,
  type ApiAuctionBid,
  type ApiAuctionLot,
  type ApiListResponse,
} from "@/lib/mapApiAuction";
import { mapApiSnapshot, type ApiSnapshot } from "@/lib/mapApiLive";
import type { AuctionBid, AuctionLot } from "@/types/auction";
import type { LotSnapshot } from "@/types/liveAuction";

// FR-D-035: with the socket down, fall back to polling the snapshot so the price never
// silently goes stale — bidding itself keeps working over REST.
const FALLBACK_POLL_MS = 8000;

function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * A single lot's detail plus its live bid feed and the bidder-facing mutations
 * (bid / proxy bid / retract) — FR-D-041's pseudonymized feed only ever makes sense
 * scoped to one lot at a time, unlike useAuctionLots' catalog browse.
 *
 * Live protocol (FR-D-030/031): pushes carry a per-lot sequence number. A gap, a reconnect
 * or a retraction triggers a snapshot resync from the server, and every bid carries an
 * idempotency key so a retry after a network drop can never double-bid — "did my bid land?"
 * has one answer.
 */
export function useAuctionLot(publicId: string | undefined) {
  const [lot, setLot] = useState<AuctionLot | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [snapshot, setSnapshot] = useState<LotSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(publicId));
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [live, setLive] = useState(false);
  const [wasLive, setWasLive] = useState(false);
  const lastSequence = useRef(0);

  const loadSnapshot = useCallback(() => {
    if (!publicId) return;

    apiFetch<ApiSnapshot>(`/auction/lots/${publicId}/snapshot`)
      .then((response) => {
        const mapped = mapApiSnapshot(response);
        lastSequence.current = mapped.sequence;
        setSnapshot(mapped);
      })
      .catch(() => undefined);
  }, [publicId]);

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
        loadSnapshot();
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
  }, [publicId, loadSnapshot]);

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
      .subscribed(() => {
        setLive(true);
        setWasLive(true);
        // FR-D-031: (re)connected — restore state from the server rather than trusting
        // whatever we last heard before the drop.
        load();
      })
      .error(() => setLive(false))
      .listen(".bid.accepted", (event: { sequence_number?: number }) => {
        const sequence = event.sequence_number ?? 0;
        // A jump of more than one means we missed a bid; either way a refetch heals it.
        if (sequence > lastSequence.current + 1) {
          load();
        } else {
          lastSequence.current = Math.max(lastSequence.current, sequence);
          load();
        }
      })
      .listen(".bid.retracted", () => load())
      .listen(".lot.timer-extended", () => load())
      .listen(".lot.status-changed", () => load());

    return () => {
      setLive(false);
      channel.stopListening(".bid.accepted");
      channel.stopListening(".bid.retracted");
      channel.stopListening(".lot.timer-extended");
      channel.stopListening(".lot.status-changed");
      echo.leave(`lot.${publicId}`);
    };
  }, [publicId, load]);

  useEffect(() => {
    if (!publicId || live) return;

    const timer = window.setInterval(loadSnapshot, FALLBACK_POLL_MS);
    return () => window.clearInterval(timer);
  }, [publicId, live, loadSnapshot]);

  const placeBid = useCallback(
    async (amount: string) => {
      if (!publicId) return;
      setActionError(null);
      setSubmitting(true);

      // One key per user action, reused if we have to retry after a dropped connection.
      const idempotencyKey = newIdempotencyKey();
      const send = () =>
        apiFetch(`/auction/lots/${publicId}/bids`, {
          method: "POST",
          body: { amount, idempotency_key: idempotencyKey },
        });

      try {
        try {
          await send();
        } catch (err) {
          // Only a transport failure (no HTTP response) is ambiguous; the server treats the
          // same key as a replay, so retrying once is safe.
          if (err instanceof ApiError) throw err;
          await send();
        }
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

  return {
    lot,
    bids,
    snapshot,
    loading,
    error,
    actionError,
    submitting,
    live,
    connectionDropped: wasLive && !live,
    placeBid,
    placeProxyBid,
    retractBid,
  };
}

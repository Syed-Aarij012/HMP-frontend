"use client";

import { useEffect, useState } from "react";
import { openEventStream } from "@/lib/api-client";
import { mapApiSpectatorEvent, type ApiSpectatorEvent } from "@/lib/mapApiLive";
import type { SpectatorLotState } from "@/types/liveAuction";

/**
 * FR-D-036: the spectator tier for a non-bidding viewer — a plain SSE poll loop, entirely
 * separate from useAuctionLot's Reverb private-channel subscription, so spectator traffic
 * never shares (or can add latency to) the bidder-priority path. Bidders use useAuctionLot,
 * never this hook.
 */
export function useLotSpectatorStream(lotPublicId: string | undefined) {
  const [state, setState] = useState<SpectatorLotState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!lotPublicId) return;

    const controller = new AbortController();
    queueMicrotask(() => setConnected(false));

    openEventStream<ApiSpectatorEvent>(
      `/auction/lots/${lotPublicId}/spectate`,
      (event) => {
        setConnected(true);
        setState(mapApiSpectatorEvent(event));
      },
      controller.signal
    )
      .catch(() => undefined)
      .finally(() => setConnected(false));

    return () => controller.abort();
  }, [lotPublicId]);

  return { state, connected };
}

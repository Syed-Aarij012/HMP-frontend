"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { getEcho } from "@/lib/echo";
import { mapApiConsole } from "@/lib/mapApiLive";
import type { RostrumConsole } from "@/types/liveAuction";

const POLL_MS = 3000;

type LaneAction = "start" | "pause" | "resume" | "skip";

/**
 * FR-D-034: the auctioneer's rostrum for one lane — a single feed for the current lot, its
 * bid stream (with channel origin) and reserve indicator, plus every rostrum action. Each
 * action is one call so it fits the SRS's "two interactions or fewer" budget. The console is
 * re-read on a short poll and on every push for the lane and its current lot.
 */
export function useRostrum(laneId: number | null) {
  const [state, setState] = useState<RostrumConsole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (laneId === null) return;

    apiFetch<Parameters<typeof mapApiConsole>[0]>(`/auction/lanes/${laneId}/console`)
      .then((response) => {
        setState(mapApiConsole(response));
        setError(null);
      })
      .catch(() => setError("You can only open the console for a lane you are assigned to."));
  }, [laneId]);

  useEffect(() => {
    if (laneId === null) return;
    queueMicrotask(load);
    const timer = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(timer);
  }, [laneId, load]);

  const currentLotId = state?.currentLot?.id ?? null;

  useEffect(() => {
    const echo = getEcho();
    if (!echo || laneId === null) return;

    const lane = echo.private(`lane.${laneId}`).listen(".lane.state-changed", load);
    const lot = currentLotId
      ? echo
          .private(`lot.${currentLotId}`)
          .listen(".bid.accepted", load)
          .listen(".bid.retracted", load)
          .listen(".lot.status-changed", load)
      : null;

    return () => {
      lane.stopListening(".lane.state-changed");
      echo.leave(`lane.${laneId}`);
      if (lot && currentLotId) {
        lot.stopListening(".bid.accepted");
        lot.stopListening(".bid.retracted");
        lot.stopListening(".lot.status-changed");
        echo.leave(`lot.${currentLotId}`);
      }
    };
  }, [laneId, currentLotId, load]);

  const run = useCallback(
    async (action: () => Promise<string | void>, fallback: string): Promise<boolean> => {
      setActionError(null);
      setNotice(null);
      setBusy(true);
      try {
        const message = await action();
        if (message) setNotice(message);
        load();
        return true;
      } catch (err) {
        setActionError(describeApiError(err, fallback));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const laneAction = useCallback(
    (action: LaneAction) =>
      run(async () => {
        await apiFetch(`/auction/lanes/${laneId}/${action}`, { method: "POST" });
      }, `Could not ${action} this lane.`),
    [laneId, run],
  );

  const hammer = useCallback(
    (lotId: string) =>
      run(async () => {
        const response = await apiFetch<{ outcome: "sold" | "provisional" }>(`/auction/lots/${lotId}/hammer`, {
          method: "POST",
        });
        return response.outcome === "sold" ? "Sold - trade order created." : "Below reserve - referred to the seller.";
      }, "Could not hammer this lot."),
    [run],
  );

  const withdraw = useCallback(
    (lotId: string, reasonCode: string) =>
      run(async () => {
        await apiFetch(`/auction/lots/${lotId}/withdraw`, { method: "POST", body: { reason_code: reasonCode } });
        return "Lot withdrawn.";
      }, "Could not withdraw this lot."),
    [run],
  );

  const hallBid = useCallback(
    (lotId: string, bidderId: number, amount: string) =>
      run(async () => {
        await apiFetch(`/auction/lots/${lotId}/hall-bids`, {
          method: "POST",
          body: { bidder_id: bidderId, amount },
        });
        return "Hall bid recorded.";
      }, "Could not record this hall bid."),
    [run],
  );

  return { state, error, actionError, notice, busy, laneAction, hammer, withdraw, hallBid };
}

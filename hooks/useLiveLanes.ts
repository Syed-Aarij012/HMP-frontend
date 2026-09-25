"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { getEcho } from "@/lib/echo";
import { mapApiLiveLanes, type ApiLiveLanes } from "@/lib/mapApiLive";
import type { LiveLane } from "@/types/liveAuction";

const POLL_MS = 3000;

/**
 * FR-D-033: every lane currently on air with the lot being sold in it. One request feeds all
 * subscribed lanes, refreshed on a short poll and immediately whenever a subscribed lane's
 * state changes (start / pause / resume / skip) over its private channel.
 */
export function useLiveLanes(subscribedLaneIds: number[] = []) {
  const [lanes, setLanes] = useState<LiveLane[]>([]);
  const [maxLanes, setMaxLanes] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ApiLiveLanes>("/auction/lanes")
      .then((response) => {
        const mapped = mapApiLiveLanes(response);
        setLanes(mapped.lanes);
        setMaxLanes(mapped.maxLanes);
        setError(null);
      })
      .catch(() => setError("Could not load the live lanes."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const subscriptionKey = subscribedLaneIds.join(",");

  useEffect(() => {
    const echo = getEcho();
    if (!echo || !subscriptionKey) return;

    const ids = subscriptionKey.split(",").map(Number);
    ids.forEach((id) => echo.private(`lane.${id}`).listen(".lane.state-changed", () => load()));

    return () => {
      ids.forEach((id) => {
        echo.private(`lane.${id}`).stopListening(".lane.state-changed");
        echo.leave(`lane.${id}`);
      });
    };
  }, [subscriptionKey, load]);

  return { lanes, maxLanes, loading, error };
}

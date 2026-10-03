"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiLaneVideoStream, type ApiLaneVideoStream } from "@/lib/mapApiLive";
import type { LaneVideoStream } from "@/types/liveAuction";

/** FR-D-033: the lane's audio/video stream descriptor, fetched once per lane. */
export function useLaneVideoStream(laneId: number | string | undefined) {
  const [stream, setStream] = useState<LaneVideoStream | null>(null);
  const [loading, setLoading] = useState(Boolean(laneId));

  useEffect(() => {
    if (!laneId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<{ data: ApiLaneVideoStream }>(`/auction/lanes/${laneId}/stream`)
      .then((response) => {
        if (!cancelled) setStream(mapApiLaneVideoStream(response.data));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [laneId]);

  return { stream, loading };
}

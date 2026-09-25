"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

const SAMPLES = 3;
const DEFAULT_RESYNC_SECONDS = 60;

async function measureOffset(): Promise<number | null> {
  let best: { rtt: number; offset: number } | null = null;

  for (let i = 0; i < SAMPLES; i += 1) {
    try {
      const sentAt = Date.now();
      const response = await apiFetch<{ server_time: number }>("/auction/time");
      const receivedAt = Date.now();
      const rtt = receivedAt - sentAt;
      // NTP-style: assume the server stamped the response halfway through the round trip.
      const offset = response.server_time - (sentAt + rtt / 2);
      if (!best || rtt < best.rtt) best = { rtt, offset };
    } catch {
      return best ? best.offset : null;
    }
  }

  return best ? best.offset : null;
}

/**
 * FR-D-032: displayed timers must agree across clients, so they render from the server's
 * clock rather than the device's. The offset is measured with a short NTP-style handshake
 * (lowest round-trip of a few samples wins) on connect and re-measured periodically.
 */
export function useServerClock(resyncSeconds = DEFAULT_RESYNC_SECONDS) {
  const [offsetMs, setOffsetMs] = useState(0);
  const [synced, setSynced] = useState(false);

  const sync = useCallback(async () => {
    const offset = await measureOffset();
    if (offset !== null) {
      setOffsetMs(offset);
      setSynced(true);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void sync());
    const timer = window.setInterval(() => void sync(), resyncSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [sync, resyncSeconds]);

  return { offsetMs, synced, resync: sync };
}

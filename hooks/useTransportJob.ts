"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import type { TransportJob } from "@/types/postSale";

type QuoteInput = {
  pickupPostcode: string;
  dropoffPostcode: string;
  vehicleClass: "car" | "lcv" | "motorcycle";
  isRunner: boolean;
  transportType: "open" | "enclosed";
};

/**
 * FR-F-001/002: the buyer's transport job for a trade order — request a distance-based quote
 * (a panel of carriers), pick one and book it, then follow it. While a vehicle is in transit
 * the job is re-read every 30 seconds so position and ETA stay fresh.
 */
export function useTransportJob(jobId: number | null, tradeOrderId: number, onChanged?: () => void) {
  const [job, setJob] = useState<TransportJob | null>(null);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(jobId);

  const load = useCallback(() => {
    if (!currentId) return () => undefined;
    let cancelled = false;

    apiFetch<{ data: TransportJob }>(`/transport-jobs/${currentId}`)
      .then((response) => {
        if (!cancelled) {
          setJob(response.data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the transport details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentId]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    if (job?.status !== "in_transit") return;
    const timer = window.setInterval(() => load(), 30000);
    return () => window.clearInterval(timer);
  }, [job?.status, load]);

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(describeApiError(err, "That action could not be completed."));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const requestQuote = useCallback(
    (input: QuoteInput) =>
      run(async () => {
        const response = await apiFetch<{ data: TransportJob }>(`/trade-orders/${tradeOrderId}/transport-jobs`, {
          method: "POST",
          body: {
            pickup_address: { postcode: input.pickupPostcode },
            dropoff_address: { postcode: input.dropoffPostcode },
            vehicle_class: input.vehicleClass,
            is_runner: input.isRunner,
            transport_type: input.transportType,
          },
        });
        setJob(response.data);
        setCurrentId(response.data.id);
        onChanged?.();
      }),
    [run, tradeOrderId, onChanged],
  );

  const book = useCallback(
    (carrierId?: number) =>
      run(async () => {
        if (!currentId) return;
        const response = await apiFetch<{ data: TransportJob }>(`/transport-jobs/${currentId}/book`, {
          method: "POST",
          body: carrierId ? { carrier_id: carrierId } : {},
        });
        setJob(response.data);
        onChanged?.();
      }),
    [run, currentId, onChanged],
  );

  return { job, loading, error, busy, requestQuote, book };
}

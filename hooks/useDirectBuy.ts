"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiRetailOrder, type ApiRetailOrder } from "@/lib/mapApiDirectBuy";
import type { RetailOrder } from "@/types/directBuy";

type ApiListResponse<T> = { data: T[] };
type ApiItemResponse<T> = { data: T };

/** FR-C-030/FR-E-011: starting a direct-buy (Buy Now) holding-deposit purchase on a listing. */
export function useInitiateDirectBuy(listingPublicId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiate = useCallback(async (): Promise<RetailOrder | null> => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<ApiItemResponse<ApiRetailOrder>>(`/listings/${listingPublicId}/direct-buy`, {
        method: "POST",
      });
      return mapApiRetailOrder(response.data);
    } catch (err) {
      setError(describeApiError(err, "Could not start this purchase."));
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [listingPublicId]);

  return { initiate, submitting, error };
}

/** FR-C-030/FR-E-011: the signed-in buyer's own direct-buy purchases. */
export function useMyRetailOrders() {
  const [orders, setOrders] = useState<RetailOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiListResponse<ApiRetailOrder>>("/my-retail-orders")
      .then((response) => {
        if (!cancelled) {
          setOrders(response.data.map(mapApiRetailOrder));
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your orders from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { orders, loading, error };
}

/** FR-C-030/FR-E-011: a single retail order's live state, plus its cancel/pay-balance actions. */
export function useRetailOrder(publicId: string) {
  const [order, setOrder] = useState<RetailOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    apiFetch<ApiItemResponse<ApiRetailOrder>>(`/retail-orders/${publicId}`)
      .then((response) => {
        setOrder(mapApiRetailOrder(response.data));
        setError(null);
      })
      .catch(() => setError("Could not load this order from the server."))
      .finally(() => setLoading(false));
  }, [publicId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const cancel = useCallback(async (): Promise<boolean> => {
    setActing(true);
    setActionError(null);
    try {
      const response = await apiFetch<ApiItemResponse<ApiRetailOrder>>(`/retail-orders/${publicId}/cancel`, {
        method: "POST",
      });
      setOrder(mapApiRetailOrder(response.data));
      return true;
    } catch (err) {
      setActionError(describeApiError(err, "Could not cancel this order."));
      return false;
    } finally {
      setActing(false);
    }
  }, [publicId]);

  const payBalance = useCallback(async (): Promise<boolean> => {
    setActing(true);
    setActionError(null);
    try {
      const response = await apiFetch<ApiItemResponse<ApiRetailOrder>>(`/retail-orders/${publicId}/pay-balance`, {
        method: "POST",
      });
      setOrder(mapApiRetailOrder(response.data));
      return true;
    } catch (err) {
      setActionError(describeApiError(err, "Could not pay the remaining balance."));
      return false;
    } finally {
      setActing(false);
    }
  }, [publicId]);

  return { order, loading, error, cancel, payBalance, acting, actionError, reload: load };
}

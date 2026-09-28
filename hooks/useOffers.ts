"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiOffer, type ApiOffer } from "@/lib/mapApiMarketplaceTools";
import type { Offer } from "@/types/marketplaceTools";

type ApiListResponse<T> = { data: T[] };

/**
 * FR-C-032: every offer the signed-in user is a party to, either as the buyer or as the
 * listing's seller (owner or org staff) — the same set OfferController::index returns.
 */
export function useOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    apiFetch<ApiListResponse<ApiOffer>>("/offers")
      .then((response) => {
        setOffers(response.data.map((offer) => mapApiOffer(offer, user?.id ?? 0)));
        setError(null);
      })
      .catch(() => setError("Could not load your offers from the server."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const respond = useCallback(
    async (offerId: number, action: "accept" | "decline" | "counter", amount?: string) => {
      setActionError(null);
      setBusyId(offerId);
      try {
        await apiFetch(`/offers/${offerId}/respond`, { method: "POST", body: { action, amount } });
        load();
        return true;
      } catch (err) {
        setActionError(describeApiError(err, "Could not respond to this offer."));
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  return { offers, loading, error, actionError, busyId, respond, reload: load };
}

/**
 * FR-C-032: submitting a new offer (with optional part-exchange) on a specific listing.
 */
export function useMakeOffer(listingId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (amount: string, partExchangeVehicleId?: string): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await apiFetch(`/listings/${listingId}/offers`, {
          method: "POST",
          body: { amount, part_exchange_vehicle_master_record_id: partExchangeVehicleId || undefined },
        });
        return true;
      } catch (err) {
        setError(describeApiError(err, "Could not submit this offer."));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [listingId],
  );

  return { submit, submitting, error };
}

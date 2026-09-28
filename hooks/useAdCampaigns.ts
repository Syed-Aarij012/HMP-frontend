"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiAdCampaign, mapApiAdProduct, type ApiAdCampaign, type ApiAdProduct } from "@/lib/mapApiMarketplaceTools";
import type { AdCampaign, AdProduct } from "@/types/marketplaceTools";

/** FR-C-021: a dealer's ad products, their own campaigns, and campaign management. */
export function useAdCampaigns() {
  const { user } = useAuth();
  const isDealer = typeof user?.organization_id === "number";
  const [products, setProducts] = useState<AdProduct[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(isDealer);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!isDealer) {
      setLoading(false);
      return;
    }

    Promise.all([
      apiFetch<{ data: ApiAdProduct[] }>("/ad-products"),
      apiFetch<{ data: ApiAdCampaign[] }>("/ad-campaigns"),
    ])
      .then(([productsResponse, campaignsResponse]) => {
        setProducts(productsResponse.data.map(mapApiAdProduct));
        setCampaigns(campaignsResponse.data.map(mapApiAdCampaign));
        setError(null);
      })
      .catch(() => setError("Could not load your ad campaigns from the server."))
      .finally(() => setLoading(false));
  }, [isDealer]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const launch = useCallback(
    async (input: { adProductId: number; listingId?: string; targetMake?: string; targetModel?: string; startsAt: string; endsAt: string }) => {
      setSubmitting(true);
      setActionError(null);
      try {
        await apiFetch("/ad-campaigns", {
          method: "POST",
          body: {
            ad_product_id: input.adProductId,
            listing_id: input.listingId || undefined,
            target_make: input.targetMake || undefined,
            target_model: input.targetModel || undefined,
            starts_at: input.startsAt,
            ends_at: input.endsAt,
          },
        });
        load();
        return true;
      } catch (err) {
        setActionError(describeApiError(err, "Could not launch this campaign."));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [load],
  );

  const setStatus = useCallback(
    async (campaignId: number, status: "active" | "paused" | "ended") => {
      setActionError(null);
      try {
        await apiFetch(`/ad-campaigns/${campaignId}`, { method: "PATCH", body: { status } });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not update this campaign."));
      }
    },
    [load],
  );

  return { products, campaigns, loading, error, actionError, submitting, isDealer, launch, setStatus };
}

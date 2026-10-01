"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiListingToCar, type ApiListing } from "@/lib/mapApiListing";
import type { Car } from "@/types/cars";

export type SponsoredCar = Car & { sponsoredLabel: string; campaignId: number };

type ApiSponsoredEntry = {
  campaign_id: number;
  label: string;
  placement: string;
  organization: { id: number | null; name: string | null };
  listing: ApiListing | null;
};

/**
 * FR-B-008/FR-C-021: sponsored placements for a search results page — a separate, labelled,
 * capped list (never blended into organic ranking), exactly matching AdService::serve()'s own
 * design. Previously built end-to-end on the backend (campaigns, impressions, click/lead
 * attribution) but called from nowhere in the frontend, so a dealer's paid campaign could
 * never actually be seen by a buyer.
 */
export function useSponsoredListings(placement: string, context: { make?: string; model?: string } = {}) {
  const [sponsored, setSponsored] = useState<SponsoredCar[]>([]);
  const { make, model } = context;

  useEffect(() => {
    let cancelled = false;

    const qs = new URLSearchParams();
    if (make) qs.set("make", make);
    if (model) qs.set("model", model);
    const query = qs.toString() ? `?${qs.toString()}` : "";

    apiFetch<{ data: ApiSponsoredEntry[] }>(`/ads/${placement}${query}`, { auth: false })
      .then((response) => {
        if (cancelled) return;

        const mapped = response.data
          .filter((entry): entry is ApiSponsoredEntry & { listing: ApiListing } => entry.listing !== null)
          .map((entry) => ({
            ...mapApiListingToCar(entry.listing),
            sponsoredLabel: entry.label,
            campaignId: entry.campaign_id,
          }));

        setSponsored(mapped);
      })
      .catch(() => {
        // Sponsored placements are a bonus, never load-bearing — a failure here must never
        // block or blank the organic results the rest of the page already shows.
        if (!cancelled) setSponsored([]);
      });

    return () => {
      cancelled = true;
    };
  }, [placement, make, model]);

  return sponsored;
}

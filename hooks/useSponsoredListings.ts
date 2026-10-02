"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiListingToCar, type ApiListing } from "@/lib/mapApiListing";
import type { Car } from "@/types/cars";

export type SponsoredCar = Car & { sponsoredLabel: string; campaignId: number };

// FR-C-021: a model-page sponsorship promotes a make/model, not one listing — it carries the
// sponsoring dealer and their own matching stock instead.
export type ModelPageSponsorship = {
  campaignId: number;
  label: string;
  sponsorName: string | null;
  sponsorHref: string | null;
  targetMake: string;
  targetModel: string | null;
  cars: SponsoredCar[];
};

type ApiSponsoredEntry = {
  campaign_id: number;
  label: string;
  placement: string;
  target_make: string | null;
  target_model: string | null;
  organization: { id: number | null; name: string | null; storefront_slug: string | null };
  listing: ApiListing | null;
  listings: ApiListing[];
};

type ListingPlacement = "featured" | "homepage";
type SponsoredContext = { make?: string; model?: string };

// Every sponsored card shows the label itself (CAP/ASA: an ad must be identifiable as one
// wherever it appears, not only via a section heading).
function toSponsoredCar(listing: ApiListing, entry: ApiSponsoredEntry): SponsoredCar {
  return { ...mapApiListingToCar(listing), tag: entry.label, sponsoredLabel: entry.label, campaignId: entry.campaign_id };
}

/**
 * Serving a placement records an impression per campaign (AdService::serve), so this fetches
 * once per placement/context. Sponsored placements are a bonus, never load-bearing — a failure
 * must never block or blank the organic content the rest of the page already shows.
 */
function useSponsoredEntries(placement: string, context: SponsoredContext, enabled: boolean) {
  const [entries, setEntries] = useState<ApiSponsoredEntry[]>([]);
  const { make, model } = context;

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      queueMicrotask(() => {
        if (!cancelled) setEntries([]);
      });
      return () => {
        cancelled = true;
      };
    }

    const qs = new URLSearchParams();
    if (make) qs.set("make", make);
    if (model) qs.set("model", model);
    const query = qs.toString() ? `?${qs.toString()}` : "";

    apiFetch<{ data: ApiSponsoredEntry[] }>(`/ads/serve/${placement}${query}`, { auth: false })
      .then((response) => {
        if (!cancelled) setEntries(response.data);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });

    return () => {
      cancelled = true;
    };
  }, [placement, make, model, enabled]);

  return entries;
}

/**
 * FR-B-008/FR-C-021: listing-based sponsored placements (search-page "featured", homepage
 * rail) — a separate, labelled, capped list, never blended into organic ranking.
 */
export function useSponsoredListings(placement: ListingPlacement, context: SponsoredContext = {}): SponsoredCar[] {
  return useSponsoredEntries(placement, context, true)
    .filter((entry): entry is ApiSponsoredEntry & { listing: ApiListing } => entry.listing !== null)
    .map((entry) => toSponsoredCar(entry.listing, entry));
}

/**
 * FR-C-021 model-page sponsorship. The app has no dedicated model page, so the search page
 * with a make (and optionally model) filter applied is that page — nothing is requested
 * until a make is chosen, since a sponsorship always targets one.
 */
export function useModelPageSponsorships(context: SponsoredContext): ModelPageSponsorship[] {
  return useSponsoredEntries("model-page", context, Boolean(context.make))
    .filter((entry) => entry.listings.length > 0)
    .map((entry) => ({
      campaignId: entry.campaign_id,
      label: entry.label,
      sponsorName: entry.organization.name,
      sponsorHref: entry.organization.storefront_slug ? `/dealer-detail/${entry.organization.storefront_slug}` : null,
      targetMake: entry.target_make ?? context.make ?? "",
      targetModel: entry.target_model,
      cars: entry.listings.map((listing) => toSponsoredCar(listing, entry)),
    }));
}

/**
 * FR-C-021 click attribution — without this, every campaign report shows 0 clicks and
 * AdService::attributeLead() (which credits leads from a prior click) never fires.
 * `keepalive` lets the request outlive the navigation the click itself triggers.
 */
export function recordSponsoredClick(campaignId: number) {
  apiFetch(`/ads/campaigns/${campaignId}/click`, { method: "POST", keepalive: true }).catch(() => {
    // Attribution is best-effort; never interfere with the buyer's navigation.
  });
}

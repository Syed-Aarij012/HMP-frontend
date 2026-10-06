"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiPricingSuggestion, mapApiPhotoGuidance, type ApiPricingSuggestion, type ApiPhotoGuidance } from "@/lib/mapApiMarketplaceTools";
import type { PricingSuggestion, PhotoGuidance } from "@/types/marketplaceTools";

/** FR-C-003: a valuation-anchored asking-price suggestion for a specific vehicle. */
export function usePricingSuggestion() {
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async (vehiclePublicId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: ApiPricingSuggestion }>(
        `/listing-pricing-suggestion?vehicle_master_record_id=${encodeURIComponent(vehiclePublicId)}`
      );
      setSuggestion(mapApiPricingSuggestion(response.data));
    } catch (err) {
      setError(describeApiError(err, "Could not get a pricing suggestion right now."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggestion, loading, error, fetchSuggestion };
}

export type VrmLookupPreview = {
  make: string | null;
  model: string | null;
  colour: string | null;
  fuelType: string | null;
};

/**
 * FR-C-003: "guided creation flow from VRM lookup (pre-filled spec)" — a preview only
 * (POST /vehicles/lookup-vrm never persists anything), called before the vehicle record
 * exists. A simulated DVLA VES stand-in, same as the inspector-only lookup elsewhere.
 */
export function useVrmLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (vrm: string): Promise<VrmLookupPreview | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{
        data: { make: string | null; model: string | null; colour: string | null; fuel_type: string | null };
      }>("/vehicles/lookup-vrm", { method: "POST", body: { vrm } });

      return {
        make: response.data.make,
        model: response.data.model,
        colour: response.data.colour,
        fuelType: response.data.fuel_type,
      };
    } catch (err) {
      setError(describeApiError(err, "Could not look up that plate right now."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookup, loading, error };
}

export type ListingQuality = {
  score: number;
  breakdown: {
    mediaCompleteness: number;
    specCompleteness: number;
    descriptionQuality: number;
    provenanceFreshness: number;
  };
  remediationPrompts: string[];
};

/**
 * FR-C-014: the 0-100 listing-quality score + remediation prompts — computed on the backend
 * (ListingQualityService) and already returned by GET /listings/{id} to the owner, but shown
 * nowhere on the seller's own dashboard until now.
 */
export function useListingQuality() {
  const [quality, setQuality] = useState<ListingQuality | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuality = useCallback(async (listingPublicId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{
        quality?: {
          score: number;
          breakdown: {
            media_completeness: number;
            spec_completeness: number;
            description_quality: number;
            provenance_freshness: number;
          };
          remediation_prompts: string[];
        };
      }>(`/listings/${listingPublicId}`);

      if (!response.quality) {
        setError("Quality score isn't available for this listing.");
        return;
      }

      setQuality({
        score: response.quality.score,
        breakdown: {
          mediaCompleteness: response.quality.breakdown.media_completeness,
          specCompleteness: response.quality.breakdown.spec_completeness,
          descriptionQuality: response.quality.breakdown.description_quality,
          provenanceFreshness: response.quality.breakdown.provenance_freshness,
        },
        remediationPrompts: response.quality.remediation_prompts,
      });
    } catch (err) {
      setError(describeApiError(err, "Could not load the quality score right now."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { quality, loading, error, fetchQuality };
}

/** FR-C-003: the photo shot list sellers are guided to capture. */
export function usePhotoGuidance(vehiclePublicId?: string) {
  const [guidance, setGuidance] = useState<PhotoGuidance | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const query = vehiclePublicId ? `?vehicle_master_record_id=${encodeURIComponent(vehiclePublicId)}` : "";

    // The guidance sits under `data`, like every other ListingToolsController response.
    apiFetch<{ data: ApiPhotoGuidance }>(`/listings/photo-guidance${query}`)
      .then((response) => setGuidance(mapApiPhotoGuidance(response.data)))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [vehiclePublicId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return { guidance, loading, load };
}

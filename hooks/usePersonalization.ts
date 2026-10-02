"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { mapApiListingToCar, type ApiListingsResponse } from "@/lib/mapApiListing";
import { useAuth } from "@/contexts/AuthContext";
import type { Car } from "@/types/cars";

/**
 * FR-B-007(b): fetches one of the two personalized rails (GET /me/recently-viewed or
 * GET /me/recommended-listings) — both return an empty list rather than an error when the
 * viewer hasn't consented, so this hook never needs to special-case that itself.
 */
function usePersonalFeed(path: string, enabled: boolean): { cars: Car[]; loading: boolean } {
  const [state, setState] = useState<{ cars: Car[]; loading: boolean }>({ cars: [], loading: enabled });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setState((current) => ({ ...current, loading: true }));
    });

    apiFetch<{ data: ApiListingsResponse["data"] }>(path)
      .then((response) => {
        if (!cancelled) setState({ cars: response.data.map(mapApiListingToCar), loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ cars: [], loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [path, enabled]);

  // Not just gated by the effect above — a signed-out viewer must never show a stale
  // personalized feed left over from a previous signed-in session on the same page instance.
  return enabled ? state : { cars: [], loading: false };
}

export function useRecentlyViewed() {
  const { user } = useAuth();
  return usePersonalFeed("/me/recently-viewed", Boolean(user));
}

export function useRecommendedListings() {
  const { user } = useAuth();
  return usePersonalFeed("/me/recommended-listings", Boolean(user));
}

/**
 * The consent toggle itself — reads the current state off the already-loaded AuthUser (no
 * extra fetch) and PATCHes + refreshes it on change.
 */
export function usePersonalizationConsent() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const consented = Boolean(user?.personalization_consent_at);

  const setConsent = useCallback(
    async (value: boolean) => {
      setSaving(true);
      try {
        await apiFetch("/me/personalization-consent", { method: "PATCH", body: { consent: value } });
        await refreshUser();
      } finally {
        setSaving(false);
      }
    },
    [refreshUser],
  );

  return { consented, setConsent, saving, signedIn: Boolean(user) };
}

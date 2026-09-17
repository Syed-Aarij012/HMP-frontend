"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export type DealerStorefrontProfile = {
  id: number;
  slug: string;
  display_name: string;
  description: string | null;
  logo_url: string | null;
  disclosures: string | null;
  tracked_phone_number: string | null;
};

type ApiDealerStorefrontResponse = { data: DealerStorefrontProfile };

export type UpdateDealerStorefrontPayload = {
  display_name?: string;
  tracked_phone_number?: string;
  disclosures?: string;
  description?: string;
};

export type DealerStorefrontProfileResult = {
  storefront: DealerStorefrontProfile | null;
  loading: boolean;
  error: string | null;
  isDealer: boolean;
  update: (payload: UpdateDealerStorefrontPayload) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  removeLogo: () => Promise<void>;
};

/**
 * A dealer_org_admin's own storefront profile — only fetched when the signed-in user
 * belongs to an organization; a private buyer/seller has nothing to load here.
 */
export function useDealerStorefrontProfile(): DealerStorefrontProfileResult {
  const { user } = useAuth();
  const isDealer = typeof user?.organization_id === "number";

  const [storefront, setStorefront] = useState<DealerStorefrontProfile | null>(null);
  const [loading, setLoading] = useState(isDealer);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isDealer) {
      queueMicrotask(() => {
        if (!cancelled) {
          setStorefront(null);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiFetch<ApiDealerStorefrontResponse>("/my-dealer-storefront")
      .then((response) => {
        if (!cancelled) setStorefront(response.data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your dealer storefront right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isDealer]);

  const update = useCallback(async (payload: UpdateDealerStorefrontPayload) => {
    const response = await apiFetch<ApiDealerStorefrontResponse>("/my-dealer-storefront", {
      method: "PATCH",
      body: payload,
    });
    setStorefront(response.data);
  }, []);

  const uploadLogo = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    const response = await apiFetch<ApiDealerStorefrontResponse>("/my-dealer-storefront/logo", {
      method: "POST",
      body: formData,
    });
    setStorefront(response.data);
  }, []);

  const removeLogo = useCallback(async () => {
    const response = await apiFetch<ApiDealerStorefrontResponse>("/my-dealer-storefront/logo", {
      method: "DELETE",
    });
    setStorefront(response.data);
  }, []);

  return { storefront, loading, error, isDealer, update, uploadLogo, removeLogo };
}

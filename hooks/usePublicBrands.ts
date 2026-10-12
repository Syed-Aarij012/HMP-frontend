"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export type PublicBrand = {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  display_order: number;
  listing_count: number;
};

/**
 * The homepage "Search By Brand" rail, and anywhere else that wants it — admin-managed via
 * the Brands admin panel page (GET /admin/brands), publicly readable here with no auth.
 * listing_count is computed server-side from live listings, not set by an admin.
 */
export function usePublicBrands() {
  const [brands, setBrands] = useState<PublicBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ data: PublicBrand[] }>("/brands", { auth: false })
      .then((response) => {
        if (cancelled) return;
        setBrands(response.data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load brands from the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { brands, loading, error };
}

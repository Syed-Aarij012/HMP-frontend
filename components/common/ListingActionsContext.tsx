"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import { favoriteCars, getCarById } from "@/data/cars";
import { apiFetch, ApiError } from "@/lib/api-client";
import { mapApiListingToCar, type ApiListing } from "@/lib/mapApiListing";
import { useAuth } from "@/contexts/AuthContext";
import type { Car } from "@/types/cars";

const COMPARE_STORAGE_KEY = "hmp-compare-ids";
const FAVORITE_STORAGE_KEY = "hmp-favorite-ids";

type ApiWatchlistItem = {
  id: number;
  watchable_type: "listing" | "lot";
  watchable: ApiListing | Record<string, unknown>;
};

type ListingActionsContextValue = {
  compareIds: number[];
  favoriteIds: number[];
  compareCars: Car[];
  favoriteCars: Car[];
  isInCompare: (id: number) => boolean;
  isFavorite: (id: number) => boolean;
  addToCompare: (car: Car) => void;
  toggleFavorite: (car: Car) => void;
  removeFromCompare: (id: number) => void;
  removeFromFavorite: (id: number) => void;
  openComparePanel: () => void;
  syncCompareIds: (ids: number[]) => void;
  favoritesLoading: boolean;
};

const ListingActionsContext = createContext<ListingActionsContextValue | null>(
  null,
);

function readStoredIds(key: string, fallback: number[] = []): number[] {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return fallback;
    }

    return parsed.filter((id): id is number => typeof id === "number");
  } catch {
    return fallback;
  }
}

function writeStoredIds(key: string, ids: number[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(ids));
}

function getDefaultFavoriteIds() {
  return favoriteCars.map((car) => car.id);
}

export function useListingActions() {
  const context = useContext(ListingActionsContext);
  if (!context) {
    throw new Error(
      "useListingActions must be used within ListingActionsProvider",
    );
  }
  return context;
}

type ListingActionsProviderProps = {
  children: ReactNode;
};

export function ListingActionsProvider({
  children,
}: ListingActionsProviderProps) {
  const { user } = useAuth();
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  // Real (API-backed) cars aren't in data/cars.ts, so getCarById alone can't resolve them —
  // this caches whatever full Car object a caller already had in hand (a listing/watchlist
  // card) the moment it added/favorited it, keyed the same way ids already are.
  const [carCache, setCarCache] = useState<Record<number, Car>>({});
  // A real favorite's watchlist row id (needed to DELETE it) — the Car's own numeric id is
  // a hash of its ULID, not this.
  const [watchlistEntryIds, setWatchlistEntryIds] = useState<Record<number, number>>({});

  useEffect(() => {
    startTransition(() => {
      setCompareIds(readStoredIds(COMPARE_STORAGE_KEY));
      setFavoriteIds(
        readStoredIds(FAVORITE_STORAGE_KEY, getDefaultFavoriteIds()),
      );
      setIsStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    writeStoredIds(COMPARE_STORAGE_KEY, compareIds);
  }, [compareIds, isStorageReady]);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    writeStoredIds(FAVORITE_STORAGE_KEY, favoriteIds);
  }, [favoriteIds, isStorageReady]);

  // Signed-in users' favorites are real Watchlist rows — merge them in on login (and drop
  // them again on logout, so one browser's local list can't leak into the next account).
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      queueMicrotask(() => {
        if (!cancelled) setWatchlistEntryIds({});
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setFavoritesLoading(true);
    });

    apiFetch<{ data: ApiWatchlistItem[] }>("/watchlist")
      .then((response) => {
        if (cancelled) return;

        const listingItems = response.data.filter(
          (item): item is ApiWatchlistItem & { watchable: ApiListing } =>
            item.watchable_type === "listing",
        );

        const nextCache: Record<number, Car> = {};
        const nextEntryIds: Record<number, number> = {};
        const ids: number[] = [];

        for (const item of listingItems) {
          const car = mapApiListingToCar(item.watchable);
          nextCache[car.id] = car;
          nextEntryIds[car.id] = item.id;
          ids.push(car.id);
        }

        setCarCache((current) => ({ ...current, ...nextCache }));
        setWatchlistEntryIds(nextEntryIds);
        setFavoriteIds((current) => [...new Set([...ids, ...current])]);
      })
      .catch(() => {
        // Signed in but the watchlist fetch failed — keep whatever was already local
        // rather than wiping favorites out from under the user.
      })
      .finally(() => {
        if (!cancelled) setFavoritesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const resolveCar = useCallback(
    (id: number) => carCache[id] ?? getCarById(id),
    [carCache],
  );

  const compareCars = useMemo(
    () =>
      compareIds
        .map((id) => resolveCar(id))
        .filter((car): car is Car => car !== undefined),
    [compareIds, resolveCar],
  );

  const resolvedFavoriteCars = useMemo(
    () =>
      favoriteIds
        .map((id) => resolveCar(id))
        .filter((car): car is Car => car !== undefined),
    [favoriteIds, resolveCar],
  );

  const isInCompare = useCallback(
    (id: number) => compareIds.includes(id),
    [compareIds],
  );

  const isFavorite = useCallback(
    (id: number) => favoriteIds.includes(id),
    [favoriteIds],
  );

  const openComparePanel = useCallback(() => {
    const element = document.getElementById("offcanvasBottom");
    if (!element) {
      return;
    }

    void import("bootstrap/js/dist/offcanvas").then(
      ({ default: Offcanvas }) => {
        Offcanvas.getOrCreateInstance(element).show();
      },
    );
  }, []);

  const removeFromCompare = useCallback((id: number) => {
    setCompareIds((current) => current.filter((itemId) => itemId !== id));
  }, []);

  const removeFromFavorite = useCallback(
    (id: number) => {
      setFavoriteIds((current) => current.filter((itemId) => itemId !== id));

      const entryId = watchlistEntryIds[id];
      if (user && entryId) {
        apiFetch(`/watchlist/${entryId}`, { method: "DELETE" }).catch(() => {});
        setWatchlistEntryIds((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      }
    },
    [user, watchlistEntryIds],
  );

  const syncCompareIds = useCallback((ids: number[]) => {
    setCompareIds([...new Set(ids)]);
  }, []);

  const addToCompare = useCallback((car: Car) => {
    setCarCache((current) => ({ ...current, [car.id]: car }));
    setCompareIds((current) => {
      return [...new Set([car.id, ...current])];
    });
  }, []);

  const toggleFavorite = useCallback(
    (car: Car) => {
      setCarCache((current) => ({ ...current, [car.id]: car }));

      const currentlyFavorite = favoriteIds.includes(car.id);
      setFavoriteIds((current) =>
        currentlyFavorite
          ? current.filter((id) => id !== car.id)
          : [...current, car.id],
      );

      // A real listing (has a backend ULID) for a signed-in user syncs to the real
      // Watchlist API too — anything else (a guest, or a mock/demo car) stays local-only.
      if (!user || !car.publicId) {
        return;
      }

      if (currentlyFavorite) {
        const entryId = watchlistEntryIds[car.id];
        if (entryId) {
          apiFetch(`/watchlist/${entryId}`, { method: "DELETE" }).catch(() => {});
          setWatchlistEntryIds((current) => {
            const next = { ...current };
            delete next[car.id];
            return next;
          });
        }
        return;
      }

      apiFetch<{ data: ApiWatchlistItem }>("/watchlist", {
        method: "POST",
        body: { watchable_type: "listing", watchable_id: car.publicId },
      })
        .then((response) => {
          setWatchlistEntryIds((current) => ({ ...current, [car.id]: response.data.id }));
        })
        .catch((error) => {
          // Not fatal for the UI (it already toggled locally) — but a 401 mid-session
          // means the token expired, in which case don't pretend it synced.
          if (error instanceof ApiError && error.status === 401) {
            setFavoriteIds((current) => current.filter((id) => id !== car.id));
          }
        });
    },
    [favoriteIds, user, watchlistEntryIds],
  );

  const value = useMemo(
    () => ({
      compareIds,
      favoriteIds,
      compareCars,
      favoriteCars: resolvedFavoriteCars,
      isInCompare,
      isFavorite,
      addToCompare,
      toggleFavorite,
      removeFromCompare,
      removeFromFavorite,
      openComparePanel,
      syncCompareIds,
      favoritesLoading,
    }),
    [
      compareIds,
      favoriteIds,
      compareCars,
      resolvedFavoriteCars,
      isInCompare,
      isFavorite,
      addToCompare,
      toggleFavorite,
      removeFromCompare,
      removeFromFavorite,
      openComparePanel,
      syncCompareIds,
      favoritesLoading,
    ],
  );

  return (
    <ListingActionsContext.Provider value={value}>
      {children}
    </ListingActionsContext.Provider>
  );
}

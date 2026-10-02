"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ListingResultsPanel from "@/components/common/ListingResultsPanel";
import Pagination from "@/components/common/Pagination";
import { setCurrentPage } from "@/components/reducer/listingFilterActions";
import { useListingFilterState } from "@/components/listings/useListingFilterState";
import SaleAgentListingCard from "@/components/sections/sale-agents-detail/SaleAgentListingCard";
import { DEFAULT_SEARCH_PARAMS, useSearchListings, type ListingSearchParams } from "@/hooks/useSearchListings";
import { useSponsoredListings } from "@/hooks/useSponsoredListings";
import ListingSearchBar from "./ListingSearchBar";
import LiveFilters from "./LiveFilters";

// FR-C-004: the only facets reflected in this page's own URL — see the matching whitelist in
// app/(cars)/listing-grid/page.tsx's canonical-URL logic. Every other filter stays
// client-state-only so it can never produce an indexable URL combination.
const URL_WHITELISTED_FACETS = ["make", "model", "bodyType"] as const;
const URL_PARAM_NAMES: Record<(typeof URL_WHITELISTED_FACETS)[number], string> = {
  make: "make",
  model: "model",
  bodyType: "body_type",
};

function initialParamsFromUrl(searchParams: URLSearchParams): ListingSearchParams {
  const params = { ...DEFAULT_SEARCH_PARAMS };
  for (const key of URL_WHITELISTED_FACETS) {
    const value = searchParams.get(URL_PARAM_NAMES[key]);
    if (value) params[key] = value;
  }
  return params;
}

export default function ListingGridContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState<ListingSearchParams>(() => initialParamsFromUrl(searchParams));
  const hasMounted = useRef(false);

  // Keeps the URL in sync with the whitelisted facets only — every other filter change never
  // touches the URL at all, by construction (it's simply not in this dependency list).
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const next = new URLSearchParams();
    for (const key of URL_WHITELISTED_FACETS) {
      if (params[key]) next.set(URL_PARAM_NAMES[key], params[key]);
    }
    const query = next.toString();
    router.replace(query ? `/listing-grid?${query}` : "/listing-grid", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.make, params.model, params.bodyType]);
  const { cars, interpretation, locationArea, nationalFallback, facets, meta, loading, error, searchError } = useSearchListings(params, 60);

  // FR-B-008/FR-C-021: sponsored placements — always a separate, labelled, capped list, never
  // blended into the organic ranking above (AdService's own compliance design).
  const sponsored = useSponsoredListings("featured", { make: params.make, model: params.model });

  // FR-B-001: cars arriving here are already filtered server-side against every param above —
  // this hook now only drives client-side sort-dropdown/page-size/pagination UI state, not
  // filtering (no legacy Filters control writes into it any more, so its own filter fields
  // never leave their all-match defaults).
  const { state, dispatch, visibleListings, totalPages } =
    useListingFilterState({
      listings: cars,
      itemPerPage: 10,
      priceMax: facets?.price?.max ?? undefined,
    });

  if (error) {
    return (
      <section className="tf-section listing-detail">
        <div className="container">
          <div className="alert alert-danger">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <ListingSearchBar
        params={params}
        interpretation={interpretation}
        locationArea={locationArea}
        nationalFallback={nationalFallback}
        searchError={searchError}
        onChange={setParams}
      />
      {loading && (
        <div className="container">
          <p>Loading live listings...</p>
        </div>
      )}
      <LiveFilters params={params} facets={facets ?? null} onChange={setParams} />
      {sponsored.length > 0 && (
        <section className="tf-section listing-detail">
          <div className="container">
            <p className="fw-6 text-color-2 mb-10">Sponsored</p>
            <div className="list-car-grid-1">
              {sponsored.map((car) => (
                <SaleAgentListingCard key={`sponsored-${car.campaignId}`} car={car} layout="grid" />
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="tf-section listing-detail">
        <div className="container">
          <ListingResultsPanel
            defaultView="grid"
            gridColumns={4}
            showMobileFilter={false}
            resultCount={meta?.total ?? state.sorted.length}
            filterState={state}
            filterDispatch={dispatch}
            footer={
              <Pagination
                className="center mt-40"
                listClassName="justify-center"
                totalPages={meta ? Math.ceil(meta.total / state.itemPerPage) : totalPages}
                currentPage={state.currentPage}
                onPageChange={(page) => setCurrentPage(page, dispatch)}
              />
            }
          >
            {(view) =>
              visibleListings.length > 0 ? (
                visibleListings.map((car) => (
                  <SaleAgentListingCard
                    key={car.id}
                    car={car}
                    layout={view}
                  />
                ))
              ) : (
                <div className="no-results">
                  <p>No listings match your filters.</p>
                </div>
              )
            }
          </ListingResultsPanel>
        </div>
      </section>
    </>
  );
}

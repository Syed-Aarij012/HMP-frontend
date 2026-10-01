"use client";

import { useState } from "react";
import ListingResultsPanel from "@/components/common/ListingResultsPanel";
import Pagination from "@/components/common/Pagination";
import { setCurrentPage } from "@/components/reducer/listingFilterActions";
import { useListingFilterState } from "@/components/listings/useListingFilterState";
import SaleAgentListingCard from "@/components/sections/sale-agents-detail/SaleAgentListingCard";
import { DEFAULT_SEARCH_PARAMS, useSearchListings } from "@/hooks/useSearchListings";
import ListingSearchBar from "./ListingSearchBar";
import LiveFilters from "./LiveFilters";

export default function ListingGridContent() {
  const [params, setParams] = useState(DEFAULT_SEARCH_PARAMS);
  const { cars, interpretation, locationArea, nationalFallback, facets, meta, loading, error, searchError } = useSearchListings(params, 60);

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

"use client";

import { useMemo, useState } from "react";
import Filters from "@/components/common/Filters";
import ListingResultsPanel from "@/components/common/ListingResultsPanel";
import Pagination from "@/components/common/Pagination";
import { setCurrentPage } from "@/components/reducer/listingFilterActions";
import { useListingFilterState } from "@/components/listings/useListingFilterState";
import SaleAgentListingCard from "@/components/sections/sale-agents-detail/SaleAgentListingCard";
import { DEFAULT_SEARCH_PARAMS, useSearchListings } from "@/hooks/useSearchListings";
import ListingSearchBar from "./ListingSearchBar";
import {
  buildListingPriceOptions,
  getListingPriceBounds,
} from "@/lib/buildListingPriceOptions";

export default function ListingGridContent() {
  const [params, setParams] = useState(DEFAULT_SEARCH_PARAMS);
  const { cars, interpretation, locationArea, loading, error, searchError } = useSearchListings(params, 60);

  const priceBounds = useMemo(() => getListingPriceBounds(cars), [cars]);
  const priceOptions = useMemo(() => buildListingPriceOptions(cars), [cars]);

  const { state, dispatch, visibleListings, totalPages } =
    useListingFilterState({
      listings: cars,
      itemPerPage: 10,
      priceMax: priceBounds.max,
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
        searchError={searchError}
        onChange={setParams}
      />
      {loading && (
        <div className="container">
          <p>Loading live listings...</p>
        </div>
      )}
      <div className="flat-filter-search tf-section-listing">
        <div className="container">
          <div className="flat-tabs">
            <Filters
              state={state}
              dispatch={dispatch}
              priceOptions={priceOptions}
            />
          </div>
        </div>
      </div>
      <section className="tf-section listing-detail">
        <div className="container">
          <ListingResultsPanel
            defaultView="grid"
            gridColumns={4}
            showMobileFilter={false}
            resultCount={state.sorted.length}
            filterState={state}
            filterDispatch={dispatch}
            footer={
              <Pagination
                className="center mt-40"
                listClassName="justify-center"
                totalPages={totalPages}
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

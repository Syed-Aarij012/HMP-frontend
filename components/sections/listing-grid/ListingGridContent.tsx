"use client";

import { useState } from "react";
import Link from "next/link";
import ListingResultsPanel from "@/components/common/ListingResultsPanel";
import Pagination from "@/components/common/Pagination";
import { setCurrentPage } from "@/components/reducer/listingFilterActions";
import { useListingFilterState } from "@/components/listings/useListingFilterState";
import SponsoredRail from "@/components/common/SponsoredRail";
import SaleAgentListingCard from "@/components/sections/sale-agents-detail/SaleAgentListingCard";
import { DEFAULT_SEARCH_PARAMS, useSearchListings } from "@/hooks/useSearchListings";
import { recordSponsoredClick, useModelPageSponsorships, useSponsoredListings } from "@/hooks/useSponsoredListings";
import ListingSearchBar from "./ListingSearchBar";
import LiveFilters from "./LiveFilters";

export default function ListingGridContent() {
  const [params, setParams] = useState(DEFAULT_SEARCH_PARAMS);
  const { cars, interpretation, locationArea, nationalFallback, facets, meta, loading, error, searchError } = useSearchListings(params, 60);

  // FR-B-008/FR-C-021: sponsored placements — always a separate, labelled, capped list, never
  // blended into the organic ranking above (AdService's own compliance design).
  const sponsored = useSponsoredListings("featured", { make: params.make, model: params.model });
  // FR-C-021 model-page sponsorship: there's no dedicated model page, so this grid with a
  // make/model filter applied is that page. Only requested once a make is chosen.
  const modelPageSponsorships = useModelPageSponsorships({ make: params.make, model: params.model });

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
      {modelPageSponsorships.map((sponsorship) => (
        <SponsoredRail
          key={`model-page-${sponsorship.campaignId}`}
          title={`${sponsorship.targetMake}${params.model ? ` ${params.model}` : sponsorship.targetModel ? ` ${sponsorship.targetModel}` : ""} stock`}
          label={sponsorship.label}
          subtitle={
            sponsorship.sponsorName &&
            (sponsorship.sponsorHref ? (
              <>
                Sponsored by{" "}
                <Link href={sponsorship.sponsorHref} onClick={() => recordSponsoredClick(sponsorship.campaignId)}>
                  {sponsorship.sponsorName}
                </Link>
              </>
            ) : (
              <>Sponsored by {sponsorship.sponsorName}</>
            ))
          }
          cars={sponsorship.cars}
          sectionClassName="tf-section listing-detail"
          gridClassName="list-car-grid-1"
        />
      ))}
      <SponsoredRail
        title="Featured listings"
        label={sponsored[0]?.sponsoredLabel ?? "Sponsored"}
        cars={sponsored}
        sectionClassName="tf-section listing-detail"
        gridClassName="list-car-grid-1"
      />
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

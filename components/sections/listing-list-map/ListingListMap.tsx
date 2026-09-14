"use client";

import { ListingMapProvider } from "@/components/common/ListingMapContext";
import ListingMapPanel from "@/components/common/ListingMapPanel";
import ListingMapSidebar from "@/components/common/ListingMapSidebar";
import ListingFilterOffcanvas from "@/components/listings/ListingFilterOffcanvas";
import { useListingFilterState } from "@/components/listings/useListingFilterState";
import { useMapListings } from "@/hooks/useMapListings";

const MAP_FILTER_OFFCANVAS_ID = "offcanvas-listing-list-map-filter";

export default function ListingListMap() {
  const { cars, loading, error } = useMapListings(60);
  const { state, dispatch } = useListingFilterState({
    listings: cars,
    itemPerPage: cars.length || 1,
  });

  if (loading) {
    return (
      <div className="container">
        <p>Loading live listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <>
      <ListingMapProvider listings={state.sorted}>
        <div className=" wrap-map flat-featured  listing-grid style flex listing-wrap-map">
          <ListingMapSidebar
            title="Listing List"
            defaultView="list"
            filterState={state}
            filterDispatch={dispatch}
            filterOffcanvasId={MAP_FILTER_OFFCANVAS_ID}
          />
          <div className="content-right fixed-space po-sticky">
            <ListingMapPanel zoom={16} />
          </div>
        </div>
      </ListingMapProvider>
      <ListingFilterOffcanvas
        id={MAP_FILTER_OFFCANVAS_ID}
        formId="filter-form-list-map"
        state={state}
        dispatch={dispatch}
      />
    </>
  );
}

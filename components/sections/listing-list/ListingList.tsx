"use client";

import ListingResultsPanel from "@/components/common/ListingResultsPanel";
import ListingSidebarFilterForm, {
  ListingSidebarClearButton,
} from "@/components/common/ListingSidebarFilterForm";
import Pagination from "@/components/common/Pagination";
import { setCurrentPage } from "@/components/reducer/listingFilterActions";
import { useListingFilterState } from "@/components/listings/useListingFilterState";
import SaleAgentListingCard from "@/components/sections/sale-agents-detail/SaleAgentListingCard";
import { useHomepageListings } from "@/hooks/useHomepageListings";

export default function ListingList() {
  const { cars, loading, error } = useHomepageListings(100);
  const { state, dispatch, visibleListings, totalPages } =
    useListingFilterState({
      listings: cars,
      itemPerPage: 50,
    });

  if (loading) {
    return (
      <section className="tf-section listing-detail pd-t0-mb">
        <div className="container">
          <p>Loading live listings...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="tf-section listing-detail pd-t0-mb">
        <div className="container">
          <div className="alert alert-danger">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="tf-section listing-detail pd-t0-mb">
      <div className="container">
        <div className="listing-grid flex text-start gap-48">
          <div className="sidebar-right-listing">
            <div className="sidebar-title flex-two flex-wrap">
              <h4>Filters and Sort</h4>
              <ListingSidebarClearButton dispatch={dispatch} />
            </div>
            <div className="form-filter-siderbar">
              <ListingSidebarFilterForm
                id="filter-form"
                state={state}
                dispatch={dispatch}
              />
            </div>
          </div>
          <ListingResultsPanel
            defaultView="list"
            gridColumns={3}
            resultCount={state.sorted.length}
            filterState={state}
            filterDispatch={dispatch}
            footer={
              <Pagination
                className="mt-40"
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
      </div>
    </section>
  );
}

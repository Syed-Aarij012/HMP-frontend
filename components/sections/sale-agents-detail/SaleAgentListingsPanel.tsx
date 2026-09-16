"use client";

import { useState } from "react";
import Pagination from "@/components/common/Pagination";
import ListingViewToggle from "@/components/common/ListingViewToggle";
import ListingToolbarSelects from "@/components/common/ListingToolbarSelects";
import SaleAgentListingCard from "@/components/sections/sale-agents-detail/SaleAgentListingCard";
import { useListingFilterState } from "@/components/listings/useListingFilterState";
import { useFilteredListings } from "@/hooks/useFilteredListings";
import {
  setCategoryTab,
  setCurrentPage,
  setItemPerPage,
  setSorting,
} from "@/components/reducer/listingFilterActions";
import {
  saleAgentListingCars,
  saleAgentListingTabs,
  type SaleAgentListingTab,
} from "@/data/cars";
import { SALE_AGENT_SHOW_OPTIONS } from "@/data/niceSelectOptions";
import type { ListingCategoryTab } from "@/types/listingFilter";
import type { Agent } from "@/types/agents";

type ListingView = "grid" | "list";

const SALE_AGENT_TAB_MAP: Record<SaleAgentListingTab, ListingCategoryTab> = {
  "Used car": "used",
  "New car": "new",
};

function getActiveTab(categoryTab: ListingCategoryTab): SaleAgentListingTab {
  return categoryTab === "new" ? "New car" : "Used car";
}

type SaleAgentListingsPanelProps = {
  agent: Agent;
};

export default function SaleAgentListingsPanel({ agent }: SaleAgentListingsPanelProps) {
  const [view, setView] = useState<ListingView>("grid");

  // A real agent's own live listings — a mock agent (no real seller_user_id to filter by)
  // keeps showing the template's sample cars instead.
  const { cars: realCars, loading, error } = useFilteredListings({
    sellerUserId: agent.isReal ? agent.id : undefined,
  });
  const listings = agent.isReal ? realCars : saleAgentListingCars;

  const { state, dispatch, visibleListings, totalPages } =
    useListingFilterState({
      listings,
      itemPerPage: 6,
      categoryTab: "used",
    });

  const activeTab = getActiveTab(state.categoryTab);

  const listClassName =
    view === "grid"
      ? "list-car-list-1 list-car-grid-1"
      : "list-car-list-1 listing-list-section";

  const handleTabChange = (tab: SaleAgentListingTab) => {
    setCategoryTab(SALE_AGENT_TAB_MAP[tab], dispatch);
    setCurrentPage(1, dispatch);
  };

  return (
    <div className="listing-list-car-wrap">
      <div className="category-filter flex justify-space align-center mb-40 flex-wrap gap-8">
        <h2 className="title">All Listing</h2>
        <div className="box-2 flex flex-wrap gap-8">
          <ListingViewToggle view={view} onViewChange={setView} />
          <ListingToolbarSelects
            showDefault={6}
            showOptions={SALE_AGENT_SHOW_OPTIONS}
            itemPerPage={state.itemPerPage}
            sortingOption={state.sortingOption}
            onItemPerPageChange={(count) => setItemPerPage(count, dispatch)}
            onSortingChange={(option) => setSorting(option, dispatch)}
          />
        </div>
      </div>
      <div className="flat-tabs themesflat-tabs">
        <div className="box-tab center">
          <ul className="menu-tab tab-title style flex">
            {saleAgentListingTabs.map((tab) => (
              <li
                key={tab}
                className={`item-title${activeTab === tab ? " active" : ""}`}
                onClick={() => handleTabChange(tab)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleTabChange(tab);
                  }
                }}
                role="tab"
                aria-selected={activeTab === tab}
                tabIndex={0}
              >
                <span className="inner">{tab}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="content-tab">
          <div className="content-inner tab-content">
            <div className={listClassName}>
              {agent.isReal && loading ? (
                <div className="no-results">
                  <p>Loading listings...</p>
                </div>
              ) : agent.isReal && error ? (
                <div className="no-results">
                  <p>{error}</p>
                </div>
              ) : visibleListings.length > 0 ? (
                visibleListings.map((car) => (
                  <SaleAgentListingCard key={car.id} car={car} layout={view} />
                ))
              ) : (
                <div className="no-results">
                  <p>No listings match your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Pagination
        className="mt-30"
        totalPages={totalPages}
        currentPage={state.currentPage}
        onPageChange={(page) => setCurrentPage(page, dispatch)}
      />
    </div>
  );
}

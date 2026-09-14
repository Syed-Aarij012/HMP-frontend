"use client";

import { useMemo, useState } from "react";
import Pagination from "@/components/common/Pagination";
import DealerListingToolbar from "@/components/common/DealerListingToolbar";
import DealerListingCard from "@/components/sections/dealer-listing/DealerListingCard";
import { useDealers } from "@/hooks/useDealers";
import { getDealerListingResults } from "@/lib/dealerListingUtils";
import type { NiceSelectOption } from "@/components/common/NiceSelect";
import type { DealerSortOption } from "@/types/dealers";

type DealerListingContentProps = {
  title?: string;
};

export default function DealerListingContent({
  title = "Find Car Dealerships",
}: DealerListingContentProps) {
  const { dealers, loading, error } = useDealers();
  const [location, setLocation] = useState("");
  const [brand, setBrand] = useState("");
  const [perPage, setPerPage] = useState(8);
  const [sortBy, setSortBy] = useState<DealerSortOption>("date");
  const [page, setPage] = useState(1);

  // data/niceSelectOptions.ts's DEALER_LOCATION_OPTIONS/DEALER_BRAND_OPTIONS are derived
  // from the mock data/dealers.ts array (US state names, specific car-brand names). Real
  // dealers report their rooftop's city as `state` and always "Multi-Brand" as `brand`, so
  // those mock-derived options wouldn't match anything a real dealer actually has. Derive
  // the dropdown options from whichever dealers actually came back instead, so filtering
  // never silently returns zero results.
  const locationOptions: NiceSelectOption[] = useMemo(() => {
    const states = [...new Set(dealers.map((dealer) => dealer.state).filter(Boolean))].sort();
    return [
      { label: "All locations", value: "" },
      ...states.map((state) => ({ label: state, value: state })),
    ];
  }, [dealers]);

  const brandOptions: NiceSelectOption[] = useMemo(() => {
    const brands = [...new Set(dealers.map((dealer) => dealer.brand).filter(Boolean))].sort();
    return [
      { label: "All brands", value: "" },
      ...brands.map((brand) => ({ label: brand, value: brand })),
    ];
  }, [dealers]);

  const results = useMemo(
    () =>
      getDealerListingResults(dealers, {
        location,
        brand,
        sortBy,
        perPage,
        page,
      }),
    [dealers, location, brand, sortBy, perPage, page],
  );

  const resetPage = () => setPage(1);

  return (
    <section className="tf-section">
      <div className="container">
        <div className="group-dealer-title">
          <h2>{title}</h2>
          <DealerListingToolbar
            location={location}
            brand={brand}
            perPage={perPage}
            sortBy={sortBy}
            locationOptions={locationOptions}
            brandOptions={brandOptions}
            onLocationChange={(value) => {
              setLocation(value);
              resetPage();
            }}
            onBrandChange={(value) => {
              setBrand(value);
              resetPage();
            }}
            onPerPageChange={(value) => {
              setPerPage(value);
              resetPage();
            }}
            onSortChange={(value) => {
              setSortBy(value);
              resetPage();
            }}
          />
        </div>
        <div className="wrap-scoll-dealer">
          {loading ? (
            <div className="compare-page-empty mb-50">
              <p>Loading dealerships…</p>
            </div>
          ) : error ? (
            <div className="compare-page-empty mb-50">
              <p>{error}</p>
            </div>
          ) : results.items.length > 0 ? (
            <div className="grid-4 gap-30 mb-50">
              {results.items.map((dealer) => (
                <DealerListingCard key={dealer.id} dealer={dealer} />
              ))}
            </div>
          ) : (
            <div className="compare-page-empty mb-50">
              <p>No dealerships match your filters.</p>
            </div>
          )}
          <Pagination
            variant="tfcl"
            styleDealer
            currentPage={results.page}
            totalPages={results.totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Pagination from "@/components/common/Pagination";
import DealerListingToolbar from "@/components/common/DealerListingToolbar";
import DealerListingCard from "@/components/sections/dealer-listing/DealerListingCard";
import { useDealers } from "@/hooks/useDealers";
import { useMakeFacets } from "@/hooks/useMakeFacets";
import { getDealerListingResults } from "@/lib/dealerListingUtils";
import type { NiceSelectOption } from "@/components/common/NiceSelect";
import type { DealerSortOption } from "@/types/dealers";

type DealerListingContentProps = {
  title?: string;
};

export default function DealerListingContent({
  title = "Find Car Dealerships",
}: DealerListingContentProps) {
  // "Dealerships by Brands" tiles deep-link here as /dealer-listing?brand=Ford.
  const searchParams = useSearchParams();
  const [location, setLocation] = useState("");
  const [brand, setBrand] = useState(() => searchParams.get("brand") ?? "");
  const [perPage, setPerPage] = useState(8);
  const [sortBy, setSortBy] = useState<DealerSortOption>("date");
  const [page, setPage] = useState(1);

  // A real dealer isn't one brand (mapApiDealerToDealer reports "Multi-Brand" for all of
  // them), so filtering happens server-side by "has a live listing of this make" instead —
  // see DealerController::index(). makeCounts gives the same real, non-empty option list
  // the homepage's brand tiles use, rather than a mock/derived one that might match nothing.
  const { dealers, loading, error } = useDealers({ make: brand || undefined });
  const { makes } = useMakeFacets();

  const locationOptions: NiceSelectOption[] = useMemo(() => {
    const states = [...new Set(dealers.map((dealer) => dealer.state).filter(Boolean))].sort();
    return [
      { label: "All locations", value: "" },
      ...states.map((state) => ({ label: state, value: state })),
    ];
  }, [dealers]);

  const brandOptions: NiceSelectOption[] = useMemo(() => {
    return [
      { label: "All brands", value: "" },
      ...makes.map((make) => ({ label: make.value, value: make.value })),
    ];
  }, [makes]);

  const results = useMemo(
    () =>
      getDealerListingResults(dealers, {
        // Brand is already applied server-side by useDealers({ make }) above — filtering
        // again here client-side by the (always "Multi-Brand") dealer.brand field would
        // incorrectly wipe out every real result.
        location,
        brand: "",
        sortBy,
        perPage,
        page,
      }),
    [dealers, location, sortBy, perPage, page],
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

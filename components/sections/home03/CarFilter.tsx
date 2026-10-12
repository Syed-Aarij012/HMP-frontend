"use client";

import { useMemo } from "react";
import Filters from "@/components/common/Filters";
import { useHomepageListings } from "@/hooks/useHomepageListings";

function CarFilter() {
  // per_page: 1 — only the facets are needed here, not the listings themselves.
  const { modelOptions: modelFacet } = useHomepageListings(1);

  const modelOptions = useMemo(
    () => [
      { label: "Any model", value: "" },
      ...modelFacet
        .slice()
        .sort((a, b) => b.count - a.count)
        .map((bucket) => ({ label: bucket.value, value: bucket.value })),
    ],
    [modelFacet],
  );

  return (
    <>
      <div className="flat-filter-search home8">
        <div className="container2">
          <div className="flat-tabs">
            <Filters modelOptions={modelOptions} />
          </div>
        </div>
      </div>
    </>
  );
}

export default CarFilter;

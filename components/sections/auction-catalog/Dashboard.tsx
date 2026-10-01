"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import NiceSelect, { type NiceSelectOption } from "@/components/common/NiceSelect";
import { DEFAULT_AUCTION_LOT_FILTERS, useAuctionLots, type AuctionLotFilters } from "@/hooks/useAuctionLots";
import type { ApiAuctionFacets } from "@/lib/mapApiAuction";
import type { AuctionLot } from "@/types/auction";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function facetOptions<V extends string | number>(
  bucket: { value: V; count: number }[] | undefined,
  allLabel: string,
  labelFor: (value: V) => string = (v) => capitalize(String(v)),
): NiceSelectOption[] {
  return [
    { label: allLabel, value: "" },
    ...(bucket ?? []).map((entry) => ({ label: `${labelFor(entry.value)} (${entry.count})`, value: String(entry.value) })),
  ];
}

/**
 * FR-B-001: faceted browse for the trade catalog — live options + counts from the facets
 * GET /auction/lots already computes against the current filter set, mirroring the retail
 * catalog's LiveFilters. This control was previously just a 3-way status toggle with no
 * facet dimension exposed at all, despite the backend supporting the same filters as retail.
 */
function AuctionFacetFilters({
  filters,
  facets,
  onChange,
}: {
  filters: AuctionLotFilters;
  facets: ApiAuctionFacets | null;
  onChange: (filters: AuctionLotFilters) => void;
}) {
  const set = <K extends keyof AuctionLotFilters>(key: K, value: AuctionLotFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const makeOptions = useMemo(() => facetOptions(facets?.make, "All makes"), [facets?.make]);
  const modelOptions = useMemo(() => facetOptions(facets?.model, "All models"), [facets?.model]);
  const bodyTypeOptions = useMemo(() => facetOptions(facets?.body_type, "All body types"), [facets?.body_type]);
  const fuelTypeOptions = useMemo(() => facetOptions(facets?.fuel_type, "All fuel types"), [facets?.fuel_type]);
  const transmissionOptions = useMemo(() => facetOptions(facets?.transmission, "All transmissions"), [facets?.transmission]);
  const colourOptions = useMemo(() => facetOptions(facets?.colour, "All colours"), [facets?.colour]);
  const doorsOptions = useMemo(() => facetOptions(facets?.doors, "Any doors", (v) => `${v} doors`), [facets?.doors]);
  const seatsOptions = useMemo(() => facetOptions(facets?.seats, "Any seats", (v) => `${v} seats`), [facets?.seats]);
  const conditionGradeOptions = useMemo(
    () => facetOptions(facets?.condition_grade, "Any condition grade", (v) => `Grade ${v}`),
    [facets?.condition_grade],
  );

  return (
    <div className="mb-3">
      <div className="row g-2">
        <div className="col-6 col-md-3 col-lg-2">
          <NiceSelect options={makeOptions} value={filters.make} onChange={(v) => set("make", String(v))} />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <NiceSelect options={modelOptions} value={filters.model} onChange={(v) => set("model", String(v))} />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <NiceSelect options={bodyTypeOptions} value={filters.bodyType} onChange={(v) => set("bodyType", String(v))} />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <NiceSelect options={fuelTypeOptions} value={filters.fuelType} onChange={(v) => set("fuelType", String(v))} />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <NiceSelect options={transmissionOptions} value={filters.transmission} onChange={(v) => set("transmission", String(v))} />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <NiceSelect options={colourOptions} value={filters.colour} onChange={(v) => set("colour", String(v))} />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <NiceSelect options={doorsOptions} value={filters.doors} onChange={(v) => set("doors", String(v))} />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <NiceSelect options={seatsOptions} value={filters.seats} onChange={(v) => set("seats", String(v))} />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <NiceSelect options={conditionGradeOptions} value={filters.conditionGrade} onChange={(v) => set("conditionGrade", String(v))} />
        </div>
      </div>
    </div>
  );
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Open for bidding", value: "open" },
  { label: "Published (upcoming)", value: "published" },
];

function formatPrice(amount: number | null) {
  if (amount === null) return "No bids yet";
  return `£${amount.toLocaleString()}`;
}

function LotRow({ lot }: { lot: AuctionLot }) {
  const title = lot.vehicle
    ? [lot.vehicle.year, lot.vehicle.make, lot.vehicle.model, lot.vehicle.derivative]
        .filter(Boolean)
        .join(" ")
    : "Vehicle details unavailable";

  return (
    <tr>
      <td>
        <Link href={`/auction/${lot.id}`} className="fw-6">
          {title}
        </Link>
        {lot.isHmpAssured && (
          <span className="ms-2" style={{ color: "#405FF2", fontWeight: 600 }}>
            HMP Assured
          </span>
        )}
      </td>
      <td>{lot.vehicle?.mileage?.toLocaleString() ?? "-"} mi</td>
      <td className="text-capitalize">{lot.status.replace("_", " ")}</td>
      <td>{formatPrice(lot.currentPrice)}</td>
      <td>{lot.saleName ?? "-"}</td>
      <td>
        <Link href={`/auction/${lot.id}`} className="sc-button">
          <span>View lot</span>
        </Link>
      </td>
    </tr>
  );
}

function Dashboard() {
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState(DEFAULT_AUCTION_LOT_FILTERS);
  const { lots, facets, loading, error } = useAuctionLots(status || undefined, filters);

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Auction catalog</h1>

                  <div className="mb-3 flex align-center gap-10">
                    {STATUS_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        className="sc-button"
                        style={{
                          opacity: status === filter.value ? 1 : 0.55,
                        }}
                        onClick={() => setStatus(filter.value)}
                      >
                        <span>{filter.label}</span>
                      </button>
                    ))}
                  </div>

                  <AuctionFacetFilters filters={filters} facets={facets} onChange={setFilters} />

                  {loading && <p>Loading the auction catalog...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && lots.length === 0 && (
                    <p className="tfcl-empty-data">No lots match this filter right now.</p>
                  )}

                  {!loading && !error && lots.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Mileage</th>
                            <th>Status</th>
                            <th>Current price</th>
                            <th>Sale</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {lots.map((lot) => (
                            <LotRow key={lot.id} lot={lot} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

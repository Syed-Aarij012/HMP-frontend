"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { can, useAuth } from "@/contexts/AuthContext";
import { type NiceSelectOption } from "@/components/common/NiceSelect";
import { DEFAULT_AUCTION_LOT_FILTERS, useAuctionLots, type AuctionLotFilters } from "@/hooks/useAuctionLots";
import { describeBlocker } from "@/lib/auctionPublishBlockers";
import type { ApiAuctionFacets } from "@/lib/mapApiAuction";
import type { AuctionLot } from "@/types/auction";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Badge,
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  ErrorNotice,
  LoadingTable,
  NoMatches,
  Notice,
  StatusBadge,
  Tabs,
  formatMoney,
  useListControls,
} from "@/components/ui/kit";

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
  const taxBandOptions = useMemo(
    () => facetOptions(facets?.tax_band, "Any tax band", (v) => `Band ${v}`),
    [facets?.tax_band],
  );
  const auctionDateOptions = useMemo((): NiceSelectOption[] => [
    { label: "Any sale date", value: "" },
    ...(facets?.auction_date ?? []).map((entry) => ({
      label: `${entry.label} (${entry.count})`,
      value: String(entry.value),
    })),
  ], [facets?.auction_date]);

  const groups: Array<{ key: keyof AuctionLotFilters; label: string; options: NiceSelectOption[] }> = [
    { key: "make", label: "Make", options: makeOptions },
    { key: "model", label: "Model", options: modelOptions },
    { key: "bodyType", label: "Body type", options: bodyTypeOptions },
    { key: "fuelType", label: "Fuel type", options: fuelTypeOptions },
    { key: "transmission", label: "Transmission", options: transmissionOptions },
    { key: "colour", label: "Colour", options: colourOptions },
    { key: "doors", label: "Doors", options: doorsOptions },
    { key: "seats", label: "Seats", options: seatsOptions },
    { key: "conditionGrade", label: "Condition grade", options: conditionGradeOptions },
    { key: "taxBand", label: "Tax band", options: taxBandOptions },
    { key: "saleId", label: "Sale date", options: auctionDateOptions },
  ];
  const active = groups.filter((group) => filters[group.key]);

  return (
    <>
      <div className="ha-filter-grid">
        {groups.map((group) => (
          <label key={group.key} className="ha-field mb-0">
            <span className="ha-label">{group.label}</span>
            <select className="ha-select" value={String(filters[group.key])} onChange={(event) => set(group.key, event.target.value)}>
              {group.options.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {active.length > 0 && (
        <div className="ha-filterbar" aria-label="Active filters">
          {active.map((group) => (
            <span key={group.key} className="ha-chip">
              {group.label}: {group.options.find((option) => String(option.value) === String(filters[group.key]))?.label.replace(/ \(\d+\)$/, "") ?? String(filters[group.key])}
              <button type="button" onClick={() => set(group.key, "" as AuctionLotFilters[typeof group.key])} aria-label={`Remove ${group.label} filter`}>
                ×
              </button>
            </span>
          ))}
          <button type="button" className="ha-link-btn" onClick={() => onChange(DEFAULT_AUCTION_LOT_FILTERS)}>
            Clear all
          </button>
        </div>
      )}
    </>
  );
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Open for bidding", value: "open" },
  { label: "Published (upcoming)", value: "published" },
];

function formatPrice(amount: number | null) {
  if (amount === null) return "No bids yet";
  return formatMoney(amount);
}

function LotRow({
  lot,
  canPublish,
  publishing,
  onPublish,
}: {
  lot: AuctionLot;
  canPublish: boolean;
  publishing: boolean;
  onPublish: (lotId: string) => void;
}) {
  const title = lot.vehicle
    ? [lot.vehicle.year, lot.vehicle.make, lot.vehicle.model, lot.vehicle.derivative]
        .filter(Boolean)
        .join(" ")
    : "Vehicle details unavailable";

  return (
    <tr>
      <td data-label="Vehicle">
        <Link href={`/auction/${lot.id}`} className="ha-primary-text">
          {title}
        </Link>
        <div className="ha-chips mt-1">
          {lot.isHmpAssured && (
            <Badge tone="primary" plain>
              HMP Assured
            </Badge>
          )}
          {lot.saleName && <span className="ha-sub">{lot.saleName}</span>}
        </div>
      </td>
      <td data-label="Mileage" className="is-num">
        {lot.vehicle?.mileage != null ? `${lot.vehicle.mileage.toLocaleString("en-GB")} mi` : "—"}
      </td>
      <td data-label="Status">
        <StatusBadge status={lot.status} />
      </td>
      <td data-label="Current price" className="is-num">
        {lot.currentPrice === null ? <span className="ha-sub">{formatPrice(lot.currentPrice)}</span> : formatPrice(lot.currentPrice)}
      </td>
      <td data-label="">
        <div className="ha-row-actions">
          {/* FR-D-003: run-list staff publish a cataloged lot once nothing is blocking it. */}
          {canPublish && lot.status === "cataloged" && lot.publishBlockers !== null && (
            lot.publishBlockers.length === 0 ? (
              <button type="button" className="ha-btn is-sm is-primary" disabled={publishing} aria-busy={publishing} onClick={() => onPublish(lot.id)}>
                {publishing ? "Publishing…" : "Publish"}
              </button>
            ) : (
              <span className="ha-sub" style={{ maxWidth: 220 }} title="These must be resolved before the lot can be published">
                Not ready: {lot.publishBlockers.map(describeBlocker).join("; ")}
              </span>
            )
          )}
          <Link href={`/auction/${lot.id}`} className="ha-btn is-sm">
            View lot
          </Link>
        </div>
      </td>
    </tr>
  );
}

function Dashboard() {
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState(DEFAULT_AUCTION_LOT_FILTERS);
  const { lots, facets, loading, error, publish } = useAuctionLots(status || undefined, filters);
  const { user } = useAuth();
  const canPublish = can(user, "manage-run-list");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function handlePublish(lotId: string) {
    setPublishingId(lotId);
    setPublishError(null);
    setPublishError(await publish(lotId));
    setPublishingId(null);
  }

  const controls = useListControls<AuctionLot>({
    items: lots,
    search: (lot) => [lot.vehicle?.make, lot.vehicle?.model, lot.vehicle?.derivative, lot.saleName],
    sorts: [
      { value: "catalogue", label: "Catalogue order", compare: () => 0 },
      { value: "price-high", label: "Highest price", compare: (a, b) => (b.currentPrice ?? -1) - (a.currentPrice ?? -1) },
      { value: "price-low", label: "Lowest price", compare: (a, b) => (a.currentPrice ?? Infinity) - (b.currentPrice ?? Infinity) },
      { value: "mileage", label: "Lowest mileage", compare: (a, b) => (a.vehicle?.mileage ?? Infinity) - (b.vehicle?.mileage ?? Infinity) },
    ],
  });

  return (
    <DashboardPage title="Auction catalogue" description="Trade stock coming up for sale. Filter by vehicle, condition and sale date.">
      <div className="mb-3">
        <Tabs
          label="Lot status"
          value={status}
          options={STATUS_FILTERS.map((filter) => filter.value)}
          labels={Object.fromEntries(STATUS_FILTERS.map((filter) => [filter.value, filter.label]))}
          onChange={setStatus}
        />
      </div>

      <Card className="mb-4" title="Filters">
        <div className="ha-card-body">
          <AuctionFacetFilters filters={filters} facets={facets} onChange={setFilters} />
        </div>
      </Card>

      {publishError && <Notice tone="danger">{publishError}</Notice>}

      <Card>
        {loading && <LoadingTable label="Loading the auction catalogue" columns={5} />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && lots.length === 0 && (
          <EmptyState
            icon="icon-carus-search"
            title="No lots match"
            text="No lots match this filter right now."
            action={
              <button type="button" className="ha-btn" onClick={() => setFilters(DEFAULT_AUCTION_LOT_FILTERS)}>
                Clear filters
              </button>
            }
          />
        )}

        {!loading && !error && lots.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search make, model or sale" noun="lot" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Auction lots">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col" className="is-num">Mileage</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="is-num">Current price</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((lot) => (
                    <LotRow key={lot.id} lot={lot} canPublish={canPublish} publishing={publishingId === lot.id} onPublish={handlePublish} />
                  ))}
                </tbody>
              </DataTable>
            )}
          </>
        )}
      </Card>
    </DashboardPage>
  );
}

export default Dashboard;

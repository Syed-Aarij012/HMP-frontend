"use client";

import { useMemo } from "react";
import NiceSelect, { type NiceSelectOption } from "@/components/common/NiceSelect";
import RangeSlider from "@/components/common/RangeSlider";
import type { ApiListingsResponse } from "@/lib/mapApiListing";
import { normalizeBodyTypeLabel } from "@/lib/mapApiListing";
import type { ListingSearchParams } from "@/hooks/useSearchListings";

type Facets = ApiListingsResponse["facets"];

type Props = {
  params: ListingSearchParams;
  facets: Facets | null;
  onChange: (params: ListingSearchParams) => void;
};

const FALLBACK_YEAR_MIN = 2000;
const FALLBACK_MILEAGE_MAX = 200000;
const FALLBACK_PRICE_MAX = 100000;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * FR-B-001: options and counts come from the live `facets` the server just returned for the
 * *currently applied* filter set — never a static demo list — so picking "BMW" immediately
 * narrows the model list to BMW's own models, the way a faceted browse is supposed to work.
 */
function facetOptions<V extends string | number>(
  bucket: { value: V; count: number }[] | undefined,
  allLabel: string,
  labelFor: (value: string | number) => string = (v) => capitalize(String(v)),
): NiceSelectOption[] {
  return [
    { label: allLabel, value: "" },
    ...(bucket ?? []).map((entry) => ({
      label: `${labelFor(entry.value)} (${entry.count})`,
      value: String(entry.value),
    })),
  ];
}

export default function LiveFilters({ params, facets, onChange }: Props) {
  const set = <K extends keyof ListingSearchParams>(key: K, value: ListingSearchParams[K]) =>
    onChange({ ...params, [key]: value });

  const makeOptions = useMemo(() => facetOptions(facets?.make, "All makes"), [facets?.make]);
  const modelOptions = useMemo(() => facetOptions(facets?.model, "All models"), [facets?.model]);
  const bodyTypeOptions = useMemo(
    () => facetOptions(facets?.body_type, "All body types", (v) => normalizeBodyTypeLabel(String(v))),
    [facets?.body_type],
  );
  const fuelTypeOptions = useMemo(() => facetOptions(facets?.fuel_type, "All fuel types"), [facets?.fuel_type]);
  const transmissionOptions = useMemo(
    () => facetOptions(facets?.transmission, "All transmissions"),
    [facets?.transmission],
  );
  const colourOptions = useMemo(() => facetOptions(facets?.colour, "All colours"), [facets?.colour]);
  const doorsOptions = useMemo(
    () => facetOptions(facets?.doors, "Any doors", (v) => `${v} doors`),
    [facets?.doors],
  );
  const seatsOptions = useMemo(
    () => facetOptions(facets?.seats, "Any seats", (v) => `${v} seats`),
    [facets?.seats],
  );
  const sellerTypeOptions = useMemo(
    () => facetOptions(facets?.seller_type, "Dealer or private", (v) => (v === "dealer" ? "Dealer" : "Private seller")),
    [facets?.seller_type],
  );

  const yearBounds: [number, number] = [
    facets?.year?.min ?? FALLBACK_YEAR_MIN,
    Math.max(facets?.year?.max ?? new Date().getFullYear(), (facets?.year?.min ?? FALLBACK_YEAR_MIN) + 1),
  ];
  const mileageBounds: [number, number] = [
    0,
    Math.max(facets?.mileage?.max ?? FALLBACK_MILEAGE_MAX, 1),
  ];
  const priceBounds: [number, number] = [
    0,
    Math.max(facets?.price?.max ?? FALLBACK_PRICE_MAX, 1),
  ];

  const yearValue: [number, number] = [
    params.yearMin ? Number(params.yearMin) : yearBounds[0],
    params.yearMax ? Number(params.yearMax) : yearBounds[1],
  ];
  const mileageValue: [number, number] = [
    params.mileageMin ? Number(params.mileageMin) : mileageBounds[0],
    params.mileageMax ? Number(params.mileageMax) : mileageBounds[1],
  ];
  const priceValue: [number, number] = [
    params.priceMin ? Number(params.priceMin) : priceBounds[0],
    params.priceMax ? Number(params.priceMax) : priceBounds[1],
  ];

  return (
    <div className="flat-filter-search tf-section-listing">
      <div className="container">
        <div className="flat-tabs">
          <div className="content-tab">
            <div className="content-inner tab-content">
              <div className="form-sl">
                <div className="wd-find-select wd-search-form show">
                  <div className="box1 grid-4 align-center">
                    <div className="form-group wg-box3">
                      <div className="group-select">
                        <label>Make</label>
                        <NiceSelect options={makeOptions} value={params.make} onChange={(v) => set("make", String(v))} />
                      </div>
                    </div>
                    <div className="form-group wg-box3">
                      <div className="group-select">
                        <label>Model</label>
                        <NiceSelect options={modelOptions} value={params.model} onChange={(v) => set("model", String(v))} />
                      </div>
                    </div>
                    <div className="form-group wg-box3">
                      <div className="group-select">
                        <label>Body type</label>
                        <NiceSelect options={bodyTypeOptions} value={params.bodyType} onChange={(v) => set("bodyType", String(v))} />
                      </div>
                    </div>
                    <div className="form-group wg-box3">
                      <div className="group-select">
                        <label>Fuel type</label>
                        <NiceSelect options={fuelTypeOptions} value={params.fuelType} onChange={(v) => set("fuelType", String(v))} />
                      </div>
                    </div>
                  </div>
                  <div className="box1 grid-4 align-center">
                    <div className="form-group wg-box3">
                      <div className="group-select">
                        <label>Transmission</label>
                        <NiceSelect options={transmissionOptions} value={params.transmission} onChange={(v) => set("transmission", String(v))} />
                      </div>
                    </div>
                    <div className="form-group wg-box3">
                      <div className="group-select">
                        <label>Colour</label>
                        <NiceSelect options={colourOptions} value={params.colour} onChange={(v) => set("colour", String(v))} />
                      </div>
                    </div>
                    <div className="form-group wg-box3">
                      <div className="group-select">
                        <label>Doors</label>
                        <NiceSelect options={doorsOptions} value={params.doors} onChange={(v) => set("doors", String(v))} />
                      </div>
                    </div>
                    <div className="form-group wg-box3">
                      <div className="group-select">
                        <label>Seats</label>
                        <NiceSelect options={seatsOptions} value={params.seats} onChange={(v) => set("seats", String(v))} />
                      </div>
                    </div>
                  </div>
                  <div className="box1 grid-4 align-center">
                    <div className="form-group wg-box3">
                      <div className="group-select">
                        <label>Seller</label>
                        <NiceSelect options={sellerTypeOptions} value={params.sellerType} onChange={(v) => set("sellerType", String(v))} />
                      </div>
                    </div>
                    <div className="form-group wg-box3">
                      <RangeSlider
                        widgetClassName="widget"
                        label="Price: "
                        min={0}
                        max={priceBounds[1]}
                        value={priceValue}
                        suffix="£"
                        thousand=","
                        onChange={([lo, hi]) => onChange({ ...params, priceMin: String(lo), priceMax: String(hi) })}
                      />
                    </div>
                    <div className="form-group wg-box3">
                      <RangeSlider
                        widgetClassName="widget"
                        label="Mileage: "
                        min={0}
                        max={mileageBounds[1]}
                        step={1000}
                        suffix=" mi"
                        thousand=","
                        value={mileageValue}
                        onChange={([lo, hi]) => onChange({ ...params, mileageMin: String(lo), mileageMax: String(hi) })}
                      />
                    </div>
                    <div className="form-group wg-box3">
                      <RangeSlider
                        widgetClassName="widget"
                        label="Year: "
                        min={yearBounds[0]}
                        max={yearBounds[1]}
                        thousand=""
                        minInputName="min-year"
                        maxInputName="max-year"
                        value={yearValue}
                        onChange={([lo, hi]) => onChange({ ...params, yearMin: String(lo), yearMax: String(hi) })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Dispatch } from "react";
import {
  clearAllFilters,
  setBodyType,
  setBrand,
  setCategoryTab,
  setColor,
  setCylinders,
  setDoors,
  setDriveType,
  setFeatured,
  setFuel,
  setMake,
  setMileageRange,
  setModel,
  setModelCategory,
  setOwnership,
  setPriceRange,
  setSeats,
  setTransmission,
  setYearRange,
  toggleFeature,
} from "@/components/reducer/listingFilterActions";
import {
  LISTING_MILEAGE_MAX,
  LISTING_YEAR_MAX,
  LISTING_YEAR_MIN,
} from "@/components/reducer/listingFilterReducer";
import type { ListingFilterAction, ListingFilterState } from "@/types/listingFilter";
import {
  BODY_TYPE_OPTIONS,
  BRAND_OPTIONS,
  MAKE_OPTIONS,
  MODEL_OPTIONS,
  OWNERSHIP_OPTIONS,
  SEAT_OPTIONS,
  SIDEBAR_COLOR_OPTIONS,
  SIDEBAR_CYLINDER_OPTIONS,
  SIDEBAR_DOOR_OPTIONS,
  SIDEBAR_DRIVE_TYPE_OPTIONS,
  SIDEBAR_FUEL_OPTIONS,
  SIDEBAR_MODEL_OPTIONS,
  SIDEBAR_TRANSMISSION_OPTIONS,
} from "@/data/niceSelectOptions";

const CATEGORY_TAB_LABELS: Record<string, string> = {
  all: "All categories",
  new: "New cars",
  used: "Used cars",
};

function getOptionLabel(
  options: { label: string; value: string | number }[],
  value: string | number,
) {
  return options.find((option) => option.value === value)?.label ?? String(value);
}

type FilterTagProps = {
  label: string;
  onRemove: () => void;
};

function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <button type="button" className="listing-filter-tag" onClick={onRemove}>
      <span className="listing-filter-tag__label">{label}</span>
      <span className="listing-filter-tag__remove" aria-hidden="true">
        <i className="icon-carus-close" />
      </span>
    </button>
  );
}

export default function ListingFilterMeta({
  state,
  dispatch,
}: {
  state: ListingFilterState;
  dispatch: Dispatch<ListingFilterAction>;
}) {
  const isDefaultPrice =
    state.price[0] === 0 && state.price[1] >= state.listingPriceMax;
  const isDefaultMileage =
    state.mileage[0] === 0 && state.mileage[1] === LISTING_MILEAGE_MAX;
  const isDefaultYear =
    state.year[0] === LISTING_YEAR_MIN && state.year[1] === LISTING_YEAR_MAX;

  const tags: { key: string; label: string; onRemove: () => void }[] = [];

  if (state.categoryTab !== "all") {
    tags.push({
      key: "categoryTab",
      label: CATEGORY_TAB_LABELS[state.categoryTab] ?? state.categoryTab,
      onRemove: () => setCategoryTab("all", dispatch),
    });
  }

  if (state.brand) {
    tags.push({
      key: "brand",
      label: getOptionLabel(BRAND_OPTIONS, state.brand),
      onRemove: () => setBrand("", dispatch),
    });
  }

  if (state.modelCategory) {
    tags.push({
      key: "modelCategory",
      label: getOptionLabel(MODEL_OPTIONS, state.modelCategory),
      onRemove: () => setModelCategory("", dispatch),
    });
  }

  if (state.make) {
    tags.push({
      key: "make",
      label: getOptionLabel(MAKE_OPTIONS, state.make),
      onRemove: () => setMake("", dispatch),
    });
  }

  if (state.model) {
    tags.push({
      key: "model",
      label: getOptionLabel(SIDEBAR_MODEL_OPTIONS, state.model),
      onRemove: () => setModel("", dispatch),
    });
  }

  if (state.bodyType) {
    tags.push({
      key: "bodyType",
      label: getOptionLabel(BODY_TYPE_OPTIONS, state.bodyType),
      onRemove: () => setBodyType("", dispatch),
    });
  }

  if (state.featured) {
    tags.push({
      key: "featured",
      label: "Featured",
      onRemove: () => setFeatured(false, dispatch),
    });
  }

  if (!isDefaultPrice) {
    tags.push({
      key: "price",
      label: `£${state.price[0].toLocaleString()} - £${state.price[1].toLocaleString()}`,
      onRemove: () => setPriceRange([0, state.listingPriceMax], dispatch),
    });
  }

  if (state.fuel) {
    tags.push({
      key: "fuel",
      label: getOptionLabel(SIDEBAR_FUEL_OPTIONS, state.fuel),
      onRemove: () => setFuel("", dispatch),
    });
  }

  if (state.transmission) {
    tags.push({
      key: "transmission",
      label: getOptionLabel(SIDEBAR_TRANSMISSION_OPTIONS, state.transmission),
      onRemove: () => setTransmission("", dispatch),
    });
  }

  if (state.driveType) {
    tags.push({
      key: "driveType",
      label: getOptionLabel(SIDEBAR_DRIVE_TYPE_OPTIONS, state.driveType),
      onRemove: () => setDriveType("", dispatch),
    });
  }

  if (!isDefaultMileage) {
    tags.push({
      key: "mileage",
      label: `${state.mileage[0].toLocaleString()} - ${state.mileage[1].toLocaleString()} km`,
      onRemove: () => setMileageRange([0, LISTING_MILEAGE_MAX], dispatch),
    });
  }

  if (state.doors !== "") {
    tags.push({
      key: "doors",
      label: getOptionLabel(SIDEBAR_DOOR_OPTIONS, state.doors),
      onRemove: () => setDoors("", dispatch),
    });
  }

  if (state.cylinders !== "") {
    tags.push({
      key: "cylinders",
      label: getOptionLabel(SIDEBAR_CYLINDER_OPTIONS, state.cylinders),
      onRemove: () => setCylinders("", dispatch),
    });
  }

  if (state.color) {
    tags.push({
      key: "color",
      label: getOptionLabel(SIDEBAR_COLOR_OPTIONS, state.color),
      onRemove: () => setColor("", dispatch),
    });
  }

  if (state.seats !== "") {
    tags.push({
      key: "seats",
      label: getOptionLabel(SEAT_OPTIONS, state.seats),
      onRemove: () => setSeats("", dispatch),
    });
  }

  if (state.ownership) {
    tags.push({
      key: "ownership",
      label: getOptionLabel(OWNERSHIP_OPTIONS, state.ownership),
      onRemove: () => setOwnership("", dispatch),
    });
  }

  if (!isDefaultYear) {
    tags.push({
      key: "year",
      label: `${state.year[0]} - ${state.year[1]}`,
      onRemove: () =>
        setYearRange([LISTING_YEAR_MIN, LISTING_YEAR_MAX], dispatch),
    });
  }

  state.features.forEach((feature) => {
    tags.push({
      key: `feature-${feature}`,
      label: feature,
      onRemove: () => toggleFeature(feature, dispatch, state.features),
    });
  });

  if (tags.length === 0) return null;

  return (
    <div className="listing-filter-meta flex flex-wrap align-center gap-10">
      <span className="listing-filter-meta__label">Filtered by:</span>
      <div className="listing-filter-meta__tags flex flex-wrap align-center gap-8">
        {tags.map((tag) => (
          <FilterTag
            key={tag.key}
            label={tag.label}
            onRemove={tag.onRemove}
          />
        ))}
      </div>
      <button
        type="button"
        className="listing-filter-meta__clear"
        onClick={() => clearAllFilters(dispatch)}
      >
        Clear All
      </button>
    </div>
  );
}

"use client";

import { Dispatch, useMemo, useReducer, useState } from "react";
import RangeSlider from "@/components/common/RangeSlider";
import NiceSelect, {
  type NiceSelectOption,
} from "@/components/common/NiceSelect";
import {
  buildLivePriceOptions,
  getPriceSelectValue,
  LIVE_PRICE_VALUE,
} from "@/lib/buildListingPriceOptions";
import {
  listingFilterInitialState,
  listingFilterReducer,
  LISTING_MILEAGE_MAX,
  LISTING_YEAR_MAX,
  LISTING_YEAR_MIN,
} from "@/components/reducer/listingFilterReducer";
import {
  setBodyType,
  setBrand,
  setCategoryTab,
  setColor,
  setCylinders,
  setDoors,
  setDriveType,
  setFuel,
  setMileageRange,
  setModelCategory,
  setOwnership,
  setPriceRange,
  setSeats,
  setTransmission,
  setYearRange,
  toggleFeature,
} from "@/components/reducer/listingFilterActions";
import type {
  ListingCategoryTab,
  ListingFilterAction,
  ListingFilterState,
} from "@/types/listingFilter";
import {
  BRAND_OPTIONS,
  COLOR_OPTIONS,
  CYLINDER_OPTIONS,
  DOOR_OPTIONS,
  DRIVER_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  MODEL_OPTIONS,
  OWNERSHIP_OPTIONS,
  PRICE_OPTIONS,
  SEAT_OPTIONS,
  TRANSMISSION_OPTIONS,
  TYPE_OPTIONS,
} from "@/data/niceSelectOptions";

const FILTER_TABS = [
  { id: "all", label: "All categories" },
  { id: "new", label: "New cars" },
  { id: "used", label: "Used cars" },
] as const;

const FEATURE_GROUPS = [
  {
    title: "Request Price Label",
    items: [
      "A/C: Front",
      "Backup Camera",
      "Cruise Control",
      "Navigation",
      "Power Locks",
    ],
  },
  {
    title: "Entertainment",
    items: [
      "Audio system",
      "Touchscreen display",
      "GPS navigation",
      "Phone connectivity",
      "In-car Wi-Fi",
    ],
  },
  {
    title: "Safety",
    items: [
      "Chrome-plated grill",
      "Smart headlight cluster",
      "Premium wheels",
      "Body character lines",
      "High-quality paint",
    ],
  },
  {
    title: "Interior",
    items: [
      "Premium leather seats",
      "Wood trim",
      "Mini bar",
      "Tachometer",
      "Glove Compartment",
    ],
  },
  {
    title: "Exterior",
    items: [
      "Chrome-plated grill",
      "Smart headlight cluster",
      "Premium wheels",
      "Body character lines",
      "High-quality paint",
    ],
  },
] as const;

type FiltersProps = {
  state?: ListingFilterState;
  dispatch?: Dispatch<ListingFilterAction>;
  priceOptions?: NiceSelectOption[];
};

export default function Filters({
  state: controlledState,
  dispatch: controlledDispatch,
  priceOptions,
}: FiltersProps) {
  const [localState, localDispatch] = useReducer(
    listingFilterReducer,
    listingFilterInitialState,
  );
  const state = controlledState ?? localState;
  const dispatch = controlledDispatch ?? localDispatch;
  const basePriceOptions = priceOptions ?? PRICE_OPTIONS;
  const resolvedPriceOptions = useMemo(
    () =>
      buildLivePriceOptions(
        basePriceOptions,
        state.price,
        state.listingPriceMax,
      ),
    [basePriceOptions, state.price, state.listingPriceMax],
  );
  const priceSelectValue = useMemo(
    () =>
      getPriceSelectValue(
        state.price,
        state.listingPriceMax,
        resolvedPriceOptions,
      ),
    [state.price, state.listingPriceMax, resolvedPriceOptions],
  );

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);

  return (
    <>
      <div className="box-tab">
        <ul className="menu-tab tab-title flex">
          {FILTER_TABS.map((tab) => (
            <li
              key={tab.id}
              className={`item-title${state.categoryTab === tab.id ? " active" : ""}`}
              onClick={() =>
                setCategoryTab(tab.id as ListingCategoryTab, dispatch)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setCategoryTab(tab.id as ListingCategoryTab, dispatch);
                }
              }}
              role="tab"
              aria-selected={state.categoryTab === tab.id}
              tabIndex={0}
            >
              <span className="inner fs-18 fw-6">{tab.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="content-tab">
        <div className="content-inner tab-content">
          <div className="form-sl">
            <form
              method="post"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <div className="wd-find-select flex align-end">
                <div className="inner-group">
                  <div className="form-group-1">
                    <div className="group-select">
                      <label>Brand Name</label>
                      <NiceSelect
                        options={BRAND_OPTIONS}
                        value={state.brand}
                        onChange={(value) => setBrand(String(value), dispatch)}
                      />
                    </div>
                  </div>
                  <div className="form-group-1">
                    <div className="group-select">
                      <label>Type</label>
                      <NiceSelect
                        options={TYPE_OPTIONS}
                        value={state.bodyType}
                        onChange={(value) =>
                          setBodyType(String(value), dispatch)
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group-1">
                    <div className="group-select">
                      <label>Model</label>
                      <NiceSelect
                        options={MODEL_OPTIONS}
                        value={state.modelCategory}
                        onChange={(value) =>
                          setModelCategory(String(value), dispatch)
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group-1">
                    <div className="group-select">
                      <label>Price</label>
                      <NiceSelect
                        options={resolvedPriceOptions}
                        value={priceSelectValue}
                        onChange={(value) => {
                          if (value === "") {
                            setPriceRange([0, state.listingPriceMax], dispatch);
                            return;
                          }

                          if (value === LIVE_PRICE_VALUE) {
                            return;
                          }

                          setPriceRange([0, Number(value)], dispatch);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group-2 form-style">
                  <a
                    href="#"
                    className={`icon-filter pull-right flex${isAdvancedOpen ? " active" : ""}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setIsAdvancedOpen((open) => !open);
                    }}
                    role="button"
                    aria-expanded={isAdvancedOpen}
                    aria-label="Toggle advanced filters"
                  >
                    <i className="icon-carus-sliders" />
                    <i className="icon-carus-search search-icon" />
                  </a>
                </div>
                <div className="button-search sc-btn-top">
                  {/* suppressHydrationWarning: a form-autofill browser extension (LastPass and
                      similar tag every form control with fdprocessedid, not just inputs) —
                      same harmless mismatch as the email inputs elsewhere in this app. */}
                  <button type="submit" className="sc-button" suppressHydrationWarning>
                    <i className="icon-carus-search text-color-1" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
              <div
                className={`wd-find-select wd-search-form${isAdvancedOpen ? " show" : ""}`}
              >
                <div className="box1 grid-4 align-center">
                  <div className="form-group wg-box3">
                    <div className="group-select">
                      <label>Fuel Type</label>
                      <NiceSelect
                        options={FUEL_TYPE_OPTIONS}
                        value={state.fuel}
                        onChange={(value) => setFuel(String(value), dispatch)}
                      />
                    </div>
                  </div>
                  <div className="form-group wg-box3">
                    <div className="group-select">
                      <label>Transmission</label>
                      <NiceSelect
                        options={TRANSMISSION_OPTIONS}
                        value={state.transmission}
                        onChange={(value) =>
                          setTransmission(String(value), dispatch)
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group wg-box3">
                    <div className="group-select">
                      <label>Driver Type</label>
                      <NiceSelect
                        options={DRIVER_TYPE_OPTIONS}
                        value={state.driveType}
                        onChange={(value) =>
                          setDriveType(String(value), dispatch)
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group wg-box3">
                    <div className="group-select">
                      <label>Cylinder</label>
                      <NiceSelect
                        options={CYLINDER_OPTIONS}
                        value={state.cylinders}
                        onChange={(value) => setCylinders(value, dispatch)}
                      />
                    </div>
                  </div>
                </div>
                <div className="box1 grid-4 align-center">
                  <div className="form-group wg-box3">
                    <div className="group-select">
                      <label>Color</label>
                      <NiceSelect
                        options={COLOR_OPTIONS}
                        value={state.color}
                        onChange={(value) => setColor(String(value), dispatch)}
                      />
                    </div>
                  </div>
                  <div className="form-group wg-box3">
                    <RangeSlider
                      widgetClassName="widget"
                      min={0}
                      max={LISTING_MILEAGE_MAX}
                      value={state.mileage}
                      step={10000}
                      suffix=" km"
                      thousand="."
                      onChange={(range) => setMileageRange(range, dispatch)}
                    />
                  </div>
                  <div className="form-group wg-box3">
                    <RangeSlider
                      widgetClassName="widget"
                      label="Price: "
                      min={0}
                      max={state.listingPriceMax}
                      value={state.price}
                      suffix="$"
                      thousand=","
                      onChange={(range) => setPriceRange(range, dispatch)}
                    />
                  </div>
                  <div className="form-group wg-box3">
                    <RangeSlider
                      widgetClassName="widget"
                      label="Year: "
                      min={LISTING_YEAR_MIN}
                      max={LISTING_YEAR_MAX}
                      value={state.year}
                      thousand=""
                      minInputName="min-year"
                      maxInputName="max-year"
                      onChange={(range) => setYearRange(range, dispatch)}
                    />
                  </div>
                </div>
                <div className="box1 grid-4 align-center">
                  <div className="form-group wg-box3">
                    <div className="group-select">
                      <label>Door</label>
                      <NiceSelect
                        options={DOOR_OPTIONS}
                        value={state.doors}
                        onChange={(value) => setDoors(value, dispatch)}
                      />
                    </div>
                  </div>
                  <div className="form-group wg-box3">
                    <div className="group-select">
                      <label>Seat</label>
                      <NiceSelect
                        options={SEAT_OPTIONS}
                        value={state.seats}
                        onChange={(value) => setSeats(value, dispatch)}
                      />
                    </div>
                  </div>
                  <div className="form-group wg-box3">
                    <div className="group-select">
                      <label>Ownership</label>
                      <NiceSelect
                        options={OWNERSHIP_OPTIONS}
                        value={state.ownership}
                        onChange={(value) =>
                          setOwnership(String(value), dispatch)
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group wg-box3">
                    <div className="group-select">
                      <label>Cylinder</label>
                      <NiceSelect
                        options={CYLINDER_OPTIONS}
                        value={state.cylinders}
                        onChange={(value) => setCylinders(value, dispatch)}
                      />
                    </div>
                  </div>
                </div>
                <div className="features-wrap">
                  <h2
                    className={isFeaturesOpen ? "active" : ""}
                    onClick={() => setIsFeaturesOpen((open) => !open)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isFeaturesOpen}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setIsFeaturesOpen((open) => !open);
                      }
                    }}
                  >
                    Features
                  </h2>
                  <div
                    className={`box2 grid-5${isFeaturesOpen ? " content-hidden" : ""}`}
                  >
                    {FEATURE_GROUPS.map((group) => (
                      <div className="form-group wg-box4" key={group.title}>
                        <div className="title fs-18 fw-5 lh-20 text-color-2">
                          {group.title}
                        </div>
                        <div className="tf-amenities bg-white">
                          {group.items.map((feature) => (
                            <label className="flex-three" key={feature}>
                              <input
                                name="features"
                                type="checkbox"
                                checked={state.features.includes(feature)}
                                onChange={() =>
                                  toggleFeature(
                                    feature,
                                    dispatch,
                                    state.features,
                                  )
                                }
                              />
                              <span className="btn-checkbox" />
                              <span className="text-color-2">{feature}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

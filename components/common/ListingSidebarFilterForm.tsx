"use client";

import { Dispatch, useReducer } from "react";
import RangeSlider from "@/components/common/RangeSlider";
import NiceSelect from "@/components/common/NiceSelect";
import {
  clearAllFilters,
  setBodyType,
  setColor,
  setCylinders,
  setDoors,
  setDriveType,
  setFeatured,
  setFuel,
  setMake,
  setMileageRange,
  setModel,
  setPriceRange,
  setTransmission,
  setYearRange,
  toggleFeature,
} from "@/components/reducer/listingFilterActions";
import {
  LISTING_MILEAGE_MAX,
  LISTING_YEAR_MAX,
  LISTING_YEAR_MIN,
  listingFilterInitialState,
  listingFilterReducer,
} from "@/components/reducer/listingFilterReducer";
import type { ListingFilterAction, ListingFilterState } from "@/types/listingFilter";
import {
  BODY_TYPE_OPTIONS,
  LISTING_FEATURE_OPTIONS,
  MAKE_OPTIONS,
  SIDEBAR_COLOR_OPTIONS,
  SIDEBAR_CYLINDER_OPTIONS,
  SIDEBAR_DOOR_OPTIONS,
  SIDEBAR_DRIVE_TYPE_OPTIONS,
  SIDEBAR_FUEL_OPTIONS,
  SIDEBAR_MODEL_OPTIONS,
  SIDEBAR_TRANSMISSION_OPTIONS,
} from "@/data/niceSelectOptions";

type ListingSidebarFilterFormProps = {
  id?: string;
  state?: ListingFilterState;
  dispatch?: Dispatch<ListingFilterAction>;
};

export default function ListingSidebarFilterForm({
  id,
  state: controlledState,
  dispatch: controlledDispatch,
}: ListingSidebarFilterFormProps) {
  const [localState, localDispatch] = useReducer(
    listingFilterReducer,
    listingFilterInitialState,
  );
  const state = controlledState ?? localState;
  const dispatch = controlledDispatch ?? localDispatch;
  return (
    <form
      id={id}
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="wd-find-select">
        <div className="form-group">
          <label className="fs-18 fw-5 text-color-2">Make</label>
          <div className="group-select">
            <NiceSelect
              options={MAKE_OPTIONS}
              value={state.make}
              onChange={(value) => setMake(String(value), dispatch)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="fs-18 fw-5 text-color-2">Model</label>
          <div className="group-select">
            <NiceSelect
              options={SIDEBAR_MODEL_OPTIONS}
              value={state.model}
              onChange={(value) => setModel(String(value), dispatch)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="fs-18 fw-5 text-color-2">Body Type</label>
          <div className="group-select">
            <NiceSelect
              options={BODY_TYPE_OPTIONS}
              value={state.bodyType}
              onChange={(value) => setBodyType(String(value), dispatch)}
            />
          </div>
        </div>
        <div className="form-group">
          <div className="tf-amenities bg-white">
            <label className="flex-three">
              <input
                name="featured"
                type="checkbox"
                checked={state.featured}
                onChange={(event) =>
                  setFeatured(event.target.checked, dispatch)
                }
              />
              <span className="btn-checkbox" />
              <span className="">Featured</span>
            </label>
          </div>
        </div>
        <div className="form-group">
          <RangeSlider
            label="Price: "
            min={0}
            max={state.listingPriceMax}
            value={state.price}
            suffix="£"
            thousand=","
            onChange={(range) => setPriceRange(range, dispatch)}
          />
        </div>
        <div className="form-group">
          <label className="fs-18 fw-5 text-color-2">Fuel / Electric</label>
          <div className="group-select">
            <NiceSelect
              options={SIDEBAR_FUEL_OPTIONS}
              value={state.fuel}
              onChange={(value) => setFuel(String(value), dispatch)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="fs-18 fw-5 text-color-2">Transmission</label>
          <div className="group-select">
            <NiceSelect
              options={SIDEBAR_TRANSMISSION_OPTIONS}
              value={state.transmission}
              onChange={(value) => setTransmission(String(value), dispatch)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="fs-18 fw-5 text-color-2">Drive Type</label>
          <div className="group-select">
            <NiceSelect
              options={SIDEBAR_DRIVE_TYPE_OPTIONS}
              value={state.driveType}
              onChange={(value) => setDriveType(String(value), dispatch)}
            />
          </div>
        </div>
        <div className="form-group">
          <RangeSlider
            min={0}
            max={LISTING_MILEAGE_MAX}
            value={state.mileage}
            suffix=" km"
            thousand="."
            onChange={(range) => setMileageRange(range, dispatch)}
          />
        </div>
        <div className="form-group">
          <label className="fs-18 fw-5 text-color-2">Doors</label>
          <div className="group-select">
            <NiceSelect
              options={SIDEBAR_DOOR_OPTIONS}
              value={state.doors}
              onChange={(value) => setDoors(value, dispatch)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="fs-18 fw-5 text-color-2">Cylinders</label>
          <div className="group-select">
            <NiceSelect
              options={SIDEBAR_CYLINDER_OPTIONS}
              value={state.cylinders}
              onChange={(value) => setCylinders(value, dispatch)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="fs-18 fw-5 text-color-2">Color</label>
          <div className="group-select">
            <NiceSelect
              options={SIDEBAR_COLOR_OPTIONS}
              value={state.color}
              onChange={(value) => setColor(String(value), dispatch)}
            />
          </div>
        </div>
        <div className="form-group">
          <RangeSlider
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
        <div className="features-wrap">
          <h4>Featured</h4>
          <div className="form-group box2 content-hidden">
            <div className="tf-amenities bg-white">
              {LISTING_FEATURE_OPTIONS.map((feature) => (
                <label className="flex-three" key={feature}>
                  <input
                    name="features"
                    type="checkbox"
                    checked={state.features.includes(feature)}
                    onChange={() =>
                      toggleFeature(feature, dispatch, state.features)
                    }
                  />
                  <span className="btn-checkbox" />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export function ListingSidebarClearButton({
  dispatch,
}: {
  dispatch: Dispatch<ListingFilterAction>;
}) {
  return (
    <button
      type="button"
      className="fw-7 fs-14 claer text-color-2 flex-three"
      onClick={() => clearAllFilters(dispatch)}
    >
      <i className="icon-carus-close" />
      Clear
    </button>
  );
}

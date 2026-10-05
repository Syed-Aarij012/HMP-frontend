"use client";

import { useState } from "react";
import {
  COMMON_FEATURES,
  DRIVETRAIN_OPTIONS,
  SERVICE_HISTORY_OPTIONS,
  type VehicleExtrasApi,
} from "@/lib/vehicleExtras";

/** The form state for a vehicle's additional specifications and features. */
export type ExtrasForm = {
  engine_capacity_cc: string;
  power_bhp: string;
  drivetrain: string;
  co2_gpkm: string;
  previous_owners: string;
  service_history: string;
  mot_expiry_at: string;
  features: string[];
};

export const EMPTY_EXTRAS: ExtrasForm = {
  engine_capacity_cc: "",
  power_bhp: "",
  drivetrain: "",
  co2_gpkm: "",
  previous_owners: "",
  service_history: "",
  mot_expiry_at: "",
  features: [],
};

const str = (value: string | number | null | undefined) => (value === null || value === undefined ? "" : String(value));

export function extrasFromVehicle(vehicle: VehicleExtrasApi): ExtrasForm {
  return {
    engine_capacity_cc: str(vehicle.engine_capacity_cc),
    power_bhp: str(vehicle.power_bhp),
    drivetrain: str(vehicle.drivetrain),
    co2_gpkm: str(vehicle.co2_gpkm),
    previous_owners: str(vehicle.previous_owners),
    service_history: str(vehicle.service_history),
    mot_expiry_at: str(vehicle.mot_expiry_at),
    features: vehicle.features ?? [],
  };
}

const NUMERIC_KEYS = ["engine_capacity_cc", "power_bhp", "co2_gpkm", "previous_owners"] as const;
const TEXT_KEYS = ["drivetrain", "service_history", "mot_expiry_at"] as const;

/** For creating a vehicle: only what the seller filled in (a blank is simply left out). */
export function extrasToCreatePayload(form: ExtrasForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of NUMERIC_KEYS) if (form[key] !== "") payload[key] = Number(form[key]);
  for (const key of TEXT_KEYS) if (form[key] !== "") payload[key] = form[key];
  if (form.features.length > 0) payload.features = form.features;
  return payload;
}

/**
 * For editing: only what differs from what's saved. A field the seller emptied is sent as null
 * (and an emptied features list as []), so removing a value really removes it.
 */
export function extrasChanges(form: ExtrasForm, saved: VehicleExtrasApi): Record<string, unknown> {
  const original = extrasFromVehicle(saved);
  const changes: Record<string, unknown> = {};

  for (const key of NUMERIC_KEYS) {
    if (form[key] !== original[key]) changes[key] = form[key] === "" ? null : Number(form[key]);
  }
  for (const key of TEXT_KEYS) {
    if (form[key] !== original[key]) changes[key] = form[key] === "" ? null : form[key];
  }
  if (JSON.stringify(form.features) !== JSON.stringify(original.features)) changes.features = form.features;

  return changes;
}

const MAX_FEATURES = 40;

/**
 * Additional specifications (engine, power, owners, service history, MOT...) and the features
 * checklist — shown to buyers under "Specifications" and "Features" on the listing page. Shared by
 * Add Listing and the edit page.
 */
export default function FeaturesSpecsFields({
  value,
  onChange,
  disabled = false,
}: {
  value: ExtrasForm;
  onChange: (next: ExtrasForm) => void;
  disabled?: boolean;
}) {
  const [custom, setCustom] = useState("");
  const has = (feature: string) => value.features.some((item) => item.toLowerCase() === feature.toLowerCase());
  const customFeatures = value.features.filter((feature) => !COMMON_FEATURES.some((common) => common.toLowerCase() === feature.toLowerCase()));
  const atLimit = value.features.length >= MAX_FEATURES;

  const set = (key: keyof ExtrasForm) => (event: { target: { value: string } }) => onChange({ ...value, [key]: event.target.value });

  function toggle(feature: string) {
    onChange({
      ...value,
      features: has(feature) ? value.features.filter((item) => item.toLowerCase() !== feature.toLowerCase()) : [...value.features, feature],
    });
  }

  function addCustom() {
    const label = custom.trim().replace(/\s+/g, " ");
    if (!label || has(label) || atLimit) return;
    onChange({ ...value, features: [...value.features, label] });
    setCustom("");
  }

  return (
    <div className="tfcl-card p-3 mb-3">
      <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0 }}>
        <h4 className="mb-1">Additional specifications</h4>
        <p className="text-color-1 fs-13 mb-3">Optional, but buyers look for these. They&apos;re shown on your listing.</p>
        <div className="row">
          <div className="col-md-6 col-lg-3 mb-3">
            <label htmlFor="extras_engine" className="mb-1">Engine size (cc)</label>
            <input id="extras_engine" type="number" min={50} max={10000} className="form-control" placeholder="e.g. 1998" value={value.engine_capacity_cc} onChange={set("engine_capacity_cc")} />
          </div>
          <div className="col-md-6 col-lg-3 mb-3">
            <label htmlFor="extras_power" className="mb-1">Power (bhp)</label>
            <input id="extras_power" type="number" min={1} max={2000} className="form-control" placeholder="e.g. 148" value={value.power_bhp} onChange={set("power_bhp")} />
          </div>
          <div className="col-md-6 col-lg-3 mb-3">
            <label htmlFor="extras_drivetrain" className="mb-1">Drivetrain</label>
            <select id="extras_drivetrain" className="form-control" value={value.drivetrain} onChange={set("drivetrain")}>
              <option value="">Not specified</option>
              {DRIVETRAIN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6 col-lg-3 mb-3">
            <label htmlFor="extras_co2" className="mb-1">CO₂ (g/km)</label>
            <input id="extras_co2" type="number" min={0} max={600} className="form-control" value={value.co2_gpkm} onChange={set("co2_gpkm")} />
          </div>
          <div className="col-md-6 col-lg-3 mb-3">
            <label htmlFor="extras_owners" className="mb-1">Previous owners</label>
            <input id="extras_owners" type="number" min={0} max={30} className="form-control" placeholder="0 = first owner" value={value.previous_owners} onChange={set("previous_owners")} />
          </div>
          <div className="col-md-6 col-lg-3 mb-3">
            <label htmlFor="extras_service" className="mb-1">Service history</label>
            <select id="extras_service" className="form-control" value={value.service_history} onChange={set("service_history")}>
              <option value="">Not specified</option>
              {SERVICE_HISTORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6 col-lg-3 mb-3">
            <label htmlFor="extras_mot" className="mb-1">MOT expires</label>
            <input id="extras_mot" type="date" className="form-control" value={value.mot_expiry_at} onChange={set("mot_expiry_at")} />
          </div>
        </div>

        <h4 className="mt-2 mb-1">Features</h4>
        <p className="text-color-1 fs-13 mb-2">
          Tick everything the car has. {value.features.length > 0 ? `${value.features.length} selected.` : ""}
        </p>
        <div className="row">
          {COMMON_FEATURES.map((feature) => (
            <div key={feature} className="col-sm-6 col-lg-4 mb-1">
              <label style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={has(feature)} onChange={() => toggle(feature)} disabled={!has(feature) && atLimit} /> {feature}
              </label>
            </div>
          ))}
        </div>

        {customFeatures.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-2">
            {customFeatures.map((feature) => (
              <span key={feature} className="badge bg-light text-dark border d-inline-flex align-items-center gap-2" style={{ fontSize: 13, padding: "6px 10px" }}>
                {feature}
                <button
                  type="button"
                  aria-label={`Remove ${feature}`}
                  onClick={() => toggle(feature)}
                  style={{ border: 0, background: "none", padding: 0, lineHeight: 1 }}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="d-flex gap-2 mt-3" style={{ maxWidth: 420 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Add another feature (e.g. Rear spoiler)"
            aria-label="Add a custom feature"
            maxLength={60}
            value={custom}
            disabled={atLimit}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <button type="button" className="sc-button" disabled={!custom.trim() || atLimit} onClick={addCustom}>
            <span>Add</span>
          </button>
        </div>
        {atLimit && <p className="text-color-1 fs-13 mt-1 mb-0">That&apos;s the maximum of {MAX_FEATURES} features.</p>}
      </fieldset>
    </div>
  );
}

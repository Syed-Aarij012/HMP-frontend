"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import {
  ADD_LISTING_BODY_TYPE_OPTIONS,
  ADD_LISTING_FUEL_TYPE_OPTIONS,
  ADD_LISTING_PRICE_TYPE_OPTIONS,
  ADD_LISTING_TRANSMISSION_OPTIONS,
  ADD_LISTING_V5C_STATUS_OPTIONS,
  VAT_STATUS_OPTIONS,
} from "@/data/niceSelectOptions";
import type { NiceSelectOption } from "@/components/common/NiceSelect";
import FeaturesSpecsFields, { extrasChanges, extrasFromVehicle, type ExtrasForm } from "@/components/sections/add-listing/FeaturesSpecsFields";
import { useEditListing, type EditableMedia, type EditPayload } from "@/hooks/useEditListing";

// Mirrors config('media.max_video_duration_seconds') — the server re-validates it.
const MAX_VIDEO_SECONDS = 240;

// The shared option lists lead with a "Select" placeholder (value ""), which a plain <select>
// shows separately only when a field is genuinely empty.
const real = (options: NiceSelectOption[]) => options.filter((option) => option.value !== "");

const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  live: "Live",
  under_offer: "Under offer",
  reserved: "Reserved",
  withdrawn: "Withdrawn",
  sold: "Sold",
  expired: "Expired",
};
// What the backend accepts to be set from here (UpdateListingRequest).
const SETTABLE_STATUSES = ["live", "under_offer", "withdrawn", "sold"];

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="col-md-6 col-lg-4 mb-3">
      <label htmlFor={htmlFor} className="mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  allowEmpty = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: NiceSelectOption[];
  allowEmpty?: boolean;
}) {
  return (
    <select id={id} className="form-control" value={value} onChange={(e) => onChange(e.target.value)}>
      {(allowEmpty || value === "") && <option value="">Select</option>}
      {real(options).map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function probeVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(probe.src);
      resolve(Math.round(probe.duration));
    };
    probe.onerror = () => {
      URL.revokeObjectURL(probe.src);
      reject(new Error("That file doesn't look like a video this browser can read."));
    };
    probe.src = URL.createObjectURL(file);
  });
}

function MediaManager({
  media,
  onRemove,
  onAddPhotos,
  onAddVideo,
  status,
  error,
}: {
  media: EditableMedia[];
  onRemove: (id: number) => void;
  onAddPhotos: (files: File[]) => void;
  onAddVideo: (file: File, durationSeconds: number) => void;
  status: string | null;
  error: string | null;
}) {
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const photos = media.filter((item) => item.type === "still");
  const videos = media.filter((item) => item.type === "video");
  const busy = status !== null;

  function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (files.length) onAddPhotos(files);
  }

  async function handleVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setVideoError(null);
    try {
      const seconds = await probeVideoDuration(file);
      if (seconds > MAX_VIDEO_SECONDS) {
        setVideoError(`This video is longer than ${MAX_VIDEO_SECONDS / 60} minutes.`);
        return;
      }
      onAddVideo(file, seconds);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Couldn't read that video.");
    }
  }

  function confirmRemove(item: EditableMedia) {
    if (window.confirm(`Remove this ${item.type === "video" ? "video" : "photo"} from the listing?`)) onRemove(item.id);
  }

  return (
    <div className="tfcl-card p-3 mb-3">
      <h4 className="mb-2">Photos &amp; video</h4>

      {photos.length === 0 && <p className="text-color-1">No photos yet.</p>}
      <div className="d-flex flex-wrap gap-3 mb-3">
        {photos.map((photo) => (
          <div key={photo.id} style={{ width: 150 }}>
            <div style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt="Listing photo"
                style={{ width: 150, height: 100, objectFit: "cover", borderRadius: 6, opacity: photo.qa_status === "failed" ? 0.5 : 1 }}
              />
              <button
                type="button"
                aria-label="Remove photo"
                disabled={busy}
                onClick={() => confirmRemove(photo)}
                style={{ position: "absolute", top: 4, right: 4, border: "none", borderRadius: "50%", width: 24, height: 24, lineHeight: "24px", background: "#24272C", color: "#fff" }}
              >
                &times;
              </button>
            </div>
            {photo.qa_status === "failed" && (
              <div className="fs-13 text-danger mt-1">{photo.qa_message ?? "This photo failed the quality check."} Remove it and add a clearer one.</div>
            )}
            {photo.qa_status === "pending" && <div className="fs-13 text-color-1 mt-1">Being checked...</div>}
          </div>
        ))}
      </div>
      <input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={handlePhotos} />
      <button type="button" className="sc-button" disabled={busy} onClick={() => photoInput.current?.click()}>
        <span>Add photos</span>
      </button>

      <h5 className="mt-4 mb-2">Video</h5>
      {videos.length === 0 && <p className="text-color-1">No video yet.</p>}
      {videos.map((video) => (
        <div key={video.id} className="mb-3" style={{ maxWidth: 420 }}>
          <video src={video.url} controls preload="metadata" playsInline style={{ width: "100%", borderRadius: 6, background: "#000" }} />
          <div className="d-flex justify-content-between align-items-center mt-1">
            <span className="fs-13 text-color-1">
              {video.duration_seconds ? `${video.duration_seconds}s` : "Walk-around video"}
              {video.qa_status === "pending" ? " · being checked" : ""}
            </span>
            <button type="button" className="sc-button" disabled={busy} onClick={() => confirmRemove(video)}>
              <span>Remove</span>
            </button>
          </div>
        </div>
      ))}
      <input ref={videoInput} type="file" accept="video/*" hidden onChange={handleVideo} />
      <button type="button" className="sc-button" disabled={busy} onClick={() => videoInput.current?.click()}>
        <span>Add video</span>
      </button>
      <p className="text-color-1 fs-13 mt-2 mb-0">Up to {MAX_VIDEO_SECONDS / 60} minutes per video.</p>

      {status && <p className="mt-2 mb-0">{status}</p>}
      {(error || videoError) && (
        <div className="alert alert-danger mt-2 mb-0" role="alert">
          {error ?? videoError}
        </div>
      )}
    </div>
  );
}

const str = (value: string | number | null | undefined) => (value === null || value === undefined ? "" : String(value));

function EditForm({
  data,
  onSave,
  mediaProps,
  listingId,
}: {
  data: EditPayload;
  onSave: (vehicleChanges: Record<string, unknown>, listingChanges: Record<string, unknown>) => Promise<string | null>;
  mediaProps: Omit<React.ComponentProps<typeof MediaManager>, "media">;
  listingId: string;
}) {
  const { vehicle, listing } = data;
  const locked = data.vehicle_locked_reason !== null;

  const [form, setForm] = useState({
    current_vrm: str(vehicle.current_vrm),
    make: str(vehicle.make),
    model: str(vehicle.model),
    derivative: str(vehicle.derivative),
    year: str(vehicle.year),
    current_mileage: str(vehicle.current_mileage),
    body_type: str(vehicle.body_type),
    fuel_type: str(vehicle.fuel_type),
    transmission: str(vehicle.transmission),
    colour: str(vehicle.colour),
    doors: str(vehicle.doors),
    seats: str(vehicle.seats),
    v5c_status: str(vehicle.v5c_status),
    vat_status: str(vehicle.vat_status),
    price: str(listing.price),
    price_type: str(listing.price_type),
    description: str(listing.description),
    postcode: str(listing.postcode),
    status: listing.status,
  });
  const [extras, setExtras] = useState<ExtrasForm>(() => extrasFromVehicle(vehicle));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };
  const input = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key)(e.target.value),
  });

  /** Only what differs from what's saved — the backend treats an absent field as unchanged. */
  function changes() {
    const vehicleChanges: Record<string, unknown> = {};
    const numeric = ["year", "current_mileage", "doors", "seats"];
    const nullable = ["current_vrm", "derivative", "colour", "doors", "seats"];
    for (const key of [
      "current_vrm", "make", "model", "derivative", "year", "current_mileage", "body_type", "fuel_type",
      "transmission", "colour", "doors", "seats", "v5c_status", "vat_status",
    ] as const) {
      const saved = str(vehicle[key as keyof typeof vehicle] as string | number | null);
      if (form[key] === saved) continue;
      if (form[key] === "" && !nullable.includes(key)) continue; // can't blank a required field
      vehicleChanges[key] = form[key] === "" ? null : numeric.includes(key) ? Number(form[key]) : form[key];
    }

    // Additional specifications and the features checklist (only what changed; a cleared field is null).
    Object.assign(vehicleChanges, extrasChanges(extras, vehicle));

    const listingChanges: Record<string, unknown> = {};
    if (form.price !== str(listing.price) && form.price !== "") listingChanges.price = Number(form.price);
    if (form.price_type !== listing.price_type) listingChanges.price_type = form.price_type;
    if (form.description !== str(listing.description)) listingChanges.description = form.description === "" ? null : form.description;
    if (form.postcode !== str(listing.postcode)) listingChanges.postcode = form.postcode === "" ? null : form.postcode;
    if (form.status !== listing.status) listingChanges.status = form.status;

    return { vehicleChanges, listingChanges };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { vehicleChanges, listingChanges } = changes();
    if (Object.keys(vehicleChanges).length + Object.keys(listingChanges).length === 0) {
      setError(null);
      setSaved(true);
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);
    const message = await onSave(vehicleChanges, listingChanges);
    setSaving(false);
    if (message) setError(message);
    else setSaved(true);
  }

  const statusOptions = SETTABLE_STATUSES.includes(listing.status) ? SETTABLE_STATUSES : [listing.status, ...SETTABLE_STATUSES];

  return (
    <form onSubmit={handleSubmit}>
      {locked && <div className="alert alert-warning">{data.vehicle_locked_reason} You can still change the price, description and photos.</div>}

      <div className="tfcl-card p-3 mb-3">
        <h4 className="mb-3">Vehicle details</h4>
        <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="row">
            <Field label="Registration" htmlFor="edit_vrm">
              <input id="edit_vrm" className="form-control" maxLength={10} style={{ textTransform: "uppercase" }} {...input("current_vrm")} />
            </Field>
            <Field label="Make *" htmlFor="edit_make">
              <input id="edit_make" className="form-control" required {...input("make")} />
            </Field>
            <Field label="Model *" htmlFor="edit_model">
              <input id="edit_model" className="form-control" required {...input("model")} />
            </Field>
            <Field label="Trim / derivative" htmlFor="edit_derivative">
              <input id="edit_derivative" className="form-control" {...input("derivative")} />
            </Field>
            <Field label="Year *" htmlFor="edit_year">
              <input id="edit_year" type="number" min={1980} max={new Date().getFullYear() + 1} className="form-control" required {...input("year")} />
            </Field>
            <Field label="Mileage *" htmlFor="edit_mileage">
              <input id="edit_mileage" type="number" min={0} className="form-control" required {...input("current_mileage")} />
            </Field>
            <Field label="Body type" htmlFor="edit_body">
              <Select id="edit_body" value={form.body_type} onChange={set("body_type")} options={ADD_LISTING_BODY_TYPE_OPTIONS} />
            </Field>
            <Field label="Fuel type" htmlFor="edit_fuel">
              <Select id="edit_fuel" value={form.fuel_type} onChange={set("fuel_type")} options={ADD_LISTING_FUEL_TYPE_OPTIONS} />
            </Field>
            <Field label="Transmission" htmlFor="edit_transmission">
              <Select id="edit_transmission" value={form.transmission} onChange={set("transmission")} options={ADD_LISTING_TRANSMISSION_OPTIONS} />
            </Field>
            <Field label="Colour" htmlFor="edit_colour">
              <input id="edit_colour" className="form-control" {...input("colour")} />
            </Field>
            <Field label="Doors" htmlFor="edit_doors">
              <input id="edit_doors" type="number" min={2} max={6} className="form-control" {...input("doors")} />
            </Field>
            <Field label="Seats" htmlFor="edit_seats">
              <input id="edit_seats" type="number" min={1} max={9} className="form-control" {...input("seats")} />
            </Field>
            <Field label="V5C (logbook)" htmlFor="edit_v5c">
              <Select id="edit_v5c" value={form.v5c_status} onChange={set("v5c_status")} options={ADD_LISTING_V5C_STATUS_OPTIONS} />
            </Field>
            <Field label="VAT status" htmlFor="edit_vat">
              <Select id="edit_vat" value={form.vat_status} onChange={set("vat_status")} options={VAT_STATUS_OPTIONS} />
            </Field>
          </div>
        </fieldset>
        <p className="text-color-1 fs-13 mb-0">
          The VIN can&apos;t be changed once a vehicle is registered on the platform. Changing the mileage or registration re-runs the
          vehicle checks.
        </p>
      </div>

      <FeaturesSpecsFields
        value={extras}
        disabled={locked}
        onChange={(next) => {
          setSaved(false);
          setExtras(next);
        }}
      />

      <div className="tfcl-card p-3 mb-3">
        <h4 className="mb-3">Listing</h4>
        <div className="row">
          <Field label="Price (£) *" htmlFor="edit_price">
            <input id="edit_price" type="number" min={0} step="0.01" className="form-control" required {...input("price")} />
          </Field>
          <Field label="Price type" htmlFor="edit_price_type">
            <Select id="edit_price_type" value={form.price_type} onChange={set("price_type")} options={ADD_LISTING_PRICE_TYPE_OPTIONS} />
          </Field>
          <Field label="Postcode" htmlFor="edit_postcode">
            <input id="edit_postcode" className="form-control" maxLength={10} {...input("postcode")} />
          </Field>
          <Field label="Status" htmlFor="edit_status">
            <select id="edit_status" className="form-control" value={form.status} onChange={(e) => set("status")(e.target.value)}>
              {statusOptions.map((status) => (
                <option key={status} value={status} disabled={!SETTABLE_STATUSES.includes(status)}>
                  {LISTING_STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>
          </Field>
          <div className="col-12 mb-1">
            <label htmlFor="edit_description" className="mb-1">
              Description
            </label>
            <textarea id="edit_description" className="form-control" rows={5} maxLength={5000} {...input("description")} />
          </div>
        </div>
      </div>

      <MediaManager media={data.media} {...mediaProps} />

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {saved && !error && <div className="alert alert-success">Saved.</div>}

      <div className="d-flex gap-3 align-items-center mb-4">
        <button type="submit" className="sc-button" disabled={saving}>
          <span>{saving ? "Saving..." : "Save changes"}</span>
        </button>
        <Link href="/my-listing" className="sc-button">
          <span>Back to my listings</span>
        </Link>
        <Link href={`/listing-detail-v1/${listingId}`} className="text-color-1">
          View listing
        </Link>
      </div>
    </form>
  );
}

/**
 * The seller's "edit all details" page: every field Add Listing asked for (bar the VIN), the
 * listing's price/description/status, and the photos and video — not just the price and
 * description the My Listings row could change.
 */
export default function EditListing({ listingId }: { listingId: string }) {
  const { data, loading, error, save, removeMedia, addPhotos, addVideo, mediaStatus, mediaError } = useEditListing(listingId);

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Edit listing</h1>
                  {loading && <p>Loading your listing...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {data && (
                    <EditForm
                      data={data}
                      onSave={save}
                      listingId={listingId}
                      mediaProps={{
                        onRemove: removeMedia,
                        onAddPhotos: addPhotos,
                        onAddVideo: addVideo,
                        status: mediaStatus,
                        error: mediaError,
                      }}
                    />
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

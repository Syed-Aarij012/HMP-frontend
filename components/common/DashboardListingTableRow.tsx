"use client";

import { useState } from "react";
import Image from "@/components/common/AppImage";
import Link from "next/link";
import NiceSelect from "@/components/common/NiceSelect";
import { DASHBOARD_LISTING_STATUS_META } from "@/data/dashboardListings";
import { ADD_LISTING_PRICE_TYPE_OPTIONS } from "@/data/niceSelectOptions";
import { formatCarPrice, getCarHref } from "@/data/cars";
import { describeApiError } from "@/lib/api-client";
import { usePricingSuggestion, useListingQuality } from "@/hooks/useListingTools";
import type { DashboardCar } from "@/types/cars";

export type ListingEditableFields = {
  price: number;
  price_type: string;
  description: string;
  // Omitted when the seller didn't change it, so saving a new price never flips the status.
  status?: "live" | "under_offer" | "withdrawn" | "sold";
};

type DashboardListingTableRowProps = {
  listing: DashboardCar;
  onDelete?: (id: number) => void;
  onSave?: (id: number, updates: ListingEditableFields) => Promise<void>;
  onMarkSold?: (id: number) => Promise<void>;
  onRenew?: (id: number) => Promise<void>;
  // Draft -> live, or withdrawn -> live ("Relist"). Rejects with the server's reason.
  onPublish?: (id: number) => Promise<void>;
};

const DEFAULT_LISTING_DESCRIPTION =
  "1st owned, automatic transmission, Apple Carplay...";

function formatListingDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const LISTING_STATUS_OPTIONS = [
  { label: "Live", value: "live" },
  { label: "Under offer", value: "under_offer" },
  { label: "Withdrawn", value: "withdrawn" },
  { label: "Sold", value: "sold" },
];

/** FR-C-003: a valuation-anchored asking-price suggestion, shown while editing a listing. */
function PricingSuggestionHint({ vehiclePublicId }: { vehiclePublicId: string }) {
  const { suggestion, loading, error, fetchSuggestion } = usePricingSuggestion();

  if (!suggestion && !loading && !error) {
    return (
      <button
        type="button"
        className="btn-action tfcl-dashboard-action-edit mb-2"
        onClick={() => fetchSuggestion(vehiclePublicId)}
      >
        Get a pricing suggestion
      </button>
    );
  }

  if (loading) return <p className="mb-2">Checking similar cars on the platform...</p>;
  if (error) return <div className="alert alert-danger mb-2">{error}</div>;
  if (!suggestion) return null;

  if (suggestion.suggestedPrice === null) {
    return <p className="tfcl-empty-data mb-2">{suggestion.message}</p>;
  }

  return (
    <div className="alert alert-success mb-2">
      Similar cars suggest around <b>£{suggestion.suggestedPrice.toLocaleString()}</b> (£
      {suggestion.rangeLow?.toLocaleString()}–£{suggestion.rangeHigh?.toLocaleString()}), based on{" "}
      {suggestion.comparables} comparable listing{suggestion.comparables === 1 ? "" : "s"}.
    </div>
  );
}

/** FR-C-014: the listing-quality score + remediation prompts, shown while editing a listing. */
function ListingQualityHint({ listingPublicId }: { listingPublicId: string }) {
  const { quality, loading, error, fetchQuality } = useListingQuality();

  if (!quality && !loading && !error) {
    return (
      <button
        type="button"
        className="btn-action tfcl-dashboard-action-edit mb-2"
        onClick={() => fetchQuality(listingPublicId)}
      >
        Check listing quality
      </button>
    );
  }

  if (loading) return <p className="mb-2">Scoring this listing...</p>;
  if (error) return <div className="alert alert-danger mb-2">{error}</div>;
  if (!quality) return null;

  return (
    <div className="alert alert-info mb-2">
      <b>Quality score: {quality.score}/100</b>
      {quality.remediationPrompts.length > 0 && (
        <ul className="mb-0 mt-1">
          {quality.remediationPrompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardListingTableRow({
  listing,
  onDelete,
  onSave,
  onMarkSold,
  onRenew,
  onPublish,
}: DashboardListingTableRowProps) {
  const detailHref = getCarHref(listing);
  const statusMeta = DASHBOARD_LISTING_STATUS_META[listing.dashboardStatus];
  const canEdit = Boolean(listing.publicId && onSave);
  const canMarkSold = Boolean(
    listing.publicId && onMarkSold && listing.dashboardStatus !== "sold"
  );
  // FR-C-003: renewal only ever applies to a listing that has (or had) an end date to extend
  // — live/under-offer/expired, never a draft, sold or withdrawn one.
  const canRenew = Boolean(
    listing.publicId && onRenew && ["live", "under_offer", "expired"].includes(listing.rawStatus ?? "")
  );
  const [markingSold, setMarkingSold] = useState(false);
  const [markSoldError, setMarkSoldError] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const canPublish = Boolean(listing.publicId && onPublish && ["draft", "withdrawn"].includes(listing.rawStatus ?? ""));
  // FR-C-001: a listing that's never been approved goes to review; an approved one is relisted.
  const needsReview = listing.rawStatus === "draft" || !listing.publishedAt;
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(String(listing.price));
  const [priceType, setPriceType] = useState(listing.priceType ?? "fixed");
  const [description, setDescription] = useState(listing.description ?? "");
  // "" = leave the status as it is.
  const [status, setStatus] = useState<NonNullable<ListingEditableFields["status"]> | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setPrice(String(listing.price));
    setDescription(listing.description ?? "");
    setPriceType(listing.priceType ?? "fixed");
    setStatus("");
    setError(null);
    setIsEditing(true);
  };

  const handleMarkSold = async () => {
    if (!onMarkSold) return;

    setMarkingSold(true);
    setMarkSoldError(null);
    try {
      await onMarkSold(listing.id);
    } catch (err) {
      setMarkSoldError(describeApiError(err, "Could not mark this listing as sold."));
    } finally {
      setMarkingSold(false);
    }
  };

  const handlePublish = async () => {
    if (!onPublish) return;

    setPublishing(true);
    setPublishError(null);
    try {
      await onPublish(listing.id);
    } catch (err) {
      setPublishError(describeApiError(err, "Could not submit this listing."));
    } finally {
      setPublishing(false);
    }
  };

  const handleRenew = async () => {
    if (!onRenew) return;

    setRenewing(true);
    setRenewError(null);
    try {
      await onRenew(listing.id);
    } catch (err) {
      setRenewError(describeApiError(err, "Could not renew this listing."));
    } finally {
      setRenewing(false);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    setError(null);
    try {
      await onSave(listing.id, {
        price: Number(price),
        price_type: priceType,
        description,
        status: status || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      setError(describeApiError(err, "Could not save these changes."));
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <tr>
        <td colSpan={4}>
          <div className="tfcl-listing-edit-inline p-3">
            {listing.vehiclePublicId && <PricingSuggestionHint vehiclePublicId={listing.vehiclePublicId} />}
            {listing.publicId && <ListingQualityHint listingPublicId={listing.publicId} />}
            <div className="grid-2 gap-30 mb-2">
              <div className="form-group mb-0">
                <label>Price</label>
                <input
                  type="number"
                  className="form-control"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  min={0}
                />
              </div>
              <div className="form-group mb-0">
                <label>Price type</label>
                <NiceSelect
                  options={ADD_LISTING_PRICE_TYPE_OPTIONS}
                  value={priceType}
                  defaultValue={priceType}
                  className="form-control"
                  onChange={(value) => setPriceType(String(value))}
                />
              </div>
            </div>
            <div className="form-group mb-2">
              <label>Description</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="form-group mb-2">
              <label>Status</label>
              <NiceSelect
                options={[{ label: `Keep as ${statusMeta.label}`, value: "" }, ...LISTING_STATUS_OPTIONS]}
                value={status}
                defaultValue=""
                className="form-control"
                onChange={(value) =>
                  setStatus(String(value) as NonNullable<ListingEditableFields["status"]> | "")
                }
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="d-flex gap-30">
              <button
                type="button"
                className="btn-action tfcl-dashboard-action-edit"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="btn-action tfcl-dashboard-action-delete"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="column-listing">
        <div className="tfcl-listing-product">
          <Link href={detailHref}>
            <Image
              src={listing.dashboardImage}
              alt={listing.title}
              width={168}
              height={95}
              unoptimized={listing.dashboardImage.startsWith("http")}
            />
          </Link>
          <div className="tfcl-listing-summary">
            <h4 className="tfcl-listing-title">
              <Link target="_blank" href={detailHref}>
                {listing.title}
              </Link>
            </h4>
            <div className="features-text">
              {listing.description ?? DEFAULT_LISTING_DESCRIPTION}
            </div>
            <div className="price">
              <div className="inner tfcl-listing-price">
                {formatCarPrice(listing.price)}
              </div>
            </div>
          </div>
        </div>
      </td>
      <td className="column-status">
        <span
          className={`tfcl-listing-status ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
        {/* FR-C-001: a declined listing comes back as a draft with the reviewer's reason. */}
        {listing.rawStatus === "draft" && listing.reviewNote && (
          <div className="text-danger fs-13 mt-1" style={{ maxWidth: 220 }}>
            Not approved: {listing.reviewNote}
          </div>
        )}
      </td>
      <td className="column-date">
        <div className="tfcl-listing-date">{formatListingDate(listing.postingDate)}</div>
      </td>
      <td className="column-controller">
        {canEdit && (
          <div className="inner-controller">
            <span className="icon">
              <Image
                src="/assets/images/dashboard/pen.svg"
                alt="icon"
                width={20}
                height={20}
              />
            </span>
            <button
              type="button"
              className="btn-action tfcl-dashboard-action-edit"
              onClick={startEditing}
            >
              Edit
            </button>
          </div>
        )}
        {canEdit && listing.publicId && (
          <div className="inner-controller">
            <span className="icon">
              <Image
                src="/assets/images/dashboard/pen.svg"
                alt="icon"
                width={20}
                height={20}
              />
            </span>
            {/* Every vehicle detail, the listing's fields, and photos/video — the quick Edit above
                only covers price, description and status. */}
            <Link href={`/edit-listing/${listing.publicId}`} className="btn-action tfcl-dashboard-action-edit">
              Edit all details
            </Link>
          </div>
        )}
        {canPublish && (
          <div className="inner-controller">
            <span className="icon">
              <Image
                src="/assets/images/dashboard/pen.svg"
                alt="icon"
                width={20}
                height={20}
              />
            </span>
            <button
              type="button"
              className="btn-action tfcl-dashboard-action-edit"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? "Sending..." : needsReview ? "Submit for review" : "Relist"}
            </button>
          </div>
        )}
        {canMarkSold && (
          <div className="inner-controller">
            <span className="icon">
              <Image
                src="/assets/images/dashboard/hide.svg"
                alt="icon"
                width={20}
                height={20}
              />
            </span>
            <button
              type="button"
              className="btn-action tfcl-dashboard-action-edit"
              onClick={handleMarkSold}
              disabled={markingSold}
            >
              {markingSold ? "Marking..." : "Sold"}
            </button>
          </div>
        )}
        {canRenew && (
          <div className="inner-controller">
            <span className="icon">
              <Image
                src="/assets/images/dashboard/pen.svg"
                alt="icon"
                width={20}
                height={20}
              />
            </span>
            <button
              type="button"
              className="btn-action tfcl-dashboard-action-edit"
              onClick={handleRenew}
              disabled={renewing}
            >
              {renewing ? "Renewing..." : listing.rawStatus === "expired" ? "Relist" : "Renew"}
            </button>
          </div>
        )}
        {listing.vehiclePublicId && (
          <div className="inner-controller">
            <span className="icon">
              <Image
                src="/assets/images/dashboard/pen.svg"
                alt="icon"
                width={20}
                height={20}
              />
            </span>
            <Link href={`/guided-capture/${listing.vehiclePublicId}`} className="btn-action tfcl-dashboard-action-edit">
              Guided photos
            </Link>
          </div>
        )}
        <div className="inner-controller">
          <span className="icon">
            <Image
              src="/assets/images/dashboard/trash.svg"
              alt="icon"
              width={20}
              height={20}
            />
          </span>
          <button
            type="button"
            className="btn-action tfcl-dashboard-action-delete"
            onClick={() => onDelete?.(listing.id)}
          >
            Delete
          </button>
        </div>
        {publishError && (
          <div className="text-danger fs-12 w-100 mt-1">{publishError}</div>
        )}
        {markSoldError && (
          <div className="text-danger fs-12 w-100 mt-1">{markSoldError}</div>
        )}
        {renewError && (
          <div className="text-danger fs-12 w-100 mt-1">{renewError}</div>
        )}
      </td>
    </tr>
  );
}

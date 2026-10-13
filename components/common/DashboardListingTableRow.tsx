"use client";

import { useId, useState } from "react";
import Image from "@/components/common/AppImage";
import Link from "next/link";
import { DASHBOARD_LISTING_STATUS_META } from "@/data/dashboardListings";
import { ADD_LISTING_PRICE_TYPE_OPTIONS } from "@/data/niceSelectOptions";
import { formatCarPrice, getCarHref } from "@/data/cars";
import { describeApiError } from "@/lib/api-client";
import { usePricingSuggestion, useListingQuality } from "@/hooks/useListingTools";
import type { DashboardCar, DashboardListingStatus } from "@/types/cars";
import { ActionMenu, Badge, Notice, formatMoney, type MenuAction, type Tone } from "@/components/ui/kit";

const STATUS_TONE: Record<DashboardListingStatus, Tone> = {
  approved: "success",
  pending: "warning",
  draft: "neutral",
  under_offer: "primary",
  reserved: "primary",
  withdrawn: "neutral",
  expired: "danger",
  sold: "dark",
};

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
      <button type="button" className="ha-btn is-sm" onClick={() => fetchSuggestion(vehiclePublicId)}>
        Get a pricing suggestion
      </button>
    );
  }

  if (loading) return <p className="ha-sub" role="status">Checking similar cars on the platform…</p>;
  if (error) return <Notice tone="danger">{error}</Notice>;
  if (!suggestion) return null;

  if (suggestion.suggestedPrice === null) {
    return <Notice tone="info">{suggestion.message}</Notice>;
  }

  return (
    <Notice tone="success">
      Similar cars suggest around <b>{formatMoney(suggestion.suggestedPrice)}</b> ({formatMoney(suggestion.rangeLow)}–
      {formatMoney(suggestion.rangeHigh)}), based on {suggestion.comparables} comparable listing
      {suggestion.comparables === 1 ? "" : "s"}.
    </Notice>
  );
}

/** FR-C-014: the listing-quality score + remediation prompts, shown while editing a listing. */
function ListingQualityHint({ listingPublicId }: { listingPublicId: string }) {
  const { quality, loading, error, fetchQuality } = useListingQuality();

  if (!quality && !loading && !error) {
    return (
      <button type="button" className="ha-btn is-sm" onClick={() => fetchQuality(listingPublicId)}>
        Check listing quality
      </button>
    );
  }

  if (loading) return <p className="ha-sub" role="status">Scoring this listing…</p>;
  if (error) return <Notice tone="danger">{error}</Notice>;
  if (!quality) return null;

  return (
    <Notice tone="info">
      <b>Quality score: {quality.score}/100</b>
      {quality.remediationPrompts.length > 0 && (
        <ul className="mb-0 mt-1">
          {quality.remediationPrompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      )}
    </Notice>
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
  const fieldId = useId();

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
          <div className="ha-inline-edit">
            <div className="ha-actions is-start mb-3">
              {listing.vehiclePublicId && <PricingSuggestionHint vehiclePublicId={listing.vehiclePublicId} />}
              {listing.publicId && <ListingQualityHint listingPublicId={listing.publicId} />}
            </div>
            <div className="ha-form-grid">
              <div className="ha-field">
                <label htmlFor={`${fieldId}-price`}>Price (£)</label>
                <input
                  id={`${fieldId}-price`}
                  type="number"
                  className="ha-input"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  min={0}
                />
              </div>
              <div className="ha-field">
                <label htmlFor={`${fieldId}-price-type`}>Price type</label>
                <select
                  id={`${fieldId}-price-type`}
                  className="ha-select"
                  value={priceType}
                  onChange={(event) => setPriceType(event.target.value)}
                >
                  {ADD_LISTING_PRICE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ha-field">
                <label htmlFor={`${fieldId}-status`}>Status</label>
                <select
                  id={`${fieldId}-status`}
                  className="ha-select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as NonNullable<ListingEditableFields["status"]> | "")}
                >
                  {[{ label: `Keep as ${statusMeta.label}`, value: "" }, ...LISTING_STATUS_OPTIONS].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ha-field">
              <label htmlFor={`${fieldId}-description`}>Description</label>
              <textarea
                id={`${fieldId}-description`}
                className="ha-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            {error && <Notice tone="danger">{error}</Notice>}
            <div className="ha-actions is-start">
              <button type="button" className="ha-btn is-primary" onClick={handleSave} disabled={saving} aria-busy={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" className="ha-btn is-ghost" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  // One primary action for the listing's current state; everything else is in "More".
  const primary = canPublish
    ? { label: publishing ? "Sending…" : needsReview ? "Submit for review" : "Relist", onClick: handlePublish, busy: publishing }
    : canRenew
      ? { label: renewing ? "Renewing…" : listing.rawStatus === "expired" ? "Relist" : "Renew", onClick: handleRenew, busy: renewing }
      : null;

  const more: MenuAction[] = [
    ...(canPublish && canRenew ? [{ label: listing.rawStatus === "expired" ? "Relist" : "Renew", onSelect: handleRenew, disabled: renewing }] : []),
    ...(canEdit && listing.publicId ? [{ label: "Edit all details", href: `/edit-listing/${listing.publicId}` }] : []),
    ...(listing.vehiclePublicId ? [{ label: "Guided photos", href: `/guided-capture/${listing.vehiclePublicId}` }] : []),
    ...(canMarkSold ? [{ label: markingSold ? "Marking…" : "Mark as sold", onSelect: handleMarkSold, disabled: markingSold }] : []),
    { label: "Delete", onSelect: () => onDelete?.(listing.id), danger: true },
  ];

  return (
    <tr>
      <td data-label="Listing">
        <div className="ha-media-row">
          <Link href={detailHref} tabIndex={-1} aria-hidden="true">
            <Image
              src={listing.dashboardImage}
              alt=""
              width={88}
              height={58}
              unoptimized={listing.dashboardImage.startsWith("http")}
            />
          </Link>
          <div className="ha-media-text">
            <Link target="_blank" href={detailHref} className="ha-media-title">
              {listing.title}
            </Link>
            <div className="ha-media-sub">{listing.description ?? DEFAULT_LISTING_DESCRIPTION}</div>
            <div className="ha-primary-text ha-num">{formatCarPrice(listing.price)}</div>
          </div>
        </div>
      </td>
      <td data-label="Status">
        <Badge tone={STATUS_TONE[listing.dashboardStatus] ?? "neutral"}>{statusMeta.label}</Badge>
        {/* FR-C-001: a declined listing comes back as a draft with the reviewer's reason. */}
        {listing.rawStatus === "draft" && listing.reviewNote && (
          <div className="ha-inline-error" style={{ maxWidth: 240 }}>
            Not approved: {listing.reviewNote}
          </div>
        )}
      </td>
      <td data-label="Posted" className="ha-num">
        {formatListingDate(listing.postingDate)}
      </td>
      <td data-label="">
        <div className="ha-row-actions">
          {primary && (
            <button type="button" className="ha-btn is-sm is-primary" onClick={primary.onClick} disabled={primary.busy} aria-busy={primary.busy}>
              {primary.label}
            </button>
          )}
          {canEdit && (
            <button type="button" className="ha-btn is-sm" onClick={startEditing}>
              Edit
            </button>
          )}
          <ActionMenu actions={more} label={`More actions for ${listing.title}`} />
        </div>
        {publishError && <div className="ha-inline-error" role="alert">{publishError}</div>}
        {markSoldError && <div className="ha-inline-error" role="alert">{markSoldError}</div>}
        {renewError && <div className="ha-inline-error" role="alert">{renewError}</div>}
      </td>
    </tr>
  );
}

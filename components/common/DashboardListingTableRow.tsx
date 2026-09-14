"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NiceSelect from "@/components/common/NiceSelect";
import { DASHBOARD_LISTING_STATUS_META } from "@/data/dashboardListings";
import { ADD_LISTING_PRICE_TYPE_OPTIONS } from "@/data/niceSelectOptions";
import { formatCarPrice, getCarHref } from "@/data/cars";
import { describeApiError } from "@/lib/api-client";
import type { DashboardCar } from "@/types/cars";

export type ListingEditableFields = {
  price: number;
  price_type: string;
  description: string;
  status: "live" | "under_offer" | "withdrawn";
};

type DashboardListingTableRowProps = {
  listing: DashboardCar;
  onDelete?: (id: number) => void;
  onSave?: (id: number, updates: ListingEditableFields) => Promise<void>;
};

const DEFAULT_LISTING_DESCRIPTION =
  "1st owned, automatic transmission, Apple Carplay...";

const LISTING_STATUS_OPTIONS = [
  { label: "Live", value: "live" },
  { label: "Under offer", value: "under_offer" },
  { label: "Withdrawn", value: "withdrawn" },
];

export default function DashboardListingTableRow({
  listing,
  onDelete,
  onSave,
}: DashboardListingTableRowProps) {
  const detailHref = getCarHref(listing);
  const statusMeta = DASHBOARD_LISTING_STATUS_META[listing.dashboardStatus];
  const canEdit = Boolean(listing.publicId && onSave);

  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(String(listing.price));
  const [priceType, setPriceType] = useState("fixed");
  const [description, setDescription] = useState(listing.description ?? "");
  const [status, setStatus] = useState<ListingEditableFields["status"]>("live");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setPrice(String(listing.price));
    setDescription(listing.description ?? "");
    setError(null);
    setIsEditing(true);
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
        status,
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
                  defaultValue="fixed"
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
                options={LISTING_STATUS_OPTIONS}
                defaultValue="live"
                className="form-control"
                onChange={(value) =>
                  setStatus(value as ListingEditableFields["status"])
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
      </td>
      <td className="column-date">
        <div className="tfcl-listing-date">{listing.postingDate}</div>
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
      </td>
    </tr>
  );
}

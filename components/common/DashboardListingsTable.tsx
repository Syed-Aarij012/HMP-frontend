"use client";

import { useId, useMemo, useState } from "react";
import DashboardListingTableBody from "@/components/common/DashboardListingTableBody";
import type { ListingEditableFields } from "@/components/common/DashboardListingTableRow";
import {
  DASHBOARD_SORT_OPTIONS,
  DASHBOARD_STATUS_OPTIONS,
} from "@/data/niceSelectOptions";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapStatus } from "@/hooks/useMyListings";
import type { DashboardCar } from "@/types/cars";
import { DataTable, EmptyState, Pager } from "@/components/ui/kit";

const DEFAULT_DASHBOARD_LISTINGS_PAGE_SIZE = 7;

type DashboardListingsTableProps = {
  initialListings: DashboardCar[];
  pageSize?: number;
  showFilters?: boolean;
};

function parsePostingDate(date: string) {
  const time = Date.parse(date);
  return Number.isNaN(time) ? null : time;
}

export default function DashboardListingsTable({
  initialListings,
  pageSize = DEFAULT_DASHBOARD_LISTINGS_PAGE_SIZE,
  showFilters = false,
}: DashboardListingsTableProps) {
  const [listings, setListings] = useState(initialListings);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | number>("all");
  const [sortBy, setSortBy] = useState<string | number>("new");
  const [currentPage, setCurrentPage] = useState(1);
  const baseId = useId();

  const filteredListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const fromTime = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTime = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

    return listings.filter((listing) => {
      if (query) {
        const haystack = `${listing.title} ${listing.description ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (statusFilter !== "all" && listing.dashboardStatus !== statusFilter) {
        return false;
      }

      const postingTime = parsePostingDate(listing.postingDate);
      if (postingTime !== null) {
        if (fromTime !== null && postingTime < fromTime) {
          return false;
        }
        if (toTime !== null && postingTime > toTime) {
          return false;
        }
      }

      return true;
    });
  }, [listings, searchQuery, fromDate, toDate, statusFilter]);

  const sortedListings = useMemo(() => {
    const sorted = [...filteredListings];

    sorted.sort((a, b) => {
      const aTime = parsePostingDate(a.postingDate);
      const bTime = parsePostingDate(b.postingDate);

      if (aTime !== null && bTime !== null && aTime !== bTime) {
        return sortBy === "old" ? aTime - bTime : bTime - aTime;
      }

      return sortBy === "old" ? a.id - b.id : b.id - a.id;
    });

    return sorted;
  }, [filteredListings, sortBy]);

  const filterKey = `${searchQuery}|${fromDate}|${toDate}|${statusFilter}|${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);

  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sortedListings.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedListings = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return sortedListings.slice(start, start + pageSize);
  }, [sortedListings, effectivePage, pageSize]);

  const handleDelete = async (id: number) => {
    const listing = listings.find((item) => item.id === id);
    if (!listing?.publicId) return;

    try {
      await apiFetch(`/listings/${listing.publicId}`, { method: "DELETE" });
      setListings((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      window.alert(describeApiError(err, "Could not withdraw this listing."));
    }
  };

  const handleMarkSold = async (id: number) => {
    const listing = listings.find((item) => item.id === id);
    if (!listing?.publicId) return;

    const response = await apiFetch<{ data: { status: string } }>(
      `/listings/${listing.publicId}`,
      { method: "PATCH", body: { status: "sold" } }
    );

    setListings((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, dashboardStatus: mapStatus(response.data.status), rawStatus: response.data.status }
          : item,
      ),
    );
  };

  // FR-C-001 Draft → PendingChecks → Live: a listing that has never been approved is submitted
  // for review (a moderator puts it live); a previously approved one that was withdrawn is
  // relisted straight away. The backend refuses with a specific reason either way — thrown
  // through so the row shows it.
  const handlePublish = async (id: number) => {
    const listing = listings.find((item) => item.id === id);
    if (!listing?.publicId) return;

    const needsReview = listing.rawStatus === "draft" || !listing.publishedAt;
    const response = await apiFetch<{ data: { status: string } }>(`/listings/${listing.publicId}`, {
      method: "PATCH",
      body: { status: needsReview ? "pending_checks" : "live" },
    });

    setListings((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, dashboardStatus: mapStatus(response.data.status), rawStatus: response.data.status }
          : item,
      ),
    );
  };

  const handleRenew = async (id: number) => {
    const listing = listings.find((item) => item.id === id);
    if (!listing?.publicId) return;

    const response = await apiFetch<{ data: { status: string; expires_at: string | null } }>(
      `/listings/${listing.publicId}/renew`,
      { method: "POST" }
    );

    setListings((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, dashboardStatus: mapStatus(response.data.status), rawStatus: response.data.status }
          : item,
      ),
    );
  };

  const handleSave = async (id: number, updates: ListingEditableFields) => {
    const listing = listings.find((item) => item.id === id);
    if (!listing?.publicId) return;

    const response = await apiFetch<{
      data: { price: string | number; description: string | null; status: string };
    }>(`/listings/${listing.publicId}`, { method: "PATCH", body: updates });

    setListings((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              price: Number(response.data.price) || 0,
              description: response.data.description ?? undefined,
              dashboardStatus: mapStatus(response.data.status),
              rawStatus: response.data.status,
            }
          : item,
      ),
    );
  };

  const statusLabel = DASHBOARD_STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label;
  const isFiltered = searchQuery.trim() !== "" || fromDate !== "" || toDate !== "" || statusFilter !== "all";
  const clearFilters = () => {
    setSearchQuery("");
    setFromDate("");
    setToDate("");
    setStatusFilter("all");
  };

  return (
    <>
      <div className="ha-toolbar">
        {showFilters && (
          <>
            <div className="ha-search" role="search">
              <i className="icon-carus-search" aria-hidden="true" />
              <input
                className="ha-input"
                type="search"
                name="title_search"
                id="title_search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search listings"
                aria-label="Search listings"
              />
            </div>
            <label className="ha-control-label" htmlFor={`${baseId}-status`}>
              <span className="ha-visually-hidden">Status</span>
              <select
                id={`${baseId}-status`}
                className="ha-select ha-inline-select"
                value={String(statusFilter)}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {DASHBOARD_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === "all" ? "All statuses" : option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="ha-control-label" htmlFor="from-date">
              From
              <input
                type="date"
                id="from-date"
                className="ha-input ha-inline-select"
                name="from_date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>
            <label className="ha-control-label" htmlFor="to-date">
              To
              <input
                type="date"
                id="to-date"
                className="ha-input ha-inline-select"
                name="to_date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>
          </>
        )}
        <div className="ha-toolbar-end">
          <label className="ha-control-label" htmlFor={`${baseId}-sort`}>
            Sort
            <select
              id={`${baseId}-sort`}
              className="ha-select ha-inline-select"
              value={String(sortBy)}
              onChange={(event) => setSortBy(event.target.value)}
            >
              {DASHBOARD_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value === "new" ? "Newest first" : option.value === "old" ? "Oldest first" : option.label}
                </option>
              ))}
            </select>
          </label>
          <span className="ha-result-count" aria-live="polite">
            {isFiltered ? `${sortedListings.length} of ${listings.length} listings` : `${listings.length} listing${listings.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>
      {isFiltered && (
        <div className="ha-filterbar" aria-label="Active filters">
          {searchQuery.trim() !== "" && (
            <span className="ha-chip">
              “{searchQuery.trim()}”
              <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">×</button>
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="ha-chip">
              Status: {statusLabel}
              <button type="button" onClick={() => setStatusFilter("all")} aria-label="Remove status filter">×</button>
            </span>
          )}
          {fromDate && (
            <span className="ha-chip">
              From {fromDate}
              <button type="button" onClick={() => setFromDate("")} aria-label="Remove from date">×</button>
            </span>
          )}
          {toDate && (
            <span className="ha-chip">
              To {toDate}
              <button type="button" onClick={() => setToDate("")} aria-label="Remove to date">×</button>
            </span>
          )}
          <button type="button" className="ha-link-btn" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}

      {listings.length === 0 ? (
        <EmptyState icon="icon-carus-car" title="No listings yet" text="Cars you list for sale will appear here." />
      ) : sortedListings.length === 0 ? (
        <EmptyState
          icon="icon-carus-search"
          title="No matches"
          text="No listings match your search and filters."
          action={
            <button type="button" className="ha-btn" onClick={clearFilters}>
              Clear filters
            </button>
          }
        />
      ) : (
        <DataTable caption="Your listings">
          <thead>
            <tr>
              <th scope="col">Listing</th>
              <th scope="col">Status</th>
              <th scope="col">Posted</th>
              <th scope="col" className="ha-right">
                <span className="ha-visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <DashboardListingTableBody
            listings={paginatedListings}
            onDelete={handleDelete}
            onSave={handleSave}
            onMarkSold={handleMarkSold}
            onRenew={handleRenew}
            onPublish={handlePublish}
          />
        </DataTable>
      )}
      {totalPages > 1 ? <Pager page={effectivePage} lastPage={totalPages} onChange={setCurrentPage} /> : null}
    </>
  );
}

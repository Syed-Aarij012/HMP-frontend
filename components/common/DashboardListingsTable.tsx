"use client";

import { useMemo, useRef, useState } from "react";
import DashboardListingTableBody from "@/components/common/DashboardListingTableBody";
import type { ListingEditableFields } from "@/components/common/DashboardListingTableRow";
import NiceSelect from "@/components/common/NiceSelect";
import Pagination from "@/components/common/Pagination";
import {
  DASHBOARD_SORT_OPTIONS,
  DASHBOARD_STATUS_OPTIONS,
} from "@/data/niceSelectOptions";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapStatus } from "@/hooks/useMyListings";
import type { DashboardCar } from "@/types/cars";

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

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M15.7506 15.7506L11.8528 11.8528M11.8528 11.8528C12.9078 10.7979 13.5004 9.36711 13.5004 7.87521C13.5004 6.38331 12.9078 4.95252 11.8528 3.89759C10.7979 2.84265 9.36711 2.25 7.87521 2.25C6.38331 2.25 4.95252 2.84265 3.89759 3.89759C2.84265 4.95252 2.25 6.38331 2.25 7.87521C2.25 9.36711 2.84265 10.7979 3.89759 11.8528C4.95252 12.9078 6.38331 13.5004 7.87521 13.5004C9.36711 13.5004 10.7979 12.9078 11.8528 11.8528Z"
        stroke="#B6B6B6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={19}
      height={18}
      viewBox="0 0 19 18"
      fill="none"
    >
      <path
        d="M5.5625 2.25V3.9375M13.4375 2.25V3.9375M2.75 14.0625V5.625C2.75 5.17745 2.92779 4.74823 3.24426 4.43176C3.56072 4.11529 3.98995 3.9375 4.4375 3.9375H14.5625C15.0101 3.9375 15.4393 4.11529 15.7557 4.43176C16.0722 4.74823 16.25 5.17745 16.25 5.625V14.0625M2.75 14.0625C2.75 14.5101 2.92779 14.9393 3.24426 15.2557C3.56072 15.5722 3.98995 15.75 4.4375 15.75H14.5625C15.0101 15.75 15.4393 15.5722 15.7557 15.2557C16.0722 14.9393 16.25 14.5101 16.25 14.0625M2.75 14.0625V8.4375C2.75 7.98995 2.92779 7.56073 3.24426 7.24426C3.56072 6.92779 3.98995 6.75 4.4375 6.75H14.5625C15.0101 6.75 15.4393 6.92779 15.7557 7.24426C16.0722 7.56073 16.25 7.98995 16.25 8.4375V14.0625M9.5 9.5625H9.506V9.5685H9.5V9.5625ZM9.5 11.25H9.506V11.256H9.5V11.25ZM9.5 12.9375H9.506V12.9435H9.5V12.9375ZM7.8125 11.25H7.8185V11.256H7.8125V11.25ZM7.8125 12.9375H7.8185V12.9435H7.8125V12.9375ZM6.125 11.25H6.131V11.256H6.125V11.25ZM6.125 12.9375H6.131V12.9435H6.125V12.9375ZM11.1875 9.5625H11.1935V9.5685H11.1875V9.5625ZM11.1875 11.25H11.1935V11.256H11.1875V11.25ZM11.1875 12.9375H11.1935V12.9435H11.1875V12.9375ZM12.875 9.5625H12.881V9.5685H12.875V9.5625ZM12.875 11.25H12.881V11.256H12.875V11.25Z"
        stroke="#B6B6B6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const openDatePicker = (input: HTMLInputElement | null) => {
    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
  };

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
          ? { ...item, dashboardStatus: mapStatus(response.data.status) }
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
            }
          : item,
      ),
    );
  };

  return (
    <>
      {showFilters ? (
        <div className="row">
          <div className="col-xl-3 col-lg-6 mb-2">
            <div className="group-input-icon search">
              <input
                type="search"
                name="title_search"
                id="title_search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search..."
              />
              <span className="datepicker-icon">
                <SearchIcon />
              </span>
            </div>
          </div>
          <div className="col-xl-3 col-lg-6 mb-2">
            <div className="group-input-icon">
              <input
                ref={fromDateRef}
                type="date"
                id="from-date"
                className="dashboard-date-input"
                name="from_date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                aria-label="From date"
              />
              <button
                type="button"
                className="datepicker-icon"
                aria-label="Open from date picker"
                onClick={() => openDatePicker(fromDateRef.current)}
              >
                <CalendarIcon />
              </button>
            </div>
          </div>
          <div className="col-xl-3 col-lg-6 mb-2">
            <div className="group-input-icon">
              <input
                ref={toDateRef}
                type="date"
                id="to-date"
                className="dashboard-date-input"
                name="to_date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                aria-label="To date"
              />
              <button
                type="button"
                className="datepicker-icon"
                aria-label="Open to date picker"
                onClick={() => openDatePicker(toDateRef.current)}
              >
                <CalendarIcon />
              </button>
            </div>
          </div>
          <div className="col-xl-3 col-lg-6 mb-2">
            <NiceSelect
              options={DASHBOARD_STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              className="form-control"
            />
          </div>
        </div>
      ) : null}

      <div className="tfcl-table-listing">
        <div className="controller-sorting mb-3">
          <span className="result-text fw-7 text-color-2">
            <b>{sortedListings.length}</b>
            results found
          </span>
          <div className="sorting-input">
            <div className="label">Sort By</div>
            <NiceSelect
              options={DASHBOARD_SORT_OPTIONS}
              value={sortBy}
              onChange={setSortBy}
              className="form-control"
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Status</th>
                <th>Posting date</th>
                <th>Action</th>
              </tr>
            </thead>
            <DashboardListingTableBody
              listings={paginatedListings}
              onDelete={handleDelete}
              onSave={handleSave}
              onMarkSold={handleMarkSold}
            />
          </table>
        </div>
        {totalPages > 1 ? (
          <Pagination
            variant="tfcl"
            currentPage={effectivePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </div>
    </>
  );
}

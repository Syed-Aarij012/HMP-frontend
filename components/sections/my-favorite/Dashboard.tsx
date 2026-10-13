"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import FavoriteListingCard from "@/components/common/FavoriteListingCard";
import { useListingActions } from "@/components/common/ListingActionsContext";
import { DASHBOARD_SORT_OPTIONS } from "@/data/niceSelectOptions";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, EmptyState, NoMatches, Pager, SearchInput } from "@/components/ui/kit";

const FAVORITES_PER_PAGE = 8;

function Dashboard() {
  const { favoriteCars } = useListingActions();
  const [sortBy, setSortBy] = useState<string | number>("new");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const sortId = useId();

  const sortedFavorites = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = favoriteCars.filter((car) => !needle || `${car.title}`.toLowerCase().includes(needle));

    sorted.sort((a, b) =>
      sortBy === "old" ? a.id - b.id : b.id - a.id,
    );

    return sorted;
  }, [favoriteCars, sortBy, query]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedFavorites.length / FAVORITES_PER_PAGE),
  );

  const sortKey = `${sortBy}|${query}`;
  const [prevSortKey, setPrevSortKey] = useState(sortKey);

  if (sortKey !== prevSortKey) {
    setPrevSortKey(sortKey);
    setCurrentPage(1);
  }

  const effectivePage = Math.min(currentPage, totalPages);

  const visibleFavorites = useMemo(() => {
    const start = (effectivePage - 1) * FAVORITES_PER_PAGE;
    return sortedFavorites.slice(start, start + FAVORITES_PER_PAGE);
  }, [sortedFavorites, effectivePage]);

  return (
    <DashboardPage title="Favourites" description="Cars you've saved to come back to.">
      {favoriteCars.length === 0 ? (
        <Card>
          <EmptyState
            icon="icon-carus-heartstraight"
            title="No favourites yet"
            text="Tap the heart on any car to save it here."
            action={
              <Link href="/listing-grid" className="ha-btn is-primary">
                Browse cars
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <div className="ha-toolbar" style={{ borderBottom: 0 }}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search favourites" label="Search favourites" />
              <div className="ha-toolbar-end">
                <label className="ha-control-label" htmlFor={sortId}>
                  Sort
                  <select id={sortId} className="ha-select ha-inline-select" value={String(sortBy)} onChange={(event) => setSortBy(event.target.value)}>
                    {DASHBOARD_SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value === "new" ? "Newest first" : option.value === "old" ? "Oldest first" : option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="ha-result-count" aria-live="polite">
                  {query.trim() ? `${sortedFavorites.length} of ${favoriteCars.length} cars` : `${favoriteCars.length} car${favoriteCars.length === 1 ? "" : "s"}`}
                </span>
              </div>
            </div>
          </Card>
          {visibleFavorites.length > 0 ? (
            <div className="wrap-favorite-listing">
              {visibleFavorites.map((car) => (
                <FavoriteListingCard key={car.id} car={car} />
              ))}
            </div>
          ) : (
            <Card>
              <NoMatches onClear={() => setQuery("")} />
            </Card>
          )}
          {sortedFavorites.length > FAVORITES_PER_PAGE ? (
            <Card className="mt-4">
              <Pager page={effectivePage} lastPage={totalPages} total={sortedFavorites.length} onChange={setCurrentPage} />
            </Card>
          ) : null}
        </>
      )}
    </DashboardPage>
  );
}

export default Dashboard;

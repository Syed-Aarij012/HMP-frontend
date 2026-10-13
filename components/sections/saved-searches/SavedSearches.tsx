"use client";

import Link from "next/link";
import { useState } from "react";
import { useSavedSearches, type SavedSearch } from "@/hooks/useSavedSearches";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Badge,
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  ErrorNotice,
  LoadingTable,
  NoMatches,
  Notice,
  useListControls,
} from "@/components/ui/kit";

function describeQuery(query: Record<string, unknown>): string {
  const parts = Object.entries(query)
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => (key === "q" ? `"${String(value)}"` : `${key.replace(/_/g, " ")}: ${String(value)}`));
  return parts.length ? parts.join(", ") : "All listings";
}

/**
 * FR-B-005: manage saved searches — pause/resume, alert frequency, email opt-in (recorded as
 * consent) and delete. Every alert email also carries its own one-click unsubscribe link.
 */
function SavedSearches() {
  const { searches, loading, error, update, remove } = useSavedSearches();
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: Promise<string | null>) {
    setActionError(await action);
  }

  const controls = useListControls<SavedSearch>({
    items: searches,
    search: (search) => [describeQuery(search.query)],
    filters: [
      { key: "channel", label: "Channel", get: (search) => search.channel, format: (value) => (value === "auction" ? "Auction" : "Retail") },
      { key: "state", label: "State", allLabel: "Active and paused", get: (search) => (search.is_paused ? "paused" : "active") },
      { key: "frequency", label: "Frequency", get: (search) => search.alert_frequency },
    ],
  });

  return (
    <DashboardPage
      title="Saved searches"
      description="We check your saved searches for new listings and price drops and notify you in the app. Turn on email to also get them by email — you can unsubscribe from any email in one click."
    >
      {actionError && <Notice tone="danger">{actionError}</Notice>}
      <Card>
        {loading && <LoadingTable label="Loading your saved searches" />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && searches.length === 0 && (
          <EmptyState
            icon="icon-carus-listings"
            title="No saved searches yet"
            text={<>Search the listings and choose &quot;Save this search&quot; to get alerts.</>}
            action={
              <Link href="/listing-grid" className="ha-btn is-primary">
                Search listings
              </Link>
            }
          />
        )}

        {searches.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search your saved searches" noun="saved search" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Your saved searches">
                <thead>
                  <tr>
                    <th scope="col">Search</th>
                    <th scope="col">Alerts</th>
                    <th scope="col">Email</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((search: SavedSearch) => (
                    <tr key={search.id}>
                      <td data-label="Search">
                        <div className="ha-primary-text">{describeQuery(search.query)}</div>
                        <div className="ha-sub">{search.channel === "auction" ? "Auction" : "Retail"}</div>
                      </td>
                      <td data-label="Alerts">
                        <select
                          className="ha-select ha-inline-select"
                          aria-label="Alert frequency"
                          value={search.alert_frequency}
                          onChange={(e) => run(update(search.id, { alert_frequency: e.target.value as SavedSearch["alert_frequency"] }))}
                        >
                          <option value="instant">Instant</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </td>
                      <td data-label="Email">
                        <label className="ha-check">
                          <input type="checkbox" checked={search.email_alerts} onChange={(e) => run(update(search.id, { email_alerts: e.target.checked }))} />
                          Email me
                        </label>
                      </td>
                      <td data-label="Status">
                        <Badge tone={search.is_paused ? "neutral" : "success"}>{search.is_paused ? "Paused" : "Active"}</Badge>
                      </td>
                      <td data-label="">
                        <div className="ha-row-actions">
                          <button type="button" className="ha-btn is-sm" onClick={() => run(update(search.id, { is_paused: !search.is_paused }))}>
                            {search.is_paused ? "Resume" : "Pause"}
                          </button>
                          <button type="button" className="ha-btn is-sm is-danger" onClick={() => run(remove(search.id))}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </>
        )}
      </Card>
    </DashboardPage>
  );
}

export default SavedSearches;

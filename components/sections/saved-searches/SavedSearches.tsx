"use client";

import Link from "next/link";
import { useState } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useSavedSearches, type SavedSearch } from "@/hooks/useSavedSearches";

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

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Saved searches</h1>
                  <p className="text-color-1 mb-3">
                    We check your saved searches for new listings and price drops and notify you in
                    the app. Turn on email to also get them by email — you can unsubscribe from
                    any email in one click.
                  </p>

                  {loading && <p>Loading your saved searches...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {actionError && <div className="alert alert-danger">{actionError}</div>}

                  {!loading && !error && searches.length === 0 && (
                    <p className="tfcl-empty-data">
                      You have no saved searches yet. Search the <Link href="/listing-grid">listings</Link>{" "}
                      and choose &quot;Save this search&quot;.
                    </p>
                  )}

                  {searches.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Search</th>
                            <th>Alerts</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {searches.map((search: SavedSearch) => (
                            <tr key={search.id}>
                              <td>
                                {describeQuery(search.query)}
                                <div className="text-color-1" style={{ fontSize: 12 }}>
                                  {search.channel === "auction" ? "Auction" : "Retail"}
                                </div>
                              </td>
                              <td>
                                <select
                                  className="form-control"
                                  value={search.alert_frequency}
                                  onChange={(e) =>
                                    run(update(search.id, { alert_frequency: e.target.value as SavedSearch["alert_frequency"] }))
                                  }
                                >
                                  <option value="instant">Instant</option>
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                </select>
                              </td>
                              <td>
                                <label style={{ cursor: "pointer" }}>
                                  <input
                                    type="checkbox"
                                    checked={search.email_alerts}
                                    onChange={(e) => run(update(search.id, { email_alerts: e.target.checked }))}
                                  />{" "}
                                  Email me
                                </label>
                              </td>
                              <td>{search.is_paused ? "Paused" : "Active"}</td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                <button
                                  type="button"
                                  className="sc-button"
                                  onClick={() => run(update(search.id, { is_paused: !search.is_paused }))}
                                >
                                  <span>{search.is_paused ? "Resume" : "Pause"}</span>
                                </button>{" "}
                                <button type="button" className="sc-button" onClick={() => run(remove(search.id))}>
                                  <span>Delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

export default SavedSearches;

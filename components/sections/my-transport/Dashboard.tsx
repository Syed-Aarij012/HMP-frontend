"use client";

import { useState } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyTransportJobs } from "@/hooks/useDriverTransportJobs";
import type { TransportJob } from "@/types/postSale";

function addressLine(address: TransportJob["pickup_address"]) {
  return [address.line1, address.postcode].filter(Boolean).join(", ") || "-";
}

/**
 * FR-F-001: "consolidated multi-vehicle moves for trade buyers" — a buyer with several
 * vehicles awaiting transport (one TransportJob each, across their trade/retail orders) can
 * select two or more still-quoted/booked jobs and combine them into one trip, discounting
 * every job after the first. Previously only reachable via the raw
 * POST /transport-jobs/consolidate endpoint.
 */
export default function Dashboard() {
  const { jobs, loading, error, actionError, consolidate, consolidating } = useMyTransportJobs();
  const [selected, setSelected] = useState<number[]>([]);

  const consolidatable = jobs.filter((job) => !job.consolidation_group_id && (job.status === "quoted" || job.status === "booked"));

  function toggle(jobId: number) {
    setSelected((previous) => (previous.includes(jobId) ? previous.filter((id) => id !== jobId) : [...previous, jobId]));
  }

  async function handleConsolidate() {
    const ok = await consolidate(selected);
    if (ok) setSelected([]);
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
                  <h1 className="admin-title mb-3">My transport</h1>
                  <p className="text-color-2 mb-3">
                    Every vehicle you have booked or quoted transport for. Moving more than one at once? Select two or more
                    below to combine them into a single trip at a discount.
                  </p>

                  {loading && <p>Loading your transport...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {actionError && <div className="alert alert-danger">{actionError}</div>}

                  {!loading && !error && jobs.length === 0 && (
                    <p className="tfcl-empty-data">You have no transport booked yet.</p>
                  )}

                  {jobs.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th />
                            <th>#</th>
                            <th>Pickup</th>
                            <th>Dropoff</th>
                            <th>Status</th>
                            <th>Quote</th>
                            <th>Trip</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.map((job) => (
                            <tr key={job.id}>
                              <td>
                                {!job.consolidation_group_id && (job.status === "quoted" || job.status === "booked") && (
                                  <input
                                    type="checkbox"
                                    aria-label={`Select job #${job.id} for consolidation`}
                                    checked={selected.includes(job.id)}
                                    onChange={() => toggle(job.id)}
                                  />
                                )}
                              </td>
                              <td>{job.id}</td>
                              <td>{addressLine(job.pickup_address)}</td>
                              <td>{addressLine(job.dropoff_address)}</td>
                              <td className="text-capitalize">{job.status.replace("_", " ")}</td>
                              <td>£{Number(job.quote_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td>{job.consolidation_group_id ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {consolidatable.length >= 2 && (
                    <div className="tfcl-card p-3 mt-3" style={{ maxWidth: 420 }}>
                      <p className="mb-2">
                        {selected.length === 0
                          ? "Select two or more jobs above to combine them into one trip."
                          : `${selected.length} job${selected.length === 1 ? "" : "s"} selected.`}
                      </p>
                      <button
                        type="button"
                        className="sc-button"
                        disabled={selected.length < 2 || consolidating}
                        onClick={handleConsolidate}
                      >
                        <span>{consolidating ? "Combining..." : "Combine into one trip"}</span>
                      </button>
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

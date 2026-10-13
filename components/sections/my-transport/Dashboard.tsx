"use client";

import { useState } from "react";
import { useMyTransportJobs } from "@/hooks/useDriverTransportJobs";
import type { TransportJob } from "@/types/postSale";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Notice, LoadingTable, EmptyState, DataTable, StatusBadge, formatMoney } from "@/components/ui/kit";

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
    <DashboardPage title="My transport" description="Every vehicle you have booked or quoted transport for. Moving more than one at once? Select two or more below to combine them into a single trip at a discount.">
      {loading && <LoadingTable label="Loading your transport" />}
      {error && <Notice tone="danger">{error}</Notice>}
      {actionError && <Notice tone="danger">{actionError}</Notice>}

      {!loading && !error && jobs.length === 0 && (
        <EmptyState icon="icon-carus-map" title="No transport booked yet" text="Transport you book for vehicles you buy appears here." />
      )}

      {jobs.length > 0 && (
        <DataTable caption="Your transport jobs">
            <thead>
              <tr>
                <th scope="col"><span className="ha-visually-hidden">Select</span></th>
                <th scope="col">Job</th>
                <th scope="col">Pickup</th>
                <th scope="col">Dropoff</th>
                <th scope="col">Status</th>
                <th scope="col" className="is-num">Quote</th>
                <th scope="col">Trip</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td data-label="Select">
                    {!job.consolidation_group_id && (job.status === "quoted" || job.status === "booked") && (
                      <input
                        type="checkbox"
                        aria-label={`Select job #${job.id} for consolidation`}
                        checked={selected.includes(job.id)}
                        onChange={() => toggle(job.id)}
                      />
                    )}
                  </td>
                  <td data-label="Job" className="ha-num">#{job.id}</td>
                  <td data-label="Pickup">{addressLine(job.pickup_address)}</td>
                  <td data-label="Dropoff">{addressLine(job.dropoff_address)}</td>
                  <td data-label="Status"><StatusBadge status={job.status} /></td>
                  <td data-label="Quote" className="is-num">{formatMoney(Number(job.quote_amount), { pence: true })}</td>
                  <td data-label="Trip">{job.consolidation_group_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
      )}

      {consolidatable.length >= 2 && (
        <div className="ha-card ha-card-body ha-row-actions" style={{ justifyContent: "space-between" }} role="region" aria-label="Combine jobs">
          <p className="mb-0" aria-live="polite">
            {selected.length === 0
              ? "Select two or more jobs above to combine them into one trip."
              : `${selected.length} job${selected.length === 1 ? "" : "s"} selected.`}
          </p>
          <button
            type="button"
            className="ha-btn is-primary"
            disabled={selected.length < 2 || consolidating}
            onClick={handleConsolidate}
          >{consolidating ? "Combining…" : "Combine into one trip"}</button>
        </div>
      )}
    </DashboardPage>
  );
}

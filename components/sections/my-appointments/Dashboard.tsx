"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyAppointments } from "@/hooks/useAppointments";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  ErrorNotice,
  LoadingTable,
  NoMatches,
  Notice,
  StatusBadge,
  formatDate,
  useListControls,
} from "@/components/ui/kit";
import type { Appointment } from "@/types/marketplaceTools";

export default function Dashboard() {
  const { appointments, loading, error, actionError, busyId, cancel, markOutcome } = useMyAppointments();
  const hasDealerSide = appointments.some((appointment) => appointment.isDealerSide);
  // Captured once at mount: whether a booking's time has passed decides if it can be marked
  // completed / a no-show (the backend rejects either before the scheduled time).
  const [now] = useState(() => Date.now());
  const controls = useListControls<Appointment>({
    items: appointments,
    search: (appointment) => [appointment.listing?.vehicleLabel, appointment.buyerName],
    filters: [
      { key: "status", label: "Status", get: (appointment) => appointment.status },
      {
        key: "when",
        label: "Timing",
        get: (appointment) => (new Date(appointment.scheduledAt).getTime() > now ? "upcoming" : "past"),
        options: [
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past" },
        ],
      },
    ],
    sorts: [
      { value: "soonest", label: "Soonest first", compare: (a, b) => a.scheduledAt.localeCompare(b.scheduledAt) },
      { value: "latest", label: "Latest first", compare: (a, b) => b.scheduledAt.localeCompare(a.scheduledAt) },
    ],
  });

  return (
    <DashboardPage
      title="My appointments"
      description={hasDealerSide ? "Test drives booked on your listings, and any you have booked yourself." : "Test drives and dealer visits you have booked."}
    >
      {actionError && <Notice tone="danger">{actionError}</Notice>}
      <Card>
        {loading && <LoadingTable label="Loading your appointments" />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && appointments.length === 0 && (
          <EmptyState icon="icon-carus-clock" title="No appointments booked" text="Test drives you book, or that buyers book on your listings, appear here." />
        )}

        {appointments.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder={hasDealerSide ? "Search by vehicle or buyer" : "Search by vehicle"} noun="appointment" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Your appointments">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    {hasDealerSide && <th scope="col">Booked by</th>}
                    <th scope="col">When</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((appointment) => {
                    const isPast = new Date(appointment.scheduledAt).getTime() <= now;
                    const busy = busyId === appointment.id;
                    return (
                      <tr key={appointment.id}>
                        <td data-label="Vehicle" className="ha-primary-text">
                          {appointment.listing?.vehicleLabel ?? "—"}
                        </td>
                        {hasDealerSide && (
                          <td data-label="Booked by">
                            {appointment.isDealerSide ? (
                              <>
                                {appointment.buyerName ?? "—"}
                                {appointment.buyerNoShows ? (
                                  <div className="ha-inline-error">
                                    {appointment.buyerNoShows} previous no-show{appointment.buyerNoShows > 1 ? "s" : ""}
                                  </div>
                                ) : null}
                              </>
                            ) : (
                              <span className="ha-muted">You</span>
                            )}
                          </td>
                        )}
                        <td data-label="When" className="ha-num">
                          {formatDate(appointment.scheduledAt, { time: true })}
                        </td>
                        <td data-label="Status">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td data-label="">
                          <div className="ha-row-actions">
                            {appointment.status === "booked" && appointment.isDealerSide && isPast && (
                              <>
                                <button type="button" className="ha-btn is-sm is-primary" disabled={busy} onClick={() => markOutcome(appointment.id, "complete")}>
                                  Mark completed
                                </button>
                                <button type="button" className="ha-btn is-sm" disabled={busy} onClick={() => markOutcome(appointment.id, "no-show")}>
                                  Mark no-show
                                </button>
                              </>
                            )}
                            {appointment.status === "booked" && !isPast && (
                              <button type="button" className="ha-btn is-sm is-danger" disabled={busy} onClick={() => cancel(appointment.id)}>
                                Cancel
                              </button>
                            )}
                            {appointment.listing && (
                              <Link href={`/listing-detail-v4/${appointment.listing.id}`} className="ha-btn is-sm is-ghost">
                                View listing
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
            )}
          </>
        )}
      </Card>
    </DashboardPage>
  );
}

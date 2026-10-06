"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyAppointments } from "@/hooks/useAppointments";

export default function Dashboard() {
  const { appointments, loading, error, actionError, busyId, cancel, markOutcome } = useMyAppointments();
  const hasDealerSide = appointments.some((appointment) => appointment.isDealerSide);
  // Captured once at mount: whether a booking's time has passed decides if it can be marked
  // completed / a no-show (the backend rejects either before the scheduled time).
  const [now] = useState(() => Date.now());

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My appointments</h1>
                  <p className="text-color-2 mb-3">
                    {hasDealerSide
                      ? "Test drives booked on your listings, and any you have booked yourself."
                      : "Test drives and dealer visits you have booked."}
                  </p>

                  {loading && <p>Loading your appointments...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {actionError && <div className="alert alert-danger">{actionError}</div>}

                  {!loading && !error && appointments.length === 0 && (
                    <p className="tfcl-empty-data">You have no appointments booked.</p>
                  )}

                  {appointments.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            {hasDealerSide && <th>Booked by</th>}
                            <th>When</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map((appointment) => (
                            <tr key={appointment.id}>
                              <td>{appointment.listing?.vehicleLabel ?? "-"}</td>
                              {hasDealerSide && (
                                <td>
                                  {appointment.isDealerSide ? (
                                    <>
                                      {appointment.buyerName ?? "-"}
                                      {appointment.buyerNoShows ? (
                                        <div className="fs-13 text-danger">
                                          {appointment.buyerNoShows} previous no-show{appointment.buyerNoShows > 1 ? "s" : ""}
                                        </div>
                                      ) : null}
                                    </>
                                  ) : (
                                    <span className="text-color-2">You</span>
                                  )}
                                </td>
                              )}
                              <td>{new Date(appointment.scheduledAt).toLocaleString()}</td>
                              <td className="text-capitalize">{appointment.status.replace("_", "-")}</td>
                              <td className="flex gap-10">
                                {appointment.listing && (
                                  <Link href={`/listing-detail-v4/${appointment.listing.id}`} className="sc-button">
                                    <span>View listing</span>
                                  </Link>
                                )}
                                {appointment.status === "booked" &&
                                  appointment.isDealerSide &&
                                  new Date(appointment.scheduledAt).getTime() <= now && (
                                    <>
                                      <button
                                        type="button"
                                        className="sc-button"
                                        disabled={busyId === appointment.id}
                                        onClick={() => markOutcome(appointment.id, "complete")}
                                      >
                                        <span>Mark completed</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="sc-button"
                                        disabled={busyId === appointment.id}
                                        onClick={() => markOutcome(appointment.id, "no-show")}
                                      >
                                        <span>Mark no-show</span>
                                      </button>
                                    </>
                                  )}
                                {appointment.status === "booked" && new Date(appointment.scheduledAt).getTime() > now && (
                                  <button
                                    type="button"
                                    className="sc-button"
                                    disabled={busyId === appointment.id}
                                    onClick={() => cancel(appointment.id)}
                                  >
                                    <span>Cancel</span>
                                  </button>
                                )}
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

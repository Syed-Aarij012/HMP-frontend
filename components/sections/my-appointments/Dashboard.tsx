"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyAppointments } from "@/hooks/useAppointments";

export default function Dashboard() {
  const { appointments, loading, error, actionError, busyId, cancel } = useMyAppointments();

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
                  <p className="text-color-1 mb-3">Test drives and dealer visits you have booked.</p>

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
                            <th>When</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map((appointment) => (
                            <tr key={appointment.id}>
                              <td>{appointment.listing?.vehicleLabel ?? "-"}</td>
                              <td>{new Date(appointment.scheduledAt).toLocaleString()}</td>
                              <td className="text-capitalize">{appointment.status.replace("_", " ")}</td>
                              <td className="flex gap-10">
                                {appointment.listing && (
                                  <Link href={`/listing-detail-v4/${appointment.listing.id}`} className="sc-button">
                                    <span>View listing</span>
                                  </Link>
                                )}
                                {appointment.status === "booked" && (
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

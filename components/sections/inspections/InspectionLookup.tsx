"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useInspectionAssignments } from "@/hooks/useInspectionAssignments";

/**
 * SRS §2.2 P6: "write access limited to assigned inspection tasks" — the inspector's work list.
 * Each task is a vehicle a Quality Supervisor has assigned to them; there's no way to open one
 * that isn't (the API refuses it as well).
 */
export default function InspectionLookup() {
  const { assignments, loading, error } = useInspectionAssignments("assigned");

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-2">My inspections</h1>
                  <p className="text-color-2 mb-3">The vehicles assigned to you. Open one to capture it and write its condition report.</p>

                  {loading && <p>Loading your tasks...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {!loading && !error && assignments.length === 0 && (
                    <p className="tfcl-empty-data">Nothing is assigned to you right now. A Quality Supervisor assigns inspections.</p>
                  )}

                  {assignments.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Registration</th>
                            <th>Assigned</th>
                            <th>Note</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((task) => (
                            <tr key={task.id}>
                              <td>{task.vehicle.title || "Vehicle"}</td>
                              <td>{task.vehicle.vrm ?? "-"}</td>
                              <td>{task.assigned_at ? new Date(task.assigned_at).toLocaleDateString("en-GB") : "-"}{task.assigned_by ? ` by ${task.assigned_by}` : ""}</td>
                              <td>{task.note ?? ""}</td>
                              <td>
                                <Link href={`/inspections/${task.vehicle.id}`} className="sc-button">
                                  <span>Inspect</span>
                                </Link>
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

"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyConsignedLots } from "@/hooks/useMyConsignedLots";

function Dashboard() {
  const { lots, loading, error } = useMyConsignedLots();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My consigned vehicles</h1>

                  {loading && <p>Loading your consigned vehicles...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && lots.length === 0 && (
                    <p className="tfcl-empty-data">
                      You haven&apos;t consigned any vehicles to auction yet.{" "}
                      <Link href="/consign-vehicle">Consign one now</Link>.
                    </p>
                  )}

                  {!loading && !error && lots.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Sale</th>
                            <th>Status</th>
                            <th>Current price</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {lots.map((lot) => (
                            <tr key={lot.id}>
                              <td>
                                {lot.vehicle
                                  ? [lot.vehicle.year, lot.vehicle.make, lot.vehicle.model]
                                      .filter(Boolean)
                                      .join(" ")
                                  : "-"}
                              </td>
                              <td>{lot.saleName ?? "-"}</td>
                              <td className="text-capitalize">{lot.status.replace("_", " ")}</td>
                              <td>{lot.currentPrice !== null ? `£${lot.currentPrice.toLocaleString()}` : "-"}</td>
                              <td>
                                <Link href={`/auction/${lot.id}`} className="sc-button">
                                  <span>View lot</span>
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

export default Dashboard;

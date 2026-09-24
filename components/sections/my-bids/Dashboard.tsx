"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyBids } from "@/hooks/useMyBids";

function Dashboard() {
  const { bids, loading, error } = useMyBids();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My bids</h1>

                  {loading && <p>Loading your bids...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && bids.length === 0 && (
                    <p className="tfcl-empty-data">You haven&apos;t placed any bids yet.</p>
                  )}

                  {!loading && !error && bids.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Your bid</th>
                            <th>Current price</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {bids.map((bid) => (
                            <tr key={bid.id}>
                              <td>{bid.vehicleLabel ?? "-"}</td>
                              <td>£{bid.amount.toLocaleString()}</td>
                              <td>
                                {bid.currentPrice !== null ? `£${bid.currentPrice.toLocaleString()}` : "-"}
                                {bid.isLeading && " (you're leading)"}
                              </td>
                              <td className="text-capitalize">{bid.lotStatus?.replace("_", " ") ?? "-"}</td>
                              <td>
                                {bid.lotId && (
                                  <Link href={`/auction/${bid.lotId}`} className="sc-button">
                                    <span>View lot</span>
                                  </Link>
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

export default Dashboard;

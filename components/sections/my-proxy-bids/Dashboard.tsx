"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyProxyBids } from "@/hooks/useMyProxyBids";
import { useExposure } from "@/hooks/useExposure";

function Dashboard() {
  const { proxyBids, loading, error } = useMyProxyBids();
  const { exposure } = useExposure();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My proxy bids</h1>
                  <p className="text-color-1 mb-3">
                    Your armed proxy maxima are confidential — even to you, once lodged — so
                    only their status and the lot they&apos;re on show here. Your aggregate
                    exposure against them is on{" "}
                    <Link href="/my-exposure">My exposure</Link>
                    {exposure && ` (currently £${exposure.committedExposure.toLocaleString()} committed).`}
                  </p>

                  {loading && <p>Loading your proxy bids...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && proxyBids.length === 0 && (
                    <p className="tfcl-empty-data">You haven&apos;t lodged any proxy bids yet.</p>
                  )}

                  {!loading && !error && proxyBids.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Lot status</th>
                            <th>Current price</th>
                            <th>Proxy status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {proxyBids.map((proxy) => (
                            <tr key={proxy.id}>
                              <td>{proxy.vehicleLabel ?? "-"}</td>
                              <td className="text-capitalize">{proxy.lotStatus?.replace("_", " ") ?? "-"}</td>
                              <td>{proxy.currentPrice !== null ? `£${proxy.currentPrice.toLocaleString()}` : "-"}</td>
                              <td className="text-capitalize">{proxy.status}</td>
                              <td>
                                {proxy.lotId && (
                                  <Link href={`/auction/${proxy.lotId}`} className="sc-button">
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

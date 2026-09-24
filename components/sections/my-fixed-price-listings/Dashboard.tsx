"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyTradeFixedPriceListings } from "@/hooks/useMyTradeFixedPriceListings";

function Dashboard() {
  const { listings, loading, error } = useMyTradeFixedPriceListings();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My fixed-price listings</h1>

                  {loading && <p>Loading your listings...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && listings.length === 0 && (
                    <p className="tfcl-empty-data">
                      You haven&apos;t listed any vehicles at a fixed price yet.{" "}
                      <Link href="/list-fixed-price">List one now</Link>.
                    </p>
                  )}

                  {!loading && !error && listings.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Status</th>
                            <th>Asking price</th>
                            <th>Buyer&apos;s premium</th>
                            <th>Sold at</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listings.map((listing) => (
                            <tr key={listing.id}>
                              <td>
                                {listing.vehicle
                                  ? [listing.vehicle.year, listing.vehicle.make, listing.vehicle.model]
                                      .filter(Boolean)
                                      .join(" ")
                                  : "-"}
                              </td>
                              <td className="text-capitalize">{listing.status}</td>
                              <td>£{listing.askingPrice.toLocaleString()}</td>
                              <td>{listing.buyersPremium !== null ? `£${listing.buyersPremium.toLocaleString()}` : "-"}</td>
                              <td>{listing.soldAt ? new Date(listing.soldAt).toLocaleDateString() : "-"}</td>
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

"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useTradeOrders } from "@/hooks/useTradeOrders";

function Dashboard() {
  const { tradeOrders, loading, error } = useTradeOrders();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My trade orders</h1>

                  {loading && <p>Loading your trade orders...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && tradeOrders.length === 0 && (
                    <p className="tfcl-empty-data">You haven&apos;t won any lots yet.</p>
                  )}

                  {!loading && !error && tradeOrders.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Hammer price</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {tradeOrders.map((order) => (
                            <tr key={order.id}>
                              <td>
                                {order.vehicle
                                  ? [order.vehicle.year, order.vehicle.make, order.vehicle.model]
                                      .filter(Boolean)
                                      .join(" ")
                                  : "-"}
                              </td>
                              <td>£{order.hammerPrice.toLocaleString()}</td>
                              <td className="text-capitalize">{order.status.replace("_", " ")}</td>
                              <td>
                                <Link href={`/my-trade-orders/${order.id}`} className="sc-button">
                                  <span>View</span>
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

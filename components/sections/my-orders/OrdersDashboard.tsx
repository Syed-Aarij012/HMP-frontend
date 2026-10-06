"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyRetailOrders } from "@/hooks/useDirectBuy";

const STATUS_LABELS: Record<string, string> = {
  deposit_held: "Cooling-off active",
  cancelled_cooling_off: "Cancelled",
  confirmed: "Confirmed — balance due",
  paid: "Paid in full",
};

export default function OrdersDashboard() {
  const { orders, loading, error } = useMyRetailOrders();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My orders</h1>
                  <p className="text-color-2 mb-3">Vehicles you&apos;ve bought outright with a holding deposit.</p>

                  {loading && <p>Loading your orders...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {!loading && !error && orders.length === 0 && (
                    <p className="tfcl-empty-data">You haven&apos;t bought anything yet.</p>
                  )}

                  {orders.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Price</th>
                            <th>Deposit</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order.publicId}>
                              <td>{order.car?.title ?? "-"}</td>
                              <td>{order.car ? `£${order.car.price.toLocaleString()}` : "-"}</td>
                              <td>£{order.depositAmount.toLocaleString()}</td>
                              <td>{STATUS_LABELS[order.status] ?? order.status}</td>
                              <td>
                                <Link href={`/my-orders/${order.publicId}`} className="sc-button">
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

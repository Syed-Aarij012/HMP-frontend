"use client";

import Link from "next/link";
import { useState } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useTradeOrder } from "@/hooks/useTradeOrder";

export default function TradeOrderDetail({ id }: { id: number }) {
  const { tradeOrder, loading, error, payError, paying, pay } = useTradeOrder(id);
  const [notice, setNotice] = useState<string | null>(null);

  async function handlePay() {
    setNotice(null);
    try {
      await pay();
      setNotice("Payment received.");
    } catch {
      // payError already surfaces the reason from the server.
    }
  }

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  {loading && <p>Loading this trade order...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && tradeOrder && (
                    <>
                      <h1 className="admin-title mb-1">
                        {tradeOrder.vehicle
                          ? [tradeOrder.vehicle.year, tradeOrder.vehicle.make, tradeOrder.vehicle.model, tradeOrder.vehicle.derivative]
                              .filter(Boolean)
                              .join(" ")
                          : `Trade order #${tradeOrder.id}`}
                      </h1>
                      <p className="text-color-1 mb-3">
                        <Link href={`/auction/${tradeOrder.lotId}`}>View lot</Link> &middot; Status:{" "}
                        <span className="text-capitalize">{tradeOrder.status.replace("_", " ")}</span>
                      </p>

                      {notice && <div className="alert alert-success mb-3">{notice}</div>}
                      {payError && <div className="alert alert-danger mb-3">{payError}</div>}

                      <div className="table-responsive mb-4">
                        <table className="table">
                          <tbody>
                            <tr><td>Hammer price</td><td>£{tradeOrder.hammerPrice.toLocaleString()}</td></tr>
                            {tradeOrder.feeLines.map((line) => (
                              <tr key={line.feeType}>
                                <td className="text-capitalize">{line.feeType.replace(/_/g, " ")}</td>
                                <td>£{line.amount.toLocaleString()}{line.vatAmount > 0 && ` (+£${line.vatAmount.toLocaleString()} VAT)`}</td>
                              </tr>
                            ))}
                            {tradeOrder.invoice && (
                              <tr className="fw-6">
                                <td>Total owed</td>
                                <td>£{tradeOrder.invoice.total.toLocaleString()}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {tradeOrder.status === "pending_payment" && (
                        <button type="button" className="sc-button" disabled={paying} onClick={handlePay}>
                          <span>{paying ? "Paying..." : `Pay £${tradeOrder.invoice?.total.toLocaleString() ?? tradeOrder.hammerPrice.toLocaleString()}`}</span>
                        </button>
                      )}

                      {tradeOrder.status === "paid" && (
                        <p className="tfcl-empty-data">
                          Paid{tradeOrder.paidAt ? ` on ${new Date(tradeOrder.paidAt).toLocaleDateString()}` : ""}.
                          {tradeOrder.transportJobStatus
                            ? ` Transport: ${tradeOrder.transportJobStatus.replace(/_/g, " ")}.`
                            : " No transport has been booked yet."}
                        </p>
                      )}
                    </>
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

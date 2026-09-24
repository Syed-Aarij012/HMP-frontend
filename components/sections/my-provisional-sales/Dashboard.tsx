"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useProvisionalSales } from "@/hooks/useProvisionalSales";
import type { ProvisionalSale } from "@/types/auction";

function SellerDecisionRow({
  sale,
  submitting,
  onDecide,
}: {
  sale: ProvisionalSale;
  submitting: boolean;
  onDecide: (id: number, decision: "accept" | "decline" | "counter", counterAmount?: string) => void;
}) {
  const [counterAmount, setCounterAmount] = useState("");

  function handleCounter(event: FormEvent) {
    event.preventDefault();
    onDecide(sale.id, "counter", counterAmount);
  }

  return (
    <tr>
      <td>{sale.vehicleLabel ?? "-"}</td>
      <td>{sale.highestBidAmount !== null ? `£${sale.highestBidAmount.toLocaleString()}` : "-"}</td>
      <td>{sale.reservePrice !== null ? `£${sale.reservePrice.toLocaleString()}` : "Not shown"}</td>
      <td>
        {sale.isAwaitingSeller ? (
          <div className="flex gap-10" style={{ flexDirection: "column" }}>
            <div className="flex gap-10">
              <button type="button" className="sc-button" disabled={submitting} onClick={() => onDecide(sale.id, "accept")}>
                <span>Accept £{sale.highestBidAmount?.toLocaleString()}</span>
              </button>
              <button type="button" className="sc-button" disabled={submitting} onClick={() => onDecide(sale.id, "decline")}>
                <span>Decline</span>
              </button>
            </div>
            <form onSubmit={handleCounter} className="flex gap-10">
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="Counter amount (£)"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                required
              />
              <button type="submit" className="sc-button" disabled={submitting}>
                <span>Counter</span>
              </button>
            </form>
          </div>
        ) : (
          <span className="text-capitalize">
            {sale.sellerDecision === "counter"
              ? `Countered at £${sale.counterAmount?.toLocaleString()} — ${sale.buyerResponse ?? "awaiting buyer"}`
              : sale.sellerDecision}
          </span>
        )}
      </td>
      <td>
        <Link href={`/auction/${sale.lotId}`} className="sc-button">
          <span>View lot</span>
        </Link>
      </td>
    </tr>
  );
}

function BuyerResponseRow({
  sale,
  submitting,
  onRespond,
}: {
  sale: ProvisionalSale;
  submitting: boolean;
  onRespond: (id: number, response: "accepted" | "declined") => void;
}) {
  return (
    <tr>
      <td>{sale.vehicleLabel ?? "-"}</td>
      <td>{sale.highestBidAmount !== null ? `£${sale.highestBidAmount.toLocaleString()}` : "-"}</td>
      <td className="text-capitalize">{sale.sellerDecision}</td>
      <td>
        {sale.isAwaitingBuyer ? (
          <div className="flex gap-10">
            <span className="fw-6">Counter: £{sale.counterAmount?.toLocaleString()}</span>
            <button type="button" className="sc-button" disabled={submitting} onClick={() => onRespond(sale.id, "accepted")}>
              <span>Accept</span>
            </button>
            <button type="button" className="sc-button" disabled={submitting} onClick={() => onRespond(sale.id, "declined")}>
              <span>Decline</span>
            </button>
          </div>
        ) : (
          <span className="text-capitalize">
            {sale.sellerDecision === "pending" ? "Awaiting seller decision" : sale.buyerResponse ?? "-"}
          </span>
        )}
      </td>
      <td>
        <Link href={`/auction/${sale.lotId}`} className="sc-button">
          <span>View lot</span>
        </Link>
      </td>
    </tr>
  );
}

function Dashboard() {
  const seller = useProvisionalSales("seller");
  const buyer = useProvisionalSales("buyer");

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Provisional sales</h1>
                  <p className="text-color-1 mb-3">
                    When a lot you consign hammers below reserve, it lands here for you to
                    accept, decline, or counter — and when you&apos;re the highest bidder on a
                    lot like that, any counter-offer you need to respond to shows up here too.
                  </p>

                  <h4 className="mb-2">On vehicles I&apos;ve consigned</h4>
                  {seller.loading && <p>Loading...</p>}
                  {seller.error && <div className="alert alert-danger">{seller.error}</div>}
                  {seller.actionError && <div className="alert alert-danger mb-3">{seller.actionError}</div>}
                  {!seller.loading && !seller.error && seller.sales.length === 0 && (
                    <p className="tfcl-empty-data mb-4">No provisional sales awaiting your decision.</p>
                  )}
                  {!seller.loading && !seller.error && seller.sales.length > 0 && (
                    <div className="table-responsive mb-4">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Highest bid</th>
                            <th>Reserve</th>
                            <th>Decision</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {seller.sales.map((sale) => (
                            <SellerDecisionRow key={sale.id} sale={sale} submitting={seller.submitting} onDecide={seller.decide} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h4 className="mb-2">Where I&apos;m the highest bidder</h4>
                  {buyer.loading && <p>Loading...</p>}
                  {buyer.error && <div className="alert alert-danger">{buyer.error}</div>}
                  {buyer.actionError && <div className="alert alert-danger mb-3">{buyer.actionError}</div>}
                  {!buyer.loading && !buyer.error && buyer.sales.length === 0 && (
                    <p className="tfcl-empty-data">No provisional sales on lots you&apos;ve bid on.</p>
                  )}
                  {!buyer.loading && !buyer.error && buyer.sales.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Your bid</th>
                            <th>Seller decision</th>
                            <th />
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {buyer.sales.map((sale) => (
                            <BuyerResponseRow key={sale.id} sale={sale} submitting={buyer.submitting} onRespond={buyer.respond} />
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

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useOffers } from "@/hooks/useOffers";
import type { Offer } from "@/types/marketplaceTools";

function OfferRow({
  offer,
  busy,
  onRespond,
}: {
  offer: Offer;
  busy: boolean;
  onRespond: (id: number, action: "accept" | "decline" | "counter", amount?: string) => void;
}) {
  const [counterAmount, setCounterAmount] = useState("");
  const isOpen = offer.status === "pending" || (offer.status === "countered" && offer.isAwaitingBuyer);

  function handleCounter(event: FormEvent) {
    event.preventDefault();
    onRespond(offer.id, "counter", counterAmount);
  }

  return (
    <tr>
      <td>{offer.listing?.vehicleLabel ?? "-"}</td>
      <td>
        £{offer.amount.toLocaleString()}
        {offer.partExchange && (
          <div className="fs-13 text-color-2">
            + part-exchange
            {offer.partExchange.low !== null && offer.partExchange.high !== null
              ? ` (£${Math.round(offer.partExchange.low).toLocaleString()}–£${Math.round(offer.partExchange.high).toLocaleString()})`
              : " (to be appraised)"}
          </div>
        )}
      </td>
      <td>{offer.expiresAt ? new Date(offer.expiresAt).toLocaleDateString() : "-"}</td>
      <td>
        {isOpen ? (
          <div className="flex gap-10" style={{ flexDirection: "column" }}>
            <div className="flex gap-10">
              <button type="button" className="sc-button" disabled={busy} onClick={() => onRespond(offer.id, "accept")}>
                <span>Accept</span>
              </button>
              <button type="button" className="sc-button" disabled={busy} onClick={() => onRespond(offer.id, "decline")}>
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
              <button type="submit" className="sc-button" disabled={busy}>
                <span>Counter</span>
              </button>
            </form>
          </div>
        ) : (
          <span className="text-capitalize">{offer.status}</span>
        )}
      </td>
      <td>
        {offer.listing && (
          <Link href={`/listing-detail-v4/${offer.listing.id}`} className="sc-button">
            <span>View listing</span>
          </Link>
        )}
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const { offers, loading, error, actionError, busyId, respond } = useOffers();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My offers</h1>
                  <p className="text-color-2 mb-3">
                    Offers you have made, and offers made on your own listings — accept, decline or counter.
                  </p>

                  {loading && <p>Loading your offers...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {actionError && <div className="alert alert-danger">{actionError}</div>}

                  {!loading && !error && offers.length === 0 && (
                    <p className="tfcl-empty-data">You have no offers yet.</p>
                  )}

                  {offers.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Amount</th>
                            <th>Expires</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {offers.map((offer) => (
                            <OfferRow
                              key={offer.id}
                              offer={offer}
                              busy={busyId === offer.id}
                              onRespond={(id, action, amount) => respond(id, action, amount)}
                            />
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

"use client";

import { useState } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useBuyTradeFixedPriceListing } from "@/hooks/useBuyTradeFixedPriceListing";
import { useTradeFixedPriceListings } from "@/hooks/useTradeFixedPriceListings";

/**
 * FR-A-030 (M): the Fixed-Price Trade ("Buy Now") marketplace — a trade buyer purchases a
 * consigned vehicle instantly at the consignor's asking price, no bidding.
 */
function TradeMarketplace() {
  const { listings, loading, error, reload } = useTradeFixedPriceListings();
  const { buy, submitting, error: buyError } = useBuyTradeFixedPriceListing();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  async function handleBuy(listingId: string) {
    setBuyingId(listingId);
    setConfirmation(null);
    try {
      await buy(listingId);
      setConfirmation(`Purchase confirmed. See "My trade orders" for next steps.`);
      reload();
    } catch {
      // buyError from the hook already carries the server's reason.
    } finally {
      setBuyingId(null);
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
                  <h1 className="admin-title mb-3">Trade marketplace — Buy Now</h1>
                  <p className="text-color-1 mb-3">
                    Fixed-price trade stock — purchase instantly at the seller&apos;s asking
                    price, no bidding.
                  </p>

                  {loading && <p>Loading listings...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {buyError && <div className="alert alert-danger">{buyError}</div>}
                  {confirmation && <div className="alert alert-success">{confirmation}</div>}

                  {!loading && !error && listings.length === 0 && (
                    <p className="tfcl-empty-data">No fixed-price listings are available right now.</p>
                  )}

                  {!loading && !error && listings.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Mileage</th>
                            <th>Condition grade</th>
                            <th>Asking price</th>
                            <th />
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
                              <td>{listing.vehicle ? `${listing.vehicle.mileage.toLocaleString()} mi` : "-"}</td>
                              <td>{listing.conditionReport?.conditionGrade ?? "-"}</td>
                              <td>£{listing.askingPrice.toLocaleString()}</td>
                              <td>
                                <button
                                  type="button"
                                  className="sc-button"
                                  disabled={submitting && buyingId === listing.id}
                                  onClick={() => handleBuy(listing.id)}
                                >
                                  <span>{submitting && buyingId === listing.id ? "Buying..." : "Buy now"}</span>
                                </button>
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

export default TradeMarketplace;

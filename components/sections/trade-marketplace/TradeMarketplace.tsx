"use client";

import { useState } from "react";
import { can, useAuth } from "@/contexts/AuthContext";
import { useBuyTradeFixedPriceListing } from "@/hooks/useBuyTradeFixedPriceListing";
import { useTradeFixedPriceListings } from "@/hooks/useTradeFixedPriceListings";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Badge,
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  ErrorNotice,
  LoadingTable,
  NoMatches,
  Notice,
  formatMoney,
  useListControls,
} from "@/components/ui/kit";
import type { TradeFixedPriceListing } from "@/types/tradeFixedPrice";

const vehicleName = (listing: TradeFixedPriceListing) =>
  listing.vehicle ? [listing.vehicle.year, listing.vehicle.make, listing.vehicle.model].filter(Boolean).join(" ") : "—";

/**
 * FR-A-030 (M): the Fixed-Price Trade ("Buy Now") marketplace — a trade buyer purchases a
 * consigned vehicle instantly at the consignor's asking price, no bidding.
 */
function TradeMarketplace() {
  const { listings, loading, error, reload } = useTradeFixedPriceListings();
  // §2.2 P3/P4: buying trade stock is for funded trade buyers; other catalog viewers only browse.
  const { user } = useAuth();
  const canBuy = can(user, "place-bid");
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

  const controls = useListControls<TradeFixedPriceListing>({
    items: listings,
    search: (listing) => [vehicleName(listing)],
    filters: [
      { key: "make", label: "Make", get: (listing) => listing.vehicle?.make ?? null, format: (value) => value },
      { key: "grade", label: "Condition grade", get: (listing) => (listing.conditionReport?.conditionGrade != null ? String(listing.conditionReport.conditionGrade) : null), format: (value) => `Grade ${value}` },
    ],
    sorts: [
      { value: "price-low", label: "Lowest price", compare: (a, b) => a.askingPrice - b.askingPrice },
      { value: "price-high", label: "Highest price", compare: (a, b) => b.askingPrice - a.askingPrice },
      { value: "mileage", label: "Lowest mileage", compare: (a, b) => (a.vehicle?.mileage ?? Infinity) - (b.vehicle?.mileage ?? Infinity) },
    ],
  });

  return (
    <DashboardPage title="Trade marketplace" description="Fixed-price trade stock — buy instantly at the seller's asking price, no bidding.">
      {buyError && <Notice tone="danger">{buyError}</Notice>}
      {confirmation && <Notice tone="success">{confirmation}</Notice>}

      <Card>
        {loading && <LoadingTable label="Loading listings" />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && listings.length === 0 && (
          <EmptyState icon="icon-carus-car" title="Nothing for sale right now" text="No fixed-price listings are available right now." />
        )}

        {!loading && !error && listings.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search make or model" noun="vehicle" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Fixed-price trade listings">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col" className="is-num">Mileage</th>
                    <th scope="col">Condition</th>
                    <th scope="col" className="is-num">Asking price</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((listing) => (
                    <tr key={listing.id}>
                      <td data-label="Vehicle" className="ha-primary-text">
                        {vehicleName(listing)}
                      </td>
                      <td data-label="Mileage" className="is-num">
                        {listing.vehicle ? `${listing.vehicle.mileage.toLocaleString("en-GB")} mi` : "—"}
                      </td>
                      <td data-label="Condition">
                        {listing.conditionReport?.conditionGrade != null ? <Badge plain>Grade {listing.conditionReport.conditionGrade}</Badge> : "—"}
                      </td>
                      <td data-label="Asking price" className="is-num ha-primary-text">
                        {formatMoney(listing.askingPrice)}
                      </td>
                      <td data-label="" className="ha-right">
                        {canBuy ? (
                          <button
                            type="button"
                            className="ha-btn is-sm is-primary"
                            disabled={submitting && buyingId === listing.id}
                            aria-busy={submitting && buyingId === listing.id}
                            onClick={() => handleBuy(listing.id)}
                          >
                            {submitting && buyingId === listing.id ? "Buying…" : "Buy now"}
                          </button>
                        ) : (
                          <span className="ha-sub">View only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </>
        )}
      </Card>
    </DashboardPage>
  );
}

export default TradeMarketplace;

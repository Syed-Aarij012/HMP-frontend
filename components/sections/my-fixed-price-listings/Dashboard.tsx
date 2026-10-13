"use client";

import Link from "next/link";
import { useMyTradeFixedPriceListings } from "@/hooks/useMyTradeFixedPriceListings";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  ErrorNotice,
  LoadingTable,
  NoMatches,
  StatusBadge,
  formatDate,
  formatMoney,
  useListControls,
} from "@/components/ui/kit";
import type { TradeFixedPriceListing } from "@/types/tradeFixedPrice";

const vehicleName = (listing: TradeFixedPriceListing) =>
  listing.vehicle ? [listing.vehicle.year, listing.vehicle.make, listing.vehicle.model].filter(Boolean).join(" ") : "—";

function Dashboard() {
  const { listings, loading, error } = useMyTradeFixedPriceListings();
  const controls = useListControls<TradeFixedPriceListing>({
    items: listings,
    search: (listing) => [vehicleName(listing)],
    filters: [{ key: "status", label: "Status", get: (listing) => listing.status }],
    sorts: [
      { value: "recent", label: "Newest first", compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
      { value: "price", label: "Highest price", compare: (a, b) => b.askingPrice - a.askingPrice },
    ],
  });

  return (
    <DashboardPage
      title="My fixed-price listings"
      description="Vehicles you've offered to the trade at a fixed Buy Now price."
      actions={
        <Link href="/list-fixed-price" className="ha-btn is-primary">
          <i className="icon-carus-plus" aria-hidden="true" />
          List a vehicle
        </Link>
      }
    >
      <Card>
        {loading && <LoadingTable label="Loading your listings" columns={5} />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && listings.length === 0 && (
          <EmptyState
            icon="icon-carus-car"
            title="No fixed-price listings yet"
            text="You haven't listed any vehicles at a fixed price yet."
            action={
              <Link href="/list-fixed-price" className="ha-btn is-primary">
                List one now
              </Link>
            }
          />
        )}

        {!loading && !error && listings.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search by vehicle" noun="listing" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Your fixed-price listings">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="is-num">Asking price</th>
                    <th scope="col" className="is-num">Buyer&apos;s premium</th>
                    <th scope="col">Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((listing) => (
                    <tr key={listing.id}>
                      <td data-label="Vehicle" className="ha-primary-text">
                        {vehicleName(listing)}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={listing.status} />
                      </td>
                      <td data-label="Asking price" className="is-num">
                        {formatMoney(listing.askingPrice)}
                      </td>
                      <td data-label="Buyer's premium" className="is-num">
                        {listing.buyersPremium !== null ? formatMoney(listing.buyersPremium) : "—"}
                      </td>
                      <td data-label="Sold">{listing.soldAt ? formatDate(listing.soldAt) : "—"}</td>
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

export default Dashboard;

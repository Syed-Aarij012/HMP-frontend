"use client";

import Link from "next/link";
import { useMyBids } from "@/hooks/useMyBids";
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
  StatusBadge,
  formatMoney,
  useListControls,
} from "@/components/ui/kit";
import type { MyBid } from "@/types/auction";

function Dashboard() {
  const { bids, loading, error } = useMyBids();
  const controls = useListControls<MyBid>({
    items: bids,
    search: (bid) => [bid.vehicleLabel, bid.saleName],
    filters: [
      { key: "status", label: "Lot status", get: (bid) => bid.lotStatus },
      { key: "leading", label: "Position", allLabel: "Any position", get: (bid) => (bid.isLeading ? "leading" : "not_leading"), options: [{ value: "leading", label: "Leading" }, { value: "not_leading", label: "Not leading" }] },
    ],
    sorts: [
      { value: "recent", label: "Most recent", compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
      { value: "amount", label: "Highest bid", compare: (a, b) => b.amount - a.amount },
    ],
  });

  return (
    <DashboardPage title="My bids" description="Every bid you've placed, and whether you're still in front.">
      <Card>
        {loading && <LoadingTable label="Loading your bids" />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && bids.length === 0 && (
          <EmptyState
            icon="icon-carus-checkcircle"
            title="You haven't placed any bids yet"
            text="Bids you place in the auction catalogue appear here."
            action={
              <Link href="/auction" className="ha-btn is-primary">
                Browse the auction catalogue
              </Link>
            }
          />
        )}

        {!loading && !error && bids.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search by vehicle or sale" noun="bid" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Your bids">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col" className="is-num">Your bid</th>
                    <th scope="col" className="is-num">Current price</th>
                    <th scope="col">Lot status</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((bid) => (
                    <tr key={bid.id}>
                      <td data-label="Vehicle">
                        <div className="ha-primary-text">{bid.vehicleLabel ?? "—"}</div>
                        {bid.saleName && <div className="ha-sub">{bid.saleName}</div>}
                      </td>
                      <td data-label="Your bid" className="is-num">
                        {formatMoney(bid.amount)}
                      </td>
                      <td data-label="Current price" className="is-num">
                        {bid.currentPrice !== null ? formatMoney(bid.currentPrice) : "—"}
                        {bid.isLeading && (
                          <div>
                            <Badge tone="success">You&apos;re leading</Badge>
                          </div>
                        )}
                      </td>
                      <td data-label="Lot status">
                        <StatusBadge status={bid.lotStatus} />
                      </td>
                      <td data-label="" className="ha-right">
                        {bid.lotId && (
                          <Link href={`/auction/${bid.lotId}`} className="ha-btn is-sm">
                            View lot
                          </Link>
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

export default Dashboard;

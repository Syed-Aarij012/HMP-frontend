"use client";

import Link from "next/link";
import { useMyProxyBids } from "@/hooks/useMyProxyBids";
import { useExposure } from "@/hooks/useExposure";
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
  formatMoney,
  useListControls,
} from "@/components/ui/kit";
import type { MyProxyBid } from "@/types/auction";

function Dashboard() {
  const { proxyBids, loading, error } = useMyProxyBids();
  const { exposure } = useExposure();
  const controls = useListControls<MyProxyBid>({
    items: proxyBids,
    search: (proxy) => [proxy.vehicleLabel, proxy.saleName],
    filters: [
      { key: "status", label: "Proxy status", get: (proxy) => proxy.status },
      { key: "lot", label: "Lot status", get: (proxy) => proxy.lotStatus },
    ],
    sorts: [
      { value: "recent", label: "Most recent", compare: (a, b) => (b.lodgedAt ?? "").localeCompare(a.lodgedAt ?? "") },
      { value: "price", label: "Highest current price", compare: (a, b) => (b.currentPrice ?? 0) - (a.currentPrice ?? 0) },
    ],
  });

  return (
    <DashboardPage
      title="My proxy bids"
      description={
        <>
          Your armed proxy maxima are confidential — even to you, once lodged — so only their status and the lot
          they&apos;re on show here. Your aggregate exposure against them is on <Link href="/my-exposure">My exposure</Link>
          {exposure && ` (currently ${formatMoney(exposure.committedExposure)} committed).`}
        </>
      }
    >
      <Card>
        {loading && <LoadingTable label="Loading your proxy bids" />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && proxyBids.length === 0 && (
          <EmptyState icon="icon-carus-sliders" title="No proxy bids yet" text="Proxy bids you lodge on auction lots will appear here." />
        )}

        {!loading && !error && proxyBids.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search by vehicle or sale" noun="proxy bid" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Your proxy bids">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Lot status</th>
                    <th scope="col" className="is-num">Current price</th>
                    <th scope="col">Proxy status</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((proxy) => (
                    <tr key={proxy.id}>
                      <td data-label="Vehicle">
                        <div className="ha-primary-text">{proxy.vehicleLabel ?? "—"}</div>
                        {proxy.saleName && <div className="ha-sub">{proxy.saleName}</div>}
                      </td>
                      <td data-label="Lot status">
                        <StatusBadge status={proxy.lotStatus} />
                      </td>
                      <td data-label="Current price" className="is-num">
                        {proxy.currentPrice !== null ? formatMoney(proxy.currentPrice) : "—"}
                      </td>
                      <td data-label="Proxy status">
                        <StatusBadge status={proxy.status} />
                      </td>
                      <td data-label="" className="ha-right">
                        {proxy.lotId && (
                          <Link href={`/auction/${proxy.lotId}`} className="ha-btn is-sm">
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

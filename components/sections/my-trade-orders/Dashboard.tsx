"use client";

import Link from "next/link";
import { useTradeOrders } from "@/hooks/useTradeOrders";
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
import type { TradeOrder } from "@/types/auction";

const vehicleName = (order: TradeOrder) =>
  order.vehicle ? [order.vehicle.year, order.vehicle.make, order.vehicle.model].filter(Boolean).join(" ") : "—";

function Dashboard() {
  const { tradeOrders, loading, error } = useTradeOrders();
  const controls = useListControls<TradeOrder>({
    items: tradeOrders,
    search: (order) => [vehicleName(order)],
    filters: [{ key: "status", label: "Status", get: (order) => order.status }],
    sorts: [
      { value: "recent", label: "Most recent", compare: (a, b) => b.id - a.id },
      { value: "price", label: "Highest hammer price", compare: (a, b) => b.hammerPrice - a.hammerPrice },
    ],
  });

  return (
    <DashboardPage title="My trade orders" description="Lots you've won at auction — pay, arrange transport and collect your documents.">
      <Card>
        {loading && <LoadingTable label="Loading your trade orders" />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && tradeOrders.length === 0 && (
          <EmptyState icon="icon-carus-checkcircle" title="No trade orders yet" text="Lots you win at auction will appear here." />
        )}

        {!loading && !error && tradeOrders.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search by vehicle" noun="order" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Your trade orders">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col" className="is-num">Hammer price</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((order) => (
                    <tr key={order.id}>
                      <td data-label="Vehicle" className="ha-primary-text">
                        {vehicleName(order)}
                      </td>
                      <td data-label="Hammer price" className="is-num">
                        {formatMoney(order.hammerPrice)}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={order.status} />
                      </td>
                      <td data-label="" className="ha-right">
                        <Link href={`/my-trade-orders/${order.id}`} className="ha-btn is-sm">
                          View order
                        </Link>
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

"use client";

import Link from "next/link";
import { useMyRetailOrders } from "@/hooks/useDirectBuy";
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
  type Tone,
} from "@/components/ui/kit";

const STATUS_LABELS: Record<string, string> = {
  deposit_held: "Cooling-off active",
  cancelled_cooling_off: "Cancelled",
  confirmed: "Confirmed — balance due",
  paid: "Paid in full",
};

const STATUS_TONES: Record<string, Tone> = {
  deposit_held: "warning",
  cancelled_cooling_off: "danger",
  confirmed: "warning",
  paid: "success",
};

type RetailOrder = ReturnType<typeof useMyRetailOrders>["orders"][number];

export default function OrdersDashboard() {
  const { orders, loading, error } = useMyRetailOrders();
  const controls = useListControls<RetailOrder>({
    items: orders,
    search: (order) => [order.car?.title],
    filters: [{ key: "status", label: "Status", get: (order) => order.status, format: (value) => STATUS_LABELS[value] ?? value.replace(/_/g, " ") }],
  });

  return (
    <DashboardPage title="My orders" description="Vehicles you've bought outright with a holding deposit.">
      <Card>
        {loading && <LoadingTable label="Loading your orders" />}
        {error && <ErrorNotice message={error} />}
        {!loading && !error && orders.length === 0 && (
          <EmptyState icon="icon-carus-car" title="No orders yet" text="Cars you reserve or buy outright will appear here." />
        )}

        {orders.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search by vehicle" noun="order" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Your orders">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col" className="is-num">Price</th>
                    <th scope="col" className="is-num">Deposit</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((order) => (
                    <tr key={order.publicId}>
                      <td data-label="Vehicle" className="ha-primary-text">
                        {order.car?.title ?? "—"}
                      </td>
                      <td data-label="Price" className="is-num">
                        {order.car ? formatMoney(order.car.price) : "—"}
                      </td>
                      <td data-label="Deposit" className="is-num">
                        {formatMoney(order.depositAmount)}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={order.status} label={STATUS_LABELS[order.status]} tone={STATUS_TONES[order.status]} />
                      </td>
                      <td data-label="" className="ha-right">
                        <Link href={`/my-orders/${order.publicId}`} className="ha-btn is-sm">
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

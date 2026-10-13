"use client";

import Link from "next/link";
import { useState } from "react";
import { useTradeOrder } from "@/hooks/useTradeOrder";
import PostSalePanel from "./PostSalePanel";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, LoadingRows, Notice, StatusBadge, formatDate, formatMoney } from "@/components/ui/kit";

export default function TradeOrderDetail({ id }: { id: number }) {
  const { tradeOrder, loading, error, payError, paying, pay, reload } = useTradeOrder(id);
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

  const title = tradeOrder
    ? tradeOrder.vehicle
      ? [tradeOrder.vehicle.year, tradeOrder.vehicle.make, tradeOrder.vehicle.model, tradeOrder.vehicle.derivative].filter(Boolean).join(" ")
      : `Trade order #${tradeOrder.id}`
    : "Trade order";

  return (
    <DashboardPage
      eyebrow={<Link href="/my-trade-orders">← My trade orders</Link>}
      title={title}
      description={
        tradeOrder ? (
          <>
            <StatusBadge status={tradeOrder.status} /> · <Link href={`/auction/${tradeOrder.lotId}`}>View lot</Link>
          </>
        ) : undefined
      }
    >
      {loading && <LoadingRows label="Loading this trade order" />}
      {error && <Notice tone="danger">{error}</Notice>}

      {!loading && !error && tradeOrder && (
        <>
          {notice && <Notice tone="success">{notice}</Notice>}
          {payError && <Notice tone="danger">{payError}</Notice>}

          <Card
            className="mb-4"
            title="What you owe"
            actions={
              tradeOrder.status === "pending_payment" ? (
                <button type="button" className="ha-btn is-primary" disabled={paying} aria-busy={paying} onClick={handlePay}>
                  {paying ? "Paying…" : `Pay ${formatMoney(tradeOrder.invoice?.total ?? tradeOrder.hammerPrice)}`}
                </button>
              ) : tradeOrder.status === "paid" ? (
                <Badge tone="success">Paid{tradeOrder.paidAt ? ` on ${formatDate(tradeOrder.paidAt)}` : ""}</Badge>
              ) : undefined
            }
          >
            <DataTable caption="Charges on this trade order" stacked={false}>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col" className="is-num">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Hammer price</td>
                  <td className="is-num">{formatMoney(tradeOrder.hammerPrice)}</td>
                </tr>
                {tradeOrder.feeLines.map((line) => (
                  <tr key={line.feeType}>
                    <td className="text-capitalize">{line.feeType.replace(/_/g, " ")}</td>
                    <td className="is-num">
                      {formatMoney(line.amount)}
                      {line.vatAmount > 0 && <span className="ha-sub"> (+{formatMoney(line.vatAmount)} VAT)</span>}
                    </td>
                  </tr>
                ))}
                {tradeOrder.invoice && (
                  <tr>
                    <td className="ha-primary-text">Total owed</td>
                    <td className="is-num ha-primary-text">{formatMoney(tradeOrder.invoice.total)}</td>
                  </tr>
                )}
              </tbody>
            </DataTable>
          </Card>

          {tradeOrder.status === "paid" && (
            <div className="ha-card ha-card-body">
              <PostSalePanel order={tradeOrder} onChanged={reload} />
            </div>
          )}
        </>
      )}
    </DashboardPage>
  );
}

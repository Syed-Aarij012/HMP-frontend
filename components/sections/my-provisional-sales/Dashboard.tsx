"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useProvisionalSales } from "@/hooks/useProvisionalSales";
import type { ProvisionalSale } from "@/types/auction";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, EmptyState, ErrorNotice, LoadingTable, Notice, StatusBadge, formatMoney } from "@/components/ui/kit";

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
  const counterId = useId();

  function handleCounter(event: FormEvent) {
    event.preventDefault();
    onDecide(sale.id, "counter", counterAmount);
  }

  return (
    <tr>
      <td data-label="Vehicle" className="ha-primary-text">
        {sale.vehicleLabel ?? "—"}
      </td>
      <td data-label="Highest bid" className="is-num">
        {sale.highestBidAmount !== null ? formatMoney(sale.highestBidAmount) : "—"}
      </td>
      <td data-label="Reserve" className="is-num">
        {sale.reservePrice !== null ? formatMoney(sale.reservePrice) : <span className="ha-sub">Not shown</span>}
      </td>
      <td data-label="Decision">
        {sale.isAwaitingSeller ? (
          <div style={{ minWidth: 260 }}>
            <Badge tone="warning">Awaiting your decision</Badge>
            <div className="ha-row-actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
              <button type="button" className="ha-btn is-sm is-primary" disabled={submitting} onClick={() => onDecide(sale.id, "accept")}>
                Accept {formatMoney(sale.highestBidAmount)}
              </button>
              <button type="button" className="ha-btn is-sm is-danger" disabled={submitting} onClick={() => onDecide(sale.id, "decline")}>
                Decline
              </button>
            </div>
            <form onSubmit={handleCounter} className="ha-row-actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
              <label htmlFor={counterId} className="ha-visually-hidden">
                Counter amount in pounds
              </label>
              <input
                id={counterId}
                type="number"
                step="0.01"
                min="0"
                className="ha-input"
                style={{ height: 30, maxWidth: 150 }}
                placeholder="Counter (£)"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                required
              />
              <button type="submit" className="ha-btn is-sm" disabled={submitting}>
                Counter
              </button>
            </form>
          </div>
        ) : sale.sellerDecision === "counter" ? (
          <span>
            Countered at <b>{formatMoney(sale.counterAmount)}</b> — <StatusBadge status={sale.buyerResponse ?? "awaiting buyer"} tone={sale.buyerResponse ? undefined : "warning"} />
          </span>
        ) : (
          <StatusBadge status={sale.sellerDecision} />
        )}
      </td>
      <td data-label="" className="ha-right">
        <Link href={`/auction/${sale.lotId}`} className="ha-btn is-sm is-ghost">
          View lot
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
      <td data-label="Vehicle" className="ha-primary-text">
        {sale.vehicleLabel ?? "—"}
      </td>
      <td data-label="Your bid" className="is-num">
        {sale.highestBidAmount !== null ? formatMoney(sale.highestBidAmount) : "—"}
      </td>
      <td data-label="Seller decision">
        <StatusBadge status={sale.sellerDecision} />
      </td>
      <td data-label="Your response">
        {sale.isAwaitingBuyer ? (
          <div className="ha-row-actions" style={{ justifyContent: "flex-start" }}>
            <span className="ha-primary-text">Counter: {formatMoney(sale.counterAmount)}</span>
            <button type="button" className="ha-btn is-sm is-primary" disabled={submitting} onClick={() => onRespond(sale.id, "accepted")}>
              Accept
            </button>
            <button type="button" className="ha-btn is-sm is-danger" disabled={submitting} onClick={() => onRespond(sale.id, "declined")}>
              Decline
            </button>
          </div>
        ) : sale.sellerDecision === "pending" ? (
          <Badge tone="warning">Awaiting seller decision</Badge>
        ) : (
          <StatusBadge status={sale.buyerResponse} />
        )}
      </td>
      <td data-label="" className="ha-right">
        <Link href={`/auction/${sale.lotId}`} className="ha-btn is-sm is-ghost">
          View lot
        </Link>
      </td>
    </tr>
  );
}

function Dashboard() {
  const seller = useProvisionalSales("seller");
  const buyer = useProvisionalSales("buyer");
  const sellerWaiting = seller.sales.filter((sale) => sale.isAwaitingSeller).length;
  const buyerWaiting = buyer.sales.filter((sale) => sale.isAwaitingBuyer).length;

  return (
    <DashboardPage
      title="Provisional sales"
      description="When a lot you consign hammers below reserve, it lands here for you to accept, decline, or counter — and when you're the highest bidder on a lot like that, any counter-offer you need to respond to shows up here too."
    >
      <Card
        className="mb-4"
        title="On vehicles I've consigned"
        actions={sellerWaiting > 0 ? <Badge tone="warning">{sellerWaiting} need your decision</Badge> : undefined}
      >
        {seller.loading && <LoadingTable label="Loading provisional sales" />}
        {seller.error && <ErrorNotice message={seller.error} />}
        {seller.actionError && (
          <div className="ha-card-body" style={{ paddingBottom: 0 }}>
            <Notice tone="danger">{seller.actionError}</Notice>
          </div>
        )}
        {!seller.loading && !seller.error && seller.sales.length === 0 && (
          <EmptyState icon="icon-carus-pending" title="Nothing to decide" text="No provisional sales awaiting your decision." />
        )}
        {!seller.loading && !seller.error && seller.sales.length > 0 && (
          <DataTable caption="Provisional sales on vehicles you consigned">
            <thead>
              <tr>
                <th scope="col">Vehicle</th>
                <th scope="col" className="is-num">Highest bid</th>
                <th scope="col" className="is-num">Reserve</th>
                <th scope="col">Decision</th>
                <th scope="col">
                  <span className="ha-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {seller.sales.map((sale) => (
                <SellerDecisionRow key={sale.id} sale={sale} submitting={seller.submitting} onDecide={seller.decide} />
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      <Card
        title="Where I'm the highest bidder"
        actions={buyerWaiting > 0 ? <Badge tone="warning">{buyerWaiting} need your response</Badge> : undefined}
      >
        {buyer.loading && <LoadingTable label="Loading provisional sales" />}
        {buyer.error && <ErrorNotice message={buyer.error} />}
        {buyer.actionError && (
          <div className="ha-card-body" style={{ paddingBottom: 0 }}>
            <Notice tone="danger">{buyer.actionError}</Notice>
          </div>
        )}
        {!buyer.loading && !buyer.error && buyer.sales.length === 0 && (
          <EmptyState icon="icon-carus-checkcircle" title="Nothing to respond to" text="No provisional sales on lots you've bid on." />
        )}
        {!buyer.loading && !buyer.error && buyer.sales.length > 0 && (
          <DataTable caption="Provisional sales where you are the highest bidder">
            <thead>
              <tr>
                <th scope="col">Vehicle</th>
                <th scope="col" className="is-num">Your bid</th>
                <th scope="col">Seller decision</th>
                <th scope="col">Your response</th>
                <th scope="col">
                  <span className="ha-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {buyer.sales.map((sale) => (
                <BuyerResponseRow key={sale.id} sale={sale} submitting={buyer.submitting} onRespond={buyer.respond} />
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </DashboardPage>
  );
}

export default Dashboard;

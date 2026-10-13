"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useOffers } from "@/hooks/useOffers";
import type { Offer } from "@/types/marketplaceTools";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  ErrorNotice,
  LoadingTable,
  NoMatches,
  Notice,
  StatusBadge,
  formatDate,
  formatMoney,
  useListControls,
} from "@/components/ui/kit";

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
  const counterId = useId();

  function handleCounter(event: FormEvent) {
    event.preventDefault();
    onRespond(offer.id, "counter", counterAmount);
  }

  return (
    <tr>
      <td data-label="Vehicle">
        <div className="ha-primary-text">{offer.listing?.vehicleLabel ?? "—"}</div>
        {offer.listing && <div className="ha-sub">Asking {formatMoney(offer.listing.price)}</div>}
      </td>
      <td data-label="Offer" className="is-num">
        <div className="ha-primary-text">{formatMoney(offer.amount)}</div>
        {offer.partExchange && (
          <div className="ha-sub">
            + part-exchange
            {offer.partExchange.low !== null && offer.partExchange.high !== null
              ? ` (${formatMoney(Math.round(offer.partExchange.low))}–${formatMoney(Math.round(offer.partExchange.high))})`
              : " (to be appraised)"}
          </div>
        )}
      </td>
      <td data-label="Expires">{offer.expiresAt ? formatDate(offer.expiresAt) : "—"}</td>
      <td data-label="Status">
        <StatusBadge status={offer.status} label={isOpen ? "Awaiting your response" : undefined} tone={isOpen ? "warning" : undefined} />
      </td>
      <td data-label="">
        {isOpen ? (
          <div className="ha-stack" style={{ minWidth: 260 }}>
            <div className="ha-row-actions">
              <button type="button" className="ha-btn is-sm is-primary" disabled={busy} aria-busy={busy} onClick={() => onRespond(offer.id, "accept")}>
                Accept
              </button>
              <button type="button" className="ha-btn is-sm is-danger" disabled={busy} onClick={() => onRespond(offer.id, "decline")}>
                Decline
              </button>
            </div>
            <form onSubmit={handleCounter} className="ha-row-actions" style={{ marginTop: 8 }}>
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
              <button type="submit" className="ha-btn is-sm" disabled={busy}>
                Counter
              </button>
            </form>
          </div>
        ) : (
          offer.listing && (
            <div className="ha-row-actions">
              <Link href={`/listing-detail-v4/${offer.listing.id}`} className="ha-btn is-sm">
                View listing
              </Link>
            </div>
          )
        )}
        {isOpen && offer.listing && (
          <div className="ha-row-actions" style={{ marginTop: 8 }}>
            <Link href={`/listing-detail-v4/${offer.listing.id}`} className="ha-link-btn">
              View listing
            </Link>
          </div>
        )}
      </td>
    </tr>
  );
}

const isAwaiting = (offer: Offer) => offer.status === "pending" || (offer.status === "countered" && offer.isAwaitingBuyer);

export default function Dashboard() {
  const { offers, loading, error, actionError, busyId, respond } = useOffers();
  const controls = useListControls<Offer>({
    items: offers,
    search: (offer) => [offer.listing?.vehicleLabel, offer.amount],
    filters: [
      { key: "status", label: "Status", get: (offer) => offer.status },
      {
        key: "action",
        label: "Needs action",
        get: (offer) => (isAwaiting(offer) ? "yes" : "no"),
        options: [
          { value: "yes", label: "Needs your response" },
          { value: "no", label: "No action needed" },
        ],
      },
    ],
    sorts: [
      { value: "action", label: "Needs action first", compare: (a, b) => Number(isAwaiting(b)) - Number(isAwaiting(a)) },
      { value: "expiry", label: "Expiring soonest", compare: (a, b) => (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999") },
      { value: "amount", label: "Highest amount", compare: (a, b) => b.amount - a.amount },
    ],
  });

  return (
    <DashboardPage title="My offers" description="Offers you have made, and offers made on your own listings — accept, decline or counter.">
      {actionError && <Notice tone="danger">{actionError}</Notice>}
      <Card>
        {loading && <LoadingTable label="Loading your offers" columns={5} />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && offers.length === 0 && (
          <EmptyState icon="icon-carus-pending" title="No offers yet" text="Offers you make, or receive on your listings, will appear here." />
        )}

        {offers.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search by vehicle" noun="offer" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Your offers">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col" className="is-num">Offer</th>
                    <th scope="col">Expires</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((offer) => (
                    <OfferRow key={offer.id} offer={offer} busy={busyId === offer.id} onRespond={(id, action, amount) => respond(id, action, amount)} />
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

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import ConditionReportSection from "./ConditionReportSection";
import LotCountdown from "./LotCountdown";
import MediaGallery from "./MediaGallery";
import { useAuctionLot } from "@/hooks/useAuctionLot";
import { useServerClock } from "@/hooks/useServerClock";
import { useFeeEstimate } from "@/hooks/useFeeEstimate";
import { useStepUp } from "@/hooks/useStepUp";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, downloadFile } from "@/lib/api-client";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, EmptyState, LoadingRows, Notice, StatusBadge, formatDate } from "@/components/ui/kit";

// NFR-S-005 / EnsureStepUpVerified: bids at/above this need a fresh 2FA code on top of the
// standing session. Mirrors config('step_up.thresholds.bid_amount')'s default — there's no
// endpoint exposing the live config value, so this is a display/UX threshold only; the
// backend is the actual source of truth and will 428 regardless of what this checks.
const STEP_UP_THRESHOLD = 10000;

function formatPrice(amount: number | null) {
  if (amount === null) return "No bids yet";
  return `£${amount.toLocaleString()}`;
}

function money(amount: number) {
  return `£${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function TotalCostCalculator({ lotId, amount }: { lotId: string; amount: string }) {
  const { estimate, loading, error } = useFeeEstimate(lotId, amount);

  if (!amount) {
    return <p className="ha-sub mb-0">Enter an amount to see the full cost breakdown.</p>;
  }

  if (loading) return <p className="ha-sub mb-0" role="status">Calculating…</p>;
  if (error) return <Notice tone="danger">{error}</Notice>;
  if (!estimate) return null;

  return (
    <table className="ha-table ha-proration">
      <caption className="ha-visually-hidden">Full cost if you win at this price</caption>
      <tbody>
        <tr><td>Hammer price</td><td className="is-num">{money(estimate.hammerPrice)}</td></tr>
        <tr><td>Buyer&apos;s premium</td><td className="is-num">{money(estimate.buyersPremium)}</td></tr>
        <tr><td>VAT on premium</td><td className="is-num">{money(estimate.vatOnPremium)}</td></tr>
        {estimate.vatStatus === "qualifying" && (
          <tr><td>VAT on vehicle (qualifying)</td><td className="is-num">{money(estimate.vehicleVat)}</td></tr>
        )}
        {estimate.isHmpAssured && (
          <tr><td>HMP Assured fee</td><td className="is-num">{money(estimate.assuranceFee)}</td></tr>
        )}
        <tr><td>Indicative transport (open, running)</td><td className="is-num">{money(estimate.transportEstimate)}</td></tr>
        <tr className="ha-primary-text">
          <td>Total if you win at this price</td>
          <td className="is-num">{money(estimate.totalWithTransport)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function StepUpPrompt({
  onVerified,
  onCancel,
}: {
  onVerified: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const { submitting, error, verify } = useStepUp();
  const [code, setCode] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await verify(code);
      onVerified();
    } catch {
      // error already surfaced by the hook
    }
  }

  if (!user?.mfa_enabled) {
    return (
      <Notice tone="danger">
        Bids of £{STEP_UP_THRESHOLD.toLocaleString()} or more need a fresh two-factor code, and
        you haven&apos;t enrolled yet. <Link href="/security">Enable two-factor authentication</Link>{" "}
        first, then try again.
        <div className="mt-2">
          <button type="button" className="ha-btn is-sm" onClick={onCancel}>Cancel</button>
        </div>
      </Notice>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ha-card ha-card-body ha-form-card mb-4">
      <h2 className="hd-card-title">Step-up verification required</h2>
      <p className="ha-muted mb-2">Enter a fresh code from your authenticator app to confirm this bid.</p>
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="ha-field">
        <label htmlFor="stepup-code" className="ha-visually-hidden">6-digit code</label>
        <input
          id="stepup-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="ha-input"
          style={{ maxWidth: 200, letterSpacing: 4, fontSize: 18 }}
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <div className="ha-actions is-start">
        <button type="submit" className="ha-btn is-primary" disabled={submitting}>{submitting ? "Verifying…" : "Verify and continue"}</button>
        <button type="button" className="ha-btn is-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function LotDetail({ publicId }: { publicId: string }) {
  const { lot, peerBenchmark, bids, snapshot, loading, error, actionError, submitting, live, connectionDropped, latencyDegraded, placeBid, placeProxyBid, retractBid } =
    useAuctionLot(publicId);
  const { offsetMs } = useServerClock();
  const [bidAmount, setBidAmount] = useState("");
  const [proxyAmount, setProxyAmount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingBid, setConfirmingBid] = useState(false);
  const [confirmingProxy, setConfirmingProxy] = useState(false);
  const [stepUpFor, setStepUpFor] = useState<"bid" | "proxy" | null>(null);
  const [integrityAcknowledged, setIntegrityAcknowledged] = useState(false);

  const isBiddable = lot?.status === "open" || lot?.status === "in_lane";
  const isConcluded = lot !== null && ["hammered", "provisional", "not_sold", "withdrawn", "settled"].includes(lot.status);
  // FR-D-035: bidding never depends on the live channel, but a bidder on a degraded
  // connection must be warned before we accept another tap — either because the WebSocket
  // itself dropped, or because the server has told us our own measured round-trip latency
  // to the lot crossed its threshold (a live socket says nothing about that on its own).
  const connectionDegraded = isBiddable && (connectionDropped || latencyDegraded);
  const nextBid = snapshot?.nextBid ?? null;
  const closesAt = snapshot?.closesAt ?? lot?.closesAt ?? null;

  async function handleDownloadBidLog() {
    if (!lot) return;
    setNotice(null);
    try {
      await downloadFile(`/auction/lots/${lot.id}/bid-log?format=csv`, `bid-log-${lot.id}.csv`);
    } catch {
      setNotice("The bid log could not be downloaded right now.");
    }
  }

  async function submitBid() {
    setNotice(null);
    try {
      await placeBid(bidAmount);
      setBidAmount("");
      setNotice("Bid placed.");
      setStepUpFor(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 428) {
        setStepUpFor("bid");
      }
    }
  }

  async function submitProxy() {
    setNotice(null);
    try {
      await placeProxyBid(proxyAmount);
      setProxyAmount("");
      setNotice("Proxy bid lodged.");
      setStepUpFor(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 428) {
        setStepUpFor("proxy");
      }
    }
  }

  function handleBidSubmit(event: FormEvent) {
    event.preventDefault();
    if (connectionDegraded && !integrityAcknowledged) {
      setIntegrityAcknowledged(true);
      return;
    }
    if (Number(bidAmount) >= STEP_UP_THRESHOLD && !confirmingBid) {
      setConfirmingBid(true);
      return;
    }
    setConfirmingBid(false);
    setIntegrityAcknowledged(false);
    submitBid();
  }

  function handleProxySubmit(event: FormEvent) {
    event.preventDefault();
    if (Number(proxyAmount) >= STEP_UP_THRESHOLD && !confirmingProxy) {
      setConfirmingProxy(true);
      return;
    }
    setConfirmingProxy(false);
    submitProxy();
  }

  async function handleRetract(bidId: number) {
    setNotice(null);
    try {
      await retractBid(bidId, "bidder_error");
      setNotice("Bid retracted.");
    } catch {
      // actionError already surfaces the reason from the server.
    }
  }

  const title = lot?.vehicle
    ? [lot.vehicle.year, lot.vehicle.make, lot.vehicle.model, lot.vehicle.derivative].filter(Boolean).join(" ")
    : "Lot";

  return (
    <DashboardPage
      eyebrow={<Link href="/auction">← Auction catalogue</Link>}
      title={lot ? title : "Lot"}
      description={
        lot ? (
          <span className="ha-chips" style={{ alignItems: "center" }}>
            {lot.saleName && <span>{lot.saleName}</span>}
            <StatusBadge status={lot.status} />
            {lot.isHmpAssured && (
              <Badge tone="primary" plain>
                HMP Assured
              </Badge>
            )}
            <Badge tone={live ? "success" : "neutral"}>{live ? "Live" : "Connecting…"}</Badge>
          </span>
        ) : undefined
      }
    >
      {loading && <LoadingRows rows={5} label="Loading this lot" />}
      {error && <Notice tone="danger">{error}</Notice>}

      {!loading && !error && lot && (
        <>
          {snapshot?.laneStatus === "paused" && (
            <Notice tone="warning">This lane is paused by the auctioneer. Bidding resumes when they restart it.</Notice>
          )}

          {connectionDegraded && (
            <Notice tone="danger">
              {connectionDropped
                ? "Live updates dropped, so the price shown may be out of date. You can still bid, but check the latest price first. We refresh it every few seconds."
                : "Your connection to the auction is slow right now, so the price shown may be a moment behind. You can still bid, but check the latest price first."}
            </Notice>
          )}

          <div className="ha-lot-layout">
            <div className="ha-stack">
              {lot.vehicle && (
                <Card title="Vehicle">
                  <div className="ha-card-body">
                    <dl className="ha-dl">
                      <div>
                        <dt>Mileage</dt>
                        <dd className="ha-num">{lot.vehicle.mileage.toLocaleString("en-GB")} mi</dd>
                      </div>
                      <div>
                        <dt>Fuel</dt>
                        <dd className="text-capitalize">{lot.vehicle.fuelType}</dd>
                      </div>
                      <div>
                        <dt>Transmission</dt>
                        <dd className="text-capitalize">{lot.vehicle.transmission}</dd>
                      </div>
                      {lot.vehicle.colour && (
                        <div>
                          <dt>Colour</dt>
                          <dd className="text-capitalize">{lot.vehicle.colour}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </Card>
              )}

              <div className="hd-template-section">
                <MediaGallery vehicle={lot.vehicle} />
              </div>

              {lot.conditionReport && (
                <div className="hd-template-section">
                  <ConditionReportSection report={lot.conditionReport} vehicle={lot.vehicle} />
                </div>
              )}

              {peerBenchmark && peerBenchmark.sample_size >= 2 && (
                <Notice tone="info">
                  Dealers like you retail this derivative in {peerBenchmark.avg_days_to_retail} days at{" "}
                  {peerBenchmark.avg_margin !== undefined && peerBenchmark.avg_margin >= 0 ? "+" : ""}
                  £{peerBenchmark.avg_margin?.toLocaleString("en-GB")} margin, on average (based on {peerBenchmark.sample_size} comparable deals).
                </Notice>
              )}
            </div>

            <div className="ha-lot-panel ha-stack">
              <section className="ha-card" aria-label="Bidding">
                <div className="ha-card-body">
                  <span className="ha-eyebrow">Current price</span>
                  {/* UX-003: screen-reader announcement on bid events — this region's
                      text only changes when the price/leader actually changes, so it
                      self-limits to real events instead of firing on every poll. */}
                  <div role="status" aria-live="polite">
                    <div className="ha-rostrum-price ha-num mb-1">{formatPrice(snapshot?.currentPrice ?? lot.currentPrice)}</div>
                    {snapshot?.isLeading && isBiddable && <Badge tone="success">You&apos;re the highest bidder</Badge>}
                  </div>
                  <div className="mt-3">
                    <LotCountdown closesAt={closesAt} offsetMs={offsetMs} />
                  </div>
                  <dl className="ha-dl mt-3">
                    {isBiddable && nextBid && (
                      <div>
                        <dt>Next minimum bid</dt>
                        <dd className="ha-num">
                          £{nextBid.minimum.toLocaleString("en-GB")} <span className="ha-sub">(+£{nextBid.increment.toLocaleString("en-GB")})</span>
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Reserve</dt>
                      <dd>
                        {lot.reservePrice !== null ? (
                          `£${lot.reservePrice.toLocaleString("en-GB")}`
                        ) : lot.reserveMet === null ? (
                          <span className="ha-muted">Not visible to you</span>
                        ) : lot.reserveMet ? (
                          <Badge tone="success">Met</Badge>
                        ) : (
                          <Badge tone="warning">Not met</Badge>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>

              {notice && <Notice tone="success">{notice}</Notice>}
              {actionError && stepUpFor === null && <Notice tone="danger">{actionError}</Notice>}

              {stepUpFor && (
                <StepUpPrompt onCancel={() => setStepUpFor(null)} onVerified={() => (stepUpFor === "bid" ? submitBid() : submitProxy())} />
              )}

              <Card title="Place a bid">
                <form onSubmit={handleBidSubmit} className="ha-card-body">
                  <div className="ha-field">
                    <label htmlFor="lot-bid-amount">Bid amount (£)</label>
                    <div className="ha-actions is-start" style={{ flexWrap: "nowrap" }}>
                      <input
                        id="lot-bid-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="ha-input"
                        value={bidAmount}
                        onChange={(e) => {
                          setBidAmount(e.target.value);
                          setConfirmingBid(false);
                        }}
                        required
                      />
                      {isBiddable && nextBid && (
                        <button
                          type="button"
                          className="ha-btn"
                          onClick={() => {
                            setBidAmount(String(nextBid.minimum));
                            setConfirmingBid(false);
                          }}
                        >
                          Use minimum
                        </button>
                      )}
                    </div>
                  </div>

                  {/* UX-021 (M): total-cost calculator, shown before the bid can be committed. */}
                  <TotalCostCalculator lotId={lot.id} amount={bidAmount} />

                  {integrityAcknowledged && (
                    <Notice tone="danger" className="mt-3">
                      Your live connection is down, so this price may be stale. Click again to place the bid anyway.
                    </Notice>
                  )}

                  {confirmingBid && (
                    <Notice tone="warning" className="mt-3">
                      This is a large bid — click again to confirm £{Number(bidAmount).toLocaleString("en-GB")}.
                    </Notice>
                  )}

                  {/* UX-004 (M): the button shows the exact commit amount, never a bare "Bid". */}
                  <button type="submit" className="ha-btn is-primary is-block mt-3" style={{ height: 44 }} disabled={submitting || !bidAmount} aria-busy={submitting}>
                    {submitting
                      ? "Placing…"
                      : confirmingBid
                        ? `Confirm bid £${Number(bidAmount || 0).toLocaleString("en-GB")}`
                        : bidAmount
                          ? `Bid £${Number(bidAmount).toLocaleString("en-GB")}`
                          : "Enter an amount"}
                  </button>
                </form>
              </Card>

              <Card title="Set a proxy (max) bid" description="We bid for you, up to your maximum.">
                <form onSubmit={handleProxySubmit} className="ha-card-body">
                  <div className="ha-field">
                    <label htmlFor="lot-proxy-amount">Maximum amount (£)</label>
                    <input
                      id="lot-proxy-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      className="ha-input"
                      value={proxyAmount}
                      onChange={(e) => {
                        setProxyAmount(e.target.value);
                        setConfirmingProxy(false);
                      }}
                      required
                    />
                  </div>

                  <TotalCostCalculator lotId={lot.id} amount={proxyAmount} />

                  {confirmingProxy && (
                    <Notice tone="warning" className="mt-3">
                      This is a large proxy max — click again to confirm £{Number(proxyAmount).toLocaleString("en-GB")}.
                    </Notice>
                  )}

                  <button type="submit" className="ha-btn is-block mt-3" disabled={submitting || !proxyAmount} aria-busy={submitting}>
                    {submitting
                      ? "Lodging…"
                      : confirmingProxy
                        ? `Confirm proxy max £${Number(proxyAmount || 0).toLocaleString("en-GB")}`
                        : proxyAmount
                          ? `Set proxy max £${Number(proxyAmount).toLocaleString("en-GB")}`
                          : "Enter a maximum"}
                  </button>
                </form>
              </Card>
            </div>
          </div>

          <Card
            className="mt-4"
            title="Bid history"
            actions={
              isConcluded ? (
                <button type="button" className="ha-btn is-sm" onClick={handleDownloadBidLog}>
                  Download bid log (CSV)
                </button>
              ) : undefined
            }
          >
            {bids.length === 0 && <EmptyState icon="icon-carus-checkcircle" title="No bids yet" text="Bids on this lot appear here as they happen." />}
            {bids.length > 0 && (
              <DataTable caption="Bid history for this lot">
                <thead>
                  <tr>
                    <th scope="col">Bidder</th>
                    <th scope="col" className="is-num">Amount</th>
                    <th scope="col">Time</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid) => (
                    <tr key={bid.id}>
                      <td data-label="Bidder">{bid.bidder === "you" ? <Badge tone="primary" plain>You</Badge> : bid.bidder}</td>
                      <td data-label="Amount" className="is-num">£{bid.amount.toLocaleString("en-GB")}</td>
                      <td data-label="Time" className="ha-num">{formatDate(bid.createdAt, { time: true })}</td>
                      <td data-label="" className="ha-right">
                        {bid.bidder === "you" && bid.status === "accepted" && (
                          <button type="button" className="ha-btn is-sm is-danger" disabled={submitting} onClick={() => handleRetract(bid.id)}>
                            Retract
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>
        </>
      )}
    </DashboardPage>
  );
}

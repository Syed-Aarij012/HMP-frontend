"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import ConditionReportSection from "./ConditionReportSection";
import MediaGallery from "./MediaGallery";
import { useAuctionLot } from "@/hooks/useAuctionLot";
import { useFeeEstimate } from "@/hooks/useFeeEstimate";
import { useStepUp } from "@/hooks/useStepUp";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api-client";

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
    return (
      <p className="tfcl-empty-data">Enter an amount above to see the full cost breakdown.</p>
    );
  }

  if (loading) return <p>Calculating...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!estimate) return null;

  return (
    <div className="table-responsive">
      <table className="table">
        <tbody>
          <tr><td>Hammer price</td><td>{money(estimate.hammerPrice)}</td></tr>
          <tr><td>Buyer&apos;s premium</td><td>{money(estimate.buyersPremium)}</td></tr>
          <tr><td>VAT on premium</td><td>{money(estimate.vatOnPremium)}</td></tr>
          {estimate.vatStatus === "qualifying" && (
            <tr><td>VAT on vehicle (qualifying)</td><td>{money(estimate.vehicleVat)}</td></tr>
          )}
          {estimate.isHmpAssured && (
            <tr><td>HMP Assured fee</td><td>{money(estimate.assuranceFee)}</td></tr>
          )}
          <tr><td>Indicative transport (open, running)</td><td>{money(estimate.transportEstimate)}</td></tr>
          <tr className="fw-6">
            <td>Total if you win at this price</td>
            <td>{money(estimate.totalWithTransport)}</td>
          </tr>
        </tbody>
      </table>
    </div>
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
      <div className="alert alert-danger">
        Bids of £{STEP_UP_THRESHOLD.toLocaleString()} or more need a fresh two-factor code, and
        you haven&apos;t enrolled yet. <Link href="/security">Enable two-factor authentication</Link>{" "}
        first, then try again.
        <div className="mt-2">
          <button type="button" className="sc-button" onClick={onCancel}>
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="tfcl-card mb-3">
      <h4 className="mb-2">Step-up verification required</h4>
      <p className="text-color-1 mb-2">Enter a fresh code from your authenticator app to confirm this bid.</p>
      {error && <div className="alert alert-danger mb-2">{error}</div>}
      <div className="form-group">
        <input
          type="text"
          inputMode="numeric"
          className="form-control"
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-10">
        <button type="submit" className="sc-button" disabled={submitting}>
          <span>{submitting ? "Verifying..." : "Verify and continue"}</span>
        </button>
        <button type="button" className="sc-button" onClick={onCancel}>
          <span>Cancel</span>
        </button>
      </div>
    </form>
  );
}

export default function LotDetail({ publicId }: { publicId: string }) {
  const { lot, bids, loading, error, actionError, submitting, live, placeBid, placeProxyBid, retractBid } =
    useAuctionLot(publicId);
  const [bidAmount, setBidAmount] = useState("");
  const [proxyAmount, setProxyAmount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingBid, setConfirmingBid] = useState(false);
  const [confirmingProxy, setConfirmingProxy] = useState(false);
  const [stepUpFor, setStepUpFor] = useState<"bid" | "proxy" | null>(null);

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
    if (Number(bidAmount) >= STEP_UP_THRESHOLD && !confirmingBid) {
      setConfirmingBid(true);
      return;
    }
    setConfirmingBid(false);
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

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  {loading && <p>Loading this lot...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && lot && (
                    <>
                      <h1 className="admin-title mb-1">
                        {lot.vehicle
                          ? [lot.vehicle.year, lot.vehicle.make, lot.vehicle.model, lot.vehicle.derivative]
                              .filter(Boolean)
                              .join(" ")
                          : "Lot"}
                      </h1>
                      <p className="text-color-1 mb-3">
                        {lot.saleName} &middot; Status: <span className="text-capitalize">{lot.status.replace("_", " ")}</span>
                        {lot.isHmpAssured && " · HMP Assured"}
                        {" · "}
                        <span style={{ color: live ? "#2ecc71" : "#999" }}>
                          {live ? "● Live" : "○ Connecting..."}
                        </span>
                      </p>

                      <div className="row mb-4">
                        <div className="col-md-6">
                          <p><b>Current price:</b> {formatPrice(lot.currentPrice)}</p>
                          <p>
                            <b>Reserve:</b>{" "}
                            {lot.reservePrice !== null
                              ? `£${lot.reservePrice.toLocaleString()}`
                              : lot.reserveMet === null
                                ? "Not visible to you"
                                : lot.reserveMet
                                  ? "Met"
                                  : "Not met"}
                          </p>
                        </div>
                        {lot.vehicle && (
                          <div className="col-md-6">
                            <p><b>Mileage:</b> {lot.vehicle.mileage.toLocaleString()} mi</p>
                            <p><b>Fuel / Transmission:</b> {lot.vehicle.fuelType} / {lot.vehicle.transmission}</p>
                            {lot.vehicle.colour && <p><b>Colour:</b> {lot.vehicle.colour}</p>}
                          </div>
                        )}
                      </div>

                      <MediaGallery vehicle={lot.vehicle} />

                      {lot.conditionReport && (
                        <ConditionReportSection report={lot.conditionReport} vehicle={lot.vehicle} />
                      )}

                      {notice && <div className="alert alert-success mb-3">{notice}</div>}
                      {actionError && stepUpFor === null && (
                        <div className="alert alert-danger mb-3">{actionError}</div>
                      )}

                      {stepUpFor && (
                        <StepUpPrompt
                          onCancel={() => setStepUpFor(null)}
                          onVerified={() => (stepUpFor === "bid" ? submitBid() : submitProxy())}
                        />
                      )}

                      <div className="row mb-4">
                        <div className="col-md-6">
                          <form onSubmit={handleBidSubmit} className="tfcl-card p-3">
                            <h4 className="mb-2">Place a bid</h4>
                            <div className="form-group">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                placeholder="Bid amount (£)"
                                value={bidAmount}
                                onChange={(e) => {
                                  setBidAmount(e.target.value);
                                  setConfirmingBid(false);
                                }}
                                required
                              />
                            </div>

                            {/* UX-021 (M): total-cost calculator, shown before the bid can be committed. */}
                            <TotalCostCalculator lotId={lot.id} amount={bidAmount} />

                            {confirmingBid && (
                              <div className="alert alert-danger my-2">
                                This is a large bid — click again to confirm £{Number(bidAmount).toLocaleString()}.
                              </div>
                            )}

                            {/* UX-004 (M): the button shows the exact commit amount, never a bare "Bid". */}
                            <button type="submit" className="sc-button mt-2" disabled={submitting || !bidAmount}>
                              <span>
                                {submitting
                                  ? "Placing..."
                                  : confirmingBid
                                    ? `Confirm bid £${Number(bidAmount || 0).toLocaleString()}`
                                    : bidAmount
                                      ? `Bid £${Number(bidAmount).toLocaleString()}`
                                      : "Enter an amount"}
                              </span>
                            </button>
                          </form>
                        </div>
                        <div className="col-md-6">
                          <form onSubmit={handleProxySubmit} className="tfcl-card p-3">
                            <h4 className="mb-2">Set a proxy (max) bid</h4>
                            <div className="form-group">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                placeholder="Maximum amount (£)"
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
                              <div className="alert alert-danger my-2">
                                This is a large proxy max — click again to confirm £{Number(proxyAmount).toLocaleString()}.
                              </div>
                            )}

                            <button type="submit" className="sc-button mt-2" disabled={submitting || !proxyAmount}>
                              <span>
                                {submitting
                                  ? "Lodging..."
                                  : confirmingProxy
                                    ? `Confirm proxy max £${Number(proxyAmount || 0).toLocaleString()}`
                                    : proxyAmount
                                      ? `Set proxy max £${Number(proxyAmount).toLocaleString()}`
                                      : "Enter a maximum"}
                              </span>
                            </button>
                          </form>
                        </div>
                      </div>

                      <h4 className="mb-2">Bid history</h4>
                      {bids.length === 0 && <p className="tfcl-empty-data">No bids on this lot yet.</p>}
                      {bids.length > 0 && (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Bidder</th>
                                <th>Amount</th>
                                <th>Time</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {bids.map((bid) => (
                                <tr key={bid.id}>
                                  <td>{bid.bidder}</td>
                                  <td>£{bid.amount.toLocaleString()}</td>
                                  <td>{new Date(bid.createdAt).toLocaleString()}</td>
                                  <td>
                                    {bid.bidder === "you" && bid.status === "accepted" && (
                                      <button
                                        type="button"
                                        className="sc-button"
                                        disabled={submitting}
                                        onClick={() => handleRetract(bid.id)}
                                      >
                                        <span>Retract</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

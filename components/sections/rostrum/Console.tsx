"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useLiveLanes } from "@/hooks/useLiveLanes";
import { useRostrum } from "@/hooks/useRostrum";
import type { ReserveIndicator } from "@/types/liveAuction";

const CHANNEL_LABEL: Record<string, string> = { hall: "Hall", online: "Online", proxy: "Proxy" };

const WITHDRAW_REASONS = [
  { value: "seller_request", label: "Seller request" },
  { value: "vehicle_unavailable", label: "Vehicle unavailable" },
  { value: "documentation_issue", label: "Documentation issue" },
  { value: "condition_dispute", label: "Condition dispute" },
];

function reserveLabel(reserve: ReserveIndicator) {
  if (reserve.state === "no_reserve") return "No reserve";
  if (reserve.state === "met") return `Reserve met (£${reserve.reservePrice?.toLocaleString()})`;

  const band =
    reserve.band === "within_5_percent" ? "within 5%" : reserve.band === "within_15_percent" ? "within 15%" : "far off";
  return `Reserve not met (£${reserve.reservePrice?.toLocaleString()}, ${band})`;
}

function reserveColour(reserve: ReserveIndicator) {
  if (reserve.state === "met" || reserve.state === "no_reserve") return "#2ecc71";
  return reserve.band === "far" ? "#e74c3c" : "#e67e22";
}

/**
 * FR-D-034: the auctioneer's rostrum. Everything needed to run a lane sits on one screen:
 * lane controls, the current lot with its reserve indicator, the live bid feed with each
 * bid's channel of origin (bidders shown only as paddle numbers, per the anti-collusion
 * rule), hall-bid entry, hammer and withdraw. No action needs more than two interactions.
 */
export default function Console() {
  const { lanes } = useLiveLanes();
  const [laneId, setLaneId] = useState<number | null>(null);
  const { state, error, actionError, notice, busy, laneAction, hammer, withdraw, hallBid } = useRostrum(laneId);
  const [confirmHammer, setConfirmHammer] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState(WITHDRAW_REASONS[0].value);
  const [hallBidder, setHallBidder] = useState("");
  const [hallAmount, setHallAmount] = useState("");

  const lot = state?.currentLot ?? null;
  const laneStatus = state?.lane.status;
  const canBid = lot !== null && (lot.status === "open" || lot.status === "in_lane");

  async function handleHammer() {
    if (!lot) return;
    if (!confirmHammer) {
      setConfirmHammer(true);
      return;
    }
    setConfirmHammer(false);
    await hammer(lot.id);
  }

  async function handleHallBid(event: FormEvent) {
    event.preventDefault();
    if (!lot) return;
    const ok = await hallBid(lot.id, Number(hallBidder), hallAmount || String(lot.nextBid?.minimum ?? ""));
    if (ok) setHallAmount("");
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
                  <h1 className="admin-title mb-1">Rostrum console</h1>
                  <p className="text-color-1 mb-3">
                    Run your lane: start, pause or skip, take hall bids and hammer. Bidders appear as paddle numbers only.
                  </p>

                  <div className="form-group mb-3" style={{ maxWidth: 420 }}>
                    <label htmlFor="rostrum-lane">Lane</label>
                    <select
                      id="rostrum-lane"
                      className="form-control"
                      value={laneId ?? ""}
                      onChange={(e) => {
                        setLaneId(e.target.value ? Number(e.target.value) : null);
                        setConfirmHammer(false);
                      }}
                    >
                      <option value="">Select a lane...</option>
                      {lanes.map((lane) => (
                        <option key={lane.id} value={lane.id}>
                          {lane.saleName} - {lane.name} ({lane.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && laneId !== null && <div className="alert alert-danger">{error}</div>}
                  {actionError && <div className="alert alert-danger">{actionError}</div>}
                  {notice && <div className="alert alert-success">{notice}</div>}

                  {state && (
                    <>
                      <div className="flex gap-10 mb-3" style={{ alignItems: "center", flexWrap: "wrap" }}>
                        <b>
                          {state.lane.name}: <span className="text-capitalize">{laneStatus}</span>
                        </b>
                        {laneStatus === "pending" && (
                          <button type="button" className="sc-button" disabled={busy} onClick={() => laneAction("start")}>
                            <span>Start lane</span>
                          </button>
                        )}
                        {laneStatus === "active" && (
                          <button type="button" className="sc-button" disabled={busy} onClick={() => laneAction("pause")}>
                            <span>Pause</span>
                          </button>
                        )}
                        {laneStatus === "paused" && (
                          <button type="button" className="sc-button" disabled={busy} onClick={() => laneAction("resume")}>
                            <span>Resume</span>
                          </button>
                        )}
                        {state.nextLots.length > 0 && (
                          <button type="button" className="sc-button" disabled={busy} onClick={() => laneAction("skip")}>
                            <span>Skip lot</span>
                          </button>
                        )}
                      </div>

                      {!lot && <p className="tfcl-empty-data">No lot is queued in this lane.</p>}

                      {lot && (
                        <div className="row mb-4">
                          <div className="col-md-6">
                            <div className="tfcl-card p-3 mb-3">
                              <h4 className="mb-1">{lot.vehicle ?? "Current lot"}</h4>
                              <p className="text-color-1 mb-2 text-capitalize">{lot.status.replace("_", " ")}</p>
                              <p style={{ fontSize: 28 }} className="mb-1">
                                <b>{lot.currentPrice !== null ? `£${lot.currentPrice.toLocaleString()}` : "No bids"}</b>
                              </p>
                              <p style={{ color: reserveColour(lot.reserve) }}>
                                <b>{reserveLabel(lot.reserve)}</b>
                              </p>
                              {lot.nextBid && (
                                <p className="mb-2">
                                  Next bid: £{lot.nextBid.minimum.toLocaleString()} (+£{lot.nextBid.increment.toLocaleString()})
                                </p>
                              )}
                              {state.lane.saleType === "timed_online" && (
                                <p className="text-color-1">Timed sale: this lot closes automatically.</p>
                              )}

                              <div className="flex gap-10 mt-2" style={{ flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  className="sc-button"
                                  disabled={busy || lot.status !== "open" || lot.currentPrice === null}
                                  onClick={handleHammer}
                                >
                                  <span>
                                    {confirmHammer
                                      ? `Confirm: hammer at £${lot.currentPrice?.toLocaleString()}`
                                      : "Hammer"}
                                  </span>
                                </button>
                                {confirmHammer && (
                                  <button type="button" className="sc-button" onClick={() => setConfirmHammer(false)}>
                                    <span>Cancel</span>
                                  </button>
                                )}
                              </div>

                              <div className="form-group mt-3">
                                <label htmlFor="rostrum-withdraw">Withdraw lot</label>
                                <div className="flex gap-10">
                                  <select
                                    id="rostrum-withdraw"
                                    className="form-control"
                                    value={withdrawReason}
                                    onChange={(e) => setWithdrawReason(e.target.value)}
                                  >
                                    {WITHDRAW_REASONS.map((reason) => (
                                      <option key={reason.value} value={reason.value}>
                                        {reason.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="sc-button"
                                    disabled={busy}
                                    onClick={() => withdraw(lot.id, withdrawReason)}
                                  >
                                    <span>Withdraw</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <form onSubmit={handleHallBid} className="tfcl-card p-3">
                              <h4 className="mb-2">Hall bid</h4>
                              <div className="form-group">
                                <input
                                  type="number"
                                  min="1"
                                  className="form-control"
                                  placeholder="Bidder account ID"
                                  value={hallBidder}
                                  onChange={(e) => setHallBidder(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="form-control"
                                  placeholder={lot.nextBid ? `Amount (min £${lot.nextBid.minimum})` : "Amount (£)"}
                                  value={hallAmount}
                                  onChange={(e) => setHallAmount(e.target.value)}
                                />
                              </div>
                              <button type="submit" className="sc-button" disabled={busy || !canBid || !hallBidder}>
                                <span>Record hall bid</span>
                              </button>
                            </form>
                          </div>

                          <div className="col-md-6">
                            <h4 className="mb-2">Bid feed</h4>
                            {lot.bidFeed.length === 0 && <p className="tfcl-empty-data">No bids yet.</p>}
                            {lot.bidFeed.length > 0 && (
                              <div className="table-responsive">
                                <table className="table">
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>Paddle</th>
                                      <th>Channel</th>
                                      <th>Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lot.bidFeed.map((bid) => (
                                      <tr key={bid.id}>
                                        <td>{bid.sequenceNumber}</td>
                                        <td>{bid.paddle}</td>
                                        <td>{CHANNEL_LABEL[bid.channel] ?? bid.channel}</td>
                                        <td>£{bid.amount.toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {state.nextLots.length > 0 && (
                              <>
                                <h4 className="mb-2 mt-3">Up next</h4>
                                <ol>
                                  {state.nextLots.map((next) => (
                                    <li key={next.id}>
                                      <Link href={`/auction/${next.id}`}>{next.vehicle ?? next.id}</Link>
                                    </li>
                                  ))}
                                </ol>
                              </>
                            )}
                          </div>
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

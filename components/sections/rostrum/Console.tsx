"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import LiveStreamPlayer from "@/components/common/LiveStreamPlayer";
import { useLiveLanes } from "@/hooks/useLiveLanes";
import { useRostrum } from "@/hooks/useRostrum";
import type { ReserveIndicator } from "@/types/liveAuction";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, DataTable, EmptyState, Notice, StatusBadge, formatMoney, type Tone } from "@/components/ui/kit";

const CHANNEL_LABEL: Record<string, string> = { hall: "Hall", online: "Online", proxy: "Proxy" };

const WITHDRAW_REASONS = [
  { value: "seller_request", label: "Seller request" },
  { value: "vehicle_unavailable", label: "Vehicle unavailable" },
  { value: "documentation_issue", label: "Documentation issue" },
  { value: "condition_dispute", label: "Condition dispute" },
];

function reserveLabel(reserve: ReserveIndicator) {
  if (reserve.state === "no_reserve") return "No reserve";
  if (reserve.state === "met") return `Reserve met (${formatMoney(reserve.reservePrice)})`;

  const band =
    reserve.band === "within_5_percent" ? "within 5%" : reserve.band === "within_15_percent" ? "within 15%" : "far off";
  return `Reserve not met (${formatMoney(reserve.reservePrice)}, ${band})`;
}

function reserveTone(reserve: ReserveIndicator): Tone {
  if (reserve.state === "met" || reserve.state === "no_reserve") return "success";
  return reserve.band === "far" ? "danger" : "warning";
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
    <DashboardPage title="Rostrum console" description="Run your lane: start, pause or skip, take hall bids and hammer. Bidders appear as paddle numbers only.">
      <Card className="mb-4">
        <div className="ha-toolbar" style={{ borderBottom: state ? undefined : 0 }}>
          <label className="ha-control-label" htmlFor="rostrum-lane">
            Lane
            <select
              id="rostrum-lane"
              className="ha-select ha-inline-select"
              style={{ minWidth: 280 }}
              value={laneId ?? ""}
              onChange={(e) => {
                setLaneId(e.target.value ? Number(e.target.value) : null);
                setConfirmHammer(false);
              }}
            >
              <option value="">Select a lane…</option>
              {lanes.map((lane) => (
                <option key={lane.id} value={lane.id}>
                  {lane.saleName} — {lane.name} ({lane.status})
                </option>
              ))}
            </select>
          </label>
          {state && (
            <div className="ha-toolbar-end">
              <StatusBadge status={laneStatus} tone={laneStatus === "active" ? "success" : laneStatus === "paused" ? "warning" : undefined} />
              {laneStatus === "pending" && (
                <button type="button" className="ha-btn is-primary" disabled={busy} onClick={() => laneAction("start")}>
                  Start lane
                </button>
              )}
              {laneStatus === "active" && (
                <button type="button" className="ha-btn" disabled={busy} onClick={() => laneAction("pause")}>
                  Pause
                </button>
              )}
              {laneStatus === "paused" && (
                <button type="button" className="ha-btn is-primary" disabled={busy} onClick={() => laneAction("resume")}>
                  Resume
                </button>
              )}
              {state.nextLots.length > 0 && (
                <button type="button" className="ha-btn" disabled={busy} onClick={() => laneAction("skip")}>
                  Skip lot
                </button>
              )}
            </div>
          )}
        </div>
        {!laneId && <EmptyState icon="icon-carus-sliders" title="Choose a lane" text="Pick the lane you're running to open its console." />}
      </Card>

      {error && laneId !== null && <Notice tone="danger">{error}</Notice>}
      {actionError && <Notice tone="danger">{actionError}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      {state && (
        <>
          {!lot && (
            <div className="ha-grid is-2" style={{ alignItems: "start" }}>
              <Card>
                <EmptyState icon="icon-carus-car" title="No lot queued" text="No lot is queued in this lane." />
              </Card>
              <Card title="Lane video">
                <div className="ha-card-body">
                  <LiveStreamPlayer laneId={laneId ?? undefined} />
                </div>
              </Card>
            </div>
          )}

          {lot && (
            <div className="ha-rostrum">
              <div className="ha-stack">
                <section className="ha-card" aria-label="Current lot">
                  <div className="ha-card-head">
                    <div>
                      <span className="ha-eyebrow">Current lot</span>
                      <h2>{lot.vehicle ?? "Current lot"}</h2>
                    </div>
                    <StatusBadge status={lot.status} />
                  </div>
                  <div className="ha-card-body">
                    <div className="ha-rostrum-price ha-num" aria-live="polite">
                      {lot.currentPrice !== null ? formatMoney(lot.currentPrice) : <span className="ha-muted">No bids</span>}
                    </div>
                    <div className="ha-chips mb-3">
                      <Badge tone={reserveTone(lot.reserve)}>{reserveLabel(lot.reserve)}</Badge>
                      {lot.nextBid && (
                        <Badge plain>
                          Next {formatMoney(lot.nextBid.minimum)} (+{formatMoney(lot.nextBid.increment)})
                        </Badge>
                      )}
                    </div>
                    {state.lane.saleType === "timed_online" && <p className="ha-sub">Timed sale: this lot closes automatically.</p>}

                    <div className="ha-actions is-start">
                      <button
                        type="button"
                        className={`ha-btn ${confirmHammer ? "is-danger-solid" : "is-primary"}`}
                        style={{ height: 44, paddingInline: 22 }}
                        disabled={busy || lot.status !== "open" || lot.currentPrice === null}
                        onClick={handleHammer}
                      >
                        {confirmHammer ? `Confirm: hammer at ${formatMoney(lot.currentPrice)}` : "Hammer"}
                      </button>
                      {confirmHammer && (
                        <button type="button" className="ha-btn is-ghost" onClick={() => setConfirmHammer(false)}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="ha-card-body" style={{ borderTop: "1px solid var(--hmp-border)" }}>
                    <label htmlFor="rostrum-withdraw" className="ha-label">
                      Withdraw lot
                    </label>
                    <div className="ha-actions is-start" style={{ flexWrap: "nowrap" }}>
                      <select id="rostrum-withdraw" className="ha-select" value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)}>
                        {WITHDRAW_REASONS.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="ha-btn is-danger" disabled={busy} onClick={() => withdraw(lot.id, withdrawReason)}>
                        Withdraw
                      </button>
                    </div>
                  </div>
                </section>

                <Card title="Hall bid">
                  <form onSubmit={handleHallBid} className="ha-card-body">
                    <div className="ha-form-grid">
                      <div className="ha-field">
                        <label htmlFor="rostrum-bidder">Bidder account ID</label>
                        <input id="rostrum-bidder" type="number" min="1" className="ha-input" value={hallBidder} onChange={(e) => setHallBidder(e.target.value)} required />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="rostrum-amount">Amount (£)</label>
                        <input
                          id="rostrum-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          className="ha-input"
                          placeholder={lot.nextBid ? `Min ${lot.nextBid.minimum}` : undefined}
                          value={hallAmount}
                          onChange={(e) => setHallAmount(e.target.value)}
                        />
                        <div className="ha-hint">Leave blank to bid the next minimum.</div>
                      </div>
                    </div>
                    <button type="submit" className="ha-btn is-primary" disabled={busy || !canBid || !hallBidder}>
                      Record hall bid
                    </button>
                  </form>
                </Card>
              </div>

              <div className="ha-stack">
                <Card title="Bid feed">
                  {lot.bidFeed.length === 0 && <EmptyState icon="icon-carus-checkcircle" title="No bids yet" />}
                  {lot.bidFeed.length > 0 && (
                    <DataTable caption="Bid feed for the current lot" stacked={false}>
                      <thead>
                        <tr>
                          <th scope="col" className="is-num">#</th>
                          <th scope="col">Paddle</th>
                          <th scope="col">Channel</th>
                          <th scope="col" className="is-num">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lot.bidFeed.map((bid) => (
                          <tr key={bid.id}>
                            <td className="is-num">{bid.sequenceNumber}</td>
                            <td className="ha-primary-text">{bid.paddle}</td>
                            <td>
                              <Badge plain>{CHANNEL_LABEL[bid.channel] ?? bid.channel}</Badge>
                            </td>
                            <td className="is-num">{formatMoney(bid.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  )}
                </Card>

                {state.nextLots.length > 0 && (
                  <Card title="Up next">
                    <ol className="ha-card-body ha-up-next">
                      {state.nextLots.map((next) => (
                        <li key={next.id}>
                          <Link href={`/auction/${next.id}`}>{next.vehicle ?? next.id}</Link>
                        </li>
                      ))}
                    </ol>
                  </Card>
                )}

                <Card title="Lane video">
                  <div className="ha-card-body">
                    <LiveStreamPlayer laneId={laneId ?? undefined} />
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardPage>
  );
}

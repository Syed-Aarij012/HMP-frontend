"use client";

import Link from "next/link";
import { useState } from "react";
import LiveStreamPlayer from "@/components/common/LiveStreamPlayer";
import LotCountdown from "@/components/sections/auction-lot/LotCountdown";
import { useLiveLanes } from "@/hooks/useLiveLanes";
import { useLotSpectatorStream } from "@/hooks/useLotSpectatorStream";
import { useServerClock } from "@/hooks/useServerClock";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, EmptyState, LoadingRows, Notice, StatusBadge, formatMoney } from "@/components/ui/kit";

/**
 * FR-D-033/036: multi-lane viewing. A trade buyer can follow up to the platform's
 * concurrent-lane limit at once, watch each one's video feed and live price (over the
 * FR-D-036 spectator SSE tier, never the bidder-priority Reverb channel — that only opens
 * once a lot is a buyer's actual bidding focus), and pick one as that focus to open its lot
 * and bid. The video feed is independent of the bid data channel by construction (FR-D-035),
 * so a missing or failed stream here never affects bidding on LotDetail.
 */
function FollowedLaneCard({
  lane,
  isFocus,
  offsetMs,
  onMakeFocus,
}: {
  lane: ReturnType<typeof useLiveLanes>["lanes"][number];
  isFocus: boolean;
  offsetMs: number;
  onMakeFocus: () => void;
}) {
  const { state: spectatorState } = useLotSpectatorStream(lane.currentLot?.id);
  const currentPrice = spectatorState?.currentPrice ?? lane.currentLot?.currentPrice ?? null;
  const closesAt = spectatorState?.closesAt ?? lane.currentLot?.closesAt ?? null;

  return (
    <section className={`ha-card ha-lane${isFocus ? " is-focus" : ""}`} aria-label={`${lane.name}${isFocus ? " (bidding focus)" : ""}`}>
      <div className="ha-card-head">
        <h2>{lane.name}</h2>
        <div className="ha-chips">
          {isFocus && <Badge tone="success">Bidding focus</Badge>}
          <StatusBadge status={lane.status} tone={lane.status === "paused" ? "warning" : undefined} />
        </div>
      </div>
      {lane.status === "paused" && (
        <div className="ha-card-body" style={{ paddingBottom: 0 }}>
          <Notice tone="warning">Paused by the auctioneer.</Notice>
        </div>
      )}
      {!lane.currentLot && <EmptyState icon="icon-carus-videocamerass" title="No lot on this lane" />}
      {lane.currentLot && (
        <div className="ha-card-body">
          <LiveStreamPlayer laneId={lane.id} compact />
          <div className="ha-sub mt-3">{lane.currentLot.vehicle ?? "Current lot"}</div>
          <div className="ha-lane-price ha-num" aria-live="polite">
            {currentPrice !== null ? formatMoney(currentPrice) : <span className="ha-muted">No bids yet</span>}
          </div>
          <LotCountdown closesAt={closesAt} offsetMs={offsetMs} />
          <div className="ha-actions is-start mt-3">
            {isFocus ? (
              <Link href={`/auction/${lane.currentLot.id}`} className="ha-btn is-primary">
                Open lot to bid
              </Link>
            ) : null}
            <button type="button" className={`ha-btn${isFocus ? " is-ghost" : " is-primary"}`} onClick={onMakeFocus} aria-pressed={isFocus}>
              {isFocus ? "Bidding focus" : "Make bidding focus"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function LiveLanes() {
  const [selected, setSelected] = useState<number[]>([]);
  const { lanes, maxLanes, loading, error } = useLiveLanes(selected);
  const { offsetMs } = useServerClock();
  const [focusId, setFocusId] = useState<number | null>(null);

  function toggle(laneId: number) {
    setSelected((current) => {
      if (current.includes(laneId)) return current.filter((id) => id !== laneId);
      if (current.length >= maxLanes) return current;
      return [...current, laneId];
    });
  }

  const followed = lanes.filter((lane) => selected.includes(lane.id));
  const atLimit = selected.length >= maxLanes;

  return (
    <DashboardPage title="Live lanes" description={<>Follow up to {maxLanes} lanes at once. Choose one as your bidding focus to open its lot.</>}>
      {loading && <LoadingRows rows={3} label="Loading live lanes" />}
      {error && <Notice tone="danger">{error}</Notice>}
      {!loading && !error && lanes.length === 0 && (
        <Card>
          <EmptyState icon="icon-carus-videocamerass" title="Nothing on air" text="No lanes are on air right now." />
        </Card>
      )}

      {lanes.length > 0 && (
        <Card className="mb-4" title="Available lanes" actions={<Badge tone={atLimit ? "warning" : "neutral"} plain>{selected.length}/{maxLanes} followed</Badge>}>
          <fieldset className="ha-card-body ha-lane-picker">
            <legend className="ha-visually-hidden">Lanes to follow</legend>
            {lanes.map((lane) => (
              <label key={lane.id} className="ha-check">
                <input
                  type="checkbox"
                  checked={selected.includes(lane.id)}
                  disabled={!selected.includes(lane.id) && atLimit}
                  onChange={() => toggle(lane.id)}
                />
                <span>
                  {lane.saleName} — {lane.name}
                </span>
                <StatusBadge status={lane.status} />
              </label>
            ))}
            {atLimit && <p className="ha-sub mb-0">You are following the maximum number of lanes.</p>}
          </fieldset>
        </Card>
      )}

      <div className="ha-grid is-2">
        {followed.map((lane) => (
          <FollowedLaneCard
            key={lane.id}
            lane={lane}
            isFocus={focusId === lane.id}
            offsetMs={offsetMs}
            onMakeFocus={() => setFocusId(lane.id)}
          />
        ))}
      </div>
    </DashboardPage>
  );
}

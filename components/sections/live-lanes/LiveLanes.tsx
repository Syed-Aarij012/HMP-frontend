"use client";

import Link from "next/link";
import { useState } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import LiveStreamPlayer from "@/components/common/LiveStreamPlayer";
import LotCountdown from "@/components/sections/auction-lot/LotCountdown";
import { useLiveLanes } from "@/hooks/useLiveLanes";
import { useLotSpectatorStream } from "@/hooks/useLotSpectatorStream";
import { useServerClock } from "@/hooks/useServerClock";

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
    <div className="col-md-6 mb-3">
      <div className="tfcl-card p-3" style={isFocus ? { outline: "2px solid #2ecc71" } : undefined}>
        <h4 className="mb-1">
          {lane.name} <span className="text-color-2 text-capitalize">({lane.status})</span>
        </h4>
        {lane.status === "paused" && <p style={{ color: "#e67e22" }}>Paused by the auctioneer.</p>}
        {!lane.currentLot && <p className="tfcl-empty-data">No lot on this lane.</p>}
        {lane.currentLot && (
          <>
            <LiveStreamPlayer laneId={lane.id} compact />
            <p className="mb-1">{lane.currentLot.vehicle ?? "Current lot"}</p>
            <p style={{ fontSize: 24 }} className="mb-1">
              <b>{currentPrice !== null ? `£${currentPrice.toLocaleString()}` : "No bids yet"}</b>
            </p>
            <LotCountdown closesAt={closesAt} offsetMs={offsetMs} />
            <div className="flex gap-10 mt-2">
              <button type="button" className="sc-button" onClick={onMakeFocus}>
                <span>{isFocus ? "Bidding focus" : "Make bidding focus"}</span>
              </button>
              {isFocus && (
                <Link href={`/auction/${lane.currentLot.id}`} className="sc-button">
                  <span>Open lot to bid</span>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-1">Live lanes</h1>
                  <p className="text-color-2 mb-3">
                    Follow up to {maxLanes} lanes at once. Choose one as your bidding focus to open its lot.
                  </p>

                  {loading && <p>Loading live lanes...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {!loading && !error && lanes.length === 0 && (
                    <p className="tfcl-empty-data">No lanes are on air right now.</p>
                  )}

                  {lanes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2">
                        Available lanes ({selected.length}/{maxLanes} followed)
                      </h4>
                      {lanes.map((lane) => (
                        <label key={lane.id} style={{ display: "block", marginBottom: 6 }}>
                          <input
                            type="checkbox"
                            checked={selected.includes(lane.id)}
                            disabled={!selected.includes(lane.id) && atLimit}
                            onChange={() => toggle(lane.id)}
                          />{" "}
                          {lane.saleName} - {lane.name} <span className="text-color-2">({lane.status})</span>
                        </label>
                      ))}
                      {atLimit && <p className="text-color-2">You are following the maximum number of lanes.</p>}
                    </div>
                  )}

                  <div className="row">
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
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

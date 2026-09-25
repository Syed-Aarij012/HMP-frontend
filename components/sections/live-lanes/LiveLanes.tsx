"use client";

import Link from "next/link";
import { useState } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import LotCountdown from "@/components/sections/auction-lot/LotCountdown";
import { useLiveLanes } from "@/hooks/useLiveLanes";
import { useServerClock } from "@/hooks/useServerClock";

/**
 * FR-D-033: multi-lane viewing. A trade buyer can follow up to the platform's concurrent-lane
 * limit at once and pick one as the bidding focus to open its lot. Video is not part of this
 * build; the data channel here is independent of it, which is also how FR-D-035 expects
 * bidding to survive a video failure.
 */
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
                  <p className="text-color-1 mb-3">
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
                          {lane.saleName} - {lane.name} <span className="text-color-1">({lane.status})</span>
                        </label>
                      ))}
                      {atLimit && <p className="text-color-1">You are following the maximum number of lanes.</p>}
                    </div>
                  )}

                  <div className="row">
                    {followed.map((lane) => (
                      <div className="col-md-6 mb-3" key={lane.id}>
                        <div
                          className="tfcl-card p-3"
                          style={focusId === lane.id ? { outline: "2px solid #2ecc71" } : undefined}
                        >
                          <h4 className="mb-1">
                            {lane.name} <span className="text-color-1 text-capitalize">({lane.status})</span>
                          </h4>
                          {lane.status === "paused" && <p style={{ color: "#e67e22" }}>Paused by the auctioneer.</p>}
                          {!lane.currentLot && <p className="tfcl-empty-data">No lot on this lane.</p>}
                          {lane.currentLot && (
                            <>
                              <p className="mb-1">{lane.currentLot.vehicle ?? "Current lot"}</p>
                              <p style={{ fontSize: 24 }} className="mb-1">
                                <b>
                                  {lane.currentLot.currentPrice !== null
                                    ? `£${lane.currentLot.currentPrice.toLocaleString()}`
                                    : "No bids yet"}
                                </b>
                              </p>
                              <LotCountdown closesAt={lane.currentLot.closesAt} offsetMs={offsetMs} />
                              <div className="flex gap-10 mt-2">
                                <button type="button" className="sc-button" onClick={() => setFocusId(lane.id)}>
                                  <span>{focusId === lane.id ? "Bidding focus" : "Make bidding focus"}</span>
                                </button>
                                {focusId === lane.id && (
                                  <Link href={`/auction/${lane.currentLot.id}`} className="sc-button">
                                    <span>Open lot to bid</span>
                                  </Link>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
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

"use client";

import { useLaneVideoStream } from "@/hooks/useLaneVideoStream";

type LiveStreamPlayerProps = {
  laneId: number | string | undefined;
  compact?: boolean;
};

/**
 * FR-D-033/035: a lane's audio/video feed when one is available, and a clear "not connected"
 * placeholder otherwise. Never blocks or gates anything around it — the bid data channel is
 * independent of video by construction (BiddingService never touches this component or its
 * hook), so a missing or failed stream here has no effect on bidding.
 */
export default function LiveStreamPlayer({ laneId, compact = false }: LiveStreamPlayerProps) {
  const { stream, loading } = useLaneVideoStream(laneId);

  if (!laneId || loading) return null;

  if (!stream || !stream.available) {
    return (
      <div
        className="tfcl-card p-3 mb-3 text-center text-color-2"
        style={compact ? { padding: "12px" } : undefined}
      >
        <p className="mb-0">Video feed not connected for this lane. Bidding is unaffected.</p>
      </div>
    );
  }

  return (
    <div className="tfcl-card p-3 mb-3">
      <video
        src={stream.url}
        autoPlay
        muted
        playsInline
        controls
        aria-label="Live lane video feed"
        style={{ width: "100%", borderRadius: 8, display: "block" }}
      />
    </div>
  );
}

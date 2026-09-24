"use client";

import { useState } from "react";
import type { AuctionLotVehicle } from "@/types/auction";

/**
 * Photos, walk-around videos and the 360° spin set for a lot's vehicle. Plain <img>/<video>
 * elements rather than next/image: these are user-uploaded files served from the API host.
 */
export default function MediaGallery({ vehicle }: { vehicle: AuctionLotVehicle | null }) {
  const [spinIndex, setSpinIndex] = useState(0);

  if (!vehicle) return null;

  const media = [...vehicle.photos].sort((a, b) => a.sequence - b.sequence);
  const stills = media.filter((m) => m.type === "still");
  const videos = media.filter((m) => m.type === "video");
  const spinFrames = media.filter((m) => m.type === "spin_frame");

  if (!media.length) return null;

  return (
    <div className="mb-4">
      <h3>Photos &amp; video</h3>

      {stills.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {stills.map((photo) => (
            <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="Vehicle photo" style={{ width: "100%", height: "auto", borderRadius: 6 }} />
            </a>
          ))}
        </div>
      )}

      {videos.map((video) => (
        <div key={video.id} className="mt-3">
          <video src={video.url} controls preload="metadata" style={{ width: "100%", maxWidth: 720, borderRadius: 6 }} />
        </div>
      ))}

      {spinFrames.length > 0 && (
        <div className="mt-3">
          <h4>360° view</h4>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spinFrames[spinIndex]?.url}
            alt={`360 frame ${spinIndex + 1}`}
            style={{ width: "100%", maxWidth: 720, height: "auto", borderRadius: 6 }}
          />
          <input
            type="range"
            min={0}
            max={spinFrames.length - 1}
            value={spinIndex}
            onChange={(e) => setSpinIndex(Number(e.target.value))}
            style={{ width: "100%", maxWidth: 720, display: "block" }}
            aria-label="Rotate vehicle"
          />
          <p className="text-color-1">Drag the slider to rotate.</p>
        </div>
      )}
    </div>
  );
}

import type { Car } from "@/types/cars";

type ListingDetailVideoSectionProps = {
  car: Car;
};

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * The seller's walk-around video(s). Renders nothing for a listing without one, so cars with
 * no video look exactly as before.
 */
export default function ListingDetailVideoSection({ car }: ListingDetailVideoSectionProps) {
  const videos = car.videos ?? [];
  if (videos.length === 0) return null;

  return (
    <div className="listing-video mb-40">
      <div className="tfcl-listing-header">
        <h2>Video</h2>
      </div>
      <div className="tfcl-listing-info">
        {videos.map((video, index) => (
          <figure key={video.id} className={index > 0 ? "mt-3 mb-0" : "mb-0"}>
            <video
              src={video.url}
              controls
              preload="metadata"
              playsInline
              style={{ width: "100%", maxHeight: 520, borderRadius: 8, background: "#000" }}
            >
              Your browser can&apos;t play this video.
            </video>
            {formatDuration(video.durationSeconds) && (
              <figcaption className="text-color-1 fs-13 mt-1">Walk-around video · {formatDuration(video.durationSeconds)}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

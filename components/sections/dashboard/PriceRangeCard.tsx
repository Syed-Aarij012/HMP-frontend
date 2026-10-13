"use client";

function formatGBP(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

type Props = { min: number | null; max: number | null; average: number | null; count: number };

/** Min/avg/max asking price across this dealer's live stock, with a visual range track. */
export default function PriceRangeCard({ min, max, average, count }: Props) {
  if (min === null || max === null || average === null || count === 0) {
    return (
      <div className="tfcl-card p-3">
        <div className="text-color-2 mb-1">Live stock price range</div>
        <p className="tfcl-empty-data mb-0">No live listings yet.</p>
      </div>
    );
  }

  // Where the average sits between min and max, as a percentage along the track — 50% when
  // there's only one live listing (min === max === average), never NaN from a 0-width range.
  const averagePosition = max > min ? ((average - min) / (max - min)) * 100 : 50;

  return (
    <div className="tfcl-card p-3">
      <div className="text-color-2 mb-1">Live stock price range ({count} listing{count === 1 ? "" : "s"})</div>
      <div className="flex align-end gap-10 mb-2" style={{ flexWrap: "wrap" }}>
        <div>
          <div className="text-color-2" style={{ fontSize: 12 }}>
            Min
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{formatGBP(min)}</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div className="text-color-2" style={{ fontSize: 12 }}>
            Max
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{formatGBP(max)}</div>
        </div>
      </div>
      <div
        role="img"
        aria-label={`Price range from ${formatGBP(min)} to ${formatGBP(max)}, average ${formatGBP(average)}`}
        style={{ position: "relative", height: 8, background: "#f0f0ee", borderRadius: 4 }}
      >
        <div style={{ position: "absolute", inset: 0, background: "#2a78d6", borderRadius: 4, opacity: 0.25 }} />
        <div
          style={{
            position: "absolute",
            left: `${averagePosition}%`,
            top: -4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#2a78d6",
            border: "2px solid #fcfcfb",
            transform: "translateX(-50%)",
          }}
          title={`Average: ${formatGBP(average)}`}
        />
      </div>
      <div className="text-center text-color-2 mt-1" style={{ fontSize: 12 }}>
        Average: <b>{formatGBP(average)}</b>
      </div>
    </div>
  );
}

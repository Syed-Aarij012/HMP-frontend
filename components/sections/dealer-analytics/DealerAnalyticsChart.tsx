"use client";

import { useId } from "react";

type Series = { date: string; impressions: number; views: number; calls: number }[];

// Validated categorical palette (dataviz skill), slots 1-3 — the only three that clear the
// all-pairs CVD/normal-vision floors together, which is exactly how many series this chart
// has. Aqua sits below 3:1 contrast on a light surface, so it always carries a direct label
// (the "relief rule"), never color alone.
const SERIES_COLOR = { impressions: "#2a78d6", views: "#eb6834", calls: "#1baf7a" } as const;
const SERIES_LABEL = { impressions: "Impressions", views: "Detail views", calls: "Calls" } as const;

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 40;
const PAD_RIGHT = 84;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

/**
 * FR-C-022: the dealer's search-impressions / detail-view / call-tap trend as a small
 * multi-line chart — three series, one axis, a legend, and a direct end-label per line
 * (the low-contrast aqua series never relies on color alone).
 */
export default function DealerAnalyticsChart({ series }: { series: Series }) {
  const gradientId = useId();

  if (series.length === 0) return null;

  const maxValue = niceMax(Math.max(1, ...series.flatMap((point) => [point.impressions, point.views, point.calls])));
  const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (index: number) => PAD_LEFT + (series.length === 1 ? 0 : (index / (series.length - 1)) * innerWidth);
  const y = (value: number) => PAD_TOP + innerHeight - (value / maxValue) * innerHeight;

  const lines = (Object.keys(SERIES_COLOR) as (keyof typeof SERIES_COLOR)[]).map((key) => ({
    key,
    color: SERIES_COLOR[key],
    label: SERIES_LABEL[key],
    points: series.map((point, index) => ({ x: x(index), y: y(point[key]), value: point[key] })),
  }));

  const yTicks = [0, 0.5, 1].map((fraction) => Math.round(maxValue * fraction));
  const firstLabel = new Date(series[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const lastLabel = new Date(series[series.length - 1].date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Search impressions, detail views and calls over time" style={{ width: "100%", height: "auto" }}>
        <title id={`${gradientId}-title`}>Search impressions, detail views and calls over time</title>

        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y(tick)} y2={y(tick)} stroke="#d8d7d2" strokeWidth={1} />
            <text x={PAD_LEFT - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#78776f">
              {tick.toLocaleString()}
            </text>
          </g>
        ))}

        <text x={PAD_LEFT} y={HEIGHT - 4} fontSize={11} fill="#78776f">
          {firstLabel}
        </text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 4} textAnchor="end" fontSize={11} fill="#78776f">
          {lastLabel}
        </text>

        {lines.map((line) => {
          const path = line.points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
          const end = line.points[line.points.length - 1];

          return (
            <g key={line.key}>
              <path d={path} fill="none" stroke={line.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={end.x} cy={end.y} r={4} fill={line.color} stroke="#fcfcfb" strokeWidth={2} />
              {/* Direct end-label — required "relief" for the low-contrast series, and consistent across all three per the skill's labeling rule. */}
              <text x={end.x + 8} y={end.y} dominantBaseline="middle" fontSize={11} fill="#0b0b0b" fontWeight={600}>
                {end.value.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend — always present for 2+ series; text stays in text tokens, identity carried by the swatch. */}
      <div className="flex gap-20 mt-2" style={{ flexWrap: "wrap" }}>
        {lines.map((line) => (
          <span key={line.key} className="flex gap-10" style={{ alignItems: "center" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: line.color }} />
            <span className="text-color-2">{line.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

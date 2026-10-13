"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { DashboardFormat, DashboardSegment, DashboardSeries } from "@/types/dashboardOverview";
import { SERIES_COLORS, formatBucket, formatCompact, formatValue, niceMax } from "./format";

/*
 * Small SVG charts for the role dashboards, built to the dataviz rules: one axis, thin marks with
 * 4px rounded data-ends, recessive grid, text in text colours (never the series colour), a legend
 * for 2+ series, a hover/focus readout, and a table view so no value depends on colour or hover.
 */

const W = 640;
const H = 220;
const PAD = { top: 12, right: 16, bottom: 26, left: 48 };

type Tip = { x: number; y: number; title: string; rows: { label: string; value: string; color: string }[] } | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div className="ov-tip" style={{ left: `${(tip.x / W) * 100}%`, top: `${(tip.y / H) * 100}%` }} role="presentation">
      <div className="ov-tip-title">{tip.title}</div>
      {tip.rows.map((row) => (
        <div key={row.label} className="ov-tip-row">
          <span className="ov-key-line" style={{ background: row.color }} aria-hidden="true" />
          <b>{row.value}</b>
          <span>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function YAxis({ max, format, innerH }: { max: number; format: DashboardFormat; innerH: number }) {
  return (
    <>
      {[0, 0.5, 1].map((f) => {
        const y = PAD.top + innerH - f * innerH;
        return (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="ov-grid" />
            <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="ov-axis">
              {formatCompact(max * f, format)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function XLabels({ points, x, bucket }: { points: string[]; x: (i: number) => number; bucket: "day" | "week" }) {
  if (points.length === 0) return null;
  const idx = points.length <= 2 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  return (
    <>
      {[...new Set(idx)].map((i, n, all) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor={n === 0 ? "start" : n === all.length - 1 ? "end" : "middle"} className="ov-axis">
          {formatBucket(points[i], bucket)}
        </text>
      ))}
    </>
  );
}

/** Trend over time; one or more series on one axis, crosshair readout, arrow-key navigation. */
export function LineChart({ series, format, bucket, label }: { series: DashboardSeries[]; format: DashboardFormat; bucket: "day" | "week"; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const xs = series[0]?.points.map((p) => p.x) ?? [];
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.y))));
  const x = (i: number) => PAD.left + (xs.length <= 1 ? innerW / 2 : (i / (xs.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  function locate(event: PointerEvent<SVGSVGElement>) {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box || xs.length === 0) return;
    const px = ((event.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (xs.length - 1));
    setActive(Math.max(0, Math.min(xs.length - 1, i)));
  }

  function onKey(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setActive((current) => {
      const start = current ?? (event.key === "ArrowLeft" ? xs.length : -1);
      return Math.max(0, Math.min(xs.length - 1, start + (event.key === "ArrowRight" ? 1 : -1)));
    });
  }

  const tip: Tip =
    active === null
      ? null
      : {
          x: x(active),
          y: PAD.top,
          title: formatBucket(xs[active], bucket, true),
          rows: series.map((s, si) => ({ label: s.label, value: formatValue(s.points[active]?.y ?? 0, format), color: SERIES_COLORS[si] })),
        };

  return (
    <div className="ov-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label}. Use the left and right arrow keys to read each point.`}
        tabIndex={0}
        onPointerMove={locate}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <YAxis max={max} format={format} innerH={innerH} />
        <XLabels points={xs} x={x} bucket={bucket} />
        {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} className="ov-crosshair" />}
        {series.map((s, si) => {
          const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
          return (
            <g key={s.key}>
              <path d={d} pathLength={1} className="ov-line ov-draw" style={{ stroke: SERIES_COLORS[si] }} />
              {active !== null && s.points[active] && <circle cx={x(active)} cy={y(s.points[active].y)} r={4.5} className="ov-dot" style={{ fill: SERIES_COLORS[si] }} />}
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
      {series.length > 1 && <Legend items={series.map((s, si) => ({ label: s.label, color: SERIES_COLORS[si], shape: "line" }))} />}
    </div>
  );
}

/** Comparisons across time buckets (one series). Each bar is its own hover/focus target. */
export function BarChart({ series, format, bucket, label }: { series: DashboardSeries; format: DashboardFormat; bucket: "day" | "week"; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const points = series.points;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(0, ...points.map((p) => p.y)));
  const slot = innerW / Math.max(points.length, 1);
  const barW = Math.max(2, Math.min(28, slot - 2));
  const x = (i: number) => PAD.left + slot * i + (slot - barW) / 2;

  const tip: Tip =
    active === null
      ? null
      : { x: x(active) + barW / 2, y: PAD.top + innerH - (points[active].y / max) * innerH, title: formatBucket(points[active].x, bucket, true), rows: [{ label: series.label, value: formatValue(points[active].y, format), color: SERIES_COLORS[0] }] };

  return (
    <div className="ov-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label} onPointerLeave={() => setActive(null)}>
        <YAxis max={max} format={format} innerH={innerH} />
        <XLabels points={points.map((p) => p.x)} x={(i) => x(i) + barW / 2} bucket={bucket} />
        {points.map((p, i) => {
          const h = (p.y / max) * innerH;
          const top = PAD.top + innerH - h;
          const r = Math.min(4, barW / 2, h);
          // Rounded data-end, square baseline.
          const d = h <= 0 ? "" : `M${x(i)},${PAD.top + innerH} V${top + r} Q${x(i)},${top} ${x(i) + r},${top} H${x(i) + barW - r} Q${x(i) + barW},${top} ${x(i) + barW},${top + r} V${PAD.top + innerH} Z`;
          return (
            <g
              key={p.x}
              tabIndex={0}
              role="img"
              aria-label={`${formatBucket(p.x, bucket, true)}: ${formatValue(p.y, format)}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="ov-bar-hit"
            >
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill="transparent" />
              {d && <path d={d} className={`ov-bar ov-grow${active === i ? " is-active" : ""}`} style={{ fill: SERIES_COLORS[0] }} />}
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

/** Ranked categories as labelled horizontal bars (values printed — no hover needed). */
export function HBarChart({ segments, format }: { segments: DashboardSegment[]; format: DashboardFormat }) {
  const max = Math.max(1, ...segments.map((s) => s.value));
  return (
    <ul className="ov-hbars">
      {segments.map((segment) => (
        <li key={segment.label}>
          <span className="ov-hbar-label">{segment.href ? <Link href={segment.href}>{segment.label}</Link> : segment.label}</span>
          <span className="ov-hbar-track" aria-hidden="true">
            <span className="ov-hbar-fill ov-grow-x" style={{ width: `${Math.max(2, (segment.value / max) * 100)}%`, background: SERIES_COLORS[0] }} />
          </span>
          <span className="ov-hbar-value ha-num">{formatValue(segment.value, format)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Part-of-whole, at most five segments. The legend carries every value and share. */
export function DonutChart({ segments, format, label }: { segments: DashboardSegment[]; format: DashboardFormat; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const lengths = segments.map((segment) => (total ? (segment.value / total) * circumference : 0));
  const offsets = lengths.map((_, i) => lengths.slice(0, i).reduce((sum, l) => sum + l, 0));

  return (
    <div className="ov-donut">
      <svg viewBox="0 0 160 160" role="img" aria-label={`${label}: ${segments.map((s) => `${s.label} ${formatValue(s.value, format)}`).join(", ")}`}>
        <g transform="rotate(-90 80 80)">
          {segments.map((segment, i) => {
            const dash = `${Math.max(0, lengths[i] - 2)} ${circumference}`;
            return (
              <circle
                key={segment.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                strokeWidth={active === i ? 22 : 18}
                strokeDasharray={dash}
                strokeDashoffset={-offsets[i]}
                style={{ stroke: SERIES_COLORS[i % SERIES_COLORS.length], transition: "stroke-width 120ms ease-out" }}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              />
            );
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" className="ov-donut-total">
          {active === null ? formatValue(total, format) : formatValue(segments[active].value, format)}
        </text>
        <text x="80" y="96" textAnchor="middle" className="ov-axis">
          {active === null ? "Total" : segments[active].label}
        </text>
      </svg>
      <ul className="ov-donut-legend">
        {segments.map((segment, i) => (
          <li key={segment.label} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)}>
            <span className="ov-key-box" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} aria-hidden="true" />
            <span className="ov-donut-label">{segment.label}</span>
            <b className="ha-num">{formatValue(segment.value, format)}</b>
            <span className="ov-donut-share ha-num">{total ? Math.round((segment.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A limit: how much of a maximum is used. Tone and text both say when it's getting close. */
export function Gauge({ value, max, format, caption }: { value: number; max: number; format: DashboardFormat; caption?: string }) {
  const share = max > 0 ? value / max : 0;
  const tone = share >= 1 ? "is-danger" : share >= 0.8 ? "is-warning" : "";
  const status = max <= 0 ? "No funding set up" : share >= 1 ? "At or over your limit" : share >= 0.8 ? "Close to your limit" : "Within your limit";
  return (
    <div className="ov-gauge">
      <div className="ov-gauge-figures">
        <span className="ov-gauge-value ha-num">{formatValue(value, format)}</span>
        <span className="ha-muted">of {formatValue(max, format)}</span>
      </div>
      <div className={`ha-meter ov-gauge-meter ${tone}`} role="progressbar" aria-label={caption ?? "Usage"} aria-valuenow={Math.round(share * 100)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${Math.round(share * 100)}% — ${status}`}>
        <span className="ov-grow-x" style={{ width: `${Math.min(100, share * 100)}%` }} />
      </div>
      <div className="ov-gauge-status">
        <b>{max > 0 ? `${Math.round(share * 100)}% used` : "—"}</b> · {status}
      </div>
    </div>
  );
}

/** Pipeline stages, each bar showing its count and share of the first stage. */
export function Funnel({ segments, format }: { segments: DashboardSegment[]; format: DashboardFormat }) {
  const first = segments.reduce((max, s) => Math.max(max, s.value), 0) || 1;
  return (
    <ol className="ov-funnel">
      {segments.map((segment, i) => (
        <li key={segment.label}>
          <span className="ov-funnel-label">{segment.label}</span>
          <span className="ov-funnel-bar" aria-hidden="true">
            <span className="ov-grow-x" style={{ width: `${Math.max(2, (segment.value / first) * 100)}%`, background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
          </span>
          <span className="ov-hbar-value ha-num">{formatValue(segment.value, format)}</span>
        </li>
      ))}
    </ol>
  );
}

export function Legend({ items }: { items: { label: string; color: string; shape: "line" | "box" }[] }) {
  return (
    <ul className="ha-legend" aria-label="Legend">
      {items.map((item) => (
        <li key={item.label}>
          <span className={item.shape === "line" ? "ov-key-line" : "ov-key-box"} style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Every chart's data as a table — the colour- and hover-free way to read it. */
export function ChartTable({ series, segments, format, bucket, caption }: { series?: DashboardSeries[]; segments?: DashboardSegment[]; format: DashboardFormat; bucket: "day" | "week"; caption: string }) {
  const id = useId();
  const rows = useMemo(() => {
    if (series && series.length) {
      return series[0].points.map((p, i) => [formatBucket(p.x, bucket, true), ...series.map((s) => formatValue(s.points[i]?.y ?? 0, format))]);
    }
    return (segments ?? []).map((s) => [s.label, formatValue(s.value, format)]);
  }, [series, segments, format, bucket]);
  const head = series && series.length ? [bucket === "week" ? "Week" : "Day", ...series.map((s) => s.label)] : ["Category", "Value"];

  return (
    <div className="ha-table-wrap ov-table" aria-labelledby={id}>
      <table className="ha-table">
        <caption id={id} className="ha-visually-hidden">
          {caption}
        </caption>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={i > 0 ? "is-num" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i} className={i > 0 ? "is-num" : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * 96 + 2).toFixed(1)},${(26 - ((v - min) / span) * 22).toFixed(1)}`);
  const last = pts[pts.length - 1].split(",");
  return (
    <svg className="ov-spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts.join(" ")} className="ov-spark-line ov-draw" pathLength={1} />
      <circle cx={last[0]} cy={last[1]} r={2.5} className="ov-spark-dot" />
    </svg>
  );
}

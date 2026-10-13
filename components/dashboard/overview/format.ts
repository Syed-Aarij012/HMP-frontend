"use client";

import { useEffect, useState } from "react";
import type { DashboardFormat } from "@/types/dashboardOverview";

/** Full value, for KPI numbers, tooltips and tables. */
export function formatValue(value: number | null | undefined, format: DashboardFormat): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  switch (format) {
    case "money":
      return value.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: value >= 1000 || Number.isInteger(value) ? 0 : 2 });
    case "percent":
      return `${(value * 100).toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;
    case "days":
      return `${value.toLocaleString("en-GB", { maximumFractionDigits: 1 })} ${value === 1 ? "day" : "days"}`;
    default:
      return value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
  }
}

/** Compact value, for axis ticks: £12k, 1.2m. */
export function formatCompact(value: number, format: DashboardFormat): string {
  const compact = Math.abs(value) >= 1000 ? value.toLocaleString("en-GB", { notation: "compact", maximumFractionDigits: 1 }) : value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
  if (format === "money") return `£${compact}`;
  if (format === "percent") return `${Math.round(value * 100)}%`;
  return compact;
}

/** Bucket label: "13 Oct" for a day, "w/c 6 Oct" for a week. */
export function formatBucket(date: string, bucket: "day" | "week", long = false): string {
  const d = new Date(`${date}T00:00:00`);
  const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(long ? { year: "numeric" } : {}) });
  return bucket === "week" ? `w/c ${label}` : label;
}

export function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  const future = diff < 0;
  const abs = Math.abs(diff);
  const rel = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  if (abs < 60) return future ? "in a moment" : "just now";
  if (abs < 3600) return rel.format(Math.round((future ? 1 : -1) * (abs / 60)), "minute");
  if (abs < 86400) return rel.format(Math.round((future ? 1 : -1) * (abs / 3600)), "hour");
  if (abs < 7 * 86400) return rel.format(Math.round((future ? 1 : -1) * (abs / 86400)), "day");
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Counts a number up from its last value (250 ms, ease-out). Instant under reduced motion. */
export function useCountUp(target: number | null, duration = 250): number | null {
  const [shown, setShown] = useState<number | null>(target);

  useEffect(() => {
    if (target === null) {
      queueMicrotask(() => setShown(null));
      return;
    }
    if (prefersReducedMotion()) {
      queueMicrotask(() => setShown(target));
      return;
    }
    let frame = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (target - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return shown;
}

/** "Nice" axis maximum: 1, 2, 2.5 or 5 × 10ⁿ, never below 1. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

// Validated categorical palette (dataviz skill, light mode): fixed order, never cycled. Slots
// 3–5 sit below 3:1 on the surface, so every chart also carries direct labels / a table view.
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"] as const;

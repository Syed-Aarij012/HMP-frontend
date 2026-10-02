"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { apiFetch } from "@/lib/api-client";

const REPORTED_METRICS = new Set(["LCP", "CLS", "INP", "FCP", "TTFB"]);

/**
 * FR-C-004: Core Web Vitals budgets (§5 NFR-P-010) — real visitor-reported metrics via
 * Next's own built-in collector, posted to the new /web-vitals endpoint so
 * web-vitals:report can assess them against the SRS budget. Next also reports its own
 * custom metrics (e.g. "Next.js-hydration") alongside the standard five; only the standard
 * ones are forwarded, since the backend's budget table only has thresholds for those.
 *
 * Best-effort: a failed report must never surface to the visitor or affect the page.
 */
export default function WebVitalsReporter() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    if (!REPORTED_METRICS.has(metric.name)) return;

    apiFetch("/web-vitals", {
      method: "POST",
      auth: false,
      body: { metric: metric.name, value: metric.value, path: pathname },
    }).catch(() => {
      // Reporting is a bonus, never load-bearing.
    });
  });

  return null;
}

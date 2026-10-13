"use client";

// Matches "Dashboard Status" chip labels used elsewhere (DASHBOARD_LISTING_STATUS_META) so a
// dealer sees the same wording here as on their own listings table.
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_checks: "Awaiting review",
  live: "Live",
  under_offer: "Under offer",
  reserved: "Reserved",
  sold: "Sold",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

// Fixed status order (not count order) so a bar's position never jumps around as counts
// change week to week — a dealer builds muscle memory for "live is the 3rd bar".
const STATUS_ORDER = ["draft", "pending_checks", "live", "under_offer", "reserved", "sold", "withdrawn", "expired"];

// Single sequential hue (magnitude only — this is a ranked count-per-status breakdown, not a
// comparison needing per-bar identity) from the app's own established chart palette
// (DealerAnalyticsChart's "impressions" series) rather than introducing a new, unvalidated one.
const BAR_COLOR = "#2a78d6";

type Props = { breakdown: { value: string; count: number }[] };

export default function StatusBreakdownChart({ breakdown }: Props) {
  if (breakdown.length === 0) return null;

  const rows = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status] ?? status,
    count: breakdown.find((row) => row.value === status)?.count ?? 0,
  })).filter((row) => row.count > 0);

  if (rows.length === 0) return null;

  const max = Math.max(...rows.map((row) => row.count));

  return (
    <div role="img" aria-label="Listing count by status">
      {rows.map((row) => (
        <div key={row.status} className="flex align-center gap-10 mb-2">
          <div className="text-color-2" style={{ width: 120, flexShrink: 0, fontSize: 13 }}>
            {row.label}
          </div>
          <div style={{ flex: 1, background: "#f0f0ee", borderRadius: 4, height: 18, position: "relative" }}>
            <div
              style={{
                width: `${Math.max(4, (row.count / max) * 100)}%`,
                background: BAR_COLOR,
                height: "100%",
                borderRadius: 4,
                transition: "width 0.3s ease-in-out",
              }}
            />
          </div>
          <div style={{ width: 28, flexShrink: 0, fontSize: 13, fontWeight: 600, textAlign: "right" }}>{row.count}</div>
        </div>
      ))}
    </div>
  );
}

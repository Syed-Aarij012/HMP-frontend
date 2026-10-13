"use client";

import Link from "next/link";
import { useId, useMemo, useState, type FormEvent } from "react";
import { Card, EmptyState, StatusBadge, humanize } from "@/components/ui/kit";
import type { DashboardActionItem, DashboardActivityItem, DashboardChart, DashboardKpi, DashboardRange, DashboardRangeKey } from "@/types/dashboardOverview";
import type { RangeSelection } from "@/hooks/useDashboardOverview";
import { BarChart, ChartTable, DonutChart, Funnel, Gauge, HBarChart, LineChart, Sparkline } from "./charts";
import { formatValue, formatWhen, useCountUp } from "./format";

// ---------------------------------------------------------------- Date range

const PRESETS: { key: Exclude<DashboardRangeKey, "custom">; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

/** Presets as a segmented control, custom dates behind one more button. Scopes everything below. */
export function RangeSelector({ value, onChange, range }: { value: RangeSelection; onChange: (next: RangeSelection) => void; range: DashboardRange | null }) {
  const [customOpen, setCustomOpen] = useState(value.key === "custom");
  const [from, setFrom] = useState(value.from ?? range?.from ?? "");
  const [to, setTo] = useState(value.to ?? range?.to ?? "");
  const id = useId();

  function applyCustom(event: FormEvent) {
    event.preventDefault();
    if (from && to && from <= to) onChange({ key: "custom", from, to });
  }

  return (
    <div className="ov-range">
      <div className="ha-tabs">
        <div role="radiogroup" aria-label="Reporting period" style={{ display: "contents" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            role="radio"
            aria-checked={value.key === preset.key}
            className={value.key === preset.key ? "is-active" : undefined}
            onClick={() => {
              setCustomOpen(false);
              onChange({ key: preset.key });
            }}
          >
            {preset.label}
          </button>
        ))}
        </div>
        <button type="button" aria-pressed={value.key === "custom"} aria-expanded={customOpen} className={value.key === "custom" ? "is-active" : undefined} onClick={() => setCustomOpen(!customOpen)}>
          Custom
        </button>
      </div>
      {customOpen && (
        <form className="ov-range-custom" onSubmit={applyCustom}>
          <label htmlFor={`${id}-from`} className="ha-control-label">
            From
            <input id={`${id}-from`} type="date" className="ha-input ha-inline-select" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label htmlFor={`${id}-to`} className="ha-control-label">
            To
            <input id={`${id}-to`} type="date" className="ha-input ha-inline-select" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} required />
          </label>
          <button type="submit" className="ha-btn is-sm is-primary" disabled={!from || !to || from > to}>
            Apply
          </button>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- KPI card

function Change({ kpi }: { kpi: DashboardKpi }) {
  if (kpi.change_pct === null || kpi.previous === null) {
    return kpi.previous === 0 && (kpi.value ?? 0) > 0 ? <span className="ov-change is-up">New this period</span> : null;
  }
  const up = kpi.change_pct > 0;
  const flat = kpi.change_pct === 0;
  const unit = kpi.change_unit === "pts" ? " pts" : "%";
  return (
    <span className={`ov-change${flat ? "" : up ? " is-up" : " is-down"}`}>
      <span aria-hidden="true">{flat ? "–" : up ? "▲" : "▼"}</span> {flat ? "No change" : `${Math.abs(kpi.change_pct).toLocaleString("en-GB", { maximumFractionDigits: 1 })}${unit}`}
      <span className="ha-visually-hidden"> {flat ? "" : up ? "up" : "down"} on the previous period</span>
    </span>
  );
}

export function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const shown = useCountUp(kpi.value);
  const body = (
    <>
      <div className="ov-kpi-label">{kpi.label}</div>
      <div className="ov-kpi-value ha-num" aria-hidden="true">
        {formatValue(shown, kpi.format)}
      </div>
      <span className="ha-visually-hidden">{formatValue(kpi.value, kpi.format)}</span>
      <div className="ov-kpi-foot">
        <div>
          <Change kpi={kpi} />
          {kpi.hint && <div className="ha-sub">{kpi.hint}</div>}
          {kpi.change_pct !== null && !kpi.hint && <div className="ha-sub">vs previous period</div>}
        </div>
        {kpi.series && <Sparkline values={kpi.series} />}
      </div>
    </>
  );
  return kpi.href ? (
    <Link href={kpi.href} className="ha-card ov-kpi ov-enter">
      {body}
    </Link>
  ) : (
    <div className="ha-card ov-kpi ov-enter">{body}</div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="ha-card ov-kpi" aria-hidden="true">
      <div className="ha-skeleton" style={{ width: "50%" }} />
      <div className="ha-skeleton" style={{ height: 28, width: "70%" }} />
      <div className="ha-skeleton" style={{ width: "40%" }} />
    </div>
  );
}

// ---------------------------------------------------------------- Action needed

const SEVERITY_LABEL = { urgent: "Urgent", warning: "Soon", info: "FYI" } as const;

export function ActionPanel({ items, loading }: { items: DashboardActionItem[]; loading: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(() => [...items].sort((a, b) => ["urgent", "warning", "info"].indexOf(a.severity) - ["urgent", "warning", "info"].indexOf(b.severity)), [items]);
  const visible = showAll ? sorted : sorted.slice(0, 6);
  const urgent = items.filter((i) => i.severity === "urgent").length;

  return (
    <Card
      className="ov-actions ov-enter"
      title="Action needed"
      actions={items.length > 0 ? <span className={`ha-badge${urgent ? " is-danger" : " is-warning"}`}>{urgent ? `${urgent} urgent` : `${items.length} to look at`}</span> : undefined}
    >
      {loading && items.length === 0 ? (
        <div className="ha-card-body" aria-busy="true">
          <div className="ha-skeleton" />
          <div className="ha-skeleton" style={{ width: "80%" }} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="icon-carus-checkcircle" title="You're all caught up" text="Nothing needs your attention right now." />
      ) : (
        <>
          <ul className="ov-action-list">
            {visible.map((item) => {
              const content = (
                <>
                  <span className={`ov-severity is-${item.severity}`}>
                    <span aria-hidden="true">{item.severity === "urgent" ? "!" : item.severity === "warning" ? "◷" : "i"}</span>
                    <span className="ha-visually-hidden">{SEVERITY_LABEL[item.severity]}:</span>
                  </span>
                  <span className="ov-action-text">
                    <b>{item.title}</b>
                    {item.detail && <span className="ha-sub">{item.detail}</span>}
                  </span>
                  {item.href && <span className="ov-action-go" aria-hidden="true">→</span>}
                </>
              );
              return (
                <li key={item.key}>
                  {item.href ? (
                    <Link href={item.href} className="ov-action">
                      {content}
                    </Link>
                  ) : (
                    <div className="ov-action">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {sorted.length > 6 && (
            <div className="ha-card-body" style={{ paddingTop: 8 }}>
              <button type="button" className="ha-link-btn" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
                {showAll ? "Show fewer" : `Show all ${sorted.length}`}
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- Chart card

function chartHasData(chart: DashboardChart): boolean {
  if (chart.type === "gauge") return (chart.max ?? 0) > 0 || (chart.value ?? 0) > 0;
  if (chart.series) return chart.series.some((s) => s.points.some((p) => p.y > 0));
  return (chart.segments ?? []).some((s) => s.value > 0);
}

export function ChartCard({ chart, bucket }: { chart: DashboardChart; bucket: "day" | "week" }) {
  const [table, setTable] = useState(false);
  const hasData = chartHasData(chart);
  const tableable = chart.type !== "gauge" && hasData;

  return (
    <Card
      className="ov-chart-card ov-enter"
      title={chart.title}
      description={chart.caption}
      actions={
        <>
          {tableable && (
            <button type="button" className="ha-btn is-sm is-ghost" aria-pressed={table} onClick={() => setTable(!table)}>
              {table ? "Chart" : "Table"}
            </button>
          )}
          {chart.href && (
            <Link href={chart.href} className="ha-btn is-sm is-ghost">
              Details →
            </Link>
          )}
        </>
      }
    >
      <div className="ha-card-body">
        {!hasData && chart.type !== "gauge" ? (
          <EmptyState icon="icon-carus-listings" title="Nothing to show yet" text={chart.empty_text ?? "No data in this period."} />
        ) : table ? (
          <ChartTable series={chart.series} segments={chart.segments} format={chart.format} bucket={bucket} caption={chart.title} />
        ) : chart.type === "line" ? (
          <LineChart series={chart.series ?? []} format={chart.format} bucket={bucket} label={chart.title} />
        ) : chart.type === "bar" ? (
          <BarChart series={(chart.series ?? [])[0]} format={chart.format} bucket={bucket} label={chart.title} />
        ) : chart.type === "hbar" ? (
          <HBarChart segments={chart.segments ?? []} format={chart.format} />
        ) : chart.type === "donut" ? (
          <DonutChart segments={chart.segments ?? []} format={chart.format} label={chart.title} />
        ) : chart.type === "funnel" ? (
          <Funnel segments={chart.segments ?? []} format={chart.format} />
        ) : (
          <Gauge value={chart.value ?? 0} max={chart.max ?? 0} format={chart.format} caption={chart.caption} />
        )}
      </div>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <div className="ha-card ov-chart-card" aria-hidden="true">
      <div className="ha-card-head">
        <div className="ha-skeleton" style={{ width: 160, margin: 0 }} />
      </div>
      <div className="ha-card-body">
        <div className="ha-skeleton" style={{ height: 160, margin: 0 }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Recent activity

export function ActivityTable({ items, viewAll, loading }: { items: DashboardActivityItem[]; viewAll: { label: string; href: string } | null; loading: boolean }) {
  const [type, setType] = useState("");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const id = useId();
  const types = useMemo(() => [...new Map(items.map((i) => [i.type, i.type_label])).entries()], [items]);
  const rows = useMemo(() => {
    const filtered = type ? items.filter((i) => i.type === type) : items;
    return [...filtered].sort((a, b) => (order === "newest" ? 1 : -1) * String(b.at).localeCompare(String(a.at)));
  }, [items, type, order]);

  return (
    <Card
      className="ov-enter"
      title="Recent activity"
      actions={
        viewAll ? (
          <Link href={viewAll.href} className="ha-btn is-sm is-ghost">
            {viewAll.label} →
          </Link>
        ) : undefined
      }
    >
      {items.length > 0 && (
        <div className="ha-toolbar">
          {types.length > 1 && (
            <label className="ha-control-label" htmlFor={`${id}-type`}>
              <span className="ha-visually-hidden">Type</span>
              <select id={`${id}-type`} className="ha-select ha-inline-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All activity</option>
                {types.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="ha-toolbar-end">
            <label className="ha-control-label" htmlFor={`${id}-order`}>
              Sort
              <select id={`${id}-order`} className="ha-select ha-inline-select" value={order} onChange={(e) => setOrder(e.target.value as "newest" | "oldest")}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
            <span className="ha-result-count" aria-live="polite">
              {type ? `${rows.length} of ${items.length}` : `${items.length}`} event{items.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}
      {loading && items.length === 0 ? (
        <div className="ha-card-body" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ha-skeleton" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="icon-carus-clock" title="No activity yet" text="Your latest bids, offers, orders and updates will appear here." />
      ) : (
        <div className="ha-table-wrap">
          <table className="ha-table is-stacked">
            <caption className="ha-visually-hidden">Recent activity</caption>
            <thead>
              <tr>
                <th scope="col">What</th>
                <th scope="col">Status</th>
                <th scope="col" className="is-num">
                  Amount
                </th>
                <th scope="col">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td data-label="What">
                    <span className="ov-activity-type">{item.type_label}</span>
                    {item.href ? (
                      <Link href={item.href} className="ha-primary-text">
                        {item.title}
                      </Link>
                    ) : (
                      <span className="ha-primary-text">{item.title}</span>
                    )}
                    {item.detail && <div className="ha-sub">{humanize(item.detail)}</div>}
                  </td>
                  <td data-label="Status">{item.status ? <StatusBadge status={item.status} /> : <span className="ha-muted">—</span>}</td>
                  <td data-label="Amount" className="is-num">
                    {item.amount !== null ? formatValue(item.amount, "money") : <span className="ha-muted">—</span>}
                  </td>
                  <td data-label="When" className="ha-num" title={item.at ? new Date(item.at).toLocaleString("en-GB") : undefined}>
                    {formatWhen(item.at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

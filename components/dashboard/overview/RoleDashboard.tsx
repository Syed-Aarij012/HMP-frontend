"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import DashboardPage from "@/components/dashboard/DashboardPage";
import DealerPageBanner from "@/components/sections/dashboard/DealerPageBanner";
import { Card, EmptyState, Notice } from "@/components/ui/kit";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardOverview, type RangeSelection } from "@/hooks/useDashboardOverview";
import type { DashboardOverview } from "@/types/dashboardOverview";
import { ActionPanel, ActivityTable, ChartCard, ChartSkeleton, KpiCard, KpiSkeleton, RangeSelector } from "./widgets";

export function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export function periodSummary(data: DashboardOverview | null): string | undefined {
  if (!data) return undefined;
  const from = new Date(data.range.from).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const to = new Date(data.range.to).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `Showing ${from} – ${to}, compared with the ${data.range.days} days before.`;
}

/**
 * The dashboard body — key figures, action needed, charts, recent activity — for whichever page
 * hosts it (the user dashboard, or the Admin Panel overview). `extra` slots in after the main row.
 */
export function OverviewBody({ state, showQuickActions = true, extra }: {
  state: ReturnType<typeof useDashboardOverview>;
  showQuickActions?: boolean;
  extra?: ReactNode;
}) {
  const { data, loading, error, retry } = state;
  const refreshing = loading && data !== null;
  const bucket = data?.range.bucket ?? "day";

  return (
    <>
      {error && (
        <Notice tone="danger">
          {error}{" "}
          <button type="button" className="ha-link-btn" onClick={retry}>
            Try again
          </button>
        </Notice>
      )}

      {showQuickActions && data && data.quick_actions.length > 0 && (
        <div className="ov-quick" aria-label="Quick actions">
          {data.quick_actions.slice(0, 4).map((action) => (
            <Link key={action.href} href={action.href} className={`ha-btn${action.primary ? " is-primary" : ""}`}>
              {action.label}
            </Link>
          ))}
        </div>
      )}

      {data?.persona === "dealer" && <DealerPageBanner adCount={data.kpis.find((k) => k.key === "stock")?.value ?? 0} />}

      <div className={`ov-body${refreshing ? " is-refreshing" : ""}`} aria-busy={loading}>
        <section aria-label="Key figures" className="ov-kpis">
          {data ? data.kpis.map((kpi) => <KpiCard key={kpi.key} kpi={kpi} />) : !error && [0, 1, 2, 3].map((i) => <KpiSkeleton key={i} />)}
        </section>

        {error && !data ? (
          <Card>
            <EmptyState
              icon="icon-carus-close"
              title="Couldn't load the dashboard"
              text="Check your connection and try again."
              action={
                <button type="button" className="ha-btn is-primary" onClick={retry}>
                  Try again
                </button>
              }
            />
          </Card>
        ) : (
          <>
            <div className="ov-main">
              <ActionPanel items={data?.actions ?? []} loading={loading} />
              {data ? data.charts[0] && <ChartCard chart={data.charts[0]} bucket={bucket} /> : <ChartSkeleton />}
            </div>

            {extra}

            <div className="ov-charts">
              {data ? data.charts.slice(1).map((chart) => <ChartCard key={chart.key} chart={chart} bucket={bucket} />) : [0, 1].map((i) => <ChartSkeleton key={i} />)}
            </div>

            <ActivityTable items={data?.activity.items ?? []} viewAll={data?.activity.view_all ?? null} loading={loading} />
          </>
        )}
      </div>
    </>
  );
}

/**
 * Every role's home dashboard: status at a glance (KPIs with change vs the previous period),
 * what needs attention, trends, and the latest activity — driven by one reporting window.
 */
export default function RoleDashboard() {
  const { user } = useAuth();
  const [selection, setSelection] = useState<RangeSelection>({ key: "30d" });
  const state = useDashboardOverview(selection);
  const { data } = state;
  const firstName = (data?.name ?? user?.name ?? "").split(" ")[0];

  return (
    <DashboardPage
      eyebrow={data ? [data.persona_label, ...data.roles.filter((r) => r !== data.persona_label)].slice(0, 2).join(" · ") : "Dashboard"}
      title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
      description={periodSummary(data)}
      actions={<RangeSelector value={selection} onChange={setSelection} range={data?.range ?? null} />}
    >
      <OverviewBody state={state} />
    </DashboardPage>
  );
}

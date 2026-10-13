"use client";

import Link from "next/link";
import { useState } from "react";
import DashboardPage from "@/components/dashboard/DashboardPage";
import DealerPageBanner from "@/components/sections/dashboard/DealerPageBanner";
import { Card, EmptyState, Notice } from "@/components/ui/kit";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardOverview, type RangeSelection } from "@/hooks/useDashboardOverview";
import { ActionPanel, ActivityTable, ChartCard, ChartSkeleton, KpiCard, KpiSkeleton, RangeSelector } from "./widgets";

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

/**
 * Every role's home dashboard: status at a glance (KPIs with change vs the previous period),
 * what needs attention, trends, and the latest activity — driven by one reporting window.
 */
export default function RoleDashboard() {
  const { user } = useAuth();
  const [selection, setSelection] = useState<RangeSelection>({ key: "30d" });
  const { data, loading, error, retry } = useDashboardOverview(selection);
  const firstName = (data?.name ?? user?.name ?? "").split(" ")[0];
  const refreshing = loading && data !== null;
  const bucket = data?.range.bucket ?? "day";

  return (
    <DashboardPage
      eyebrow={data ? [data.persona_label, ...data.roles.filter((r) => r !== data.persona_label)].slice(0, 2).join(" · ") : "Dashboard"}
      title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
      description={data ? `Showing ${new Date(data.range.from).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(data.range.to).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, compared with the ${data.range.days} days before.` : undefined}
      actions={<RangeSelector value={selection} onChange={setSelection} range={data?.range ?? null} />}
    >
      {error && (
        <Notice tone="danger">
          {error}{" "}
          <button type="button" className="ha-link-btn" onClick={retry}>
            Try again
          </button>
        </Notice>
      )}

      {data && data.quick_actions.length > 0 && (
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
              title="Couldn't load your dashboard"
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

            <div className="ov-charts">
              {data ? data.charts.slice(1).map((chart) => <ChartCard key={chart.key} chart={chart} bucket={bucket} />) : [0, 1].map((i) => <ChartSkeleton key={i} />)}
            </div>

            <ActivityTable items={data?.activity.items ?? []} viewAll={data?.activity.view_all ?? null} loading={loading} />
          </>
        )}
      </div>
    </DashboardPage>
  );
}

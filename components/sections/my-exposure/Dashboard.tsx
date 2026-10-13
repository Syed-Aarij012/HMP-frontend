"use client";

import { useExposure } from "@/hooks/useExposure";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { ErrorNotice, LoadingRows, StatCard, Stats, formatMoney } from "@/components/ui/kit";

function Dashboard() {
  const { exposure, loading, error } = useExposure();

  return (
    <DashboardPage
      title="My exposure"
      description="What you've committed across every lot you're currently active on, and what's left before bidding is declined for insufficient funding."
    >
      {loading && <LoadingRows rows={2} label="Loading your exposure" />}
      {error && <ErrorNotice message={error} />}

      {!loading && !error && exposure && (
        <Stats>
          <StatCard label="Committed exposure" icon="icon-carus-shieldcheck" value={formatMoney(exposure.committedExposure)} note="Across your active lots" />
          <StatCard
            label="Available headroom"
            icon="icon-carus-power"
            value={formatMoney(exposure.availableHeadroom)}
            note={exposure.availableHeadroom <= 0 ? "No headroom left — new bids will be declined" : "Before bids are declined"}
            attention={exposure.availableHeadroom <= 0}
          />
        </Stats>
      )}
    </DashboardPage>
  );
}

export default Dashboard;

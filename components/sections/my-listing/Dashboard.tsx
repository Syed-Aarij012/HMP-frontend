"use client";

import DashboardListingsTable from "@/components/common/DashboardListingsTable";
import { useMyListings } from "@/hooks/useMyListings";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, ErrorNotice, LoadingTable, Notice } from "@/components/ui/kit";

function Dashboard({ submitted = false }: { submitted?: boolean }) {
  const { listings, loading, error } = useMyListings();

  return (
    <DashboardPage title="My listings" description="Everything you have for sale — edit, submit for review, renew or mark as sold.">
      {submitted && (
        <Notice tone="success">
          Your listing has been submitted for review. We&apos;ll check it and put it live — if anything needs changing,
          you&apos;ll see why here.
        </Notice>
      )}
      <Card>
        {loading && <LoadingTable label="Loading your listings" />}
        {error && <ErrorNotice message={error} />}
        {!loading && !error && <DashboardListingsTable initialListings={listings} showFilters />}
      </Card>
    </DashboardPage>
  );
}

export default Dashboard;

"use client";

import DashboardListingsTable from "@/components/common/DashboardListingsTable";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyListings } from "@/hooks/useMyListings";

function Dashboard({ submitted = false }: { submitted?: boolean }) {
  const { listings, loading, error } = useMyListings();

  return (
    <>
      <div id="themesflat-content">
        <DashboardToggle />
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="content-area">
                <main id="main" className="main-content">
                  <div className="tfcl-dashboard">
                    <h1 className="admin-title mb-3">My listing</h1>
                    {submitted && (
                      <div className="alert alert-success">
                        Your listing has been submitted for review. We&apos;ll check it and put it live — if anything needs
                        changing, you&apos;ll see why here.
                      </div>
                    )}
                    <div className="tfcl-dashboard-middle mt-2">
                      <div className="row">
                        <div className="tfcl-dashboard-middle-left col-md-12">
                          <div className="tfcl-dashboard-listing">
                            {loading && <p>Loading your listings...</p>}
                            {error && <div className="alert alert-danger">{error}</div>}
                            {!loading && !error && (
                              <DashboardListingsTable
                                initialListings={listings}
                                showFilters
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;

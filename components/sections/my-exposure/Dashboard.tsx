"use client";

import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useExposure } from "@/hooks/useExposure";

function Dashboard() {
  const { exposure, loading, error } = useExposure();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My exposure</h1>
                  <p className="text-color-1 mb-3">
                    What you&apos;ve committed across every lot you&apos;re currently active on, and
                    what&apos;s left before bidding is declined for insufficient funding.
                  </p>

                  {loading && <p>Loading your exposure...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && exposure && (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="tfcl-card">
                          <h4 className="mb-1">Committed exposure</h4>
                          <p className="fs-24 fw-6">£{exposure.committedExposure.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="tfcl-card">
                          <h4 className="mb-1">Available headroom</h4>
                          <p className="fs-24 fw-6">£{exposure.availableHeadroom.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

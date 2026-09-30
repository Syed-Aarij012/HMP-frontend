"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import DashboardToggle from "@/components/dashboard/DashboardToggle";

export default function InspectionLookup() {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!vehicleId.trim()) return;
    router.push(`/inspections/${vehicleId.trim()}`);
  }

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Vehicle inspection</h1>
                  <p className="text-color-1 mb-3">
                    Enter the vehicle ID to write or continue its condition report.
                  </p>

                  <form onSubmit={handleSubmit} className="tfcl-card p-3 flex gap-10">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Vehicle ID"
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                      required
                    />
                    <button type="submit" className="sc-button">
                      <span>Open</span>
                    </button>
                  </form>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

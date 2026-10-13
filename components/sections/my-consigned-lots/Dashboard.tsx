"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Badge,
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  ErrorNotice,
  LoadingTable,
  NoMatches,
  Notice,
  StatusBadge,
  formatMoney,
  useListControls,
} from "@/components/ui/kit";
import { useMyConsignedLots } from "@/hooks/useMyConsignedLots";
import { CONSIGNOR_FIXABLE, describeBlocker } from "@/lib/auctionPublishBlockers";
import type { AuctionLot } from "@/types/auction";

/**
 * A cataloged lot isn't in the live auction yet: it goes live once its VAT and V5C details are
 * in (the consignor's job) and an inspector has published a condition report and the auction
 * team publishes it. This says which of those is outstanding, and lets the consignor fill in
 * the details that are theirs to provide.
 */
function NextSteps({
  lot,
  onSave,
}: {
  lot: AuctionLot;
  onSave: (lotId: string, details: { vatStatus?: string; v5cStatus?: string; acquisitionCost?: number }) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [vatStatus, setVatStatus] = useState("");
  const [v5cStatus, setV5cStatus] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (lot.status !== "cataloged" || lot.publishBlockers === null) return null;

  const blockers = lot.publishBlockers;

  if (blockers.length === 0) {
    return <Badge tone="primary">Ready — waiting for the auction team to publish it</Badge>;
  }

  const yours = blockers.filter((code) => (CONSIGNOR_FIXABLE as string[]).includes(code));
  const needsCost = blockers.includes("acquisition_cost") || vatStatus === "margin_scheme";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const message = await onSave(lot.id, {
      vatStatus: vatStatus || undefined,
      v5cStatus: v5cStatus || undefined,
      acquisitionCost: acquisitionCost === "" ? undefined : Number(acquisitionCost),
    });
    setSaving(false);
    if (message) {
      setError(message);
    } else {
      setOpen(false);
      setVatStatus("");
      setV5cStatus("");
      setAcquisitionCost("");
    }
  }

  return (
    <div>
      <ul className="mb-1" style={{ paddingLeft: 18, fontSize: 13 }}>
        {blockers.map((code) => (
          <li key={code}>{describeBlocker(code)}</li>
        ))}
      </ul>

      {yours.length > 0 && !open && (
        <button type="button" className="ha-btn is-sm is-primary" onClick={() => setOpen(true)}>
          Complete details
        </button>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="ha-inline-edit mt-2" style={{ maxWidth: 320 }}>
          {blockers.includes("v5c_status") && (
            <select
              className="ha-select mb-2"
              aria-label="V5C status"
              value={v5cStatus}
              onChange={(e) => setV5cStatus(e.target.value)}
            >
              <option value="">V5C (logbook)...</option>
              <option value="present">I have the V5C</option>
              <option value="applied_for">I&apos;ve applied for a V5C</option>
            </select>
          )}
          {blockers.includes("vat_status") && (
            <select
              className="ha-select mb-2"
              aria-label="VAT status"
              value={vatStatus}
              onChange={(e) => setVatStatus(e.target.value)}
            >
              <option value="">VAT status...</option>
              <option value="qualifying">VAT qualifying</option>
              <option value="margin_scheme">Margin scheme</option>
            </select>
          )}
          {needsCost && (
            <input
              type="number"
              min="0"
              step="0.01"
              className="ha-input mb-2"
              aria-label="Acquisition cost in pounds"
              placeholder="Acquisition cost (£)"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
              required
            />
          )}
          {error && <Notice tone="danger">{error}</Notice>}
          <div className="ha-actions is-start">
            <button type="submit" className="ha-btn is-sm is-primary" disabled={saving} aria-busy={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="ha-btn is-sm is-ghost" disabled={saving} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const vehicleName = (lot: AuctionLot) =>
  lot.vehicle ? [lot.vehicle.year, lot.vehicle.make, lot.vehicle.model].filter(Boolean).join(" ") : "—";

function Dashboard() {
  const { lots, loading, error, updateCompliance } = useMyConsignedLots();
  const controls = useListControls<AuctionLot>({
    items: lots,
    search: (lot) => [vehicleName(lot), lot.saleName],
    filters: [
      { key: "status", label: "Status", get: (lot) => lot.status },
      {
        key: "blocked",
        label: "Readiness",
        allLabel: "Any readiness",
        get: (lot) => (lot.status === "cataloged" && (lot.publishBlockers?.length ?? 0) > 0 ? "needs" : "ok"),
        options: [
          { value: "needs", label: "Needs details" },
          { value: "ok", label: "Nothing outstanding" },
        ],
      },
    ],
  });

  return (
    <DashboardPage
      title="My consigned vehicles"
      description="Vehicles you've entered into auction, and anything still needed before they go live."
      actions={
        <Link href="/consign-vehicle" className="ha-btn is-primary">
          <i className="icon-carus-plus" aria-hidden="true" />
          Consign a vehicle
        </Link>
      }
    >
      <Card>
        {loading && <LoadingTable label="Loading your consigned vehicles" columns={5} />}
        {error && <ErrorNotice message={error} />}

        {!loading && !error && lots.length === 0 && (
          <EmptyState
            icon="icon-carus-car"
            title="Nothing consigned yet"
            text="You haven't consigned any vehicles to auction yet."
            action={
              <Link href="/consign-vehicle" className="ha-btn is-primary">
                Consign one now
              </Link>
            }
          />
        )}

        {!loading && !error && lots.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search by vehicle or sale" noun="vehicle" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Your consigned vehicles">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Status</th>
                    <th scope="col">What&apos;s needed to go live</th>
                    <th scope="col" className="is-num">Current price</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((lot) => (
                    <tr key={lot.id}>
                      <td data-label="Vehicle">
                        <div className="ha-primary-text">{vehicleName(lot)}</div>
                        <div className="ha-sub">{lot.saleName ?? "No sale yet"}</div>
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={lot.status} />
                      </td>
                      <td data-label="What's needed">
                        <NextSteps lot={lot} onSave={updateCompliance} />
                      </td>
                      <td data-label="Current price" className="is-num">
                        {lot.currentPrice !== null ? formatMoney(lot.currentPrice) : "—"}
                      </td>
                      <td data-label="" className="ha-right">
                        <Link href={`/auction/${lot.id}`} className="ha-btn is-sm is-ghost">
                          View lot
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </>
        )}
      </Card>
    </DashboardPage>
  );
}

export default Dashboard;

"use client";

import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Tabs } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { formatWhen } from "@/lib/superAdmin";

type ValuationStats = {
  window_days: number;
  count: number;
  by_model_version: Record<string, number>;
  by_confidence: Record<string, number>;
  by_licensed_source: Record<string, number>;
  model_vs_guide_divergence_pct: number | null;
  accuracy_mape_pct: number | null;
  accuracy_sample: number;
  recent: {
    id: number;
    vrm: string | null;
    mileage: number | null;
    private_sale_value: string | null;
    instant_offer_value: string | null;
    internal_value: string | null;
    licensed_value: string | null;
    confidence_band: string | null;
    model_version: string | null;
    achieved_price_feedback: string | null;
    created_at: string | null;
  }[];
};

type ReserveStats = {
  concluded_lots: number;
  reserve_met_rate_pct: number | null;
  avg_final_vs_reserve_pct: number | null;
  rule_recommended_lots: number;
  lots: {
    lot_id: string;
    vehicle: string;
    vrm: string | null;
    reserve: string;
    final_price: string | null;
    outcome: string;
    reserve_met: boolean;
    final_vs_reserve_pct: number | null;
    recommended_by_rule: string | null;
    closed_at: string | null;
  }[];
};

const money = (value: string | null) => (value === null ? "—" : `£${Number(value).toLocaleString("en-GB")}`);
const pct = (value: number | null) => (value === null ? "—" : `${value}%`);

function Figure({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="ha-card ha-stat" style={{ cursor: "default" }}>
      <div className="ha-stat-label">{label}</div>
      <div className="ha-stat-value">{value}</div>
      {note && <div className="ha-stat-note">{note}</div>}
    </div>
  );
}

function Breakdown({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  return (
    <div>
      <div className="ha-sub" style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {entries.length === 0 ? <span className="ha-sub">—</span> : (
        <div className="ha-chips">{entries.map(([key, n]) => <span key={key} className="ha-tag">{key.replace(/_/g, " ")}: {n}</span>)}</div>
      )}
    </div>
  );
}

const WINDOWS = ["7 days", "30 days", "90 days"] as const;

/**
 * SRS §2.2 Data & Pricing Analyst — "valuation model monitoring, reserve recommendation
 * oversight". Read-only.
 */
export default function PricingOversight() {
  const [windowLabel, setWindowLabel] = useState<(typeof WINDOWS)[number]>("30 days");
  const days = parseInt(windowLabel, 10);
  const valuations = useAdminResource<{ data: ValuationStats }>(`/pricing-oversight/valuations?days=${days}`);
  const reserves = useAdminResource<{ data: ReserveStats }>("/pricing-oversight/reserves");
  const v = valuations.data?.data;
  const r = reserves.data?.data;

  return (
    <SuperAdminShell title="Pricing oversight" intro="How the valuation model is performing, and how recommended reserves are faring at auction." actions={<Tabs label="Window" value={windowLabel} options={WINDOWS} onChange={setWindowLabel} />}>
      <Card title="Valuation model">
        {valuations.loading && !v && <LoadingRows />}
        {valuations.error && <ErrorNotice message={valuations.error} />}
        {v && (
          <div className="ha-card-body">
            <div className="ha-stats">
              <Figure label={`Valuations (${v.window_days} days)`} value={v.count.toLocaleString("en-GB")} />
              <Figure label="Model vs trade guide" value={pct(v.model_vs_guide_divergence_pct)} note="Average gap between the internal model and the licensed guide" />
              <Figure label="Accuracy (MAPE)" value={pct(v.accuracy_mape_pct)} note={`Against ${v.accuracy_sample} achieved prices`} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <Breakdown title="By model version" counts={v.by_model_version} />
              <Breakdown title="By confidence" counts={v.by_confidence} />
              <Breakdown title="By trade-guide source" counts={v.by_licensed_source} />
            </div>
          </div>
        )}
        {v && v.recent.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Vehicle</th>
                  <th>Private sale</th>
                  <th>Internal / guide</th>
                  <th>Instant offer</th>
                  <th>Achieved</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {v.recent.map((row) => (
                  <tr key={row.id}>
                    <td className="ha-sub">{formatWhen(row.created_at)}</td>
                    <td>{row.vrm ?? "—"}<div className="ha-sub">{row.mileage?.toLocaleString("en-GB") ?? "—"} mi</div></td>
                    <td>{money(row.private_sale_value)}</td>
                    <td>{money(row.internal_value)} / {money(row.licensed_value)}</td>
                    <td>{money(row.instant_offer_value)}</td>
                    <td>{money(row.achieved_price_feedback)}</td>
                    <td><Badge plain>{row.confidence_band ?? "—"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Reserve recommendations">
        {reserves.loading && !r && <LoadingRows />}
        {reserves.error && <ErrorNotice message={reserves.error} />}
        {r && (
          <div className="ha-card-body">
            <div className="ha-stats">
              <Figure label="Concluded lots with a reserve" value={r.concluded_lots} />
              <Figure label="Reserve met" value={pct(r.reserve_met_rate_pct)} />
              <Figure label="Final price vs reserve" value={pct(r.avg_final_vs_reserve_pct)} note="Average, where bidding happened" />
              <Figure label="Reserve set by a routing rule" value={r.rule_recommended_lots} />
            </div>
          </div>
        )}
        {r && r.lots.length === 0 && <EmptyState icon="icon-carus-sliders" title="No concluded lots yet" />}
        {r && r.lots.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>Reserve</th>
                  <th>Final</th>
                  <th>Outcome</th>
                  <th>Recommended by</th>
                </tr>
              </thead>
              <tbody>
                {r.lots.map((lot) => (
                  <tr key={lot.lot_id}>
                    <td>
                      <div className="ha-primary-text">{lot.vehicle || "—"}</div>
                      <div className="ha-sub">{lot.vrm ?? ""} · {formatWhen(lot.closed_at)}</div>
                    </td>
                    <td>{money(lot.reserve)}</td>
                    <td>
                      {money(lot.final_price)}
                      {lot.final_vs_reserve_pct !== null && <div className="ha-sub">{lot.final_vs_reserve_pct > 0 ? "+" : ""}{lot.final_vs_reserve_pct}%</div>}
                    </td>
                    <td><Badge tone={lot.reserve_met ? "success" : "warning"}>{lot.outcome.replace(/_/g, " ")}</Badge></td>
                    <td className="ha-sub">{lot.recommended_by_rule ?? "Seller / staff"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </SuperAdminShell>
  );
}

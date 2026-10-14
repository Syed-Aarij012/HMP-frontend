"use client";

import { Badge, Card, EmptyState, ErrorNotice, LoadingTable, formatDate } from "@/components/ui/kit";
import { useRoutingActivity } from "@/hooks/useRoutingRules";
import { channelLabel } from "./model";

/** Vehicles the rules have routed lately — by the daily sweep or by hand. */
export default function RecentActivity() {
  const { items, loading, error } = useRoutingActivity();

  return (
    <Card title="Recent routings" description="The latest vehicles the rules have sent somewhere. The daily sweep checks part-exchange cars that have a published condition report.">
      {loading && <LoadingTable rows={4} columns={4} label="Loading recent routings" />}
      {error && <ErrorNotice message={error} />}
      {!loading && !error && items.length === 0 && <EmptyState icon="icon-carus-clock" title="Nothing routed yet" text="When a rule sends a vehicle to auction or a fixed price, it shows up here." />}
      {items.length > 0 && (
        <div className="ha-table-wrap">
          <table className="ha-table is-stacked">
            <caption className="ha-visually-hidden">Recently routed vehicles</caption>
            <thead>
              <tr>
                <th scope="col">Vehicle</th>
                <th scope="col">Rule</th>
                <th scope="col">Sent to</th>
                <th scope="col">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Vehicle">
                    <div className="ha-primary-text">{item.vehicle || "Vehicle"}</div>
                    {item.vrm && <div className="ha-sub"><code>{item.vrm}</code></div>}
                  </td>
                  <td data-label="Rule">{item.rule ?? "—"}</td>
                  <td data-label="Sent to"><Badge tone="primary" plain>{channelLabel(item.channel)}</Badge></td>
                  <td data-label="When" className="ha-num">{item.at ? formatDate(item.at, { time: true }) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

"use client";

import { useState } from "react";
import Image from "@/components/common/AppImage";
import type { AuctionLotVehicle, ConditionReport, ConditionReportDamageItem } from "@/types/auction";

const SEVERITY_COLOR: Record<string, string> = {
  minor: "#f1c40f",
  moderate: "#e67e22",
  severe: "#e74c3c",
};

function HotspotPhoto({
  photoUrl,
  items,
}: {
  photoUrl: string;
  items: ConditionReportDamageItem[];
}) {
  const [active, setActive] = useState<ConditionReportDamageItem | null>(null);

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <Image src={photoUrl} alt="Damage annotation" width={480} height={320} style={{ width: "100%", height: "auto" }} />
      {items.map((item, index) =>
        item.frameX !== null && item.frameY !== null ? (
          <button
            key={index}
            type="button"
            onClick={() => setActive(item)}
            title={`${item.panel} — ${item.damageType} (${item.severity})`}
            style={{
              position: "absolute",
              left: `${item.frameX * 100}%`,
              top: `${item.frameY * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "2px solid #fff",
              background: SEVERITY_COLOR[item.severity] ?? "#999",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ) : null
      )}
      {active && (
        <div
          className="tfcl-card mt-2"
          style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "#fff", padding: 10 }}
        >
          <b className="text-capitalize">{active.panel}</b> — {active.damageType} ({active.severity})
          {active.repairCostBand && <div>Repair cost band: {active.repairCostBand}</div>}
          {active.cvSuggested && <div className="text-color-1">Flagged by CV pre-detection, inspector-confirmed.</div>}
        </div>
      )}
    </div>
  );
}

export default function ConditionReportSection({
  report,
  vehicle,
}: {
  report: ConditionReport;
  vehicle: AuctionLotVehicle | null;
}) {
  const pinned = report.damageItems.filter((item) => item.vehicleMediaId !== null);
  const unpinned = report.damageItems.filter((item) => item.vehicleMediaId === null);

  const byPhoto = new Map<number, ConditionReportDamageItem[]>();
  for (const item of pinned) {
    const list = byPhoto.get(item.vehicleMediaId!) ?? [];
    list.push(item);
    byPhoto.set(item.vehicleMediaId!, list);
  }

  return (
    <div className="tfcl-card mb-4">
      <h4 className="mb-2">Condition report</h4>
      <p className="text-color-1 mb-2">
        Grade {report.conditionGrade ?? "-"} / 5 &middot; Mechanical grade {report.mechanicalGrade ?? "-"}
        {report.publishedAt && ` · Inspected ${new Date(report.publishedAt).toLocaleDateString()}`}
      </p>
      {report.summaryText && <p className="mb-3">{report.summaryText}</p>}

      {byPhoto.size > 0 && (
        <div className="row mb-3">
          {Array.from(byPhoto.entries()).map(([mediaId, items]) => {
            const photo = vehicle?.photos.find((p) => p.id === mediaId);
            if (!photo) return null;
            return (
              <div className="col-md-6 mb-3" key={mediaId}>
                <HotspotPhoto photoUrl={photo.url} items={items} />
              </div>
            );
          })}
        </div>
      )}

      {unpinned.length > 0 && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Panel</th>
                <th>Damage</th>
                <th>Severity</th>
                <th>Repair cost band</th>
              </tr>
            </thead>
            <tbody>
              {unpinned.map((item, index) => (
                <tr key={index}>
                  <td className="text-capitalize">{item.panel}</td>
                  <td>{item.damageType}</td>
                  <td className="text-capitalize">{item.severity}</td>
                  <td>{item.repairCostBand ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report.damageItems.length === 0 && (
        <p className="tfcl-empty-data">No itemized damage recorded.</p>
      )}
    </div>
  );
}

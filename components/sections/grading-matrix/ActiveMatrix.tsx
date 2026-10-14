"use client";

import { Badge, Card, EmptyState, Notice, formatDate } from "@/components/ui/kit";
import type { GradingMatrixVersion } from "@/types/inspection";
import GradeBands from "./GradeBands";
import MatrixTable from "./MatrixTable";
import Simulator from "./Simulator";
import { bandsFromThresholds, useMountedNow, type FlatEntry } from "./model";

export const flatEntries = (version: GradingMatrixVersion): FlatEntry[] =>
  version.entries.map((e) => ({ panel: e.panel, damageType: e.damageType, severity: e.severity, points: e.points, band: e.repairCostBand }));

/** What is live right now, what's scheduled to replace it, and the history. */
export default function ActiveMatrix({ active, versions, onNewVersion, onCopy }: {
  active: GradingMatrixVersion | null;
  versions: GradingMatrixVersion[];
  onNewVersion: () => void;
  onCopy: () => void;
}) {
  const now = useMountedNow();
  const scheduled = versions.filter((v) => new Date(v.effectiveFrom).getTime() > now);

  if (!active) {
    return (
      <Card>
        <EmptyState
          icon="icon-carus-sliders"
          title="No grading matrix is live yet"
          text="Until one is published and approved, inspectors have nothing to score damage against. Draft the first version — a starter set gets you going in a minute."
          action={<button type="button" className="ha-btn is-primary" onClick={onNewVersion}>Draft the first version</button>}
        />
      </Card>
    );
  }

  const rules = flatEntries(active);
  const caps = bandsFromThresholds(active.gradeThresholds);

  return (
    <div className="ha-stack">
      {scheduled.map((version) => (
        <Notice key={version.id} tone="info">
          <b>{version.versionLabel}</b> is approved and takes over on {formatDate(version.effectiveFrom, { time: true })}. Until then, <b>{active.versionLabel}</b> stays live.
        </Notice>
      ))}

      <Card
        title={
          <span className="gm-live-title">
            {active.versionLabel} <Badge tone="success">Live now</Badge>
          </span>
        }
        description={`In use since ${formatDate(active.effectiveFrom, { time: true })}${active.draftedBy ? ` · drafted by ${active.draftedBy}` : ""}${active.approvedBy ? ` · approved by ${active.approvedBy}` : ""}`}
        actions={
          <>
            <button type="button" className="ha-btn" onClick={onCopy}>Use as a starting point</button>
            <button type="button" className="ha-btn is-primary" onClick={onNewVersion}>New version</button>
          </>
        }
      >
        <div className="ha-card-body">
          <h3 className="hd-card-title">Grade bands</h3>
          <GradeBands caps={caps} readOnly />
        </div>
      </Card>

      <div className="gm-two">
        <Card title="Damage points" description={`${rules.length} rules. Inspectors can only record damage that appears here.`}>
          <MatrixTable rules={rules} caption={`Damage points in ${active.versionLabel}`} />
        </Card>
        <Card title="Try it" description="See how this matrix would grade a car.">
          <div className="ha-card-body">
            <Simulator rules={rules} caps={caps} />
          </div>
        </Card>
      </div>

      {versions.length > 1 && (
        <Card title="Version history" description="Every published version. Reports keep the version they were graded with.">
          <div className="ha-table-wrap">
            <table className="ha-table is-stacked">
              <caption className="ha-visually-hidden">Published grading matrix versions</caption>
              <thead>
                <tr>
                  <th scope="col">Version</th>
                  <th scope="col">Status</th>
                  <th scope="col">Took effect</th>
                  <th scope="col" className="is-num">Rules</th>
                  <th scope="col">Approved by</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => {
                  const future = new Date(version.effectiveFrom).getTime() > now;
                  return (
                    <tr key={version.id}>
                      <td data-label="Version" className="ha-primary-text">{version.versionLabel}</td>
                      <td data-label="Status">{version.isActive ? <Badge tone="success">Live</Badge> : future ? <Badge tone="primary">Scheduled</Badge> : <Badge plain>Replaced</Badge>}</td>
                      <td data-label="Took effect" className="ha-num">{formatDate(version.effectiveFrom, { time: true })}</td>
                      <td data-label="Rules" className="is-num">{version.entriesCount ?? "—"}</td>
                      <td data-label="Approved by">
                        {version.approvedBy ?? "—"}
                        {version.draftedBy && <div className="ha-sub">Drafted by {version.draftedBy}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

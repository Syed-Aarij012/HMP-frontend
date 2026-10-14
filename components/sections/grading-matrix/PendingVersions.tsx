"use client";

import { useState } from "react";
import { Badge, Card, EmptyState, ErrorNotice, Modal, formatDate } from "@/components/ui/kit";
import type { GradingMatrixVersion } from "@/types/inspection";
import { flatEntries } from "./ActiveMatrix";
import GradeBands from "./GradeBands";
import MatrixTable from "./MatrixTable";
import { bandsFromThresholds, diffAgainst, useMountedNow } from "./model";

/** Versions waiting for a second Quality Supervisor — with what they change, so it's an informed yes. */
export default function PendingVersions({ pending, active, userId, onApprove, approvingId, error, onNewVersion }: {
  pending: GradingMatrixVersion[];
  active: GradingMatrixVersion | null;
  userId: number | null;
  onApprove: (id: number) => Promise<boolean>;
  approvingId: number | null;
  error: string | null;
  onNewVersion: () => void;
}) {
  const now = useMountedNow();
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<GradingMatrixVersion | null>(null);

  if (pending.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="icon-carus-checkcircle"
          title="Nothing is waiting for approval"
          text="When a supervisor submits a new version it appears here for a second supervisor to review and approve."
          action={<button type="button" className="ha-btn" onClick={onNewVersion}>Draft a new version</button>}
        />
      </Card>
    );
  }

  return (
    <div className="ha-stack">
      {error && <ErrorNotice message={error} />}
      {pending.map((version) => {
        const mine = userId !== null && version.approvedByUserId === userId;
        const diff = active ? diffAgainst({ entries: version.entries, thresholds: version.gradeThresholds }, { entries: active.entries, thresholds: active.gradeThresholds }) : null;
        const open = reviewing === version.id;
        const startsPast = new Date(version.effectiveFrom).getTime() <= now;

        return (
          <Card
            key={version.id}
            title={
              <span className="gm-live-title">
                {version.versionLabel} <Badge tone="warning">Awaiting approval</Badge>
              </span>
            }
            description={`Drafted by ${mine ? "you" : (version.draftedBy ?? "a supervisor")} · starts ${formatDate(version.effectiveFrom, { time: true })} · ${version.entries.length} rules`}
            actions={
              <>
                <button type="button" className="ha-btn" aria-expanded={open} onClick={() => setReviewing(open ? null : version.id)}>
                  {open ? "Hide details" : "Review details"}
                </button>
                <button type="button" className="ha-btn is-primary" disabled={mine || approvingId === version.id} onClick={() => setConfirming(version)}>
                  Approve…
                </button>
              </>
            }
          >
            <div className="ha-card-body">
              {mine && (
                <p className="ha-hint" style={{ marginTop: 0 }}>
                  <b>You drafted this version</b>, so a different Quality Supervisor has to approve it — that&apos;s the four-eyes rule for grading changes.
                </p>
              )}
              {diff ? (
                <ul className="gm-diff" aria-label={`Changes compared with ${active?.versionLabel}`}>
                  <li><b className="ha-num">{diff.added}</b> rule{diff.added === 1 ? "" : "s"} added</li>
                  <li><b className="ha-num">{diff.changed}</b> changed</li>
                  <li><b className="ha-num">{diff.removed}</b> removed</li>
                  <li>Grade bands {diff.bandsChanged ? <b>changed</b> : "unchanged"}</li>
                  <li className="ha-sub">compared with live {active?.versionLabel}</li>
                </ul>
              ) : (
                <p className="ha-sub mb-0">Nothing is live yet, so this would be the first matrix.</p>
              )}
              {open && (
                <div className="mt-4">
                  <h3 className="hd-card-title">Grade bands</h3>
                  <GradeBands caps={bandsFromThresholds(version.gradeThresholds)} readOnly />
                </div>
              )}
            </div>
            {open && <MatrixTable rules={flatEntries(version)} caption={`Damage points in ${version.versionLabel}`} />}
            {startsPast && (
              <div className="ha-card-body" style={{ paddingTop: 0 }}>
                <p className="ha-hint mb-0">Its start time has passed, so it goes live the moment it&apos;s approved.</p>
              </div>
            )}
          </Card>
        );
      })}

      <Modal
        open={confirming !== null}
        onClose={() => approvingId === null && setConfirming(null)}
        title={`Approve ${confirming?.versionLabel ?? ""}?`}
        description={
          confirming
            ? new Date(confirming.effectiveFrom).getTime() <= now
              ? "Approving publishes it straight away. Inspections started from now on will be graded with it. Reports already published keep the version they used."
              : `Approving publishes it. Inspections started after ${formatDate(confirming.effectiveFrom, { time: true })} will be graded with it; until then the current matrix stays live.`
            : undefined
        }
        footer={
          <>
            <button type="button" className="ha-btn" onClick={() => setConfirming(null)} disabled={approvingId !== null}>Not yet</button>
            <button
              type="button"
              className="ha-btn is-primary"
              disabled={approvingId !== null}
              aria-busy={approvingId !== null}
              onClick={async () => {
                if (confirming && (await onApprove(confirming.id))) setConfirming(null);
              }}
            >
              {approvingId !== null ? "Approving…" : "Approve and publish"}
            </button>
          </>
        }
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, ErrorNotice, LoadingRows, Notice, Tabs } from "@/components/ui/kit";
import { useAuth } from "@/contexts/AuthContext";
import { useGradingMatrixWorkspace } from "@/hooks/useGradingMatrix";
import ActiveMatrix from "./ActiveMatrix";
import DraftEditor from "./DraftEditor";
import HowItWorks from "./HowItWorks";
import PendingVersions from "./PendingVersions";
import { bandsFromThresholds, rowsFromEntries } from "./model";

type View = "live" | "pending" | "new";
const VIEWS: readonly View[] = ["live", "pending", "new"];

const STORAGE_KEY = "hmp_gm_draft_v1";

/**
 * FR-A-020/021: the grading matrix — what's live, what's awaiting a second approver, and a guided
 * editor for the next version. Quality Supervisors (and Super Admins) only.
 */
export default function GradingMatrixAdmin() {
  const { user } = useAuth();
  const workspace = useGradingMatrixWorkspace();
  const { active, versions, pending, loading, error } = workspace;
  const [view, setView] = useState<View>("live");
  const [justSubmitted, setJustSubmitted] = useState(false);

  function startFromLive() {
    if (!active) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ label: `${active.versionLabel} (revised)`, effectiveFrom: "", caps: bandsFromThresholds(active.gradeThresholds), rows: rowsFromEntries(active.entries), copied: true }),
      );
    } catch {
      // Storage unavailable — they can use "Copy the live matrix" in the editor instead.
    }
    setView("new");
  }

  return (
    <DashboardPage
      title="Grading matrix"
      description="The scoring rules behind every Condition Grade. Review what's live, approve a colleague's changes, or draft the next version."
    >
      <HowItWorks />

      {justSubmitted && view === "pending" && (
        <Notice tone="success" onDismiss={() => setJustSubmitted(false)}>
          Submitted. It&apos;s waiting below for a different Quality Supervisor to approve — nothing changes for inspectors until then.
        </Notice>
      )}

      <div className="gm-tabs">
        <Tabs
          label="Grading matrix"
          value={view}
          options={VIEWS}
          onChange={(next) => {
            setView(next);
            setJustSubmitted(false);
          }}
          labels={{ live: "Live matrix", pending: `Awaiting approval${pending.length ? ` (${pending.length})` : ""}`, new: "New version" }}
        />
      </div>

      {loading && (
        <Card>
          <LoadingRows rows={5} label="Loading the grading matrix" />
        </Card>
      )}
      {error && !loading && <ErrorNotice message={error} />}

      {!loading && !error && view === "live" && <ActiveMatrix active={active} versions={versions} onNewVersion={() => setView("new")} onCopy={startFromLive} />}

      {!loading && !error && view === "pending" && (
        <PendingVersions
          pending={pending}
          active={active}
          userId={user?.id ?? null}
          onApprove={workspace.approve}
          approvingId={workspace.approvingId}
          error={workspace.approveError}
          onNewVersion={() => setView("new")}
        />
      )}

      {!loading && !error && view === "new" && (
        <DraftEditor
          active={active}
          onSubmit={workspace.draft}
          drafting={workspace.drafting}
          error={workspace.draftError}
          onSubmitted={() => {
            setJustSubmitted(true);
            setView("pending");
          }}
        />
      )}
    </DashboardPage>
  );
}

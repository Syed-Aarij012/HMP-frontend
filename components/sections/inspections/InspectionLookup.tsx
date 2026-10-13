"use client";

import Link from "next/link";
import { useInspectionAssignments } from "@/hooks/useInspectionAssignments";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, DataTable, DataToolbar, EmptyState, ErrorNotice, LoadingTable, NoMatches, formatDate, useListControls } from "@/components/ui/kit";

type Task = ReturnType<typeof useInspectionAssignments>["assignments"][number];

/**
 * SRS §2.2 P6: "write access limited to assigned inspection tasks" — the inspector's work list.
 * Each task is a vehicle a Quality Supervisor has assigned to them; there's no way to open one
 * that isn't (the API refuses it as well).
 */
export default function InspectionLookup() {
  const { assignments, loading, error } = useInspectionAssignments("assigned");
  const controls = useListControls<Task>({
    items: assignments,
    search: (task) => [task.vehicle.title, task.vehicle.vrm, task.note, task.assigned_by],
    sorts: [
      { value: "oldest", label: "Oldest first", compare: (a, b) => (a.assigned_at ?? "").localeCompare(b.assigned_at ?? "") },
      { value: "newest", label: "Newest first", compare: (a, b) => (b.assigned_at ?? "").localeCompare(a.assigned_at ?? "") },
    ],
  });

  return (
    <DashboardPage title="My inspections" description="The vehicles assigned to you. Open one to capture it and write its condition report.">
      <Card>
        {loading && <LoadingTable label="Loading your tasks" />}
        {error && <ErrorNotice message={error} />}
        {!loading && !error && assignments.length === 0 && (
          <EmptyState icon="icon-carus-checkcircle" title="Nothing assigned right now" text="A Quality Supervisor assigns inspections. New tasks appear here." />
        )}

        {assignments.length > 0 && (
          <>
            <DataToolbar controls={controls} searchPlaceholder="Search vehicle, registration or note" noun="task" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Inspections assigned to you">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Registration</th>
                    <th scope="col">Assigned</th>
                    <th scope="col">Note</th>
                    <th scope="col">
                      <span className="ha-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((task) => (
                    <tr key={task.id}>
                      <td data-label="Vehicle" className="ha-primary-text">
                        {task.vehicle.title || "Vehicle"}
                      </td>
                      <td data-label="Registration">{task.vehicle.vrm ? <code>{task.vehicle.vrm}</code> : "—"}</td>
                      <td data-label="Assigned">
                        {task.assigned_at ? formatDate(task.assigned_at) : "—"}
                        {task.assigned_by && <div className="ha-sub">by {task.assigned_by}</div>}
                      </td>
                      <td data-label="Note">{task.note ?? <span className="ha-muted">—</span>}</td>
                      <td data-label="" className="ha-right">
                        <Link href={`/inspections/${task.vehicle.id}`} className="ha-btn is-sm is-primary">
                          Inspect
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

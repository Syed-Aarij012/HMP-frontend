"use client";

import { Fragment, useState, type FormEvent } from "react";
import { useMyTransportJobs } from "@/hooks/useDriverTransportJobs";
import type { TransportJob } from "@/types/postSale";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Notice, LoadingTable, EmptyState, DataTable, StatusBadge } from "@/components/ui/kit";

const EXCEPTION_CODES = [
  { value: "vehicle_not_ready", label: "Vehicle not ready" },
  { value: "access_denied", label: "Access denied" },
  { value: "customer_unavailable", label: "Customer unavailable" },
  { value: "vehicle_damaged", label: "Vehicle damaged" },
  { value: "breakdown", label: "Breakdown" },
  { value: "address_incorrect", label: "Address incorrect" },
  { value: "weather_delay", label: "Weather delay" },
  { value: "other", label: "Other" },
];

function addressLine(address: TransportJob["pickup_address"]) {
  return [address.line1, address.postcode].filter(Boolean).join(", ") || "-";
}

type ActivePanel = { jobId: number; kind: "collect" | "deliver" | "exception" } | null;

/**
 * FR-F-002: the carrier driver's own view of their assigned transport jobs — collection
 * (photos + GPS), delivery (photos + signature), a manual position ping, and raising an
 * exception. Previously these actions existed only as raw API endpoints
 * (TransportJobController); this is the first UI that reaches them. Logistics staff
 * (manage-logistics) land on the same page and see every job, not just one carrier's.
 */
export default function Dashboard() {
  const { jobs, loading, error, actionError, busyId, collect, deliver, updatePosition, reportException } = useMyTransportJobs();
  const [panel, setPanel] = useState<ActivePanel>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [signedBy, setSignedBy] = useState("");
  const [exceptionCode, setExceptionCode] = useState(EXCEPTION_CODES[0].value);
  const [exceptionNotes, setExceptionNotes] = useState("");

  function closePanel() {
    setPanel(null);
    setPhotoFiles([]);
    setSignedBy("");
    setExceptionNotes("");
  }

  async function handleCollect(event: FormEvent, jobId: number) {
    event.preventDefault();
    const ok = await collect(jobId, photoFiles);
    if (ok) closePanel();
  }

  async function handleDeliver(event: FormEvent, jobId: number) {
    event.preventDefault();
    const ok = await deliver(jobId, photoFiles, signedBy);
    if (ok) closePanel();
  }

  async function handleException(event: FormEvent, jobId: number) {
    event.preventDefault();
    const ok = await reportException(jobId, exceptionCode, exceptionNotes);
    if (ok) closePanel();
  }

  return (
    <DashboardPage title="My transport jobs" description="Collections and deliveries assigned to you. Record collection and delivery with photos, and let us know straight away if something goes wrong.">
      {loading && <LoadingTable label="Loading your transport jobs" />}
      {error && <Notice tone="danger">{error}</Notice>}
      {actionError && <Notice tone="danger">{actionError}</Notice>}

      {!loading && !error && jobs.length === 0 && (
        <EmptyState icon="icon-carus-map" title="No jobs right now" text="Collections and deliveries assigned to you will appear here." />
      )}

      {jobs.length > 0 && (
        <DataTable caption="Your transport jobs">
            <thead>
              <tr>
                <th scope="col">Job</th>
                <th scope="col">Pickup</th>
                <th scope="col">Dropoff</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="ha-visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <Fragment key={job.id}>
                  <tr key={job.id}>
                    <td data-label="Job" className="ha-num">#{job.id}</td>
                    <td data-label="Pickup">{addressLine(job.pickup_address)}</td>
                    <td data-label="Dropoff">{addressLine(job.dropoff_address)}</td>
                    <td data-label="Status"><StatusBadge status={job.status} /></td>
                    <td data-label=""><div className="ha-row-actions">
                      {job.status === "assigned" && (
                        <button
                          type="button"
                          className="ha-btn is-sm is-primary"
                          disabled={busyId === job.id}
                          onClick={() => setPanel({ jobId: job.id, kind: "collect" })}
                        >
                          <span>Record collection</span>
                        </button>
                      )}
                      {job.status === "in_transit" && (
                        <>
                          <button
                            type="button"
                            className="ha-btn is-sm"
                            disabled={busyId === job.id}
                            onClick={() => updatePosition(job.id)}
                          >
                            <span>Update position</span>
                          </button>
                          <button
                            type="button"
                            className="ha-btn is-sm is-primary"
                            disabled={busyId === job.id}
                            onClick={() => setPanel({ jobId: job.id, kind: "deliver" })}
                          >
                            <span>Record delivery</span>
                          </button>
                        </>
                      )}
                      {(job.status === "assigned" || job.status === "in_transit") && (
                        <button
                          type="button"
                          className="ha-btn is-sm is-danger"
                          disabled={busyId === job.id}
                          onClick={() => setPanel({ jobId: job.id, kind: "exception" })}
                        >
                          <span>Report an issue</span>
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                  {panel?.jobId === job.id && (
                    <tr>
                      <td colSpan={5}>
                        <div className="ha-inline-edit">
                          {panel.kind === "collect" && (
                            <form onSubmit={(e) => handleCollect(e, job.id)}>
                              <h3 className="ha-primary-text mb-3" style={{ fontSize: 15 }}>Record collection</h3>
                              <div className="ha-field">
                                <label htmlFor={`collect-photos-${job.id}`}>Collection condition photos</label>
                                <input
                                  id={`collect-photos-${job.id}`}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="ha-input"
                                  onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                                />
                              </div>
                              <p className="ha-sub mb-3">Your current location will be recorded automatically.</p>
                              <div className="ha-actions is-start">
                                <button type="submit" className="ha-btn is-primary" disabled={busyId === job.id} aria-busy={busyId === job.id}>{busyId === job.id ? "Saving…" : "Confirm collection"}</button>
                                <button type="button" className="ha-btn is-ghost" onClick={closePanel}>Cancel</button>
                              </div>
                            </form>
                          )}
                          {panel.kind === "deliver" && (
                            <form onSubmit={(e) => handleDeliver(e, job.id)}>
                              <h3 className="ha-primary-text mb-3" style={{ fontSize: 15 }}>Record delivery</h3>
                              <div className="ha-field">
                                <label htmlFor={`deliver-photos-${job.id}`}>Delivery condition photos</label>
                                <input
                                  id={`deliver-photos-${job.id}`}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="ha-input"
                                  onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                                />
                              </div>
                              <div className="ha-field">
                                <label htmlFor={`signed-by-${job.id}`}>Signed by</label>
                                <input
                                  id={`signed-by-${job.id}`}
                                  type="text"
                                  className="ha-input"
                                  placeholder="Recipient's name"
                                  value={signedBy}
                                  onChange={(e) => setSignedBy(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="ha-actions is-start">
                                <button type="submit" className="ha-btn is-primary" disabled={busyId === job.id} aria-busy={busyId === job.id}>{busyId === job.id ? "Saving…" : "Confirm delivery"}</button>
                                <button type="button" className="ha-btn is-ghost" onClick={closePanel}>Cancel</button>
                              </div>
                            </form>
                          )}
                          {panel.kind === "exception" && (
                            <form onSubmit={(e) => handleException(e, job.id)}>
                              <h3 className="ha-primary-text mb-3" style={{ fontSize: 15 }}>Report an issue</h3>
                              <div className="ha-field">
                                <label htmlFor={`exception-code-${job.id}`}>What happened?</label>
                                <select
                                  id={`exception-code-${job.id}`}
                                  className="ha-select"
                                  value={exceptionCode}
                                  onChange={(e) => setExceptionCode(e.target.value)}
                                >
                                  {EXCEPTION_CODES.map((code) => (
                                    <option key={code.value} value={code.value}>
                                      {code.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="ha-field">
                                <label htmlFor={`exception-notes-${job.id}`}>Notes (optional)</label>
                                <textarea
                                  id={`exception-notes-${job.id}`}
                                  className="ha-textarea"
                                  value={exceptionNotes}
                                  onChange={(e) => setExceptionNotes(e.target.value)}
                                />
                              </div>
                              <div className="ha-actions is-start">
                                <button type="submit" className="ha-btn is-primary" disabled={busyId === job.id} aria-busy={busyId === job.id}>{busyId === job.id ? "Sending…" : "Report issue"}</button>
                                <button type="button" className="ha-btn is-ghost" onClick={closePanel}>Cancel</button>
                              </div>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </DataTable>
      )}
    </DashboardPage>
  );
}

"use client";

import { Fragment, useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useMyTransportJobs } from "@/hooks/useDriverTransportJobs";
import type { TransportJob } from "@/types/postSale";

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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My transport jobs</h1>
                  <p className="text-color-2 mb-3">
                    Collections and deliveries assigned to you. Record collection and delivery with photos, and let us know
                    straight away if something goes wrong.
                  </p>

                  {loading && <p>Loading your transport jobs...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  {actionError && <div className="alert alert-danger">{actionError}</div>}

                  {!loading && !error && jobs.length === 0 && (
                    <p className="tfcl-empty-data">No transport jobs assigned to you right now.</p>
                  )}

                  {jobs.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Pickup</th>
                            <th>Dropoff</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.map((job) => (
                            <Fragment key={job.id}>
                              <tr key={job.id}>
                                <td>{job.id}</td>
                                <td>{addressLine(job.pickup_address)}</td>
                                <td>{addressLine(job.dropoff_address)}</td>
                                <td className="text-capitalize">{job.status.replace("_", " ")}</td>
                                <td className="flex gap-10" style={{ flexWrap: "wrap" }}>
                                  {job.status === "assigned" && (
                                    <button
                                      type="button"
                                      className="sc-button"
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
                                        className="sc-button"
                                        disabled={busyId === job.id}
                                        onClick={() => updatePosition(job.id)}
                                      >
                                        <span>Update position</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="sc-button"
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
                                      className="sc-button"
                                      disabled={busyId === job.id}
                                      onClick={() => setPanel({ jobId: job.id, kind: "exception" })}
                                    >
                                      <span>Report an issue</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                              {panel?.jobId === job.id && (
                                <tr>
                                  <td colSpan={5}>
                                    <div className="tfcl-card p-3">
                                      {panel.kind === "collect" && (
                                        <form onSubmit={(e) => handleCollect(e, job.id)}>
                                          <h4 className="mb-2">Record collection</h4>
                                          <div className="form-group mb-2">
                                            <label htmlFor={`collect-photos-${job.id}`}>Collection condition photos</label>
                                            <input
                                              id={`collect-photos-${job.id}`}
                                              type="file"
                                              accept="image/*"
                                              multiple
                                              className="form-control"
                                              onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                                            />
                                          </div>
                                          <p className="fs-13 text-color-2 mb-2">Your current location will be recorded automatically.</p>
                                          <div className="flex gap-10">
                                            <button type="submit" className="sc-button" disabled={busyId === job.id}>
                                              <span>{busyId === job.id ? "Saving..." : "Confirm collection"}</span>
                                            </button>
                                            <button type="button" className="sc-button" onClick={closePanel}>
                                              <span>Cancel</span>
                                            </button>
                                          </div>
                                        </form>
                                      )}
                                      {panel.kind === "deliver" && (
                                        <form onSubmit={(e) => handleDeliver(e, job.id)}>
                                          <h4 className="mb-2">Record delivery</h4>
                                          <div className="form-group mb-2">
                                            <label htmlFor={`deliver-photos-${job.id}`}>Delivery condition photos</label>
                                            <input
                                              id={`deliver-photos-${job.id}`}
                                              type="file"
                                              accept="image/*"
                                              multiple
                                              className="form-control"
                                              onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                                            />
                                          </div>
                                          <div className="form-group mb-2">
                                            <label htmlFor={`signed-by-${job.id}`}>Signed by</label>
                                            <input
                                              id={`signed-by-${job.id}`}
                                              type="text"
                                              className="form-control"
                                              placeholder="Recipient's name"
                                              value={signedBy}
                                              onChange={(e) => setSignedBy(e.target.value)}
                                              required
                                            />
                                          </div>
                                          <div className="flex gap-10">
                                            <button type="submit" className="sc-button" disabled={busyId === job.id}>
                                              <span>{busyId === job.id ? "Saving..." : "Confirm delivery"}</span>
                                            </button>
                                            <button type="button" className="sc-button" onClick={closePanel}>
                                              <span>Cancel</span>
                                            </button>
                                          </div>
                                        </form>
                                      )}
                                      {panel.kind === "exception" && (
                                        <form onSubmit={(e) => handleException(e, job.id)}>
                                          <h4 className="mb-2">Report an issue</h4>
                                          <div className="form-group mb-2">
                                            <label htmlFor={`exception-code-${job.id}`}>What happened?</label>
                                            <select
                                              id={`exception-code-${job.id}`}
                                              className="form-control"
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
                                          <div className="form-group mb-2">
                                            <label htmlFor={`exception-notes-${job.id}`}>Notes (optional)</label>
                                            <textarea
                                              id={`exception-notes-${job.id}`}
                                              className="form-control"
                                              value={exceptionNotes}
                                              onChange={(e) => setExceptionNotes(e.target.value)}
                                            />
                                          </div>
                                          <div className="flex gap-10">
                                            <button type="submit" className="sc-button" disabled={busyId === job.id}>
                                              <span>{busyId === job.id ? "Sending..." : "Report issue"}</span>
                                            </button>
                                            <button type="button" className="sc-button" onClick={closePanel}>
                                              <span>Cancel</span>
                                            </button>
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
                      </table>
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { downloadFile } from "@/lib/api-client";
import type { usePostSaleRecords } from "@/hooks/usePostSaleRecords";
import { useTransportJob } from "@/hooks/useTransportJob";
import type { PostSaleOrderRef, TransportJob } from "@/types/postSale";

// Module F post-sale sections shared by trade orders (my-trade-orders) and retail direct-buy
// orders (my-orders), so both journeys book, track, collect and download the same way.

const STEPS: { status: TransportJob["status"]; label: string }[] = [
  { status: "quoted", label: "Quoted" },
  { status: "booked", label: "Booked" },
  { status: "assigned", label: "Carrier assigned" },
  { status: "in_transit", label: "In transit" },
  { status: "delivered", label: "Delivered" },
  { status: "pod_confirmed", label: "Confirmed" },
];

const money = (value: string | number) => `£${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-");

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4" style={{ borderTop: "1px solid #e5e5e5", paddingTop: 16 }}>
      <h3 className="mb-2">{title}</h3>
      {children}
    </section>
  );
}

function Tracker({ job }: { job: TransportJob }) {
  const reached = STEPS.findIndex((step) => step.status === job.status);

  return (
    <>
      <ol style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 0, listStyle: "none", margin: "0 0 12px" }}>
        {STEPS.map((step, index) => (
          <li
            key={step.status}
            style={{
              padding: "4px 10px",
              borderRadius: 14,
              fontSize: 13,
              background: index <= reached ? "#405FF2" : "#eee",
              color: index <= reached ? "#fff" : "#666",
            }}
          >
            {step.label}
          </li>
        ))}
      </ol>

      {job.status === "exception" && (
        <div className="alert alert-danger">
          There is a problem with this delivery ({(job.exception_code ?? "unknown").replace(/_/g, " ")}). Our logistics team is looking into it.
        </div>
      )}

      {job.eta_at && job.status === "in_transit" && (
        <p>
          <b>Estimated arrival:</b> {when(job.eta_at)}
        </p>
      )}
      {job.last_position && (
        <p className="text-color-2">
          Last seen at {job.last_position.lat.toFixed(3)}, {job.last_position.lng.toFixed(3)} ({when(job.last_position.at)}).{" "}
          <a
            href={`https://www.openstreetmap.org/?mlat=${job.last_position.lat}&mlon=${job.last_position.lng}#map=11/${job.last_position.lat}/${job.last_position.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            View on map
          </a>
        </p>
      )}
      <p className="text-color-2">
        {job.pickup_address.postcode} &rarr; {job.dropoff_address.postcode}
        {job.distance_miles ? ` (about ${Number(job.distance_miles).toFixed(0)} road miles)` : ""} &middot; {money(job.quote_amount)}
      </p>

      {job.events && job.events.length > 0 && (
        <ul className="text-color-2" style={{ paddingLeft: 18 }}>
          {[...job.events].reverse().map((event, index) => (
            <li key={index}>
              {when(event.created_at)} — {event.event_type.replace(/_/g, " ")}
              {event.signed_by ? ` (received by ${event.signed_by})` : ""}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * FR-F-001/002: quote, book and track delivery — for a trade order or a paid retail order.
 * `defaultPickup` prefills where the vehicle is collected from when the platform knows it.
 */
export function TransportSection({
  jobId,
  order,
  defaultPickup = "",
  onChanged,
}: {
  jobId: number | null;
  order: PostSaleOrderRef;
  defaultPickup?: string;
  onChanged: () => void;
}) {
  const { job, loading, error, busy, requestQuote, book } = useTransportJob(jobId, order, onChanged);
  const [pickup, setPickup] = useState(defaultPickup);
  const [dropoff, setDropoff] = useState("");
  const [enclosed, setEnclosed] = useState(false);
  const [chosen, setChosen] = useState<number | undefined>(undefined);

  if (loading) return <p>Loading transport...</p>;

  return (
    <Section title="Delivery">
      {error && <div className="alert alert-danger">{error}</div>}

      {!job && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            requestQuote({ pickupPostcode: pickup, dropoffPostcode: dropoff, vehicleClass: "car", isRunner: true, transportType: enclosed ? "enclosed" : "open" });
          }}
        >
          <p className="text-color-2">Get quotes from our carrier panel to have the vehicle delivered to you.</p>
          <div className="flex gap-10 align-center" style={{ flexWrap: "wrap" }}>
            <input className="form-control" style={{ flex: "0 0 180px" }} placeholder="Collect from (postcode)" value={pickup} onChange={(e) => setPickup(e.target.value)} required />
            <input className="form-control" style={{ flex: "0 0 180px" }} placeholder="Deliver to (postcode)" value={dropoff} onChange={(e) => setDropoff(e.target.value)} required />
            <label>
              <input type="checkbox" checked={enclosed} onChange={(e) => setEnclosed(e.target.checked)} /> Enclosed transport
            </label>
            <button type="submit" className="sc-button" disabled={busy}>
              <span>{busy ? "Getting quotes..." : "Get quotes"}</span>
            </button>
          </div>
        </form>
      )}

      {job && (
        <>
          <Tracker job={job} />

          {job.status === "quoted" && (
            <div>
              {job.carrier_quotes && job.carrier_quotes.length > 0 ? (
                <table className="table">
                  <tbody>
                    {job.carrier_quotes.map((quote, index) => (
                      <tr key={quote.carrier_id}>
                        <td>
                          <label style={{ cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="carrier"
                              checked={(chosen ?? job.carrier_quotes?.[0].carrier_id) === quote.carrier_id}
                              onChange={() => setChosen(quote.carrier_id)}
                            />{" "}
                            {quote.carrier} {index === 0 && <b style={{ color: "#27ae60" }}>(cheapest)</b>}
                          </label>
                        </td>
                        <td>{money(quote.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-color-2">Indicative price {money(job.quote_amount)} (we could not measure this route, so this is a flat estimate).</p>
              )}
              <button type="button" className="sc-button" disabled={busy} onClick={() => book(chosen ?? job.carrier_quotes?.[0]?.carrier_id)}>
                <span>{busy ? "Booking..." : "Book delivery"}</span>
              </button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

/** FR-F-010: the collector's release code and QR, shown once payment has cleared. */
export function ReleaseSection({ releaseNoteId, release }: { releaseNoteId: number | null; release: ReturnType<typeof usePostSaleRecords>["release"] }) {
  if (!releaseNoteId) {
    return (
      <Section title="Collection">
        <p className="text-color-2">Your release code will appear here once your payment has cleared.</p>
      </Section>
    );
  }

  return (
    <Section title="Collection">
      {!release && <p>Loading...</p>}
      {release && release.status === "held" && (
        <div className="alert alert-danger">Release is on hold{release.hold_reason ? `: ${release.hold_reason.replace(/_/g, " ")}` : ""}. Please contact support.</div>
      )}
      {release && release.status === "released" && <p>Vehicle released on {when(release.released_at)}.</p>}
      {release && release.status === "pending" && release.release_code && (
        <div className="flex gap-20 align-center" style={{ flexWrap: "wrap" }}>
          {release.release_qr_svg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Release QR code"
              width={160}
              height={160}
              src={`data:image/svg+xml;utf8,${encodeURIComponent(release.release_qr_svg)}`}
            />
          )}
          <div>
            <p className="mb-1">Show this at the gate together with photo ID:</p>
            <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4 }}>{release.release_code}</p>
            <p className="text-color-2">Only the named collector can collect this vehicle.</p>
          </div>
        </div>
      )}
      {release?.handover_checklist && (
        <ul className="text-color-2" style={{ paddingLeft: 18 }}>
          {Object.entries(release.handover_checklist).map(([key, value]) => (
            <li key={key}>
              {key.replace(/_/g, " ")}: {value ? "yes" : "no"}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** FR-F-012: the order's document vault — every entry a real PDF download. */
export function DocumentsSection({ documents }: { documents: ReturnType<typeof usePostSaleRecords>["documents"] }) {
  const [error, setError] = useState<string | null>(null);

  if (!documents) return null;

  const rows: { label: string; url: string; retain: string; file: string }[] = [
    ...(documents.distance_selling_pack
      ? [{ label: "Distance-selling information & cancellation pack", url: documents.distance_selling_pack.download_url, retain: documents.distance_selling_pack.retain_until, file: "distance-selling-pack.pdf" }]
      : []),
    ...documents.invoices.map((doc) => ({ label: `Invoice ${doc.invoice_number}`, url: doc.download_url, retain: doc.retain_until, file: `invoice-${doc.invoice_number}.pdf` })),
    ...(documents.release_note ? [{ label: "Release note", url: documents.release_note.download_url, retain: documents.release_note.retain_until, file: "release-note.pdf" }] : []),
    ...(documents.condition_report ? [{ label: "Condition report", url: documents.condition_report.download_url, retain: documents.condition_report.retain_until, file: "condition-report.pdf" }] : []),
    { label: "MOT history", url: documents.mot_history_download.download_url, retain: documents.mot_history_download.retain_until, file: "mot-history.pdf" },
    ...(documents.title_transfer ? [{ label: "V5C / keeper change", url: documents.title_transfer.download_url, retain: documents.title_transfer.retain_until, file: "keeper-change.pdf" }] : []),
    ...(documents.proof_of_delivery ? [{ label: "Proof of delivery", url: documents.proof_of_delivery.download_url, retain: documents.proof_of_delivery.retain_until, file: "proof-of-delivery.pdf" }] : []),
    ...documents.vehicle_documents.map((doc) => ({ label: `${doc.type.replace(/_/g, " ")}: ${doc.original_name}`, url: doc.download_url, retain: doc.retain_until, file: doc.original_name })),
  ];

  return (
    <Section title="Documents">
      {error && <div className="alert alert-danger">{error}</div>}
      <table className="table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.url}>
              <td>{row.label}</td>
              <td className="text-color-2">Kept until {row.retain}</td>
              <td>
                <button type="button" className="sc-button" onClick={() => downloadFile(row.url, row.file).catch(() => setError("That document could not be downloaded."))}>
                  <span>Download</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}


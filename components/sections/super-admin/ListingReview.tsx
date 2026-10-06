"use client";

import Link from "next/link";
import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import JustifiedAction from "./JustifiedAction";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Modal, useToast, type Tone } from "@/components/admin/ui";
import { hasRole, useAuth } from "@/contexts/AuthContext";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { apiFetch, describeApiError, downloadFile } from "@/lib/api-client";
import { DOCUMENT_TYPE_LABELS, formatWhen, humanize, type ModerationDetail } from "@/lib/superAdmin";

const STATUS_TONE: Record<string, Tone> = { pending_checks: "warning", live: "success", sold: "dark", draft: "neutral", withdrawn: "neutral" };
const RESULT_TONE: Record<string, Tone> = { pass: "success", clear: "success", fail: "danger", flagged: "warning" };

const VEHICLE_FIELDS: [key: string, label: string][] = [
  ["current_vrm", "Registration"],
  ["vin", "VIN"],
  ["make", "Make"],
  ["model", "Model"],
  ["derivative", "Derivative"],
  ["year", "Year"],
  ["first_registered_at", "First registered"],
  ["current_mileage", "Mileage"],
  ["body_type", "Body type"],
  ["fuel_type", "Fuel"],
  ["transmission", "Transmission"],
  ["drivetrain", "Drivetrain"],
  ["colour", "Colour"],
  ["doors", "Doors"],
  ["seats", "Seats"],
  ["engine_capacity_cc", "Engine (cc)"],
  ["power_bhp", "Power (bhp)"],
  ["co2_gpkm", "CO₂ (g/km)"],
  ["previous_owners", "Previous owners"],
  ["service_history", "Service history"],
  ["mot_expiry_at", "MOT expires"],
  ["tax_status", "Tax"],
  ["v5c_status", "V5C (logbook)"],
  ["vat_status", "VAT status"],
  ["provenance_status", "Provenance"],
];

function DetailGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="ha-dl">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value === null || value === undefined || value === "" ? "—" : value}</dd>
        </div>
      ))}
    </dl>
  );
}

type Decision = "approve" | "decline" | null;

/**
 * FR-C-001 PendingChecks → Live: everything a moderator needs to judge one listing — the car,
 * its photos and video, documents, provenance and condition checks, the seller, the history,
 * and what would stop it going live — with the approve / decline decision.
 */
export default function ListingReview({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data, loading, error, reload } = useAdminResource<{ data: ModerationDetail }>(`/moderation/listings/${listingId}`);
  const [decision, setDecision] = useState<Decision>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const d = data?.data;

  async function decide() {
    if (!decision) return;
    setBusy(true);
    setDecisionError(null);
    try {
      await apiFetch(`/moderation/listings/${listingId}/${decision}`, {
        method: "POST",
        body: decision === "approve" ? { note: text.trim() || null } : { reason: text.trim() },
      });
      notify(decision === "approve" ? "Approved — the listing is live." : "Declined — sent back to the seller.");
      setDecision(null);
      setText("");
      reload();
    } catch (err) {
      setDecisionError(describeApiError(err, "Could not record the decision."));
    } finally {
      setBusy(false);
    }
  }

  async function download(doc: ModerationDetail["documents"][number]) {
    try {
      await downloadFile(doc.download_path, doc.original_name);
    } catch (err) {
      notify(describeApiError(err, "Could not download that document."), { error: true });
    }
  }

  if (loading && !d) return <SuperAdminShell title="Listing review"><Card><LoadingRows rows={6} /></Card></SuperAdminShell>;
  if (error || !d) return <SuperAdminShell title="Listing review"><Card><ErrorNotice message={error ?? "Listing not found."} /></Card></SuperAdminShell>;

  const { listing, seller, vehicle } = d;
  const awaiting = listing.status === "pending_checks";
  const photos = d.media.filter((m) => m.type === "still" || m.type === "spin_frame");
  const videos = d.media.filter((m) => m.type === "video");

  return (
    <SuperAdminShell
      title={listing.title}
      intro={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Badge tone={STATUS_TONE[listing.status] ?? "neutral"}>{listing.status === "pending_checks" ? "awaiting review" : humanize(listing.status)}</Badge>
          <span>£{Number(listing.price).toLocaleString("en-GB")}</span>
          <span>· {vehicle.current_vrm ?? "No VRM"}</span>
          <span>· listed by {seller.name ?? "—"}</span>
          <Link href="/admin/review">← Back to queue</Link>
        </span>
      }
      actions={
        <>
          <a href={`/listing-detail-v1/${listing.id}`} target="_blank" rel="noreferrer" className="ha-btn">
            Open public page
          </a>
          {awaiting && (
            <>
              <button type="button" className="ha-btn is-danger" onClick={() => { setText(""); setDecision("decline"); }}>
                Decline
              </button>
              <button type="button" className="ha-btn is-primary" onClick={() => { setText(""); setDecision("approve"); }}>
                Approve &amp; publish
              </button>
            </>
          )}
          {hasRole(user, "super_admin") && !listing.taken_down_at && listing.status !== "sold" && (
            <JustifiedAction label="Take down" title="Take listing down" description="Withdraws it and blocks the seller from relisting." path={`/admin/listings/${listing.id}/takedown`} fourEyes danger onDone={reload} />
          )}
        </>
      }
    >
      {awaiting && d.blockers.length > 0 && (
        <div className="ha-alert is-danger">
          <b>Can&apos;t go live yet:</b>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {d.blockers.map((b) => <li key={b.code}>{b.message}</li>)}
          </ul>
        </div>
      )}
      {awaiting && d.blockers.length === 0 && (
        <div className="ha-alert is-info">All automated checks pass. Review the photos and documents below, then approve or decline.</div>
      )}
      {listing.status === "draft" && listing.review_note && (
        <div className="ha-alert is-warning">
          <b>Declined{listing.reviewed_by ? ` by ${listing.reviewed_by}` : ""}{listing.reviewed_at ? ` on ${formatWhen(listing.reviewed_at)}` : ""}:</b> {listing.review_note}
        </div>
      )}
      {listing.taken_down_at && (
        <div className="ha-alert is-danger"><b>Taken down {formatWhen(listing.taken_down_at)}:</b> {listing.takedown_reason}</div>
      )}

      <div className="ha-review-grid">
        <div>
          <Card title={`Photos & video (${d.media.length})`}>
            <div className="ha-card-body">
              {d.media.length === 0 && <EmptyState icon="icon-carus-imagessquare" title="No photos or video" />}
              {photos.length > 0 && (
                <div className="ha-gallery">
                  {photos.map((m) => (
                    <button key={m.id} type="button" className="ha-thumb" onClick={() => m.url && setLightbox(m.url)} aria-label="Enlarge photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {m.url && <img src={m.url} alt="" />}
                      {m.qa_status === "failed" && <span className="ha-thumb-flag" title={m.qa_message ?? undefined}>QA failed</span>}
                    </button>
                  ))}
                </div>
              )}
              {videos.map((m) => m.url && (
                <video key={m.id} src={m.url} controls preload="metadata" style={{ width: "100%", borderRadius: 10, marginTop: 12, background: "#000" }} />
              ))}
            </div>
          </Card>

          <Card title="Vehicle details">
            <div className="ha-card-body">
              <DetailGrid items={VEHICLE_FIELDS.map(([key, label]) => {
                const value = vehicle[key];
                const shown = key === "current_mileage" && typeof value === "number" ? `${value.toLocaleString("en-GB")} mi` : typeof value === "string" ? humanize(value) : value;
                return [label, shown as React.ReactNode];
              })} />
              {vehicle.features.length > 0 && (
                <>
                  <div className="ha-sub" style={{ margin: "16px 0 6px", fontWeight: 600 }}>Features</div>
                  <div className="ha-chips">{vehicle.features.map((f) => <span key={f} className="ha-tag">{f}</span>)}</div>
                </>
              )}
              {listing.description && (
                <>
                  <div className="ha-sub" style={{ margin: "16px 0 6px", fontWeight: 600 }}>Seller&apos;s description</div>
                  <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{listing.description}</p>
                </>
              )}
            </div>
          </Card>

          <Card title={`Documents (${d.documents.length})`}>
            {d.documents.length === 0 ? (
              <EmptyState icon="icon-carus-listings" title="No documents uploaded" text="The seller hasn't attached a V5C, MOT or service history." />
            ) : (
              <div className="ha-table-wrap">
                <table className="ha-table">
                  <tbody>
                    {d.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="ha-primary-text">{DOCUMENT_TYPE_LABELS[doc.type] ?? humanize(doc.type)}</div>
                          <div className="ha-sub">{doc.original_name} · {(doc.size_bytes / 1024).toFixed(0)} KB</div>
                        </td>
                        <td className="ha-sub">Uploaded {formatWhen(doc.uploaded_at)}{doc.uploaded_by ? ` by ${doc.uploaded_by}` : ""}</td>
                        <td className="ha-right">
                          <button type="button" className="ha-btn is-sm" onClick={() => download(doc)}>Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title="Seller">
            <div className="ha-card-body">
              <DetailGrid items={[
                ["Name", seller.name],
                ["Type", seller.kind === "dealer" ? "Dealer" : "Private seller"],
                ["Email", seller.email],
                ["Phone", seller.phone],
                ["Identity (KYC)", seller.kyc_status ? <Badge tone={seller.kyc_status === "verified" ? "success" : "warning"}>{seller.kyc_status}</Badge> : null],
                ["Account", seller.account_status ? <Badge tone={seller.account_status === "active" ? "success" : "danger"}>{seller.account_status}</Badge> : null],
                ["Member since", formatWhen(seller.member_since)],
                ["Other listings", seller.other_listings],
                ...(seller.organization ? [["Dealer group", `${seller.organization.name} (KYB ${seller.organization.kyb_status})`] as [string, React.ReactNode]] : []),
              ]} />
            </div>
          </Card>

          <Card title="Provenance checks">
            {d.provenance_checks.length === 0 ? (
              <EmptyState icon="icon-carus-shieldcheck" title="No checks run yet" />
            ) : (
              <div className="ha-table-wrap">
                <table className="ha-table">
                  <tbody>
                    {d.provenance_checks.map((c) => (
                      <tr key={c.check_type}>
                        <td className="ha-primary-text" style={{ textTransform: "capitalize" }}>{humanize(c.check_type)}</td>
                        <td><Badge tone={RESULT_TONE[c.result] ?? "neutral"}>{c.result}</Badge></td>
                        <td className="ha-sub ha-right">{formatWhen(c.checked_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Condition report">
            <div className="ha-card-body">
              {d.condition_report ? (
                <DetailGrid items={[
                  ["Grade", d.condition_report.condition_grade],
                  ["Mechanical", d.condition_report.mechanical_grade],
                  ["Version", d.condition_report.version],
                  ["Published", formatWhen(d.condition_report.published_at)],
                ]} />
              ) : (
                <span className="ha-sub">No published condition report.</span>
              )}
            </div>
          </Card>

          <Card title="History">
            <div className="ha-card-body">
              {d.history.length === 0 && <span className="ha-sub">No status changes yet.</span>}
              <ol className="ha-timeline">
                {d.history.map((h, i) => (
                  <li key={i}>
                    <div><b>{humanize(h.from ?? "created")}</b> → <b>{humanize(h.to)}</b></div>
                    <div className="ha-sub">{formatWhen(h.at)}{h.by ? ` · ${h.by}` : ""}{h.reason ? ` · ${humanize(h.reason)}` : ""}</div>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={decision !== null}
        onClose={() => !busy && setDecision(null)}
        title={decision === "approve" ? "Approve and publish" : "Decline listing"}
        description={decision === "approve" ? "The listing goes live straight away." : "It goes back to the seller as a draft, with your reason, so they can fix it and resubmit."}
        footer={
          <>
            <button type="button" className="ha-btn" onClick={() => setDecision(null)} disabled={busy}>Cancel</button>
            <button
              type="button"
              className={`ha-btn ${decision === "approve" ? "is-primary" : "is-danger-solid"}`}
              onClick={decide}
              disabled={busy || (decision === "decline" && text.trim().length < 10)}
            >
              {busy ? "Working..." : decision === "approve" ? "Approve & publish" : "Decline"}
            </button>
          </>
        }
      >
        {decision === "approve" && d.blockers.length > 0 && (
          <div className="ha-alert is-warning">The checks above will stop it going live until they&apos;re resolved.</div>
        )}
        <div className="ha-field">
          <label htmlFor="decision-text">{decision === "approve" ? "Note (optional, internal)" : "What the seller needs to fix"}</label>
          <textarea
            id="decision-text"
            className="ha-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={decision === "decline" ? "e.g. The photos don't show the damage mentioned in the description." : ""}
            maxLength={2000}
          />
          {decision === "decline" && <div className="ha-hint">At least 10 characters — the seller sees this.</div>}
        </div>
        {decisionError && <div className="ha-alert is-danger" role="alert">{decisionError}</div>}
      </Modal>

      <Modal open={lightbox !== null} onClose={() => setLightbox(null)} title="Photo" wide>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {lightbox && <img src={lightbox} alt="" style={{ width: "100%", borderRadius: 10 }} />}
      </Modal>
    </SuperAdminShell>
  );
}

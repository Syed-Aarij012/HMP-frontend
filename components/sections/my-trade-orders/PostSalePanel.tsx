"use client";

import { useState } from "react";
import { DocumentsSection, ReleaseSection, Section, TransportSection } from "@/components/sections/post-sale/PostSaleSections";
import { usePostSaleRecords } from "@/hooks/usePostSaleRecords";
import type { TradeOrder } from "@/types/auction";

const money = (value: string | number) => `£${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-");

function ClaimsSection({ order, records }: { order: TradeOrder; records: ReturnType<typeof usePostSaleRecords> }) {
  const [type, setType] = useState("mechanical");
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);
  const [now] = useState(() => Date.now());

  if (!order.isHmpAssured) return null;

  const closes = order.assuranceClaimWindowClosesAt ? new Date(order.assuranceClaimWindowClosesAt) : null;
  const open = closes !== null && closes.getTime() > now;

  return (
    <Section title="HMP Assured claims">
      {records.claims.map((claim) => (
        <div key={claim.id} className="mb-2">
          <b className="text-capitalize">{claim.claim_type.replace(/_/g, " ")}</b> — <span className="text-capitalize">{claim.status.replace(/_/g, " ")}</span>
          {claim.resolution && ` (${claim.resolution.replace(/_/g, " ")}${claim.resolution_amount ? `, ${money(claim.resolution_amount)}` : ""})`}
          <div className="text-color-2">{claim.description}</div>
          {claim.resolution_notes && <div className="text-color-2">Outcome: {claim.resolution_notes}</div>}
        </div>
      ))}

      {closes === null && <p className="text-color-2">You can raise a claim once the vehicle has been collected.</p>}
      {closes !== null && !open && <p className="text-color-2">The claim window closed on {when(order.assuranceClaimWindowClosesAt)}.</p>}

      {open && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await records.raiseClaim(type, description);
            setSent(ok);
            if (ok) setDescription("");
          }}
        >
          <p className="text-color-2">You can raise a claim until {when(order.assuranceClaimWindowClosesAt)}.</p>
          {records.claimError && <div className="alert alert-danger">{records.claimError}</div>}
          {sent && <div className="alert alert-success">Claim submitted. We aim to review it within one working day.</div>}
          <select className="form-control mb-2" value={type} onChange={(e) => setType(e.target.value)} aria-label="Claim type">
            <option value="mechanical">Mechanical fault</option>
            <option value="condition_mismatch">Condition doesn&apos;t match the report</option>
            <option value="documentation">Missing documentation</option>
            <option value="other">Something else</option>
          </select>
          <textarea
            className="form-control mb-2"
            placeholder="Describe the problem (at least 10 characters)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minLength={10}
            required
          />
          <button type="submit" className="sc-button" disabled={records.submitting}>
            <span>{records.submitting ? "Submitting..." : "Submit claim"}</span>
          </button>
        </form>
      )}
    </Section>
  );
}

/**
 * Everything that happens after a trade order is paid: delivery quote/booking/tracking
 * (FR-F-001/002), the collection release code and QR (FR-F-010), the document vault
 * (FR-F-012) and HMP Assured claims (FR-F-020).
 */
export default function PostSalePanel({ order, onChanged }: { order: TradeOrder; onChanged: () => void }) {
  const records = usePostSaleRecords({ kind: "trade", id: order.id }, order.releaseNoteId);

  return (
    <div className="mt-4">
      <TransportSection jobId={order.transportJobId} order={{ kind: "trade", id: order.id }} onChanged={onChanged} />
      <ReleaseSection releaseNoteId={order.releaseNoteId} release={records.release} />
      <DocumentsSection documents={records.documents} />
      <ClaimsSection order={order} records={records} />
    </div>
  );
}

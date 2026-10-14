"use client";

import { useId } from "react";
import { TICKET_PATTERN } from "@/lib/superAdmin";

export const MIN_REASON = 10;

/** True once the reason is long enough and the ticket looks like OPS-1234. */
export const isJustified = (reason: string, ticket: string) => reason.trim().length >= MIN_REASON && TICKET_PATTERN.test(ticket);

/**
 * The reason + ticket pair every privileged change asks for (audited). Shows how much more the
 * reason needs, and only complains about the ticket once the person has typed something.
 */
export default function Justification({ reason, ticket, onReason, onTicket, example = "OPS-1234", reasonHint }: {
  reason: string;
  ticket: string;
  onReason: (value: string) => void;
  onTicket: (value: string) => void;
  example?: string;
  reasonHint?: string;
}) {
  const id = useId();
  const short = MIN_REASON - reason.trim().length;
  return (
    <>
      <div className="ha-field">
        <label htmlFor={`${id}-reason`}>Reason</label>
        <textarea
          id={`${id}-reason`}
          className="ha-textarea"
          rows={3}
          placeholder={reasonHint ?? "Say why, in a sentence — this is kept in the audit log"}
          value={reason}
          onChange={(event) => onReason(event.target.value)}
          aria-describedby={`${id}-reason-hint`}
        />
        <div id={`${id}-reason-hint`} className="ha-hint">
          {short > 0 && reason.length > 0 ? `${short} more character${short === 1 ? "" : "s"} needed.` : `At least ${MIN_REASON} characters.`}
        </div>
      </div>
      <div className="ha-field">
        <label htmlFor={`${id}-ticket`}>Ticket reference</label>
        <input
          id={`${id}-ticket`}
          className="ha-input"
          placeholder={`e.g. ${example}`}
          autoComplete="off"
          value={ticket}
          aria-invalid={ticket !== "" && !TICKET_PATTERN.test(ticket)}
          onChange={(event) => onTicket(event.target.value.toUpperCase().trim())}
        />
        {ticket !== "" && !TICKET_PATTERN.test(ticket) && <div className="ha-error-text">Use a ticket reference like {example}.</div>}
      </div>
    </>
  );
}

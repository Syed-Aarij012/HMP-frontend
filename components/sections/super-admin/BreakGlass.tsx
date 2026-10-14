"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import SuperAdminShell from "./SuperAdminShell";
import Justification, { isJustified } from "./Justification";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows, Modal, Notice, useToast } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { formatWhen, type PrivilegeElevation } from "@/lib/superAdmin";

type ElevationsResponse = { data: PrivilegeElevation[]; scopes: Record<string, string>; max_minutes: number };

const PRESETS = [5, 15, 30, 60];

/** A clock that ticks once a second while `enabled`, so countdowns stay live. */
function useNow(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    queueMicrotask(() => setNow(Date.now()));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [enabled]);
  return now;
}

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const lengthLabel = (minutes: number) => (minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} hour${minutes === 60 ? "" : "s"}` : `${minutes} minute${minutes === 1 ? "" : "s"}`);

/**
 * REQ RBAC-005: Just-In-Time break-glass elevation — reason and ticket captured, time-boxed, and
 * revocable. §2.3: a Super Admin may hammer or withdraw a lot only while one of these is live.
 */
export default function BreakGlass() {
  const { notify } = useToast();
  const { data, loading, error, reload } = useAdminResource<ElevationsResponse>("/admin/elevations");
  const [scope, setScope] = useState("");
  const [minutes, setMinutes] = useState("15");
  const [reason, setReason] = useState("");
  const [ticket, setTicket] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const scopes = data?.scopes ?? {};
  const scopeKeys = Object.keys(scopes);
  const chosenScope = scope || (scopeKeys.length === 1 ? scopeKeys[0] : "");
  const maxMinutes = data?.max_minutes ?? 60;
  const elevations = useMemo(() => data?.data ?? [], [data]);

  const anyLive = elevations.some((e) => e.active);
  const now = useNow(anyLive);
  const isLive = (e: PrivilegeElevation) => e.active && new Date(e.expires_at).getTime() > now;
  const live = elevations.filter(isLive);
  const past = elevations.filter((e) => !isLive(e));

  const length = Number(minutes);
  const lengthOk = Number.isInteger(length) && length >= 1 && length <= maxMinutes;
  const valid = chosenScope !== "" && lengthOk && isJustified(reason, ticket);
  const presets = [...new Set([...PRESETS.filter((p) => p < maxMinutes), maxMinutes])];

  async function start(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/admin/elevations", {
        method: "POST",
        body: { scope: chosenScope, minutes: length, reason: reason.trim(), ticket_reference: ticket.trim() },
      });
      notify(`Break-glass is live for ${lengthLabel(length)}.`);
      setReason("");
      setTicket("");
      setConfirming(false);
      reload();
    } catch (err) {
      setFormError(describeApiError(err, "Could not start the elevation."));
    } finally {
      setBusy(false);
    }
  }

  async function end(id: number) {
    setEnding(id);
    try {
      await apiFetch(`/admin/elevations/${id}/revoke`, { method: "POST" });
      notify("Elevation ended. Standing access only.");
      reload();
    } catch (err) {
      notify(describeApiError(err, "Could not end the elevation."), { error: true });
    } finally {
      setEnding(null);
    }
  }

  return (
    <SuperAdminShell
      eyebrow="Emergency access"
      title="Break-glass"
      intro="Super Admins hold no standing right to hammer or withdraw a lot. When an emergency needs it, start a short, ticketed elevation — it ends by itself."
    >
      {error && !data && <ErrorNotice message={error} />}

      {/* ------------------------------------------------ Status */}
      {loading && !data ? (
        <Card><LoadingRows rows={2} /></Card>
      ) : live.length === 0 ? (
        <section className="bg-status is-calm" aria-label="Current access">
          <span className="bg-status-icon" aria-hidden="true"><i className="icon-carus-shieldcheck" /></span>
          <div>
            <h2>Standing access only</h2>
            <p>No elevation is active, so lot control (hammer or withdraw) is switched off for everyone, including you.</p>
          </div>
        </section>
      ) : (
        <section className="bg-status is-live" aria-label="Active elevations">
          <div className="bg-status-head">
            <span className="bg-pulse" aria-hidden="true" />
            <div>
              <h2>{live.length === 1 ? "Elevated access is live" : `${live.length} elevations are live`}</h2>
              <p>Everything you do is recorded against the ticket. End {live.length === 1 ? "it" : "them"} the moment the emergency is over.</p>
            </div>
          </div>
          <ul className="bg-live">
            {live.map((e) => {
              const expires = new Date(e.expires_at).getTime();
              const started = e.created_at ? new Date(e.created_at).getTime() : expires - 60 * 60 * 1000;
              const left = Math.max(0, expires - now);
              const fraction = Math.min(1, Math.max(0, left / Math.max(1, expires - started)));
              return (
                <li key={e.id} className="bg-live-item">
                  <div className="bg-live-main">
                    <b>{scopes[e.scope] ?? e.scope}</b>
                    <span>{e.ticket_reference} · {e.reason}</span>
                    <div className="bg-bar" role="presentation"><span style={{ width: `${fraction * 100}%` }} /></div>
                  </div>
                  <div className="bg-clock" role="timer" aria-label={`Time left: ${clock(left)}`}>
                    <b>{clock(left)}</b>
                    <span>left</span>
                  </div>
                  <button type="button" className="ha-btn is-danger-solid" disabled={ending === e.id} onClick={() => end(e.id)}>
                    {ending === e.id ? "Ending…" : "End now"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="bg-grid">
        {/* ------------------------------------------------ Request */}
        <Card title="Start an elevation" description="Three things: what for, how long, and why.">
          <form
            className="ha-card-body bg-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (valid) setConfirming(true);
            }}
          >
            <fieldset className="bg-fieldset">
              <legend>1 · What do you need to do?</legend>
              {scopeKeys.length === 0 ? (
                <p className="ha-sub">Loading…</p>
              ) : (
                <div className="ctl-options" role="radiogroup" aria-label="What the elevation is for">
                  {scopeKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={chosenScope === key}
                      className={`ctl-option${chosenScope === key ? " is-selected" : ""}`}
                      onClick={() => setScope(key)}
                    >
                      <span className="ctl-radio" aria-hidden="true" />
                      <span>
                        <b>{scopes[key]}</b>
                        <span>{key}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset className="bg-fieldset">
              <legend>2 · For how long?</legend>
              <div className="bg-durations" role="radiogroup" aria-label="Duration">
                {presets.map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={length === p} className={`bg-duration${length === p ? " is-selected" : ""}`} onClick={() => setMinutes(String(p))}>
                    {lengthLabel(p)}
                  </button>
                ))}
                <label className="bg-custom">
                  <span className="ha-visually-hidden">Custom minutes</span>
                  <input type="number" min={1} max={maxMinutes} inputMode="numeric" className="ha-input" value={minutes} aria-invalid={!lengthOk} onChange={(event) => setMinutes(event.target.value)} />
                  <span aria-hidden="true">min</span>
                </label>
              </div>
              <div className={lengthOk ? "ha-hint" : "ha-error-text"}>{lengthOk ? `It switches itself off after ${lengthLabel(length)}. Up to ${maxMinutes} minutes.` : `Enter a whole number from 1 to ${maxMinutes}.`}</div>
            </fieldset>

            <fieldset className="bg-fieldset">
              <legend>3 · Why is it needed?</legend>
              <Justification reason={reason} ticket={ticket} onReason={setReason} onTicket={setTicket} example="INC-42" reasonHint="What is happening, and why can’t it wait?" />
            </fieldset>

            <button type="submit" className="ha-btn is-danger-solid is-block" disabled={!valid}>
              Review and start
            </button>
          </form>
        </Card>

        {/* ------------------------------------------------ History */}
        <Card title="Your recent elevations" description="Newest first. Each one is also in the audit log.">
          {loading && !data && <LoadingRows rows={3} />}
          {data && elevations.length === 0 && <EmptyState icon="icon-carus-clock" title="None yet" text="Elevations you start will be listed here." />}
          {data && elevations.length > 0 && (
            <ol className="bg-history">
              {[...live, ...past].map((e) => {
                const liveNow = isLive(e);
                const endedEarly = !liveNow && e.revoked_at !== null;
                return (
                  <li key={e.id} className={`bg-entry${liveNow ? " is-live" : ""}`}>
                    <span className="bg-entry-dot" aria-hidden="true" />
                    <div>
                      <div className="bg-entry-top">
                        <b>{scopes[e.scope] ?? e.scope}</b>
                        {liveNow ? <Badge tone="warning">Live</Badge> : endedEarly ? <Badge tone="neutral">Ended early</Badge> : <Badge tone="neutral" plain>Expired</Badge>}
                      </div>
                      <p>{e.reason}</p>
                      <span className="ha-sub">
                        {e.ticket_reference} · {formatWhen(e.created_at)} ·{" "}
                        {liveNow ? `until ${formatWhen(e.expires_at)}` : endedEarly ? `ended ${formatWhen(e.revoked_at)}` : `ran out ${formatWhen(e.expires_at)}`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>

      {/* ------------------------------------------------ Confirm */}
      <Modal
        open={confirming}
        onClose={() => !busy && setConfirming(false)}
        title="Start break-glass access?"
        description="You’re about to give yourself temporary elevated access."
      >
        <form onSubmit={start}>
          <dl className="bg-summary">
            <div><dt>Access</dt><dd>{scopes[chosenScope] ?? chosenScope}</dd></div>
            <div><dt>Lasts</dt><dd>{lengthOk ? lengthLabel(length) : "–"}, then switches off by itself</dd></div>
            <div><dt>Ticket</dt><dd>{ticket}</dd></div>
            <div><dt>Reason</dt><dd>{reason.trim()}</dd></div>
          </dl>
          <Notice tone="warning">Actions taken while it’s live are audited. You can end it early at any time.</Notice>
          {formError && <Notice tone="danger">{formError}</Notice>}
          <div className="ha-modal-foot ctl-modal-foot">
            <button type="button" className="ha-btn" onClick={() => setConfirming(false)} disabled={busy}>Go back</button>
            <button type="submit" className="ha-btn is-danger-solid" disabled={busy || !valid}>{busy ? "Starting…" : "Start elevation"}</button>
          </div>
        </form>
      </Modal>
    </SuperAdminShell>
  );
}

"use client";

import { useMemo, useState, type FormEvent } from "react";
import SuperAdminShell from "./SuperAdminShell";
import Justification, { isJustified } from "./Justification";
import { Card, EmptyState, ErrorNotice, LoadingRows, Modal, Notice, SearchInput, Tabs, humanize, useToast } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { formatWhen, type FeatureFlag, type FeatureFlagCatalogEntry } from "@/lib/superAdmin";

type Dialog = { kind: "toggle"; flag: FeatureFlag } | { kind: "create"; preselect?: string } | null;
type View = "all" | "on" | "off";

const VIEWS = ["all", "on", "off"] as const;

/**
 * §2.2 P7 "feature-flag control" (NFR-O-004). Every change is ticketed and audited.
 *
 * Flags are only ever created from the catalog a developer has registered in
 * config/feature_flags.php (GET .../catalog) — a plain-English name and description, never a raw
 * dotted key to type. A flag that no code actually checks can't be invented from here.
 */
export default function FeatureFlags() {
  const { notify } = useToast();
  const { data, loading, error, reload } = useAdminResource<{ data: FeatureFlag[] }>("/admin/feature-flags");
  const { data: catalogData, reload: reloadCatalog } = useAdminResource<{ data: FeatureFlagCatalogEntry[] }>("/admin/feature-flags/catalog");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [reason, setReason] = useState("");
  const [ticket, setTicket] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");

  const flags = useMemo(() => data?.data ?? [], [data]);
  const catalog = useMemo(() => catalogData?.data ?? [], [catalogData]);
  const catalogByKey = useMemo(() => new Map(catalog.map((entry) => [entry.key, entry])), [catalog]);
  const creatable = catalog.filter((entry) => !entry.exists);
  const nameOf = (flag: FeatureFlag) => catalogByKey.get(flag.key)?.label ?? humanize(flag.key.split(".").pop());
  const descriptionOf = (flag: FeatureFlag) => flag.description ?? catalogByKey.get(flag.key)?.description ?? null;

  const onCount = flags.filter((flag) => flag.enabled).length;
  const needle = query.trim().toLowerCase();
  const visible = flags.filter((flag) => {
    if (view === "on" && !flag.enabled) return false;
    if (view === "off" && flag.enabled) return false;
    return !needle || `${nameOf(flag)} ${flag.key} ${descriptionOf(flag) ?? ""}`.toLowerCase().includes(needle);
  });

  function open(next: Dialog) {
    setReason("");
    setTicket("");
    setFormError(null);
    if (next?.kind === "create") {
      setSelectedKey(next.preselect ?? null);
      setEnabled(false);
    }
    setDialog(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!dialog || !isJustified(reason, ticket)) return;
    setBusy(true);
    setFormError(null);
    try {
      if (dialog.kind === "toggle") {
        await apiFetch(`/admin/feature-flags/${dialog.flag.id}`, {
          method: "PATCH",
          body: { enabled: !dialog.flag.enabled, reason: reason.trim(), ticket_reference: ticket.trim() },
        });
        notify(`“${nameOf(dialog.flag)}” switched ${dialog.flag.enabled ? "off" : "on"}.`);
      } else {
        if (!selectedKey) return;
        await apiFetch("/admin/feature-flags", {
          method: "POST",
          body: { key: selectedKey, enabled, reason: reason.trim(), ticket_reference: ticket.trim() },
        });
        notify(`“${catalogByKey.get(selectedKey)?.label ?? selectedKey}” added${enabled ? " and switched on" : ""}.`);
      }
      setDialog(null);
      reload();
      reloadCatalog();
    } catch (err) {
      setFormError(describeApiError(err, "Could not save the flag."));
    } finally {
      setBusy(false);
    }
  }

  const toggling = dialog?.kind === "toggle" ? dialog.flag : null;

  return (
    <SuperAdminShell
      eyebrow="Platform controls"
      title="Feature flags"
      intro="Switch platform features on or off without a release. Every change needs a reason and a ticket, and is written to the audit log."
      actions={
        <button type="button" className="ha-btn is-primary" onClick={() => open({ kind: "create" })} disabled={catalogData !== null && creatable.length === 0} title={catalogData !== null && creatable.length === 0 ? "Every known flag has already been added" : undefined}>
          + New flag
        </button>
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}

      <div className="ctl-summary">
        <div className="ctl-metric">
          <span className="ctl-metric-label">Flags</span>
          <b>{loading && !data ? "–" : flags.length}</b>
          <span className="ctl-metric-note">registered</span>
        </div>
        <div className="ctl-metric is-good">
          <span className="ctl-metric-label">Live</span>
          <b>{loading && !data ? "–" : onCount}</b>
          <span className="ctl-metric-note">switched on</span>
        </div>
        <div className="ctl-metric">
          <span className="ctl-metric-label">Dark</span>
          <b>{loading && !data ? "–" : flags.length - onCount}</b>
          <span className="ctl-metric-note">switched off</span>
        </div>
        <div className={`ctl-metric${creatable.length > 0 ? " is-info" : ""}`}>
          <span className="ctl-metric-label">Ready to add</span>
          <b>{catalogData ? creatable.length : "–"}</b>
          <span className="ctl-metric-note">available features</span>
        </div>
      </div>

      {creatable.length > 0 && (
        <Card title="Ready to add" description="Features the platform supports that don’t have a flag yet.">
          <ul className="ctl-available">
            {creatable.map((entry) => (
              <li key={entry.key}>
                <span className="ctl-icon" aria-hidden="true"><i className="icon-carus-power" /></span>
                <div className="ctl-available-text">
                  <b>{entry.label}</b>
                  <span>{entry.description}</span>
                </div>
                <button type="button" className="ha-btn is-sm" onClick={() => open({ kind: "create", preselect: entry.key })}>
                  Add flag
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="ctl-toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search flags" label="Search feature flags" />
        <Tabs
          label="Show flags that are"
          value={view}
          options={VIEWS}
          onChange={setView}
          labels={{ all: `All (${flags.length})`, on: `On (${onCount})`, off: `Off (${flags.length - onCount})` }}
        />
      </div>

      {loading && !data && <Card><LoadingRows rows={3} /></Card>}
      {error && !data && <Card><ErrorNotice message={error} /></Card>}
      {data && flags.length === 0 && (
        <Card>
          <EmptyState icon="icon-carus-power" title="No flags yet" text="Add the first one from the list above, or with “New flag”." />
        </Card>
      )}
      {data && flags.length > 0 && visible.length === 0 && (
        <Card>
          <EmptyState icon="icon-carus-search" title="No flags match" text="Try another search, or show all flags." action={<button type="button" className="ha-btn" onClick={() => { setQuery(""); setView("all"); }}>Clear filters</button>} />
        </Card>
      )}

      {visible.length > 0 && (
        <ul className="ctl-flags" aria-label="Feature flags">
          {visible.map((flag) => {
            const name = nameOf(flag);
            const description = descriptionOf(flag);
            return (
              <li key={flag.id} className={`ctl-flag${flag.enabled ? " is-on" : ""}`}>
                <div className="ctl-flag-top">
                  <span className={`ctl-state${flag.enabled ? " is-on" : ""}`}>
                    <span className="ctl-dot" aria-hidden="true" />
                    {flag.enabled ? "On" : "Off"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.enabled}
                    aria-label={`${name}: ${flag.enabled ? "on. Switch off" : "off. Switch on"}`}
                    className={`ha-switch${flag.enabled ? " is-on" : ""}`}
                    onClick={() => open({ kind: "toggle", flag })}
                  />
                </div>
                <h3>{name}</h3>
                {description && <p className="ctl-flag-desc">{description}</p>}
                <div className="ctl-flag-foot">
                  <code>{flag.key}</code>
                  <span className="ha-sub">
                    {flag.updated_by ? `${flag.updated_by.name} · ` : ""}
                    {formatWhen(flag.updated_at)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Notice tone="info" className="ctl-audit-note">
        <b>Every change is on the record.</b> The reason, ticket, who made it and when are kept in the audit log, and can’t be edited afterwards.
      </Notice>

      <Modal
        open={dialog !== null}
        onClose={() => !busy && setDialog(null)}
        title={toggling ? `Switch ${toggling.enabled ? "off" : "on"} “${nameOf(toggling)}”?` : "Add a feature flag"}
        description={toggling ? undefined : "Pick a feature. New flags start switched off unless you say otherwise."}
      >
        <form onSubmit={submit}>
          {toggling && (
            <div className="ctl-change" aria-live="polite">
              <span className={`ctl-state${toggling.enabled ? " is-on" : ""}`}><span className="ctl-dot" aria-hidden="true" />{toggling.enabled ? "On" : "Off"}</span>
              <span aria-hidden="true" className="ctl-arrow">→</span>
              <span className={`ctl-state${toggling.enabled ? "" : " is-on"}`}><span className="ctl-dot" aria-hidden="true" />{toggling.enabled ? "Off" : "On"}</span>
              <p>
                {toggling.enabled
                  ? "The feature stops working for everyone straight away."
                  : "The feature becomes available to everyone straight away."}
              </p>
            </div>
          )}

          {dialog?.kind === "create" && (
            <>
              {!catalogData && <p className="ha-sub">Loading available features…</p>}
              {catalogData && creatable.length === 0 && <Notice tone="info">Every known feature already has a flag — switch it on or off from the list instead.</Notice>}
              {creatable.length > 0 && (
                <div className="ctl-options" role="radiogroup" aria-label="Feature to add">
                  {creatable.map((entry) => (
                    <button
                      key={entry.key}
                      type="button"
                      role="radio"
                      aria-checked={selectedKey === entry.key}
                      className={`ctl-option${selectedKey === entry.key ? " is-selected" : ""}`}
                      onClick={() => setSelectedKey(entry.key)}
                    >
                      <span className="ctl-radio" aria-hidden="true" />
                      <span>
                        <b>{entry.label}</b>
                        <span>{entry.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <label className="ctl-check">
                <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                <span>
                  <b>Switch it on straight away</b>
                  <span>Leave unticked to add it switched off.</span>
                </span>
              </label>
            </>
          )}

          <Justification reason={reason} ticket={ticket} onReason={setReason} onTicket={setTicket} />
          {formError && <Notice tone="danger">{formError}</Notice>}
          <div className="ha-modal-foot ctl-modal-foot">
            <button type="button" className="ha-btn" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
            <button
              type="submit"
              className={`ha-btn ${toggling?.enabled ? "is-danger-solid" : "is-primary"}`}
              disabled={busy || !isJustified(reason, ticket) || (dialog?.kind === "create" && !selectedKey)}
            >
              {busy ? "Saving…" : toggling ? `Switch ${toggling.enabled ? "off" : "on"}` : "Add flag"}
            </button>
          </div>
        </form>
      </Modal>
    </SuperAdminShell>
  );
}

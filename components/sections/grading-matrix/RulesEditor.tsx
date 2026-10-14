"use client";

import { useId, useMemo, useState } from "react";
import { Badge, EmptyState, Modal, SearchInput } from "@/components/ui/kit";
import PanelSection, { useOpenPanels } from "./PanelSection";
import {
  ALL_DAMAGE,
  ALL_PANELS,
  COST_BANDS,
  PANEL_GROUPS,
  SEVERITIES,
  emptyCell,
  label,
  newRow,
  rowKey,
  starterRows,
  type RuleRow,
  type Severity,
} from "./model";

const OTHER = "__other__";

/** A native select of choices, with "Other…" that reveals a text box for anything not listed. */
function ChoiceField({ id, labelText, value, onChange, groups, options, otherLabel }: {
  id: string;
  labelText: string;
  value: string;
  onChange: (value: string) => void;
  groups?: { label: string; items: string[] }[];
  options?: string[];
  otherLabel: string;
}) {
  const known = (groups?.flatMap((g) => g.items) ?? options ?? []).includes(value);
  const [custom, setCustom] = useState(false);
  const showText = custom || (value !== "" && !known);

  return (
    <div className="ha-field">
      <label htmlFor={id}>{labelText}</label>
      <select
        id={id}
        className="ha-select"
        value={showText ? OTHER : value}
        onChange={(event) => {
          if (event.target.value === OTHER) {
            setCustom(true);
            onChange("");
          } else {
            setCustom(false);
            onChange(event.target.value);
          }
        }}
      >
        <option value="">Choose…</option>
        {groups
          ? groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((item) => <option key={item} value={item}>{label(item)}</option>)}
              </optgroup>
            ))
          : options?.map((item) => <option key={item} value={item}>{label(item)}</option>)}
        <option value={OTHER}>{otherLabel}</option>
      </select>
      {showText && (
        <input
          className="ha-input mt-2"
          aria-label={`${labelText}, custom`}
          placeholder="e.g. sunroof_seal"
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase().trim().replace(/\s+/g, "_"))}
          autoFocus={custom && value === ""}
        />
      )}
    </div>
  );
}

/**
 * The scoring grid: a row per panel and damage type, a cell per severity with its points and
 * repair-cost band. A blank cell means inspectors can't pick that severity for that damage.
 */
export default function RulesEditor({ rows, onChange }: { rows: RuleRow[]; onChange: (rows: RuleRow[]) => void }) {
  const id = useId();
  const [panel, setPanel] = useState("");
  const [damage, setDamage] = useState("");
  const [filterPanel, setFilterPanel] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const panelOrder = (p: string) => (ALL_PANELS.includes(p) ? ALL_PANELS.indexOf(p) : 999);
  const sorted = useMemo(() => [...rows].sort((a, b) => panelOrder(a.panel) - panelOrder(b.panel) || a.panel.localeCompare(b.panel) || a.damageType.localeCompare(b.damageType)), [rows]);
  const panelsInUse = useMemo(() => [...new Set(rows.map((r) => r.panel))], [rows]);
  const visible = sorted.filter((row) => {
    const needle = query.trim().toLowerCase();
    return (!filterPanel || row.panel === filterPanel) && (!needle || `${label(row.panel)} ${label(row.damageType)}`.toLowerCase().includes(needle));
  });
  const groups = useMemo(() => {
    const map = new Map<string, RuleRow[]>();
    for (const row of visible) map.set(row.panel, [...(map.get(row.panel) ?? []), row]);
    return [...map.entries()];
  }, [visible]);
  const open = useOpenPanels(panelsInUse, 3);
  const filtering = query.trim() !== "" || filterPanel !== "";
  const ruleCount = rows.reduce((sum, row) => sum + Object.values(row.cells).filter((c) => c && c.points.trim() !== "").length, 0);

  function merge(additions: RuleRow[]): number {
    const existing = new Set(rows.map((r) => r.key));
    const fresh = additions.filter((r) => !existing.has(r.key));
    if (fresh.length) onChange([...rows, ...fresh]);
    return fresh.length;
  }

  function addOne() {
    const p = panel.trim();
    const d = damage.trim();
    if (!p || !d) return;
    if (rows.some((r) => r.key === rowKey(p, d))) {
      setNotice(`${label(p)} · ${label(d)} is already in the grid — edit it below.`);
      return;
    }
    merge([newRow(p, d)]);
    setNotice(`Added ${label(p)} · ${label(d)} with suggested points. Adjust them below.`);
    setDamage("");
  }

  function addGroup(index: number) {
    const group = PANEL_GROUPS[index];
    const added = merge(starterRows(group.panels));
    setNotice(added ? `Added ${added} rules for ${group.label.toLowerCase()} with suggested points. Adjust them below.` : `${group.label} are already all in the grid.`);
  }

  function update(key: string, severity: Severity, patch: Partial<{ points: string; band: string }> | null) {
    onChange(
      rows.map((row) => {
        if (row.key !== key) return row;
        const cells = { ...row.cells };
        if (patch === null) delete cells[severity];
        else cells[severity] = { ...(cells[severity] ?? emptyCell(severity)), ...patch };
        return { ...row, cells };
      }),
    );
  }

  return (
    <div className="gm-rules">
      <div className="gm-quick">
        <div>
          <b>Quick start</b>
          <p className="ha-sub mb-0">Add every common rule for an area in one click, with sensible points you can then adjust.</p>
        </div>
        <div className="ha-chips">
          {PANEL_GROUPS.map((group, index) => (
            <button key={group.label} type="button" className="ha-btn is-sm" onClick={() => addGroup(index)}>
              + {group.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gm-add">
        <ChoiceField id={`${id}-panel`} labelText="Panel" value={panel} onChange={setPanel} groups={PANEL_GROUPS.map((g) => ({ label: g.label, items: g.panels }))} otherLabel="Other panel…" />
        <ChoiceField id={`${id}-damage`} labelText="Damage type" value={damage} onChange={setDamage} options={ALL_DAMAGE} otherLabel="Other damage…" />
        <button type="button" className="ha-btn is-primary gm-add-btn" disabled={!panel.trim() || !damage.trim()} onClick={addOne}>
          Add rule
        </button>
      </div>

      <div role="status" aria-live="polite">{notice && <p className="ha-hint gm-notice">{notice}</p>}</div>

      {rows.length === 0 ? (
        <EmptyState icon="icon-carus-listings" title="No damage rules yet" text="Use Quick start above, or add a panel and damage type, to start scoring." />
      ) : (
        <>
          <div className="ha-toolbar gm-toolbar">
            <SearchInput value={query} onChange={setQuery} placeholder="Search panel or damage" label="Search rules" />
            <label className="ha-control-label" htmlFor={`${id}-filter`}>
              <span className="ha-visually-hidden">Panel</span>
              <select id={`${id}-filter`} className="ha-select ha-inline-select" value={filterPanel} onChange={(e) => setFilterPanel(e.target.value)}>
                <option value="">All panels</option>
                {panelsInUse.map((p) => <option key={p} value={p}>{label(p)}</option>)}
              </select>
            </label>
            <div className="ha-toolbar-end">
              <span className="ha-result-count" aria-live="polite">{ruleCount} rules · {panelsInUse.length} panels</span>
              <button type="button" className="ha-btn is-sm is-ghost" onClick={open.allOpen ? open.collapseAll : open.expandAll}>
                {open.allOpen ? "Collapse all" : "Expand all"}
              </button>
              <button type="button" className="ha-btn is-sm is-danger" onClick={() => setConfirmClear(true)}>
                Clear all
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon="icon-carus-search" title="No matches" text="No rows match that search." action={<button type="button" className="ha-btn" onClick={() => { setQuery(""); setFilterPanel(""); }}>Clear filters</button>} />
          ) : (
            <div className="gm-panels">
              {groups.map(([panelKey, panelRows]) => {
                const count = panelRows.reduce((sum, row) => sum + Object.values(row.cells).filter((c) => c && c.points.trim() !== "").length, 0);
                return (
                  <PanelSection
                    key={panelKey}
                    title={label(panelKey)}
                    summary={`${panelRows.length} damage type${panelRows.length === 1 ? "" : "s"} · ${count} rule${count === 1 ? "" : "s"}`}
                    open={filtering || open.isOpen(panelKey)}
                    onToggle={() => open.toggle(panelKey)}
                  >
                    <div className="ha-table-wrap">
                      <table className="ha-table gm-table gm-edit">
                        <caption className="ha-visually-hidden">{`${label(panelKey)}: points and repair-cost band for each damage type and severity`}</caption>
                        <thead>
                          <tr>
                            <th scope="col">Damage</th>
                            {SEVERITIES.map((s) => (
                              <th key={s.value} scope="col">
                                {s.label}
                                <span className="gm-th-hint">{s.hint}</span>
                              </th>
                            ))}
                            <th scope="col"><span className="ha-visually-hidden">Remove row</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {panelRows.map((row) => (
                            <tr key={row.key}>
                              <th scope="row" className="gm-rowhead">{label(row.damageType)}</th>
                              {SEVERITIES.map((s) => {
                                const cell = row.cells[s.value];
                                const name = `${label(row.panel)} ${label(row.damageType)} ${s.label}`;
                                return (
                                  <td key={s.value}>
                                    {cell ? (
                                      <div className="gm-edit-cell">
                                        <input
                                          type="number"
                                          min={0}
                                          step={1}
                                          inputMode="numeric"
                                          className="ha-input"
                                          aria-label={`Points, ${name}`}
                                          value={cell.points}
                                          onChange={(e) => update(row.key, s.value, { points: e.target.value })}
                                        />
                                        <select className="ha-select" aria-label={`Repair cost, ${name}`} value={cell.band} onChange={(e) => update(row.key, s.value, { band: e.target.value })}>
                                          {!COST_BANDS.some((b) => b.value === cell.band) && <option value={cell.band}>{label(cell.band)}</option>}
                                          {COST_BANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                                        </select>
                                        <button type="button" className="ha-btn is-sm is-ghost is-icon" aria-label={`Don't offer ${name}`} title="Don't offer this severity" onClick={() => update(row.key, s.value, null)}>
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <button type="button" className="gm-add-cell" onClick={() => update(row.key, s.value, {})}>
                                        + Offer {s.label.toLowerCase()}
                                      </button>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="ha-right">
                                <button type="button" className="ha-btn is-sm is-ghost is-danger" aria-label={`Remove ${label(row.panel)} ${label(row.damageType)}`} onClick={() => onChange(rows.filter((r) => r.key !== row.key))}>
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </PanelSection>
                );
              })}
            </div>
          )}
          {rows.some((row) => Object.keys(row.cells).length === 0) && (
            <p className="ha-hint gm-notice">
              <Badge tone="warning">Heads up</Badge> Some rows have no severities offered, so they won&apos;t do anything. Add a severity or remove the row.
            </p>
          )}
        </>
      )}
      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Remove every rule?"
        description="This empties the grid in your draft. Nothing changes for inspectors until a version is approved."
        footer={
          <>
            <button type="button" className="ha-btn" onClick={() => setConfirmClear(false)}>Keep them</button>
            <button type="button" className="ha-btn is-danger-solid" onClick={() => { onChange([]); setConfirmClear(false); }}>Remove all</button>
          </>
        }
      />
    </div>
  );
}

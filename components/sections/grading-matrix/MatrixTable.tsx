"use client";

import { useId, useMemo, useState } from "react";
import { EmptyState, SearchInput } from "@/components/ui/kit";
import PanelSection, { useOpenPanels } from "./PanelSection";
import { SEVERITIES, bandLabel, label, type FlatEntry } from "./model";

/** A read-only view of a matrix: a collapsible group per panel, a row per damage type. */
export default function MatrixTable({ rules, caption }: { rules: FlatEntry[]; caption: string }) {
  const id = useId();
  const [panel, setPanel] = useState("");
  const [query, setQuery] = useState("");

  const panels = useMemo(() => [...new Set(rules.map((r) => r.panel))], [rules]);
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return panels
      .filter((p) => !panel || p === panel)
      .map((p) => {
        const byDamage = new Map<string, Record<string, FlatEntry>>();
        for (const rule of rules.filter((r) => r.panel === p)) byDamage.set(rule.damageType, { ...(byDamage.get(rule.damageType) ?? {}), [rule.severity]: rule });
        const rows = [...byDamage.entries()].filter(([damage]) => !needle || `${label(p)} ${label(damage)}`.toLowerCase().includes(needle));
        return { panel: p, rows };
      })
      .filter((group) => group.rows.length > 0);
  }, [rules, panels, panel, query]);

  const filtering = query.trim() !== "" || panel !== "";
  const open = useOpenPanels(panels, 3);

  if (rules.length === 0) {
    return <EmptyState icon="icon-carus-listings" title="No damage rules yet" text="This version has no rules, so inspectors can't record damage against it." />;
  }

  return (
    <>
      <div className="ha-toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search panel or damage" label="Search rules" />
        <label className="ha-control-label" htmlFor={`${id}-panel`}>
          <span className="ha-visually-hidden">Panel</span>
          <select id={`${id}-panel`} className="ha-select ha-inline-select" value={panel} onChange={(e) => setPanel(e.target.value)}>
            <option value="">All panels</option>
            {panels.map((p) => <option key={p} value={p}>{label(p)}</option>)}
          </select>
        </label>
        <div className="ha-toolbar-end">
          <span className="ha-result-count" aria-live="polite">{groups.length} of {panels.length} panels</span>
          <button type="button" className="ha-btn is-sm is-ghost" onClick={open.allOpen ? open.collapseAll : open.expandAll}>
            {open.allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>
      {groups.length === 0 ? (
        <EmptyState icon="icon-carus-search" title="No matches" text="No rules match that search." action={<button type="button" className="ha-btn" onClick={() => { setPanel(""); setQuery(""); }}>Clear filters</button>} />
      ) : (
        <div className="gm-panels">
          {groups.map((group) => {
            const count = group.rows.reduce((sum, [, cells]) => sum + Object.keys(cells).length, 0);
            return (
              <PanelSection
                key={group.panel}
                title={label(group.panel)}
                summary={`${group.rows.length} damage type${group.rows.length === 1 ? "" : "s"} · ${count} rule${count === 1 ? "" : "s"}`}
                open={filtering || open.isOpen(group.panel)}
                onToggle={() => open.toggle(group.panel)}
              >
                <table className="ha-table gm-table">
                  <caption className="ha-visually-hidden">{`${caption}: ${label(group.panel)}`}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Damage</th>
                      {SEVERITIES.map((s) => <th key={s.value} scope="col">{s.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map(([damage, cells]) => (
                      <tr key={damage}>
                        <th scope="row" className="gm-rowhead">{label(damage)}</th>
                        {SEVERITIES.map((s) => {
                          const cell = cells[s.value];
                          return (
                            <td key={s.value}>
                              {cell ? (
                                <span className="gm-cell">
                                  <b className="ha-num">{cell.points} pts</b>
                                  <span className="ha-sub">{bandLabel(cell.band)}</span>
                                </span>
                              ) : (
                                <span className="ha-muted" title="Not offered to inspectors at this severity">Not offered</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PanelSection>
            );
          })}
        </div>
      )}
    </>
  );
}

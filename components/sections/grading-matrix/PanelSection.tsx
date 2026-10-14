"use client";

import { useId, useState, type ReactNode } from "react";

/** Open/closed state for a list of collapsible panels. Small lists start open; long ones closed. */
export function useOpenPanels(keys: string[], startOpenBelow = 4) {
  const [open, setOpen] = useState<Set<string> | null>(null);
  const current = open ?? new Set(keys.length <= startOpenBelow ? keys : []);
  return {
    isOpen: (key: string) => current.has(key),
    toggle: (key: string) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setOpen(next);
    },
    expandAll: () => setOpen(new Set(keys)),
    collapseAll: () => setOpen(new Set()),
    allOpen: keys.length > 0 && keys.every((key) => current.has(key)),
  };
}

/** One panel (e.g. "Front bumper") as a collapsible group, so a 70-row matrix reads as a short list. */
export default function PanelSection({ title, summary, open, onToggle, children }: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className={`gm-panel${open ? " is-open" : ""}`}>
      <h3>
        <button type="button" className="gm-panel-head" aria-expanded={open} aria-controls={id} onClick={onToggle}>
          <svg className="gm-panel-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 6 15 12 9 18" />
          </svg>
          <span className="gm-panel-title">{title}</span>
          <span className="gm-panel-summary">{summary}</span>
        </button>
      </h3>
      {open && (
        <div id={id} className="gm-panel-body">
          {children}
        </div>
      )}
    </section>
  );
}

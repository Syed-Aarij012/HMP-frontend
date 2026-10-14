"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hmp_gm_help_closed";

const STEPS = [
  { n: 1, title: "An inspector records damage", text: "Each item is a panel, a type of damage and how severe it is — for example Front bumper · Scratch · Minor." },
  { n: 2, title: "The matrix scores each item", text: "Every combination has points and a repair-cost band. Those scores are what you set on this page." },
  { n: 3, title: "Total points give the grade", text: "Add up the points and the grade bands turn the total into a Condition Grade from 1 (best) to 5 (worst)." },
];

/** A short "how this works" strip — open the first time, remembered closed after that. */
export default function HowItWorks() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") queueMicrotask(() => setOpen(false));
    } catch {
      // Storage unavailable — just stay open.
    }
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "0" : "1");
    } catch {
      // A per-viewer convenience only.
    }
  }

  return (
    <section className="ha-card gm-help" aria-label="How grading works">
      <div className="gm-help-head">
        <h2>How grading works</h2>
        <button type="button" className="ha-btn is-sm is-ghost" aria-expanded={open} onClick={toggle}>
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open && (
        <div className="gm-help-body">
          <ol className="gm-steps">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span className="gm-step-n" aria-hidden="true">{step.n}</span>
                <div>
                  <b>{step.title}</b>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="gm-help-note">
            <b>Changes are safe.</b> Every published report remembers the version it was graded with, so old grades never change. A new version needs a{" "}
            <b>second Quality Supervisor</b> to approve it, and only applies to inspections started after its start time.
          </p>
        </div>
      )}
    </section>
  );
}

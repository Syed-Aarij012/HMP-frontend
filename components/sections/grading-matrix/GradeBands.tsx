"use client";

import { GRADE_NOTE, gradeRanges } from "./model";

/**
 * The five grades as tiles: the points range each covers, and — when editable — the cap input.
 * The tile's top edge is tinted good → bad, but the number, "best/worst" and range say it all.
 */
export default function GradeBands({ caps, onChange, readOnly = false, errorFor }: {
  caps: string[];
  onChange?: (caps: string[]) => void;
  readOnly?: boolean;
  errorFor?: (index: number) => string | null;
}) {
  const ranges = gradeRanges(caps);

  return (
    <ol className="gm-bands" aria-label="Grade bands">
      {ranges.map((range, index) => {
        const last = range.to === null;
        const error = errorFor?.(index) ?? null;
        return (
          <li key={range.grade} className={`gm-band is-g${range.grade}`}>
            <div className="gm-band-grade">
              <span className="gm-band-n">Grade {range.grade}</span>
              {GRADE_NOTE[range.grade] && <span className="gm-band-note">{GRADE_NOTE[range.grade]}</span>}
            </div>
            <div className="gm-band-range ha-num">
              {last ? (Number.isFinite(range.from) ? `${range.from}+ points` : "Above the last limit") : `${range.from}–${range.to} points`}
            </div>
            {!readOnly && !last && (
              <div className="gm-band-edit">
                <label htmlFor={`gm-cap-${index}`}>Up to</label>
                <input
                  id={`gm-cap-${index}`}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="ha-input"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `gm-cap-${index}-err` : undefined}
                  value={caps[index] ?? ""}
                  onChange={(event) => onChange?.(caps.map((cap, i) => (i === index ? event.target.value : cap)))}
                />
                <span>points</span>
              </div>
            )}
            {!readOnly && last && <div className="gm-band-edit is-fixed">Everything above grade 4</div>}
            {error && (
              <div id={`gm-cap-${index}-err`} className="ha-error-text">
                {error}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

import { useState } from "react";
import type { GradeThreshold, GradingMatrixEntry } from "@/types/inspection";

/*
 * The grading matrix, as the page edits it (FR-A-020/021).
 *
 * How grading works: an inspector records each piece of damage as a panel + damage type +
 * severity. The matrix gives every such combination points and a repair-cost band. The report's
 * total points are looked up in the grade bands to give Condition Grade 1 (best) – 5 (worst).
 */

export type Severity = "minor" | "moderate" | "severe";

export const SEVERITIES: { value: Severity; label: string; hint: string }[] = [
  { value: "minor", label: "Minor", hint: "Cosmetic, easily fixed" },
  { value: "moderate", label: "Moderate", hint: "Needs a proper repair" },
  { value: "severe", label: "Severe", hint: "Major or structural" },
];

/** Repair-cost bands. The seeded data already uses these keys; anything else is kept as-is. */
export const COST_BANDS: { value: string; label: string }[] = [
  { value: "under_100", label: "Under £100" },
  { value: "100_to_300", label: "£100–£300" },
  { value: "300_to_750", label: "£300–£750" },
  { value: "750_to_1500", label: "£750–£1,500" },
  { value: "over_1500", label: "Over £1,500" },
];

export const bandLabel = (value: string) => COST_BANDS.find((band) => band.value === value)?.label ?? value.replace(/_/g, " ");

/** Where the damage can be, grouped, with the damage types that make sense there. */
export const PANEL_GROUPS: { label: string; panels: string[]; damage: string[] }[] = [
  { label: "Bumpers", panels: ["front_bumper", "rear_bumper"], damage: ["scratch", "scuff", "dent", "crack"] },
  { label: "Body panels", panels: ["bonnet", "roof", "boot_lid", "front_left_wing", "front_right_wing", "rear_left_quarter", "rear_right_quarter"], damage: ["scratch", "scuff", "dent", "corrosion"] },
  { label: "Doors", panels: ["front_left_door", "front_right_door", "rear_left_door", "rear_right_door"], damage: ["scratch", "scuff", "dent", "corrosion"] },
  { label: "Glass & lights", panels: ["windscreen", "rear_window", "headlight", "tail_light", "wing_mirror"], damage: ["chip", "crack"] },
  { label: "Wheels", panels: ["front_left_wheel", "front_right_wheel", "rear_left_wheel", "rear_right_wheel"], damage: ["scuff", "scratch", "crack"] },
];

export const ALL_PANELS = PANEL_GROUPS.flatMap((group) => group.panels);
export const ALL_DAMAGE = [...new Set(PANEL_GROUPS.flatMap((group) => group.damage))];

export const label = (key: string) => {
  const text = key.replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Suggested points and band per severity when generating a starter set (all editable). */
const DEFAULT_POINTS: Record<Severity, number> = { minor: 2, moderate: 5, severe: 10 };
const DEFAULT_BAND: Record<Severity, string> = { minor: "under_100", moderate: "100_to_300", severe: "300_to_750" };

// ------------------------------------------------------------------ Rules (the grid)

export type Cell = { points: string; band: string };
export type RuleRow = { key: string; panel: string; damageType: string; cells: Partial<Record<Severity, Cell>> };

export const rowKey = (panel: string, damageType: string) => `${panel}|${damageType}`.toLowerCase();

export function emptyCell(severity: Severity): Cell {
  return { points: String(DEFAULT_POINTS[severity]), band: DEFAULT_BAND[severity] };
}

export function newRow(panel: string, damageType: string, severities: Severity[] = ["minor", "moderate", "severe"]): RuleRow {
  return { key: rowKey(panel, damageType), panel, damageType, cells: Object.fromEntries(severities.map((s) => [s, emptyCell(s)])) };
}

/** Every sensible panel × damage-type combination for the chosen panels, with suggested scores. */
export function starterRows(panels: string[], damageTypes?: string[]): RuleRow[] {
  const rows: RuleRow[] = [];
  for (const panel of panels) {
    const group = PANEL_GROUPS.find((g) => g.panels.includes(panel));
    for (const damage of group?.damage ?? ALL_DAMAGE) {
      if (damageTypes && !damageTypes.includes(damage)) continue;
      rows.push(newRow(panel, damage));
    }
  }
  return rows;
}

export function rowsFromEntries(entries: Pick<GradingMatrixEntry, "panel" | "damageType" | "severity" | "repairCostBand" | "points">[]): RuleRow[] {
  const map = new Map<string, RuleRow>();
  for (const entry of entries) {
    const key = rowKey(entry.panel, entry.damageType);
    const row = map.get(key) ?? { key, panel: entry.panel, damageType: entry.damageType, cells: {} };
    row.cells[entry.severity] = { points: String(entry.points), band: entry.repairCostBand };
    map.set(key, row);
  }
  return [...map.values()];
}

export type FlatEntry = { panel: string; damageType: string; severity: Severity; points: number; band: string };

export function flatten(rows: RuleRow[]): FlatEntry[] {
  return rows.flatMap((row) =>
    SEVERITIES.flatMap(({ value }) => {
      const cell = row.cells[value];
      if (!cell || cell.points.trim() === "") return [];
      return [{ panel: row.panel, damageType: row.damageType, severity: value, points: Number(cell.points), band: cell.band || DEFAULT_BAND[value] }];
    }),
  );
}

// ------------------------------------------------------------------ Grade bands

export type BandDraft = { maxPoints: string }; // five bands; the last has no cap

export const GRADES = [1, 2, 3, 4, 5] as const;
export const GRADE_NOTE: Record<number, string> = { 1: "best", 5: "worst" };
export const DEFAULT_CAPS = ["5", "15", "30", "50"];

export function bandsFromThresholds(thresholds: GradeThreshold[]): string[] {
  const sorted = [...thresholds].sort((a, b) => a.grade - b.grade);
  const caps = sorted.filter((t) => t.maxPoints !== null).map((t) => String(t.maxPoints));
  return caps.length === 4 ? caps : DEFAULT_CAPS;
}

export const thresholdsFromCaps = (caps: string[]): { max_points: number | null; grade: number }[] =>
  GRADES.map((grade, index) => ({ max_points: index < caps.length ? Number(caps[index]) : null, grade }));

/** The points range each grade covers, e.g. grade 2 with caps 5/15 → 6–15. */
export function gradeRanges(caps: string[]): { grade: number; from: number; to: number | null }[] {
  let from = 0;
  return GRADES.map((grade, index) => {
    const cap = index < caps.length ? Number(caps[index]) : null;
    const range = { grade, from, to: cap };
    if (cap !== null && Number.isFinite(cap)) from = cap + 1;
    return range;
  });
}

export function gradeFor(totalPoints: number, caps: string[]): number {
  const ranges = gradeRanges(caps);
  return ranges.find((r) => r.to === null || totalPoints <= r.to)?.grade ?? 5;
}

// ------------------------------------------------------------------ Validation

export type DraftProblem = { section: "details" | "bands" | "rules"; message: string };

export function validate(draft: { label: string; effectiveFrom: string; caps: string[]; rows: RuleRow[] }): DraftProblem[] {
  const problems: DraftProblem[] = [];
  if (!draft.label.trim()) problems.push({ section: "details", message: "Give this version a name." });
  if (!draft.effectiveFrom) problems.push({ section: "details", message: "Choose when it takes effect." });

  const caps = draft.caps.map((cap) => (cap.trim() === "" ? NaN : Number(cap)));
  if (caps.some((cap) => !Number.isInteger(cap) || cap < 0)) problems.push({ section: "bands", message: "Every grade 1–4 needs a points limit (a whole number)." });
  else if (caps.some((cap, i) => i > 0 && cap <= caps[i - 1])) problems.push({ section: "bands", message: "Each grade's limit must be higher than the one before." });

  const flat = flatten(draft.rows);
  if (flat.length === 0) problems.push({ section: "rules", message: "Add at least one damage rule." });
  if (draft.rows.some((row) => Object.values(row.cells).some((cell) => cell && cell.points.trim() !== "" && (!Number.isInteger(Number(cell.points)) || Number(cell.points) < 0)))) {
    problems.push({ section: "rules", message: "Points must be whole numbers, 0 or more." });
  }
  if (draft.rows.some((row) => !row.panel.trim() || !row.damageType.trim())) problems.push({ section: "rules", message: "Every rule needs a panel and a damage type." });

  return problems;
}

// ------------------------------------------------------------------ Comparing versions

export type MatrixDiff = { added: number; removed: number; changed: number; bandsChanged: boolean };

export function diffAgainst(
  next: { entries: Pick<GradingMatrixEntry, "panel" | "damageType" | "severity" | "points" | "repairCostBand">[]; thresholds: GradeThreshold[] },
  live: { entries: Pick<GradingMatrixEntry, "panel" | "damageType" | "severity" | "points" | "repairCostBand">[]; thresholds: GradeThreshold[] },
): MatrixDiff {
  const id = (e: { panel: string; damageType: string; severity: string }) => `${e.panel}|${e.damageType}|${e.severity}`.toLowerCase();
  const before = new Map(live.entries.map((e) => [id(e), e]));
  const after = new Map(next.entries.map((e) => [id(e), e]));
  let changed = 0;
  for (const [key, entry] of after) {
    const old = before.get(key);
    if (old && (old.points !== entry.points || old.repairCostBand !== entry.repairCostBand)) changed++;
  }
  const caps = (t: GradeThreshold[]) => [...t].sort((a, b) => a.grade - b.grade).map((x) => x.maxPoints).join(",");
  return {
    added: [...after.keys()].filter((k) => !before.has(k)).length,
    removed: [...before.keys()].filter((k) => !after.has(k)).length,
    changed,
    bandsChanged: caps(next.thresholds) !== caps(live.thresholds),
  };
}

/** "Now", captured once when the screen opens — enough to tell past start times from future ones. */
export function useMountedNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}

// GET /api/dashboard/overview — the role dashboard payload (app/Services/Dashboard on the backend).

export type DashboardFormat = "count" | "money" | "percent" | "days";

export type DashboardRangeKey = "7d" | "30d" | "90d" | "custom";

export type DashboardRange = {
  key: DashboardRangeKey;
  from: string;
  to: string;
  days: number;
  previous_from: string;
  previous_to: string;
  bucket: "day" | "week";
};

export type DashboardKpi = {
  key: string;
  label: string;
  format: DashboardFormat;
  value: number | null;
  previous: number | null;
  change_pct: number | null;
  /** "pts" when the change is in percentage points (rates), otherwise a % change. */
  change_unit?: "pts";
  series: number[] | null;
  hint?: string;
  href?: string;
};

export type DashboardActionItem = {
  key: string;
  severity: "urgent" | "warning" | "info";
  title: string;
  detail: string | null;
  href: string | null;
  at: string | null;
};

export type DashboardSeries = { key: string; label: string; points: { x: string; y: number }[] };

export type DashboardSegment = { label: string; value: number; href?: string | null };

export type DashboardChart = {
  key: string;
  title: string;
  type: "line" | "bar" | "hbar" | "donut" | "gauge" | "funnel";
  format: DashboardFormat;
  series?: DashboardSeries[];
  segments?: DashboardSegment[];
  value?: number;
  max?: number;
  caption?: string;
  empty_text?: string;
  href?: string;
};

export type DashboardActivityItem = {
  id: string;
  type: string;
  type_label: string;
  title: string;
  detail: string | null;
  status: string | null;
  amount: number | null;
  href: string | null;
  at: string | null;
};

export type DashboardOverview = {
  persona: string;
  persona_label: string;
  roles: string[];
  name: string;
  range: DashboardRange;
  generated_at: string;
  kpis: DashboardKpi[];
  actions: DashboardActionItem[];
  charts: DashboardChart[];
  activity: { items: DashboardActivityItem[]; view_all: { label: string; href: string } | null };
  quick_actions: { label: string; href: string; primary?: boolean }[];
};

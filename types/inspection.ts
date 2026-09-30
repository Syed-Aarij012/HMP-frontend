// FR-A-012/013/020/021/022/025: inspector vehicle-media QA visibility, CV damage-suggestion
// review, hotspot pinning, mandatory checklist capture, and condition-report submission.

export type InspectorVehicle = {
  id: number;
  publicId: string;
  vin: string;
  currentVrm: string | null;
  make: string | null;
  model: string | null;
  derivative: string | null;
  year: number | null;
  currentMileage: number | null;
  v5cStatus: string | null;
  provenanceStatus: string;
};

export type InspectionMedia = {
  id: number;
  type: "still" | "video" | "spin_frame";
  url: string;
  qaStatus: "pending" | "passed" | "failed";
  qaReason: string | null;
};

export type CvDamageSuggestion = {
  vehicleMediaId: number;
  panel: string;
  damageType: string;
  severity: "minor" | "moderate" | "severe";
};

export type GradingMatrixEntry = {
  id: number;
  damageType: string;
  panel: string;
  severity: "minor" | "moderate" | "severe";
  repairCostBand: string;
  points: number;
};

export type GradingMatrixVersion = {
  id: number;
  versionLabel: string;
  entries: GradingMatrixEntry[];
};

export type DraftDamageItem = {
  key: string;
  panel: string;
  damageType: string;
  severity: "minor" | "moderate" | "severe";
  vehicleMediaId: number | null;
  frameX: number | null;
  frameY: number | null;
  cvSuggested: boolean;
};

export type ConditionReportChecklist = {
  drive_status: "runs_and_drives" | "non_runner";
  warning_lamps: string[];
  service_history_verified: boolean;
  tyre_depths: { fl: number; fr: number; rl: number; rr: number };
  charging_session_verified?: boolean;
};

export type SubmittedConditionReport = {
  id: number;
  status: string;
  conditionGrade: number | null;
  mechanicalGrade: string | null;
};

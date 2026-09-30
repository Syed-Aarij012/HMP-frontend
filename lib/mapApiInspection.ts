import type {
  CvDamageSuggestion,
  GradingMatrixEntry,
  GradingMatrixVersion,
  InspectionMedia,
  InspectorVehicle,
} from "@/types/inspection";

export type ApiInspectorVehicle = {
  id: number;
  public_id: string;
  vin: string;
  current_vrm: string | null;
  make: string | null;
  model: string | null;
  derivative: string | null;
  year: number | null;
  current_mileage: number | null;
  v5c_status: string | null;
  provenance_status: string;
};

export function mapApiInspectorVehicle(api: ApiInspectorVehicle): InspectorVehicle {
  return {
    id: api.id,
    publicId: api.public_id,
    vin: api.vin,
    currentVrm: api.current_vrm,
    make: api.make,
    model: api.model,
    derivative: api.derivative,
    year: api.year,
    currentMileage: api.current_mileage,
    v5cStatus: api.v5c_status,
    provenanceStatus: api.provenance_status,
  };
}

export type ApiInspectionMedia = {
  id: number;
  type: string;
  original_url: string;
  cdn_url: string | null;
  qa_status: string;
  qa_results: { reason?: string } | null;
};

export function mapApiInspectionMedia(api: ApiInspectionMedia): InspectionMedia {
  return {
    id: api.id,
    type: api.type as InspectionMedia["type"],
    url: api.cdn_url ?? api.original_url,
    qaStatus: api.qa_status as InspectionMedia["qaStatus"],
    qaReason: api.qa_results?.reason ?? null,
  };
}

export type ApiCvDamageSuggestion = {
  vehicle_media_id: number;
  panel: string;
  damage_type: string;
  severity: string;
};

export function mapApiCvDamageSuggestion(api: ApiCvDamageSuggestion): CvDamageSuggestion {
  return {
    vehicleMediaId: api.vehicle_media_id,
    panel: api.panel,
    damageType: api.damage_type,
    severity: api.severity as CvDamageSuggestion["severity"],
  };
}

export type ApiGradingMatrixEntry = {
  id: number;
  damage_type: string;
  panel: string;
  severity: string;
  repair_cost_band: string;
  points: number;
};

export function mapApiGradingMatrixEntry(api: ApiGradingMatrixEntry): GradingMatrixEntry {
  return {
    id: api.id,
    damageType: api.damage_type,
    panel: api.panel,
    severity: api.severity as GradingMatrixEntry["severity"],
    repairCostBand: api.repair_cost_band,
    points: api.points,
  };
}

export type ApiGradingMatrixVersion = {
  id: number;
  version_label: string;
  entries: ApiGradingMatrixEntry[];
};

export function mapApiGradingMatrixVersion(api: ApiGradingMatrixVersion): GradingMatrixVersion {
  return {
    id: api.id,
    versionLabel: api.version_label,
    entries: (api.entries ?? []).map(mapApiGradingMatrixEntry),
  };
}

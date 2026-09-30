// FR-A-031: dealer bulk stock ingestion (CSV upload + saved field-mapping templates).

export const DEALER_FEED_INTERNAL_FIELDS = [
  "make",
  "model",
  "derivative",
  "body_type",
  "fuel_type",
  "transmission",
  "colour",
  "current_vrm",
  "year",
  "current_mileage",
  "price",
] as const;

export type DealerFeedInternalField = (typeof DEALER_FEED_INTERNAL_FIELDS)[number];

export type DealerFeedMappingTemplate = {
  id: number;
  name: string;
  columnMapping: Record<string, string>;
};

export type DealerStockFeedRunRow = {
  row: number;
  status: "created" | "valid" | "error";
  vehicleId: string | null;
  errors: Record<string, string[]> | null;
};

export type DealerStockFeedRun = {
  id: number;
  source: "csv" | "api" | "dms";
  mode: "dry_run" | "commit";
  status: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  report: DealerStockFeedRunRow[];
  createdAt: string;
};

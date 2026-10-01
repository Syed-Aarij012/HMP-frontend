import type { DealerFeedMappingTemplate, DealerStockFeedRun } from "@/types/dealerStockFeed";

export type ApiDealerFeedMappingTemplate = {
  id: number;
  name: string;
  column_mapping: Record<string, string>;
};

export function mapApiDealerFeedMappingTemplate(api: ApiDealerFeedMappingTemplate): DealerFeedMappingTemplate {
  return { id: api.id, name: api.name, columnMapping: api.column_mapping };
}

export type ApiDealerStockFeedRunRow = {
  row: number;
  status: string;
  vehicle_id: string | null;
  errors: Record<string, string[]> | null;
};

export type ApiDealerStockFeedRun = {
  id: number;
  source: string;
  mode: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  report: ApiDealerStockFeedRunRow[];
  created_at: string;
};

export function mapApiDealerStockFeedRun(api: ApiDealerStockFeedRun): DealerStockFeedRun {
  return {
    id: api.id,
    source: api.source as DealerStockFeedRun["source"],
    mode: api.mode as DealerStockFeedRun["mode"],
    status: api.status,
    totalRows: api.total_rows,
    validRows: api.valid_rows,
    errorRows: api.error_rows,
    report: (api.report ?? []).map((r) => ({
      row: r.row,
      status: r.status as DealerStockFeedRun["report"][number]["status"],
      vehicleId: r.vehicle_id,
      errors: r.errors,
    })),
    createdAt: api.created_at,
  };
}

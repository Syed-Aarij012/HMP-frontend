"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import {
  mapApiDealerFeedMappingTemplate,
  mapApiDealerStockFeedRun,
  type ApiDealerFeedMappingTemplate,
  type ApiDealerStockFeedRun,
} from "@/lib/mapApiDealerStockFeed";
import type { DealerFeedMappingTemplate, DealerStockFeedRun } from "@/types/dealerStockFeed";

/** FR-A-031: saved CSV-header-to-internal-field mapping templates for a dealer's own feed. */
export function useDealerFeedMappingTemplates() {
  const [templates, setTemplates] = useState<DealerFeedMappingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<ApiDealerFeedMappingTemplate[]>("/dealer/feed-mapping-templates")
      .then((response) => {
        setTemplates(response.map(mapApiDealerFeedMappingTemplate));
        setError(null);
      })
      .catch(() => setError("Could not load your saved mapping templates."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const create = useCallback(
    async (name: string, columnMapping: Record<string, string>): Promise<boolean> => {
      setCreating(true);
      setCreateError(null);
      try {
        await apiFetch("/dealer/feed-mapping-templates", { method: "POST", body: { name, column_mapping: columnMapping } });
        load();
        return true;
      } catch (err) {
        setCreateError(describeApiError(err, "Could not save this mapping template."));
        return false;
      } finally {
        setCreating(false);
      }
    },
    [load],
  );

  return { templates, loading, error, create, creating, createError };
}

/** FR-A-031: past bulk-ingestion runs, and uploading a new CSV (dry-run or committed). */
export function useDealerStockFeedRuns() {
  const [runs, setRuns] = useState<DealerStockFeedRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<DealerStockFeedRun | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<{ data: ApiDealerStockFeedRun[] }>("/dealer/stock-feeds")
      .then((response) => {
        setRuns(response.data.map(mapApiDealerStockFeedRun));
        setError(null);
      })
      .catch(() => setError("Could not load your stock-feed run history."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const upload = useCallback(
    async (file: File, mappingTemplateId: number, dryRun: boolean): Promise<boolean> => {
      setUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mapping_template_id", String(mappingTemplateId));
        formData.append("dry_run", dryRun ? "1" : "0");
        const response = await apiFetch<{ data: ApiDealerStockFeedRun }>("/dealer/stock-feeds/csv", {
          method: "POST",
          body: formData,
        });
        setLastRun(mapApiDealerStockFeedRun(response.data));
        load();
        return true;
      } catch (err) {
        setUploadError(describeApiError(err, "Could not process this CSV file."));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [load],
  );

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncDms = useCallback(
    async (dryRun: boolean): Promise<boolean> => {
      setSyncing(true);
      setSyncError(null);
      try {
        const response = await apiFetch<{ data: ApiDealerStockFeedRun }>("/dealer/stock-feeds/dms-sync", {
          method: "POST",
          body: { dry_run: dryRun },
        });
        setLastRun(mapApiDealerStockFeedRun(response.data));
        load();
        return true;
      } catch (err) {
        setSyncError(describeApiError(err, "Could not sync from your DMS."));
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [load],
  );

  return { runs, loading, error, upload, uploading, uploadError, lastRun, syncDms, syncing, syncError };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiTaxonomyNode, mapApiTaxonomyVersion, type ApiTaxonomyNode, type ApiTaxonomyVersion } from "@/lib/mapApiTaxonomy";
import type { TaxonomyNode, TaxonomyVersion } from "@/types/taxonomy";

/** FR-A-006: every taxonomy version, drafting a new one, and publishing one. */
export function useTaxonomyVersions() {
  const [versions, setVersions] = useState<TaxonomyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<ApiTaxonomyVersion[]>("/taxonomy-versions")
      .then((response) => {
        setVersions(response.map(mapApiTaxonomyVersion));
        setError(null);
      })
      .catch(() => setError("Could not load taxonomy versions."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const draft = useCallback(
    async (versionLabel: string, effectiveFrom: string): Promise<number | null> => {
      setDrafting(true);
      setDraftError(null);
      try {
        const response = await apiFetch<ApiTaxonomyVersion>("/taxonomy-versions", {
          method: "POST",
          body: { version_label: versionLabel, effective_from: effectiveFrom },
        });
        load();
        return response.id;
      } catch (err) {
        setDraftError(describeApiError(err, "Could not draft this taxonomy version."));
        return null;
      } finally {
        setDrafting(false);
      }
    },
    [load],
  );

  const publish = useCallback(
    async (versionId: number): Promise<boolean> => {
      setPublishingId(versionId);
      setPublishError(null);
      try {
        await apiFetch(`/taxonomy-versions/${versionId}/publish`, { method: "POST" });
        load();
        return true;
      } catch (err) {
        setPublishError(describeApiError(err, "Could not publish this taxonomy version."));
        return false;
      } finally {
        setPublishingId(null);
      }
    },
    [load],
  );

  return { versions, loading, error, draft, drafting, draftError, publish, publishingId, publishError };
}

/** FR-A-006: a single taxonomy version's node tree, plus adding a node to it. */
export function useTaxonomyTree(versionId: number | null) {
  const [tree, setTree] = useState<TaxonomyNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!versionId) {
      setTree([]);
      return;
    }
    setLoading(true);
    apiFetch<{ data: ApiTaxonomyNode[] }>(`/taxonomy-versions/${versionId}/tree`)
      .then((response) => setTree(response.data.map(mapApiTaxonomyNode)))
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  }, [versionId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const addNode = useCallback(
    async (type: "make" | "model" | "derivative", name: string, parentId: number | null): Promise<boolean> => {
      if (!versionId) return false;
      setAdding(true);
      setAddError(null);
      try {
        await apiFetch(`/taxonomy-versions/${versionId}/nodes`, {
          method: "POST",
          body: { type, name, parent_id: parentId ?? undefined },
        });
        load();
        return true;
      } catch (err) {
        setAddError(describeApiError(err, "Could not add this node."));
        return false;
      } finally {
        setAdding(false);
      }
    },
    [versionId, load],
  );

  return { tree, loading, addNode, adding, addError };
}

export function flattenTree(nodes: TaxonomyNode[], depth = 0): { id: number; label: string; type: TaxonomyNode["type"] }[] {
  return nodes.flatMap((node) => [
    { id: node.id, label: `${"— ".repeat(depth)}${node.name}`, type: node.type },
    ...flattenTree(node.children, depth + 1),
  ]);
}

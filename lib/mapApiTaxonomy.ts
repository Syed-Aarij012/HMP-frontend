import type { TaxonomyNode, TaxonomyVersion } from "@/types/taxonomy";

export type ApiTaxonomyVersion = {
  id: number;
  version_label: string;
  effective_from: string;
  published_at: string | null;
};

export function mapApiTaxonomyVersion(api: ApiTaxonomyVersion): TaxonomyVersion {
  return {
    id: api.id,
    versionLabel: api.version_label,
    effectiveFrom: api.effective_from,
    publishedAt: api.published_at,
  };
}

export type ApiTaxonomyNode = {
  id: number;
  type: string;
  name: string;
  children: ApiTaxonomyNode[];
};

export function mapApiTaxonomyNode(api: ApiTaxonomyNode): TaxonomyNode {
  return {
    id: api.id,
    type: api.type as TaxonomyNode["type"],
    name: api.name,
    children: (api.children ?? []).map(mapApiTaxonomyNode),
  };
}

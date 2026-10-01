// FR-A-006: versioned make/model/derivative taxonomy tree administration.

export type TaxonomyVersion = {
  id: number;
  versionLabel: string;
  effectiveFrom: string;
  publishedAt: string | null;
};

export type TaxonomyNode = {
  id: number;
  type: "make" | "model" | "derivative";
  name: string;
  children: TaxonomyNode[];
};

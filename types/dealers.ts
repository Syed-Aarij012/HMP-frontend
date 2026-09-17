export type Dealer = {
  id: number;
  name: string;
  image: string;
  logo: string;
  description?: string | null;
  reviewCount: number;
  rating: number;
  phone: string;
  address: string;
  state: string;
  brand: string;
  dateAdded: string;
  // Real dealers only: the backend's own slug (never purely numeric, unlike a mock id) —
  // used as the route segment so lib/dealer-detail-page.tsx can tell a real dealer apart
  // from a mock one, and to call GET /dealers/{slug} again.
  slug?: string;
  organizationId?: number;
};

export type DealerSortOption = "date" | "name" | "rating" | "reviews";

export type DealerListingFilters = {
  location: string;
  brand: string;
  sortBy: DealerSortOption;
  perPage: number;
  page: number;
};

// FR-C-002: one open/close pair per weekday, or null when closed that day. Keyed by the same
// lowercase 3-letter day abbreviation the backend's AppointmentService already reads
// (mon/tue/wed/thu/fri/sat/sun), not full day names.
export type DealerOpeningHours = Partial<Record<
  "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
  { open: string; close: string } | null
>>;

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
  // Number of live ads this dealer has listed (shown on the dealer card).
  listingsCount?: number;
  // FR-C-002: real dealers only — opening hours and the FCA/regulatory disclosures block,
  // both already stored and editable server-side (DealerStorefrontProfileController) but
  // never rendered on the public storefront page until now.
  openingHours?: DealerOpeningHours | null;
  disclosures?: string | null;
};

export type DealerSortOption = "date" | "name" | "rating" | "reviews";

export type DealerListingFilters = {
  location: string;
  brand: string;
  sortBy: DealerSortOption;
  perPage: number;
  page: number;
};

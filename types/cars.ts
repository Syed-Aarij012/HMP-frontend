export type DashboardListingStatus = "approved" | "pending" | "sold";

export type Car = {
  id: number;
  image: string;
  title: string;
  price: number;
  mileage: number;
  transmission: string;
  fuel: string;
  tag: string;
  photoCount: number;
  bodyType?: string[];
  listingType?: string[];
  brandType?: string[];
  priceRange?: string[];
  description?: string;
  imageWidth?: number;
  imageHeight?: number;
  href?: string;
  featured?: boolean;
  filterMake?: string;
  filterBrand?: string;
  filterModel?: string;
  filterModelCategory?: string;
  filterSeats?: number;
  filterOwnership?: string;
  filterBodyType?: string[];
  filterFuel?: string;
  filterTransmission?: string;
  filterDriveType?: string;
  filterDoors?: number;
  filterCylinders?: number;
  filterColor?: string;
  filterYear?: number;
  filterFeatures?: string[];
  mapPosition?: [number, number];
  // Real listings only: the full real photo set (QA-passed vehicle media) and the
  // backend's own ULID, needed by anything that must call the API about this exact
  // listing again (favoriting, reviews) rather than just displaying it.
  images?: string[];
  publicId?: string;
  // FR-A-023: the consumer-safe projection only — a private buyer never gets damage-item/
  // hotspot detail, that's the trade-only projection shown on the auction lot page instead.
  conditionReport?: {
    conditionGrade: number | null;
    mechanicalGrade: string | null;
    summaryText: string | null;
  };
};

export type DashboardCar = Car & {
  dashboardImage: string;
  dashboardStatus: DashboardListingStatus;
  postingDate: string;
};

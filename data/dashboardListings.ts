import type { DashboardListingStatus } from "@/types/cars";

export type { DashboardCar, DashboardListingStatus } from "@/types/cars";

export {
  DASHBOARD_LISTINGS_TOTAL_COUNT,
  FAVORITE_LISTINGS_TOTAL_COUNT,
  dashboardPageListingCars,
  favoriteCars,
  formatCarPrice,
  myListingCars,
} from "@/data/cars";

export const DASHBOARD_LISTING_STATUS_META: Record<
  DashboardListingStatus,
  { label: string; className: string }
> = {
  approved: { label: "Live", className: "status-publish" },
  pending: { label: "Pending checks", className: "status-pending" },
  draft: { label: "Draft", className: "status-draft" },
  under_offer: { label: "Under offer", className: "status-under-offer" },
  reserved: { label: "Reserved", className: "status-reserved" },
  withdrawn: { label: "Withdrawn", className: "status-withdrawn" },
  expired: { label: "Expired", className: "status-expired" },
  sold: { label: "Sold", className: "status-sold" },
};

export function formatDashboardListingPrice(price: number) {
  return `$${price.toLocaleString("en-US")}`;
}

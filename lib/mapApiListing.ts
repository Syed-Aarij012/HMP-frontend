import type { Car } from "@/types/cars";

export type ApiListing = {
  id: string;
  status: string;
  price: string | number;
  description?: string | null;
  published_at: string | null;
  vehicle: {
    make?: string;
    model?: string;
    derivative?: string;
    body_type?: string;
    fuel_type?: string;
    transmission?: string;
    colour?: string;
    doors?: number;
    seats?: number;
    year?: number;
    current_mileage?: number;
  } | null;
};

export type ApiListingsResponse = {
  data: ApiListing[];
  facets?: {
    make?: { value: string; count: number }[];
    body_type?: { value: string; count: number }[];
    [key: string]: unknown;
  };
};

const BODY_TYPE_LABELS: Record<string, string> = {
  hatchback: "Hatchback",
  saloon: "Sedan",
  estate: "Station Wagon",
  suv: "SUV",
};

// Real listings don't carry a "new vs used" flag — the backend has no such column.
// A near-zero mileage vehicle is the closest honest proxy for "new" available today.
const NEW_CAR_MILEAGE_THRESHOLD = 500;

export function mapApiListingToCar(listing: ApiListing): Car {
  const vehicle = listing.vehicle;
  // The backend's derivative already includes the model name (e.g. model "Focus",
  // derivative "Focus Titanium") — including both would double it up.
  const title = vehicle
    ? [vehicle.make, vehicle.derivative ?? vehicle.model].filter(Boolean).join(" ")
    : "Untitled listing";
  const mileage = vehicle?.current_mileage ?? 0;
  const bodyTypeLabel = vehicle?.body_type
    ? BODY_TYPE_LABELS[vehicle.body_type] ?? vehicle.body_type
    : undefined;

  return {
    id: hashListingId(listing.id),
    href: `/listing-detail-v1/${listing.id}`,
    image: "/assets/images/car-list/car1.webp",
    title: title || "Untitled listing",
    price: Number(listing.price) || 0,
    mileage,
    transmission: capitalize(vehicle?.transmission) ?? "-",
    fuel: capitalize(vehicle?.fuel_type) ?? "-",
    tag: vehicle?.year ? String(vehicle.year) : "-",
    photoCount: 0,
    description: listing.description ?? undefined,
    bodyType: bodyTypeLabel ? [bodyTypeLabel] : undefined,
    listingType: [mileage < NEW_CAR_MILEAGE_THRESHOLD ? "New car" : "Used car"],
    // Populated so the existing client-side filter engine (useListingFilterState /
    // listingFilterReducer) works against real data without any changes of its own.
    filterMake: vehicle?.make,
    filterBrand: vehicle?.make,
    filterModel: vehicle?.model,
    filterModelCategory: bodyTypeLabel,
    filterBodyType: bodyTypeLabel ? [bodyTypeLabel] : undefined,
    filterFuel: capitalize(vehicle?.fuel_type),
    filterTransmission: capitalize(vehicle?.transmission),
    filterDoors: vehicle?.doors,
    filterSeats: vehicle?.seats,
    filterColor: vehicle?.colour,
    filterYear: vehicle?.year,
  };
}

function capitalize(value?: string): string | undefined {
  if (!value) return undefined;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// The rest of this template keys cars by a numeric id (mock data, detail-page lookups).
// Real listings use ULIDs — this derives a stable numeric id from that string so the
// existing Car[] consumers (list keys, etc.) keep working without a type change.
function hashListingId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function normalizeBodyTypeLabel(value: string): string {
  return BODY_TYPE_LABELS[value] ?? capitalize(value) ?? value;
}

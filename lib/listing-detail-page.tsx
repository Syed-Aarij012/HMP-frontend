import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { allCars, getCarById, getCarDetailTitle } from "@/data/cars";
import { parseNumericRouteId } from "@/lib/routes";
import { apiFetch } from "@/lib/api-client";
import { mapApiListingToCar, type ApiListing } from "@/lib/mapApiListing";
import { getSiteUrl } from "@/lib/site-url";
import type { Car } from "@/types/cars";

// FR-C-002/C-004: schema.org Vehicle + Offer structured data — only for a real listing
// (one with a publicId; the template's mock cars don't have one and would otherwise produce
// a JSON-LD block of fabricated fields).
function listingJsonLd(car: Car): Record<string, unknown> | null {
  if (!car.publicId) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: car.title,
    image: car.images && car.images.length > 0 ? car.images : undefined,
    vehicleTransmission: car.transmission !== "-" ? car.transmission : undefined,
    fuelType: car.fuel !== "-" ? car.fuel : undefined,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: car.mileage, unitCode: "SMI" },
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      url: `${getSiteUrl()}${car.href ?? ""}`,
    },
  };
}

// Mock cars are keyed by a small numeric id; real listings use a ULID (e.g.
// "01m1eb1y..."). A non-numeric route param is always a real backend id, so it's
// fetched from GET /listings/{id} (public, no auth) instead of the mock dataset.
async function resolveCar(id: string): Promise<{ car: Car; title: string } | null> {
  const carId = parseNumericRouteId(id);

  if (carId !== null) {
    const car = getCarById(carId);
    return car ? { car, title: getCarDetailTitle(carId) } : null;
  }

  try {
    const response = await apiFetch<{ data: ApiListing }>(`/listings/${id}`, { auth: false });
    const car = mapApiListingToCar(response.data);
    return { car, title: car.title };
  } catch {
    return null;
  }
}

type ListingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export type ListingDetailSectionProps = {
  title: string;
  car: Car;
};

export function createListingDetailPageConfig(
  Hero: ComponentType,
  ListingDetail: ComponentType<ListingDetailSectionProps>,
) {
  function generateStaticParams() {
    return allCars.map((car) => ({ id: String(car.id) }));
  }

  async function generateMetadata({
    params,
  }: ListingDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    const resolved = await resolveCar(id);

    if (!resolved) {
      return {
        title:
          "Listing Detail | HMP - Car Dealer, Rental & Listing",
      };
    }

    return {
      title: `${resolved.title} | HMP`,
      description: "HMP - Car Dealer, Rental & Listing",
    };
  }

  async function Page({ params }: ListingDetailPageProps) {
    const { id } = await params;
    const resolved = await resolveCar(id);

    if (!resolved) {
      notFound();
    }

    const { car, title } = resolved;
    const jsonLd = listingJsonLd(car);

    return (
      <>
        {jsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        )}
        <Hero />
        <ListingDetail title={title} car={car} />
      </>
    );
  }

  return { generateStaticParams, generateMetadata, default: Page };
}

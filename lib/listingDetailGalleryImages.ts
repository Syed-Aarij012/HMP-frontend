import type { ListingDetailGalleryImage } from "@/data/listingDetailV1Gallery";
import type { Car } from "@/types/cars";

/**
 * Converts a real listing's photo URLs (`Car.images`) into the shape every
 * listing-detail gallery component expects. Real photos don't carry known pixel
 * dimensions client-side, so every entry is given the same `width`/`height` — pass
 * the convention the target variant's own mock gallery uses so the aspect ratio (and
 * therefore the layout) stays consistent with what that variant already renders for
 * mock/demo listings.
 */
export function toListingDetailGalleryImages(
  images: string[],
  altPrefix: string,
  width: number,
  height: number,
): ListingDetailGalleryImage[] {
  return images.map((src, index) => ({
    src,
    thumb: src,
    alt: images.length > 1 ? `${altPrefix} photo ${index + 1}` : altPrefix,
    width,
    height,
  }));
}

/**
 * Picks the gallery a listing-detail variant should render: `car`'s real photos when
 * `car` is a real backend listing (`car.publicId` set) with at least one real image,
 * else `fallback` — that variant's existing mock gallery array, unchanged, so the
 * mock/demo browsing experience never regresses.
 */
export function resolveListingDetailGalleryImages(
  car: Car,
  fallback: ListingDetailGalleryImage[],
  width: number,
  height: number,
): ListingDetailGalleryImage[] {
  if (!car.publicId || !car.images || car.images.length === 0) {
    return fallback;
  }

  return toListingDetailGalleryImages(car.images, car.title, width, height);
}

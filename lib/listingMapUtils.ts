import type { ListingMapLocation } from "@/data/listingMapLocations";
import { getCarById } from "@/data/cars";
import type { Car } from "@/types/cars";

export type MapCar = Car & { mapPosition: [number, number] };

export function hasMapPosition(car: Car): car is MapCar {
  return (
    Array.isArray(car.mapPosition) &&
    car.mapPosition.length === 2 &&
    typeof car.mapPosition[0] === "number" &&
    typeof car.mapPosition[1] === "number"
  );
}

export function listingLocationToCar(listing: ListingMapLocation): Car {
  return (
    getCarById(listing.id) ?? {
      id: listing.id,
      image: listing.image,
      title: listing.title,
      price: Number.parseInt(listing.price.replace(/[^\d]/g, ""), 10) || 0,
      mileage: Number.parseInt(listing.mileage.replace(/[^\d]/g, ""), 10) || 0,
      transmission: listing.transmission,
      fuel: listing.fuel,
      tag: listing.isNew ? "New" : "Used",
      photoCount: listing.photoCount ?? 0,
      href: listing.href,
    }
  );
}

export function carToListingMapLocation(car: MapCar): ListingMapLocation {
  return {
    id: car.id,
    position: car.mapPosition,
    image: car.image,
    href: car.href ?? `/listing-detail-v1/${car.id}`,
    category: car.filterBodyType?.[0] ?? car.bodyType?.[0] ?? "Sedan",
    title: car.title,
    mileage: `${car.mileage.toLocaleString()} Km`,
    fuel: car.fuel,
    transmission: car.transmission,
    price: `£${car.price.toLocaleString()}`,
    isNew: car.tag === "New",
    photoCount: car.photoCount,
  };
}

type LatLngLiteral = google.maps.LatLngLiteral;

const MAP_ZOOM_STEP_MS = 50;
const MAP_FOCUS_OFFSET_Y = -100;

export function panMapToLocation(
  map: google.maps.Map,
  position: LatLngLiteral,
  onComplete?: () => void,
  offsetYPx = MAP_FOCUS_OFFSET_Y,
): () => void {
  let idleListener: google.maps.MapsEventListener | null = null;
  let offsetIdleListener: google.maps.MapsEventListener | null = null;

  map.panTo(position);

  idleListener = google.maps.event.addListenerOnce(map, "idle", () => {
    idleListener = null;
    map.panBy(0, offsetYPx);
    offsetIdleListener = google.maps.event.addListenerOnce(map, "idle", () => {
      offsetIdleListener = null;
      onComplete?.();
    });
  });

  return () => {
    if (idleListener) {
      google.maps.event.removeListener(idleListener);
    }
    if (offsetIdleListener) {
      google.maps.event.removeListener(offsetIdleListener);
    }
  };
}

export function animateMapToLocation(
  map: google.maps.Map,
  position: LatLngLiteral,
  targetZoom: number,
  onComplete?: () => void,
): () => void {
  const timeouts: number[] = [];
  let idleListener: google.maps.MapsEventListener | null = null;

  const schedule = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(callback, delay);
    timeouts.push(timeoutId);
  };

  const cleanup = () => {
    timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    if (idleListener) {
      google.maps.event.removeListener(idleListener);
      idleListener = null;
    }
  };

  map.panTo(position);

  const startZoom = map.getZoom() ?? targetZoom;
  if (startZoom === targetZoom) {
    onComplete?.();
    return cleanup;
  }

  idleListener = google.maps.event.addListenerOnce(map, "idle", () => {
    idleListener = null;

    const step = startZoom < targetZoom ? 1 : -1;
    let currentZoom = startZoom;

    const runZoomStep = () => {
      if (currentZoom === targetZoom) {
        onComplete?.();
        return;
      }

      currentZoom += step;
      map.setZoom(currentZoom);

      if (currentZoom !== targetZoom) {
        schedule(runZoomStep, MAP_ZOOM_STEP_MS);
      } else {
        onComplete?.();
      }
    };

    runZoomStep();
  });

  return cleanup;
}

import type { NiceSelectOption } from "@/components/common/NiceSelect";
import type { Car } from "@/types/cars";
import { LISTING_PRICE_MAX } from "@/components/reducer/listingFilterReducer";

export const LIVE_PRICE_VALUE = "__live__";

export function getListingPriceBounds(cars: Car[]) {
  if (!cars.length) {
    return { min: 0, max: LISTING_PRICE_MAX };
  }

  const prices = cars.map((car) => car.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function formatPriceRangeLabel([min, max]: [number, number]) {
  if (min === 0) {
    return `Up to £${max.toLocaleString("en-GB")}`;
  }

  return `£${min.toLocaleString("en-GB")} - £${max.toLocaleString("en-GB")}`;
}

export function buildListingPriceOptions(cars: Car[]): NiceSelectOption[] {
  const { min, max } = getListingPriceBounds(cars);

  if (!cars.length) {
    return [{ label: "Any price", value: "" }];
  }

  const step = max - min > 50000 ? 10000 : 5000;
  const thresholds = new Set<number>();

  for (let cap = Math.ceil(min / step) * step; cap < max; cap += step) {
    if (cars.some((car) => car.price <= cap)) {
      thresholds.add(cap);
    }
  }

  thresholds.add(max);

  const sortedCaps = [...thresholds].sort((a, b) => a - b);

  return [
    { label: "Any price", value: "" },
    ...sortedCaps.map((cap) => ({
      label: `Up to £${cap.toLocaleString("en-GB")}`,
      value: cap,
    })),
  ];
}

export function buildLivePriceOptions(
  baseOptions: NiceSelectOption[],
  priceRange: [number, number],
  priceMax: number,
): NiceSelectOption[] {
  const isDefault = priceRange[0] === 0 && priceRange[1] >= priceMax;
  if (isDefault) {
    return baseOptions;
  }

  if (
    priceRange[0] === 0 &&
    baseOptions.some((option) => option.value === priceRange[1])
  ) {
    return baseOptions;
  }

  const anyPrice = baseOptions.find((option) => option.value === "") ?? {
    label: "Any price",
    value: "",
  };

  const presets = baseOptions.filter(
    (option) => option.value !== "" && option.value !== LIVE_PRICE_VALUE,
  );

  return [
    anyPrice,
    { label: formatPriceRangeLabel(priceRange), value: LIVE_PRICE_VALUE },
    ...presets,
  ];
}

export function getPriceSelectValue(
  priceRange: [number, number],
  priceMax: number,
  options: NiceSelectOption[],
) {
  if (priceRange[0] === 0 && priceRange[1] >= priceMax) {
    return "";
  }

  if (
    priceRange[0] === 0 &&
    options.some((option) => option.value === priceRange[1])
  ) {
    return priceRange[1];
  }

  if (options.some((option) => option.value === LIVE_PRICE_VALUE)) {
    return LIVE_PRICE_VALUE;
  }

  return "";
}

import type {
  ListingFilterAction,
  ListingFilterState,
} from "@/types/listingFilter";
import type { Car } from "@/types/cars";

export const LISTING_PRICE_MAX = 500000;
export const LISTING_MILEAGE_MAX = 800000;
export const LISTING_YEAR_MIN = 2000;
// Next year's models can be on sale before the calendar turns, so the slider runs one year ahead.
export const LISTING_YEAR_MAX = new Date().getFullYear() + 1;

export const listingFilterInitialState: ListingFilterState = {
  categoryTab: "all",
  brand: "",
  modelCategory: "",
  make: "",
  model: "",
  bodyType: "",
  featured: false,
  seats: "",
  ownership: "",
  price: [0, LISTING_PRICE_MAX],
  fuel: "",
  transmission: "",
  driveType: "",
  mileage: [0, LISTING_MILEAGE_MAX],
  doors: "",
  cylinders: "",
  color: "",
  year: [LISTING_YEAR_MIN, LISTING_YEAR_MAX],
  features: [],
  listingPriceMax: LISTING_PRICE_MAX,
  filtered: [],
  sortingOption: "Sort by (Defaut)",
  sorted: [],
  currentPage: 1,
  itemPerPage: 50,
};

function matchesAllFilters(car: Car, state: ListingFilterState): boolean {
  if (state.categoryTab === "new") {
    const isNew =
      car.tag === "New" || car.listingType?.includes("New car") === true;
    if (!isNew) return false;
  }

  if (state.categoryTab === "used") {
    const isUsed =
      car.tag === "Used" || car.listingType?.includes("Used car") === true;
    if (!isUsed) return false;
  }

  if (state.brand) {
    const brandLower = state.brand.toLowerCase();
    const matchesBrand =
      car.filterBrand?.toLowerCase() === brandLower ||
      car.brandType?.some(
        (item) =>
          item.toLowerCase() === brandLower ||
          item.toLowerCase().includes(brandLower),
      ) ||
      car.filterMake?.toLowerCase() === brandLower;
    if (!matchesBrand) return false;
  }

  if (
    state.modelCategory &&
    car.filterModelCategory !== state.modelCategory
  ) {
    return false;
  }

  if (state.make && car.filterMake !== state.make) return false;

  if (state.model && car.filterModel !== state.model) return false;

  if (
    state.bodyType &&
    !car.filterBodyType?.some(
      (type) => type.toLowerCase() === state.bodyType.toLowerCase(),
    )
  ) {
    return false;
  }

  if (state.featured && !car.featured) return false;

  // A range handle left at the end of its slider means "no limit" that way (ListingFilterMeta
  // already treats it as no filter). Otherwise a car priced or driven beyond the slider's top, or
  // newer/older than its last year, silently vanished from results nobody had filtered.
  const priceUpper = state.price[1] >= state.listingPriceMax ? Infinity : state.price[1];
  if (car.price < state.price[0] || car.price > priceUpper) return false;

  if (
    state.fuel &&
    car.filterFuel?.toLowerCase() !== state.fuel.toLowerCase()
  ) {
    return false;
  }

  if (
    state.transmission &&
    car.filterTransmission?.toLowerCase() !== state.transmission.toLowerCase()
  ) {
    return false;
  }

  if (
    state.driveType &&
    car.filterDriveType?.toLowerCase() !== state.driveType.toLowerCase()
  ) {
    return false;
  }

  const mileageUpper = state.mileage[1] >= LISTING_MILEAGE_MAX ? Infinity : state.mileage[1];
  if (car.mileage < state.mileage[0] || car.mileage > mileageUpper) {
    return false;
  }

  if (state.doors !== "" && car.filterDoors !== Number(state.doors)) {
    return false;
  }

  if (
    state.cylinders !== "" &&
    car.filterCylinders !== Number(state.cylinders)
  ) {
    return false;
  }

  if (
    state.color &&
    car.filterColor?.toLowerCase() !== state.color.toLowerCase()
  ) {
    return false;
  }

  if (
    state.ownership &&
    car.filterOwnership?.toLowerCase() !== state.ownership.toLowerCase()
  ) {
    return false;
  }

  if (
    state.seats !== "" &&
    car.filterSeats != null &&
    car.filterSeats !== Number(state.seats)
  ) {
    return false;
  }

  const carYear = car.filterYear ?? LISTING_YEAR_MAX;
  const yearLower = state.year[0] <= LISTING_YEAR_MIN ? -Infinity : state.year[0];
  const yearUpper = state.year[1] >= LISTING_YEAR_MAX ? Infinity : state.year[1];
  if (carYear < yearLower || carYear > yearUpper) return false;

  if (
    state.features.length &&
    !state.features.some((feature) => car.filterFeatures?.includes(feature))
  ) {
    return false;
  }

  return true;
}

export function listingFilterReducer(
  state: ListingFilterState,
  action: ListingFilterAction,
): ListingFilterState {
  switch (action.type) {
    case "SET_CATEGORY_TAB":
      return { ...state, categoryTab: action.payload };

    case "SET_BRAND":
      return { ...state, brand: action.payload };

    case "SET_MODEL_CATEGORY":
      return { ...state, modelCategory: action.payload };

    case "SET_SEATS":
      return { ...state, seats: action.payload };

    case "SET_OWNERSHIP":
      return { ...state, ownership: action.payload };

    case "SET_MAKE":
      return { ...state, make: action.payload };

    case "SET_MODEL":
      return { ...state, model: action.payload };

    case "SET_BODY_TYPE":
      return { ...state, bodyType: action.payload };

    case "SET_FEATURED":
      return { ...state, featured: action.payload };

    case "SET_PRICE":
      return { ...state, price: action.payload };

    case "SET_FUEL":
      return { ...state, fuel: action.payload };

    case "SET_TRANSMISSION":
      return { ...state, transmission: action.payload };

    case "SET_DRIVE_TYPE":
      return { ...state, driveType: action.payload };

    case "SET_MILEAGE":
      return { ...state, mileage: action.payload };

    case "SET_DOORS":
      return { ...state, doors: action.payload };

    case "SET_CYLINDERS":
      return { ...state, cylinders: action.payload };

    case "SET_COLOR":
      return { ...state, color: action.payload };

    case "SET_YEAR":
      return { ...state, year: action.payload };

    case "SET_FEATURES":
      return { ...state, features: action.payload };

    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };

    case "SET_ITEM_PER_PAGE":
      return { ...state, itemPerPage: action.payload, currentPage: 1 };

    case "FILTER_LISTINGS": {
      const filtered = [...action.payload].filter((car) =>
        matchesAllFilters(car, state),
      );
      return { ...state, filtered, currentPage: 1 };
    }

    case "SET_SORTING_OPTION":
      return { ...state, sortingOption: action.payload };

    case "SORT_LISTINGS": {
      const sorted = [...state.filtered];
      switch (state.sortingOption) {
        case "Low to high":
          sorted.sort((a, b) => a.price - b.price);
          break;
        case "High to low":
          sorted.sort((a, b) => b.price - a.price);
          break;
        default:
          break;
      }
      return { ...state, sorted, currentPage: 1 };
    }

    case "CLEAR_FILTER":
      return {
        ...state,
        categoryTab: "all",
        brand: "",
        modelCategory: "",
        make: "",
        model: "",
        bodyType: "",
        featured: false,
        seats: "",
        ownership: "",
        price: [0, state.listingPriceMax],
        fuel: "",
        transmission: "",
        driveType: "",
        mileage: [0, LISTING_MILEAGE_MAX],
        doors: "",
        cylinders: "",
        color: "",
        year: [LISTING_YEAR_MIN, LISTING_YEAR_MAX],
        features: [],
        sortingOption: "Sort by (Defaut)",
      };

    default:
      return state;
  }
}

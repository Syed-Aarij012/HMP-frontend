import type { NiceSelectOption } from "@/components/common/NiceSelect";
import { dealerBrands, dealerStates } from "@/data/dealers";

export const BRAND_OPTIONS: NiceSelectOption[] = [
  { label: "Land Rover", value: "" },
  { label: "KIA", value: "KIA" },
  { label: "Renault", value: "Renault" },
  { label: "Nissan", value: "Nissan" },
  { label: "Ford", value: "Ford" },
  { label: "BMW", value: "BMW" },
  { label: "NIO", value: "NIO" },
  { label: "Mini", value: "Mini" },
  { label: "Jeep", value: "Jeep" },
];

export const TYPE_OPTIONS: NiceSelectOption[] = [
  { label: "Coupe", value: "" },
  { label: "Hatchback", value: "Hatchback" },
  { label: "Hybrid", value: "Hybrid" },
];

export const MODEL_OPTIONS: NiceSelectOption[] = [
  { label: "Modern Supercar", value: "" },
  { label: "Muscle Car", value: "Muscle Car" },
  { label: "JDM", value: "JDM" },
  { label: "Off-Road/Truck", value: "Off-Road/Truck" },
  { label: "Rally/F1 Race Car", value: "Rally/F1 Race Car" },
];

export const PRICE_OPTIONS: NiceSelectOption[] = [
  { label: "$2000", value: 2000 },
  { label: "$3000", value: 3000 },
  { label: "$5000", value: 5000 },
  { label: "$10000", value: 10000 },
  { label: "$20000", value: 20000 },
  { label: "$30000", value: 30000 },
  { label: "$50000", value: 50000 },
  { label: "$100000", value: 100000 },
];

export const FUEL_TYPE_OPTIONS: NiceSelectOption[] = [
  { label: "Select Fuel Type", value: "" },
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "Electric", value: "electric" },
  { label: "Hybrid", value: "hybrid" },
  { label: "CNG", value: "cng" },
];

export const TRANSMISSION_OPTIONS: NiceSelectOption[] = [
  { label: "Select Transmission", value: "" },
  { label: "Manual", value: "manual" },
  { label: "Automatic", value: "automatic" },
  { label: "CVT", value: "cvt" },
  { label: "Semi-Automatic", value: "semi_automatic" },
  { label: "Dual-Clutch", value: "dual_clutch" },
];

export const DRIVER_TYPE_OPTIONS: NiceSelectOption[] = [
  { label: "Select Driver Type", value: "" },
  { label: "FWD (Front-Wheel Drive)", value: "fwd" },
  { label: "RWD (Rear-Wheel Drive)", value: "rwd" },
  { label: "AWD (All-Wheel Drive)", value: "awd" },
  { label: "4WD (4-Wheel Drive)", value: "4wd" },
];

export const CYLINDER_OPTIONS: NiceSelectOption[] = [
  { label: "Select Cylinder", value: "" },
  { label: "3 Cylinders", value: 3 },
  { label: "4 Cylinders", value: 4 },
  { label: "6 Cylinders", value: 6 },
  { label: "8 Cylinders", value: 8 },
  { label: "12 Cylinders", value: 12 },
];

export const COLOR_OPTIONS: NiceSelectOption[] = [
  { label: "Select Color", value: "" },
  { label: "White", value: "white" },
  { label: "Black", value: "black" },
  { label: "Silver", value: "silver" },
  { label: "Gray", value: "gray" },
  { label: "Blue", value: "blue" },
  { label: "Red", value: "red" },
];

export const DOOR_OPTIONS: NiceSelectOption[] = [
  { label: "Select Door", value: "" },
  { label: "2 Doors", value: 2 },
  { label: "3 Doors", value: 3 },
  { label: "4 Doors", value: 4 },
  { label: "5 Doors", value: 5 },
];

export const SEAT_OPTIONS: NiceSelectOption[] = [
  { label: "Select Seat", value: "" },
  { label: "2 Seats", value: 2 },
  { label: "4 Seats", value: 4 },
  { label: "5 Seats", value: 5 },
  { label: "7 Seats", value: 7 },
  { label: "8+ Seats", value: 8 },
];

export const OWNERSHIP_OPTIONS: NiceSelectOption[] = [
  { label: "Select Ownership", value: "" },
  { label: "New", value: "new" },
  { label: "Used", value: "used" },
  { label: "Certified Pre-Owned", value: "preowned" },
  { label: "Lease Return", value: "lease_return" },
];

export const MAKE_OPTIONS: NiceSelectOption[] = [
  { label: "Choose", value: "" },
  { label: "Toyota", value: "toyota" },
  { label: "Honda", value: "honda" },
  { label: "BMW", value: "bmw" },
  { label: "Mercedes-Benz", value: "mercedes-benz" },
  { label: "Ford", value: "ford" },
];

export const SIDEBAR_MODEL_OPTIONS: NiceSelectOption[] = [
  { label: "Choose", value: "" },
  { label: "Camry", value: "camry" },
  { label: "Civic", value: "civic" },
  { label: "Corolla", value: "corolla" },
  { label: "BMW X5", value: "x5" },
  { label: "Mercedes C-Class", value: "c-class" },
];

export const BODY_TYPE_OPTIONS: NiceSelectOption[] = [
  { label: "Choose", value: "" },
  { label: "Sedan", value: "sedan" },
  { label: "SUV", value: "suv" },
  { label: "Hatchback", value: "hatchback" },
  { label: "Coupe", value: "coupe" },
  { label: "Convertible", value: "convertible" },
];

export const SIDEBAR_FUEL_OPTIONS: NiceSelectOption[] = [
  { label: "Choose", value: "" },
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Electric", value: "electric" },
  { label: "Plug-in Hybrid", value: "plug-in-hybrid" },
];

export const SIDEBAR_TRANSMISSION_OPTIONS: NiceSelectOption[] = [
  { label: "Choose", value: "" },
  { label: "Automatic", value: "automatic" },
  { label: "Manual", value: "manual" },
  { label: "CVT", value: "cvt" },
  { label: "Dual-Clutch", value: "dual-clutch" },
];

export const SIDEBAR_DRIVE_TYPE_OPTIONS: NiceSelectOption[] = [
  { label: "Choose", value: "" },
  { label: "Front-Wheel Drive (FWD)", value: "fwd" },
  { label: "Rear-Wheel Drive (RWD)", value: "rwd" },
  { label: "All-Wheel Drive (AWD)", value: "awd" },
  { label: "4-Wheel Drive (4WD)", value: "4wd" },
];

export const SIDEBAR_DOOR_OPTIONS: NiceSelectOption[] = [
  { label: "Choose", value: "" },
  { label: "2 Doors", value: 2 },
  { label: "3 Doors", value: 3 },
  { label: "4 Doors", value: 4 },
  { label: "5 Doors", value: 5 },
];

export const SIDEBAR_CYLINDER_OPTIONS: NiceSelectOption[] = [
  { label: "Choose", value: "" },
  { label: "3 Cylinders", value: 3 },
  { label: "4 Cylinders", value: 4 },
  { label: "6 Cylinders", value: 6 },
  { label: "8 Cylinders", value: 8 },
];

export const SIDEBAR_COLOR_OPTIONS: NiceSelectOption[] = [
  { label: "Choose", value: "" },
  { label: "Black", value: "black" },
  { label: "White", value: "white" },
  { label: "Silver", value: "silver" },
  { label: "Blue", value: "blue" },
  { label: "Red", value: "red" },
];

export const LISTING_SHOW_OPTIONS: NiceSelectOption[] = [
  { label: "Show: 10", value: 10 },
  { label: "Show: 30", value: 30 },
  { label: "Show: 50", value: 50 },
  { label: "Show: 100", value: 100 },
];

export const SALE_AGENT_SHOW_OPTIONS: NiceSelectOption[] = [
  { label: "Show: 6", value: 6 },
  { label: "Show: 9", value: 9 },
  { label: "Show: 12", value: 12 },
  { label: "Show: 15", value: 15 },
];

export const LISTING_SORT_OPTIONS: NiceSelectOption[] = [
  { label: "Sort by (Defaut)", value: "" },
  { label: "Low to high", value: "low-to-high" },
  { label: "High to low", value: "high-to-low" },
];

export const LISTING_FEATURE_OPTIONS: string[] = [
  "A/C: Front",
  "Backup Camera",
  "Cruise Control",
  "Navigation",
  "Power Locks",
  "Audio system",
  "Touchscreen display",
  "GPS navigation",
  "Phone connectivity",
  "In-car Wi-Fi",
  "Chrome-plated grill",
  "Smart headlight cluster",
  "Premium wheels",
  "Body character lines",
  "High-quality paint",
];

export const LOAN_TERMS_OPTIONS: NiceSelectOption[] = [
  { label: "1 Monthly", value: 1 },
  { label: "3 Monthly", value: 3 },
  { label: "6 Monthly", value: 6 },
  { label: "12 Monthly", value: 12 },
];

export const LOAN_PERIOD_OPTIONS: NiceSelectOption[] = [
  { label: "1 months", value: 1 },
  { label: "3 months", value: 3 },
  { label: "6 months", value: 6 },
  { label: "12 months", value: 12 },
];

export const LISTING_LOAN_TERMS_OPTIONS: NiceSelectOption[] = [
  { label: "Monthly", value: "" },
  { label: "3 Monthly", value: "3-months" },
  { label: "6 Monthly", value: "6-months" },
  { label: "12 Monthly", value: "12-months" },
];

export const LISTING_LOAN_PERIOD_OPTIONS: NiceSelectOption[] = [
  { label: "1 months", value: "" },
  { label: "3 months", value: "3-months" },
  { label: "6 months", value: "6-months" },
  { label: "12 months", value: "12-months" },
];

export const DEALER_SHOW_OPTIONS: NiceSelectOption[] = [
  { label: "Show: 4", value: 4 },
  { label: "Show: 8", value: 8 },
  { label: "Show: 12", value: 12 },
  { label: "Show: 16", value: 16 },
];

export const DEALER_SORT_OPTIONS: NiceSelectOption[] = [
  { label: "Sort by Date", value: "date" },
  { label: "Sort by Name", value: "name" },
  { label: "Sort by Rating", value: "rating" },
  { label: "Sort by Reviews", value: "reviews" },
];

export const DEALER_LOCATION_OPTIONS: NiceSelectOption[] = [
  { label: "All locations", value: "" },
  ...dealerStates.map((state) => ({ label: state, value: state })),
];

export const DEALER_BRAND_OPTIONS: NiceSelectOption[] = [
  { label: "All brands", value: "" },
  ...dealerBrands.map((brand) => ({ label: brand, value: brand })),
];

export const DASHBOARD_STATUS_OPTIONS: NiceSelectOption[] = [
  { label: "Select Status", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending" },
  { label: "Sold", value: "sold" },
];

export const DASHBOARD_SORT_OPTIONS: NiceSelectOption[] = [
  { label: "New", value: "new" },
  { label: "Old", value: "old" },
];

const currentYear = new Date().getFullYear();

export const ADD_LISTING_YEAR_OPTIONS: NiceSelectOption[] = [
  { label: "Select", value: "" },
  ...Array.from({ length: 17 }, (_, index) => {
    const year = currentYear - index;
    return { label: String(year), value: year };
  }),
];

// Add Listing posts straight to the real HMP-backend API, whose vehicle/listing enums are
// narrower than the generic filter-sidebar option lists above (BODY_TYPE_OPTIONS etc. — kept
// as-is since those describe a broader filterable catalog, not what one self-service seller
// can submit). These three exactly match StoreVehicleRequest's Rule::in() sets.
export const ADD_LISTING_BODY_TYPE_OPTIONS: NiceSelectOption[] = [
  { label: "Select", value: "" },
  { label: "Hatchback", value: "hatchback" },
  { label: "Saloon", value: "saloon" },
  { label: "Estate", value: "estate" },
  { label: "SUV", value: "suv" },
];

export const ADD_LISTING_FUEL_TYPE_OPTIONS: NiceSelectOption[] = [
  { label: "Select", value: "" },
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Electric", value: "electric" },
];

export const ADD_LISTING_TRANSMISSION_OPTIONS: NiceSelectOption[] = [
  { label: "Select", value: "" },
  { label: "Manual", value: "manual" },
  { label: "Automatic", value: "automatic" },
];

export const ADD_LISTING_PRICE_TYPE_OPTIONS: NiceSelectOption[] = [
  { label: "Fixed price", value: "fixed" },
  { label: "Offers invited", value: "offers_invited" },
];

export const MILEAGE_OPTIONS: NiceSelectOption[] = [
  { label: "Select", value: "" },
  { label: "0 - 10,000", value: "0-10000" },
  { label: "10,001 - 25,000", value: "10001-25000" },
  { label: "25,001 - 50,000", value: "25001-50000" },
  { label: "50,001 - 75,000", value: "50001-75000" },
  { label: "75,001 - 100,000", value: "75001-100000" },
  { label: "100,001+", value: "100001+" },
];

export const ENGINE_SIZE_OPTIONS: NiceSelectOption[] = [
  { label: "Select", value: "" },
  { label: "1.0L", value: "1.0" },
  { label: "1.2L", value: "1.2" },
  { label: "1.5L", value: "1.5" },
  { label: "1.6L", value: "1.6" },
  { label: "2.0L", value: "2.0" },
  { label: "2.4L", value: "2.4" },
  { label: "3.0L", value: "3.0" },
  { label: "3.5L", value: "3.5" },
  { label: "4.0L", value: "4.0" },
  { label: "5.0L+", value: "5.0+" },
];

export const MPG_OPTIONS: NiceSelectOption[] = [
  { label: "Select", value: "" },
  ...Array.from({ length: 46 }, (_, index) => {
    const mpg = index + 15;
    return { label: `${mpg} MPG`, value: mpg };
  }),
];

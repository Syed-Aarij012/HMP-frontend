/**
 * The seller-declared extras on a vehicle: a features checklist and the additional
 * specifications beyond the core ones. Shared by Add Listing, the edit page and the listing
 * detail page so the options and labels stay in one place.
 */

// Offered as tick-boxes; a seller can also type their own (anything else on the vehicle's
// features list is shown as a removable custom entry).
export const COMMON_FEATURES = [
  "Air conditioning",
  "Climate control",
  "Apple CarPlay / Android Auto",
  "Bluetooth",
  "Satellite navigation",
  "Reversing camera",
  "Parking sensors",
  "Cruise control",
  "Heated seats",
  "Leather seats",
  "Sunroof / panoramic roof",
  "Keyless entry",
  "Heated steering wheel",
  "LED headlights",
  "Alloy wheels",
  "Roof rails",
  "Tow bar",
  "Lane assist",
  "Blind spot monitoring",
  "DAB radio",
  "Wireless charging",
  "Electric tailgate",
  "Spare key",
  "Full service history",
] as const;

export const SERVICE_HISTORY_OPTIONS = [
  { label: "Full service history", value: "full" },
  { label: "Part service history", value: "part" },
  { label: "No service history", value: "none" },
];

export const DRIVETRAIN_OPTIONS = [
  { label: "Front-wheel drive", value: "fwd" },
  { label: "Rear-wheel drive", value: "rwd" },
  { label: "All-wheel drive", value: "awd" },
];

export type VehicleExtrasApi = {
  features?: string[] | null;
  engine_capacity_cc?: number | null;
  power_bhp?: number | null;
  drivetrain?: string | null;
  co2_gpkm?: number | null;
  previous_owners?: number | null;
  service_history?: string | null;
  mot_expiry_at?: string | null;
};

const labelFor = (options: { label: string; value: string }[], value: string | null | undefined) =>
  options.find((option) => option.value === value)?.label ?? null;

/** The additional specifications worth showing, in reading order — only those actually set. */
export function specRows(vehicle: VehicleExtrasApi | null | undefined): { label: string; value: string }[] {
  if (!vehicle) return [];

  const rows: { label: string; value: string | null }[] = [
    { label: "Engine size", value: vehicle.engine_capacity_cc ? `${vehicle.engine_capacity_cc.toLocaleString("en-GB")} cc` : null },
    { label: "Power", value: vehicle.power_bhp ? `${vehicle.power_bhp} bhp` : null },
    { label: "Drivetrain", value: labelFor(DRIVETRAIN_OPTIONS, vehicle.drivetrain) },
    { label: "CO₂ emissions", value: vehicle.co2_gpkm != null ? `${vehicle.co2_gpkm} g/km` : null },
    {
      label: "Previous owners",
      value: vehicle.previous_owners != null ? (vehicle.previous_owners === 0 ? "First owner" : String(vehicle.previous_owners)) : null,
    },
    { label: "Service history", value: labelFor(SERVICE_HISTORY_OPTIONS, vehicle.service_history) },
    {
      label: "MOT expires",
      value: vehicle.mot_expiry_at
        ? new Date(vehicle.mot_expiry_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
        : null,
    },
  ];

  return rows.filter((row): row is { label: string; value: string } => row.value !== null);
}

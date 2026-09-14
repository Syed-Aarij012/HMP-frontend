import NiceSelect, { type NiceSelectOption } from "@/components/common/NiceSelect";
import { DEALER_SHOW_OPTIONS, DEALER_SORT_OPTIONS } from "@/data/niceSelectOptions";
import type { DealerSortOption } from "@/types/dealers";

type DealerListingToolbarProps = {
  location: string;
  brand: string;
  perPage: number;
  sortBy: DealerSortOption;
  // Passed in by the caller (real-dealer values, not the mock-derived constants this
  // component used to import directly) so the options always match what's actually
  // filterable — see DealerListingContent.tsx.
  locationOptions: NiceSelectOption[];
  brandOptions: NiceSelectOption[];
  onLocationChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onPerPageChange: (value: number) => void;
  onSortChange: (value: DealerSortOption) => void;
};

export default function DealerListingToolbar({
  location,
  brand,
  perPage,
  sortBy,
  locationOptions,
  brandOptions,
  onLocationChange,
  onBrandChange,
  onPerPageChange,
  onSortChange,
}: DealerListingToolbarProps) {
  return (
    <div className="group-sort-filter flex-wrap">
      <NiceSelect
        options={locationOptions}
        value={location}
        onChange={(value) => onLocationChange(String(value))}
      />
      <NiceSelect
        options={brandOptions}
        value={brand}
        onChange={(value) => onBrandChange(String(value))}
      />
      <NiceSelect
        options={DEALER_SHOW_OPTIONS}
        value={perPage}
        onChange={(value) => onPerPageChange(Number(value))}
      />
      <NiceSelect
        options={DEALER_SORT_OPTIONS}
        value={sortBy}
        onChange={(value) => onSortChange(value as DealerSortOption)}
      />
    </div>
  );
}

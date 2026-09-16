import DashboardListingTableRow, {
  type ListingEditableFields,
} from "@/components/common/DashboardListingTableRow";
import type { DashboardCar } from "@/types/cars";

type DashboardListingTableBodyProps = {
  listings: DashboardCar[];
  onDelete?: (id: number) => void;
  onSave?: (id: number, updates: ListingEditableFields) => Promise<void>;
  onMarkSold?: (id: number) => Promise<void>;
};

export default function DashboardListingTableBody({
  listings,
  onDelete,
  onSave,
  onMarkSold,
}: DashboardListingTableBodyProps) {
  return (
    <tbody className="tfcl-table-content">
      {listings.map((listing) => (
        <DashboardListingTableRow
          key={listing.id}
          listing={listing}
          onDelete={onDelete}
          onSave={onSave}
          onMarkSold={onMarkSold}
        />
      ))}
    </tbody>
  );
}

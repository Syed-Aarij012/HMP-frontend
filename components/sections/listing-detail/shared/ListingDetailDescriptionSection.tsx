import type { Car } from "@/types/cars";

const DEFAULT_DESCRIPTION =
  "The seller hasn't added a description for this listing yet.";

type ListingDetailDescriptionSectionProps = {
  car: Car;
};

export default function ListingDetailDescriptionSection({
  car,
}: ListingDetailDescriptionSectionProps) {
  return (
    <div className="listing-description mb-40">
      <div className="tfcl-listing-header">
        <h2>Description</h2>
      </div>
      <div className="tfcl-listing-info">
        <p>{car.description || DEFAULT_DESCRIPTION}</p>
      </div>
    </div>
  );
}

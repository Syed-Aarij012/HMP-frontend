import type { Car } from "@/types/cars";

type ListingDetailSpecsSectionProps = {
  car: Car;
};

/**
 * The additional specifications the seller declared — engine, power, drivetrain, owners, service
 * history, MOT. Only those they filled in are listed; a listing with none shows no section.
 */
export default function ListingDetailSpecsSection({ car }: ListingDetailSpecsSectionProps) {
  const specs = car.specs ?? [];
  if (specs.length === 0) return null;

  return (
    <div className="listing-specs mb-40">
      <div className="tfcl-listing-header">
        <h2>Specifications</h2>
      </div>
      <div className="tfcl-listing-info">
        <dl className="row mb-0">
          {specs.map((spec) => (
            <div key={spec.label} className="col-sm-6 col-lg-4 mb-3">
              <dt className="fw-6 text-color-1 fs-13 mb-1">{spec.label}</dt>
              <dd className="mb-0">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

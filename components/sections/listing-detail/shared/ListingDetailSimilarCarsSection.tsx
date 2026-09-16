import Link from "next/link";
import SimilarCarsSlider from "@/components/common/SimilarCarsSlider";
import type { Car } from "@/types/cars";

type ListingDetailSimilarCarsSectionProps = {
  car: Car;
};

export default function ListingDetailSimilarCarsSection({
  car,
}: ListingDetailSimilarCarsSectionProps) {
  return (
    <>
    <div className="listing-line " />
    <div className="tf-list-car-agent">
      <div className="heading-section flex align-center justify-space flex-wrap gap-20">
        <h2>Similar Cars</h2>
        <Link href={`/listing-grid`} className="tf-btn-arrow">
          See all
          <i className="icon-carus-arrowcircleright" />
        </Link>
      </div>
      <SimilarCarsSlider currentCar={car} />
    </div>
    </>
  );
}

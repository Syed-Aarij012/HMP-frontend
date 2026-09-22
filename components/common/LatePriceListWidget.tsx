import Image from "@/components/common/AppImage";
import Link from "next/link";
import {
  formatLatePriceListPrice,
  LATE_PRICE_LIST_CARS,
  LATE_PRICE_LIST_TOTAL_COUNT,
} from "@/data/latePriceListCars";

type LatePriceListWidgetProps = {
  detailHref?: string;
  footerHref?: string;
};

export default function LatePriceListWidget({
  detailHref = "/listing-detail-v1",
  footerHref = "#reviews",
}: LatePriceListWidgetProps) {
  return (
    <div className="widget-listing widget">
      <div className="listing-header">
        <h3>Late price list</h3>
        <p className="fs-14 fw-4">
          Showing {LATE_PRICE_LIST_TOTAL_COUNT} more cars you might like
        </p>
      </div>
      <div className="listing-recommended">
        {LATE_PRICE_LIST_CARS.map((car) => (
          <div key={car.id} className="item flex">
            <div className="image">
              <Image
                className=" ls-is-cached lazyloaded"
                data-src={car.image}
                src={car.image}
                alt={car.title}
                width={195}
                height={147}
              />
            </div>
            <div className="content">
              <h6>
                <Link href={car.href ?? detailHref}>{car.title}</Link>
              </h6>
              <p className="fs-16 fw-7 text-color-2">
                {formatLatePriceListPrice(car.price)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Link href={footerHref} className="fs-16 fw-5 font text-color-3 lh-22">
        View more reviews <i className="icon-carus-chev-up" />
      </Link>
    </div>
  );
}

import Image from "@/components/common/AppImage";
import Link from "next/link";
import { getCarHref } from "@/data/cars";
import ListingCardActions from "@/components/common/ListingCardActions";
import type { Car } from "@/types/cars";

type SaleAgentListingCardProps = {
  car: Car;
  layout?: "grid" | "list";
  detailHref?: string;
  onViewClick?: () => void;
};

function PhotoCountIcon() {
  return (
    <svg
      width={16}
      height={13}
      viewBox="0 0 16 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 9L4.93933 5.56067C5.07862 5.42138 5.24398 5.31089 5.42597 5.2355C5.60796 5.16012 5.80302 5.12132 6 5.12132C6.19698 5.12132 6.39204 5.16012 6.57403 5.2355C6.75602 5.31089 6.92138 5.42138 7.06067 5.56067L10.5 9M9.5 8L10.4393 7.06067C10.5786 6.92138 10.744 6.81089 10.926 6.7355C11.108 6.66012 11.303 6.62132 11.5 6.62132C11.697 6.62132 11.892 6.66012 12.074 6.7355C12.256 6.81089 12.4214 6.92138 12.5607 7.06067L14.5 9M2.5 11.5H13.5C13.7652 11.5 14.0196 11.3946 14.2071 11.2071C14.3946 11.0196 14.5 10.7652 14.5 10.5V2.5C14.5 2.23478 14.3946 1.98043 14.2071 1.79289C14.0196 1.60536 13.7652 1.5 13.5 1.5H2.5C2.23478 1.5 1.98043 1.60536 1.79289 1.79289C1.60536 1.98043 1.5 2.23478 1.5 2.5V10.5C1.5 10.7652 1.60536 11.0196 1.79289 11.2071C1.98043 11.3946 2.23478 11.5 2.5 11.5ZM9.5 4H9.50533V4.00533H9.5V4ZM9.75 4C9.75 4.0663 9.72366 4.12989 9.67678 4.17678C9.62989 4.22366 9.5663 4.25 9.5 4.25C9.4337 4.25 9.37011 4.22366 9.32322 4.17678C9.27634 4.12989 9.25 4.0663 9.25 4C9.25 3.9337 9.27634 3.87011 9.32322 3.82322C9.37011 3.77634 9.4337 3.75 9.5 3.75C9.5663 3.75 9.62989 3.77634 9.67678 3.82322C9.72366 3.87011 9.75 3.9337 9.75 4Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SaleAgentListingCard({
  car,
  layout = "grid",
  onViewClick,
}: SaleAgentListingCardProps) {
  const detailHref = getCarHref(car);
  const description =
    car.description ??
    "It was positioned to be the successor to the Citroën Xsara.";

  return (
    <div className="box-car-list hv-one style-2">
      <div className="image-group relative">
        <div className="top">
          <ul className="d-flex gap-8">
            <li className="flag-tag success">{car.tag}</li>
            <li className="flag-tag style-1">
              <div className="icon">
                <PhotoCountIcon />
              </div>
              {car.photoCount}
            </li>
          </ul>
        </div>
        <ListingCardActions car={car} />
        <div className="img-style">
          <Image
            className="lazyload"
            data-src={car.image}
            src={car.image}
            alt={car.title}
            width={car.imageWidth ?? 690}
            height={car.imageHeight ?? 504}
          />
        </div>
      </div>
      <div className="content">
        {layout === "list" ? (
          <div className="content-wrap">
            <h3 className="link-style-1">
              <Link href={detailHref}>{car.title}</Link>
            </h3>
            <p className="des">{description}</p>
            <div className="icon-box flex flex-wrap">
              <div className="icons flex-three">
                <i className="icon-carus-icon7" />
                <span>{car.mileage} Km</span>
              </div>
              <div className="icons flex-three">
                <i className="icon-carus-icon12" />
                <span>{car.transmission}</span>
              </div>
              <div className="icons flex-three">
                <i className="icon-carus-icon9" />
                <span>{car.fuel}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h3 className="link-style-1">
              <Link href={detailHref}>{car.title}</Link>
            </h3>
            <div className="icon-box flex flex-wrap">
              <div className="icons flex-three">
                <i className="icon-carus-icon7" />
                <span>{car.mileage} Km</span>
              </div>
              <div className="icons flex-three">
                <i className="icon-carus-icon12" />
                <span>{car.transmission}</span>
              </div>
              <div className="icons flex-three">
                <i className="icon-carus-icon9" />
                <span>{car.fuel}</span>
              </div>
            </div>
          </>
        )}
        <div className="days-box flex justify-space align-center">
          <div className="money fs-24 fw-7 lh-30 text-color-2">
            ${car.price.toLocaleString("en-US")}
          </div>
          {onViewClick ? (
            <button type="button" className="view-car" onClick={onViewClick}>
              View <i className="icon-carus-arright" />
            </button>
          ) : (
            <Link href={detailHref} className="view-car">
              View <i className="icon-carus-arright" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

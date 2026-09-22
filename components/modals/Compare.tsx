"use client";

import Image from "@/components/common/AppImage";
import Link from "next/link";
import { useMemo } from "react";
import { getCarDetailHref } from "@/data/cars";
import { useListingActions } from "@/components/common/ListingActionsContext";

export default function Compare() {
  const { compareCars, removeFromCompare } = useListingActions();

  const compareHref = useMemo(() => {
    if (compareCars.length === 0) {
      return "/compare";
    }

    const ids = compareCars.map((car) => car.id).join(",");
    return `/compare?ids=${ids}`;
  }, [compareCars]);

  return (
    <div
      className="offcanvas offcanvas-bottom popup-compary"
      tabIndex={-1}
      id="offcanvasBottom"
    >
      <div className="offcanvas-header">
        <button
          type="button"
          className="btn-close text-reset"
          data-bs-dismiss="offcanvas"
          aria-label="Close compare panel"
        >
          <i className=" icon-carus-up" />
        </button>
      </div>
      <div className="offcanvas-body small">
        <div id="compare_listing_wrap">
          <div
            id="tfcl-compare-listings"
            className={`compare-listing${compareCars.length > 0 ? " listing-open" : ""}`}
          >
            <div id="tfcl-compare-listing-listings">
              <div className="compare-listing-body">
                <div className="compare-thumb-main">
                  {compareCars.length > 0 ? (
                    compareCars.map((car) => (
                      <div
                        key={car.id}
                        className="compare-thumb tfcl-compare-listing"
                        data-listing-id={car.id}
                      >
                        <button
                          type="button"
                          className="compare-listing-remove"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removeFromCompare(car.id);
                          }}
                          aria-label={`Remove ${car.title} from compare`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={19}
                            viewBox="0 0 18 19"
                            fill="none"
                          >
                            <path
                              d="M4.5 14L13.5 5M4.5 5L13.5 14"
                              stroke="#24272C"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <Image
                          className="compare-listing-img"
                          alt={car.title}
                          src={car.image}
                          width={159}
                          height={119}
                        />
                        <div className="content">
                          <h3 className="tfcl-listing-title title">
                            <Link
                              title={car.title}
                              href={getCarDetailHref(car.id)}
                            >
                              {car.title}
                            </Link>
                          </h3>
                          <ul className="description">
                            <li className="mileage">
                              <i className="icon-autodeal-km1" />{" "}
                              {car.mileage.toLocaleString()} kms
                            </li>
                            <li className="fuel">
                              <i className="icon-autodeal-diesel" /> {car.fuel}
                            </li>
                            <li className="trans">
                              <i className="icon-autodeal-automatic" />{" "}
                              {car.transmission}
                            </li>
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="compare-empty-message">
                      Select vehicles to compare.
                    </p>
                  )}
                </div>
                <Link
                  href={compareHref}
                  className={`button tfcl-compare-listing-button${compareCars.length < 2 ? " disabled" : ""}`}
                  aria-disabled={compareCars.length < 2}
                  onClick={(event) => {
                    if (compareCars.length < 2) {
                      event.preventDefault();
                    }
                  }}
                >
                  Compare
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

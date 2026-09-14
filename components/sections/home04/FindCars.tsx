"use client";

import Link from "next/link";
import Image from "next/image";
import { carModelCategories } from "@/data/categories";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { useHomepageListings } from "@/hooks/useHomepageListings";

// The backend's body_type values (hatchback/saloon/estate/suv) use UK terms; the template's
// category titles use US ones for some of them — this is the only translation needed to
// match the two up. Categories with no backend equivalent (Crossover, Coupe, Pickup Truck,
// Minivan, Convertible) genuinely have no live count yet — they show 0, not a fabricated one.
const BODY_TYPE_ALIASES: Record<string, string> = {
  sedan: "saloon",
  "station wagon": "estate",
};

function FindCars() {
  const { bodyTypeCounts, loading } = useHomepageListings();

  const categories = carModelCategories.map((category) => {
    const key = category.title.toLowerCase();
    const backendKey = BODY_TYPE_ALIASES[key] ?? key;
    return {
      ...category,
      listingCount: loading ? category.listingCount : bodyTypeCounts[backendKey] ?? 0,
    };
  });

  return (
    <>
      <section className="tf-section bg-3">
        <div className="container">
          <div className="heading-section center mb-50 wow fadeInUp">
            <h2 className="heading-tittle">Find car by model</h2>
            <p className="fs-18 fw-4">
              Easily Search And Compare Specifications, Pricing, And Features
              For Any Make Or Model
            </p>
          </div>
          <Swiper
            modules={[Pagination, Navigation]}
            className="swiper tf-swiper wow fadeInUp"
            {...{
              slidesPerView: 2,
              spaceBetween: 12,
              speed: 800,
              observer: true,
              observeParents: true,
              slidesPerGroup: 2,
              navigation: {
                nextEl: ".nav-next-categories",
                prevEl: ".nav-prev-categories",
              },
              pagination: {
                el: ".sw-pagination-categories",
                clickable: true,
              },
              breakpoints: {
                "575": {
                  slidesPerView: 3,
                  spaceBetween: 12,
                  slidesPerGroup: 2,
                },
                "768": {
                  slidesPerView: 4,
                  spaceBetween: 12,
                  slidesPerGroup: 1,
                },
                "1200": {
                  slidesPerView: 6,
                  spaceBetween: 105,
                  slidesPerGroup: 1,
                },
              },
            }}
          >
            {categories.map((category) => (
              <SwiperSlide className="swiper-slide" key={category.id}>
                <Link href={`/listing-list`} className="partner-item style-4">
                  <div className="image">
                    <Image
                      className="lazyload"
                      data-src={category.image}
                      src={category.image}
                      alt={category.title}
                      width={category.imageWidth}
                      height={category.imageHeight}
                    />
                  </div>
                  <div className="content center">
                    <div className="fs-18 fw-6 title text-color-2">
                      {category.title}
                    </div>
                    <p className="sub-title fs-12 fw-4">
                      {category.listingCount}{" "}
                      {category.listingLabel ?? "Car Listing"}
                    </p>
                  </div>
                </Link>
              </SwiperSlide>
            ))}

            <span className="d-flex d-xl-none sw-dot-default sw-pagination-categories justify-content-center" />
          </Swiper>
        </div>
      </section>
    </>
  );
}

export default FindCars;

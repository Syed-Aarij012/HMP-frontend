"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import { searchByBrands } from "@/data/brands";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

function SearchByBrand() {
  return (
    <>
      <section className="tf-section3">
        <div className="container">
          <div className="heading-section center mb-50 wow fadeInUp">
            <h2 className="heading-tittle">Search by brand</h2>
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
              slidesPerGroup: 1,
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
                  slidesPerGroup: 1,
                },
                "768": {
                  slidesPerView: 4,
                  spaceBetween: 12,
                  slidesPerGroup: 1,
                },
                "1200": {
                  slidesPerView: 6,
                  spaceBetween: 30,
                  slidesPerGroup: 1,
                },
              },
            }}
          >
            {searchByBrands.map((brand) => (
              <SwiperSlide className="swiper-slide" key={brand.id}>
                <Link href={`/listing-list`} className="partner-item style-2">
                  <div className="image">
                    <Image
                      className="lazyload"
                      data-src={brand.image}
                      src={brand.image}
                      alt={brand.title}
                      width={brand.imageWidth}
                      height={brand.imageHeight}
                    />
                  </div>
                  <div className="content center">
                    <div className="fs-18 fw-6 title text-color-2">
                      {brand.title}
                    </div>
                    <p className="sub-title fs-12 fw-4">
                      {brand.listingCount}{" "}
                      {brand.listingLabel ?? "Car Listing"}
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

export default SearchByBrand;

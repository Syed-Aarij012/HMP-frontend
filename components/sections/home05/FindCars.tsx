"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import { home05FindCarCategories } from "@/data/categories";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

function FindCars() {
  return (
    <>
      <section className="tf-section3">
        <div className="container">
          <div className="heading-section center mb-47 wow fadeInUp">
            <h2 className="heading-tittle">Find Car By Model</h2>
          </div>
          <Swiper
            modules={[Pagination, Navigation]}
            className="swiper tf-swiper wow fadeInUp"
            {...{
              slidesPerView: 1,
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
                  slidesPerView: 2,
                  spaceBetween: 12,
                  slidesPerGroup: 1,
                },
                "768": {
                  slidesPerView: 3,
                  spaceBetween: 12,
                  slidesPerGroup: 1,
                },
                "1200": {
                  slidesPerView: 4,
                  spaceBetween: 48,
                  slidesPerGroup: 1,
                },
              },
            }}
          >
            {home05FindCarCategories.map((category) => (
              <SwiperSlide className="swiper-slide" key={category.id}>
                <Link href={`/listing-list`} className="partner-item style-7">
                  <div
                    className={`content${category.contentClass ? ` ${category.contentClass}` : ""}`}
                  >
                    <div className="inner">
                      <div className="fs-20 fw-6 title text-color-2">
                        {category.title}
                      </div>
                      <p className="sub-title fs-12 fw-4">
                        {category.listingCount}{" "}
                        {category.listingLabel ?? "Car Listing"}
                      </p>
                    </div>
                    <span className="icon icon-carus-arrowright-1" />
                  </div>
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
                </Link>
              </SwiperSlide>
            ))}

            <span className="d-flex sw-dot-default sw-pagination-categories justify-content-center" />
          </Swiper>
        </div>
      </section>
    </>
  );
}

export default FindCars;

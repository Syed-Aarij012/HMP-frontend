"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import { popularBrands } from "@/data/brands";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

function PopularBrands() {
  return (
    <>
      <section className="tf-section3 overflow-hidden">
        <div className="container">
          <div className="heading-section flex align-center justify-space flex-wrap gap-20 wow fadeInUp">
            <h2 className="heading-tittle">Popular Brands</h2>
            <Link href={`/listing-grid`} className="tf-btn-arrow">
              See all
              <i className="icon-carus-arrowcircleright" />
            </Link>
          </div>
          <Swiper
            modules={[Pagination, Navigation]}
            className="swiper tf-swiper b-shawdow wow fadeInUp"
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
                  slidesPerView: 4,
                  spaceBetween: 12,
                  slidesPerGroup: 1,
                },
                "768": {
                  slidesPerView: 6,
                  spaceBetween: 12,
                  slidesPerGroup: 3,
                },
                "1200": {
                  slidesPerView: 9,
                  spaceBetween: 45,
                  slidesPerGroup: 3,
                },
              },
            }}
          >
            {popularBrands.map((brand) => (
              <SwiperSlide className="swiper-slide" key={brand.id}>
                <Link href={`/listing-list`} className="partner-item style-3">
                  <div className="image">
                    <Image
                      className="lazyload"
                      data-src={brand.image}
                      src={brand.image}
                      alt={brand.name}
                      width={180}
                      height={180}
                    />
                  </div>
                  <div className="content center">
                    <div className="fs-14 fw-5 title text-color-2 font-2">
                      {brand.name}
                    </div>
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

export default PopularBrands;

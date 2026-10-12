"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { usePublicBrands } from "@/hooks/usePublicBrands";

function BrandLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    // fill (not width/height) because an admin-uploaded logo can be any aspect ratio — fixed
    // width/height props would mismatch the actual rendered box the moment that ratio isn't
    // exactly 210:120, which next/image flags as a hydration-style warning.
    return (
      <div style={{ position: "relative", width: 210, height: 120 }}>
        <Image
          className="lazyload"
          data-src={logoUrl}
          src={logoUrl}
          alt={name}
          fill
          sizes="210px"
          style={{ objectFit: "contain" }}
        />
      </div>
    );
  }

  // A brand the admin hasn't uploaded a logo for yet (see /admin/brands) — a neutral
  // initial, never another brand's actual logo standing in for this one.
  return (
    <div
      aria-hidden="true"
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "#f5f7fe",
        color: "#405ff2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 700,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SearchCar() {
  const { brands, loading } = usePublicBrands();

  if (!loading && brands.length === 0) {
    return null;
  }

  // Fewer brands than a breakpoint's slidesPerView left the row half-empty with a big gap —
  // cap each one at how many brands there actually are (brands.length is 0 only while still
  // loading, before the "return null" above would have applied, so fall back to the
  // configured value rather than handing Swiper a slidesPerView of 0).
  const cap = (slides: number) => (brands.length > 0 ? Math.min(slides, brands.length) : slides);

  return (
    <>
      <section className="tf-section">
        <div className="container">
          <div className="heading-section center mb-47 wow fadeInUp">
            <h2 className="heading-tittle">Search by brand</h2>
          </div>
          <Swiper
            modules={[Pagination, Navigation]}
            className="swiper tf-swiper wow fadeInUp"
            {...{
              slidesPerView: cap(2),
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
                  slidesPerView: cap(3),
                  spaceBetween: 12,
                  slidesPerGroup: 1,
                },
                "768": {
                  slidesPerView: cap(4),
                  spaceBetween: 12,
                  slidesPerGroup: 1,
                },
                "1200": {
                  slidesPerView: cap(6),
                  spaceBetween: 30,
                  slidesPerGroup: 1,
                },
              },
            }}
          >
            {brands.map((brand) => (
              <SwiperSlide className="swiper-slide" key={brand.id}>
                <Link
                  href={`/listing-grid?make=${encodeURIComponent(brand.name)}`}
                  className="partner-item style-2"
                >
                  <div className="image">
                    <BrandLogo name={brand.name} logoUrl={brand.logo_url} />
                  </div>
                  <div className="content center">
                    <div className="fs-18 fw-6 title text-color-2">
                      {brand.name}
                    </div>
                    <p className="sub-title fs-12 fw-4">
                      {brand.listing_count} Car Listing
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

export default SearchCar;

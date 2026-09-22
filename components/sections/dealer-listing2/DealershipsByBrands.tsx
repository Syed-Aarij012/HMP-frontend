"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import { useMakeFacets } from "@/hooks/useMakeFacets";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// The template's bundled partner logos happen to cover a few of the makes the seeded
// catalog actually has — reused here rather than shown next to the wrong brand's name for
// every other real make, which just gets an initial-letter badge instead (see NoLogoBadge).
const KNOWN_MAKE_LOGOS: Record<string, string> = {
  ford: "/assets/images/partner/partner5.webp",
  bmw: "/assets/images/partner/partner6.webp",
  nissan: "/assets/images/partner/partner4.webp",
  toyota: "/assets/images/partner/partner14.webp",
};

function NoLogoBadge({ make }: { make: string }) {
  return (
    <div
      className="d-flex align-center justify-center"
      style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "#405FF2",
        color: "#fff",
        fontSize: 24,
        fontWeight: 700,
      }}
    >
      {make.charAt(0).toUpperCase()}
    </div>
  );
}

function DealershipsByBrands() {
  const { makes, loading, error } = useMakeFacets();

  return (
    <section className="tf-section2 flat-property">
      <div className="container">
        <div className="inner-heading flex-two flex-wrap gap-20">
          <h1 className="heading-listing">Dealerships by Brands</h1>
          <div className="social-listing flex-six flex-wrap">
            <p>Share this page:</p>
            <div className="icon-social style1">
              <a href="facebook.com">
                <i className="icon-carus-facebook" />
              </a>
              <a href="linkein.com">
                <i className="icon-carus-in" />
              </a>
              <a href="x.com">
                <i className="icon-carus-x" />
              </a>
              <a href="instagram.com">
                <i className="icon-carus-instagram" />
              </a>
            </div>
          </div>
        </div>
        <p className="mb-20">
          Looking for a specific dealership instead?{" "}
          <Link href="/dealer-listing">Browse all dealers</Link>
        </p>
        {loading ? (
          <p>Loading brands...</p>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : makes.length === 0 ? (
          <p>No brands available right now.</p>
        ) : (
          <Swiper
            modules={[Navigation, Pagination]}
            className="swiper tf-swiper"
            slidesPerView={2}
            spaceBetween={12}
            speed={800}
            observer
            observeParents
            slidesPerGroup={1}
            navigation={{
              nextEl: ".dealer-brands-nav-next",
              prevEl: ".dealer-brands-nav-prev",
            }}
            pagination={{
              el: ".dealer-brands-pagination",
              clickable: true,
            }}
            breakpoints={{
              575: { slidesPerView: 3, spaceBetween: 12, slidesPerGroup: 1 },
              768: { slidesPerView: 4, spaceBetween: 12, slidesPerGroup: 1 },
              1200: { slidesPerView: 6, spaceBetween: 30, slidesPerGroup: 1 },
            }}
          >
            {makes.map((make) => {
              const logo = KNOWN_MAKE_LOGOS[make.value.toLowerCase()];

              return (
                <SwiperSlide key={make.value}>
                  <Link
                    href={`/dealer-listing?brand=${encodeURIComponent(make.value)}`}
                    className="partner-item style-2"
                  >
                    <div className="image d-flex align-center justify-center">
                      {logo ? (
                        <Image
                          className="lazyload"
                          data-src={logo}
                          src={logo}
                          alt={make.value}
                          width={210}
                          height={120}
                        />
                      ) : (
                        <NoLogoBadge make={make.value} />
                      )}
                    </div>
                    <div className="content center">
                      <div className="fs-18 fw-6 title text-color-2">
                        {make.value}
                      </div>
                      <p className="sub-title fs-12 fw-4">
                        {make.count} Car Listing{make.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
            <span className="d-flex d-xl-none sw-dot-default dealer-brands-pagination justify-content-center" />
            <div className="nav-next-categories dealer-brands-nav-next" />
            <div className="nav-prev-categories dealer-brands-nav-prev" />
          </Swiper>
        )}
      </div>
    </section>
  );
}

export default DealershipsByBrands;

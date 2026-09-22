"use client";

import Image from "@/components/common/AppImage";
import { home04Testimonials } from "@/data/testimonials";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

const STAR_PATH =
  "M2.77535 6.8442L0.261091 4.9776C-0.213455 4.63726 -0.00532068 3.95284 0.59688 3.87568L4.16291 3.7332L5.68575 0.309233C5.7919 0.119462 6.00767 0 6.24425 0C6.48083 0 6.69659 0.120085 6.80274 0.309233L8.32559 3.7332L11.8916 3.87568C12.4938 3.95284 12.7019 4.63726 12.2274 4.9776L9.71315 6.8442L10.3993 10.4884C10.4784 10.9856 9.90255 11.3576 9.40233 11.133L6.24425 9.333L3.08616 11.1324C2.58525 11.357 2.01011 10.9849 2.0892 10.4878L2.77535 6.8442Z";

function Testimonials() {
  return (
    <>
      <section className="tf-section3">
        <div className="container">
          <div className="heading-section mb-47 center wow fadeInUp">
            <h2 className="heading-tittle">our customers Feedback</h2>
            <div className="flex-five description-test">
              Dealership service centers employ certified experts for repairs,
              oil changes, and routine care.
            </div>
          </div>
          <div className="tf-testimonial-widget wow fadeInUp">
            <Swiper
              modules={[Pagination, Navigation]}
              className="swiper tf-swiper"
              {...{
                slidesPerView: 1,
                spaceBetween: 12,
                speed: 800,
                observer: true,
                observeParents: true,
                slidesPerGroup: 1,

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
                    slidesPerView: 2,
                    spaceBetween: 12,
                    slidesPerGroup: 1,
                  },
                  "1200": {
                    slidesPerView: 3,
                    spaceBetween: 30,
                    slidesPerGroup: 1,
                  },
                },
              }}
            >
              {home04Testimonials.map((testimonial) => (
                <SwiperSlide className="swiper-slide" key={testimonial.id}>
                  <div className="tf-testimonial style-3">
                    <div className="content-testimonial">
                      <div className="icon">
                        <i className="icon-carus-quote" />
                      </div>
                      <p className="description">
                        &ldquo;{testimonial.description}&rdquo;
                      </p>
                      <div className="inner-top">
                        <div className="star-wrap flex-five">
                          {Array.from({ length: testimonial.starCount }).map(
                            (_, index) => (
                              <svg
                                key={index}
                                width={13}
                                height={12}
                                viewBox="0 0 13 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d={STAR_PATH}
                                  fill="#FFD023"
                                />
                              </svg>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="author-box flex-five">
                      <div className="images">
                        <Image
                          className="lazyload"
                          data-src={testimonial.image}
                          src={testimonial.image}
                          alt={testimonial.author}
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="content">
                        <h3>{testimonial.author}</h3>
                        <p className="fs-12 lh-16">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}

              <span className="d-flex d-xl-none sw-dot-default sw-pagination-categories justify-content-center" />
            </Swiper>
            {/* <div className="swiper-button-next swiper-button-next-2" />
            <div className="swiper-button-prev swiper-button-prev-2" /> */}
          </div>
        </div>
      </section>
    </>
  );
}

export default Testimonials;

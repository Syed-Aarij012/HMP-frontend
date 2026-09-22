"use client";
import Link from "next/link";
import Image from "@/components/common/AppImage";
import { heroCategories, heroSlides } from "@/data/hero";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Navigation } from "swiper/modules";

function Hero() {
  return (
    <>
      <Swiper
        modules={[Navigation, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        className="swiper mainslider slider style1"
        navigation={{
          nextEl: ".mainslider .swiper-button-next",
          prevEl: ".mainslider .swiper-button-prev",
        }}
      >
        {heroSlides.map((slide, index) => (
          <SwiperSlide className="swiper-slide" key={slide.id}>
            <div className="slider-item">
              <div className="img-slider">
                <Image
                  className="img-item lazyload"
                  data-src={slide.image}
                  src={slide.image}
                  alt={slide.title}
                  width={2880}
                  height={1571}
                  sizes="100vw"
                  priority={index === 0}
                />
              </div>
              <div className="container-full relative">
                <div className="content po-content-two">
                  <div className="heading">
                    <h1 className="text-color-1 fade-item fade-item-1">
                      {slide.title}
                    </h1>
                    <p className="fs-18 text-color-1 fade-item fade-item-1 mb-40">
                      {slide.description}
                    </p>
                    <ul className="ul flex flex-wrap category-list-car fade-item fade-item-2">
                      {heroCategories.map((category) => (
                        <li key={category.id}>
                          <Link href={`/listing-grid`} className="flex-three">
                            <div className="icon">
                              <i className={category.icon} />
                            </div>
                            <div className="font text-color-1">
                              {category.label}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}

        <div className="button-swiper">
          <div className="swiper-button-prev style-1" />
          <div className="swiper-button-next style-1" />
        </div>
      </Swiper>
    </>
  );
}

export default Hero;

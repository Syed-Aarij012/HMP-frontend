"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import { useRef, useState } from "react";
import { home02HeroSlides } from "@/data/hero";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css/effect-fade";

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const swiperRef = useRef<SwiperInstance>(null);

  return (
    <Swiper
      modules={[Navigation, Autoplay, EffectFade]}
      className="swiper mainslider1 slider style7"
      slidesPerView={1}
      speed={500}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      watchSlidesProgress
      onSwiper={(instance) => {
        swiperRef.current = instance;
      }}
      onSlideChange={(instance) => setCurrentSlide(instance.realIndex)}
      autoplay={{
        delay: 6000,
        disableOnInteraction: false,
      }}
      navigation={{
        nextEl: ".mainslider1 .swiper-button-next",
        prevEl: ".mainslider1 .swiper-button-prev",
      }}
    >
      {home02HeroSlides.map((slide, index) => (
        <SwiperSlide className="swiper-slide" key={slide.id}>
          <div className="slider-item">
            <div className="img-slider">
              <Image
                className="img-item lazyload"
                data-src={slide.image}
                src={slide.image}
                alt={slide.title}
                width={2880}
                height={1500}
                sizes="100vw"
                priority={index === 0}
              />
            </div>
            <div className="container full relative">
              <div className="content ">
                <div className="heading">
                  <div className="fs-18 fw-6 luxury">{slide.subtitle}</div>
                  <h1 className="text-color-1 fade-item fade-item-1">
                    {slide.title}
                  </h1>
                  <p className="text-color-1 font fade-item fade-item-2">
                    {slide.description}
                  </p>
                  <div className="chat-wrap fade-item fade-item-4">
                    <Link className="sc-button" href={`/listing-list`}>
                      <span>Go to Listing</span>
                      <i className="icon-carus-arright" />
                    </Link>
                    <Link className="sc-button" href={`/contact`}>
                      <span>Contact Us</span>
                      <i className="icon-carus-arright" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}

      <div className="slider-bottom">
        <div className="chat-wrap"></div>
        <div className="button-swiper">
          <div className="swiper-button-prev style-2" />
          <div className="swiper-button-next style-2" />
        </div>
        <div className="slider-vertical-counter">
          <div className="number top">
            {String(currentSlide + 1).padStart(2, "0")}
          </div>
          <div className="lines">
            {home02HeroSlides.map((slide, index) => (
              <span
                key={slide.id}
                className={`line${currentSlide === index ? " active" : ""}`}
                onClick={() => swiperRef.current?.slideTo(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    swiperRef.current?.slideTo(index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="number bottom">
            {String(home02HeroSlides.length).padStart(2, "0")}
          </div>
        </div>
      </div>
    </Swiper>
  );
}

export default Hero;

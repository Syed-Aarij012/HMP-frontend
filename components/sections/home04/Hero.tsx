"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import { useRef, useState } from "react";
import { home04HeroSlides } from "@/data/hero";
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
      className="swiper mainslider1 slider style2 home-4"
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
      {home04HeroSlides.map((slide, index) => (
        <SwiperSlide className="swiper-slide" key={slide.id}>
          <div className="slider-item">
            <div className="img-slider">
              <Image
                className="img-item lazyload"
                data-src={slide.image}
                src={slide.image}
                alt={`${slide.titleLine1} ${slide.titleLine2}`}
                width={2880}
                height={1500}
                sizes="100vw"
                priority={index === 0}
              />
            </div>
            <div className="container full">
              <div className="content">
                <div className="heading">
                  <h1 className="text-color-1 fade-item fade-item-1">
                    {slide.titleLine1} <br /> {slide.titleLine2}
                  </h1>
                  <p className="fs-18 text-color-1 fade-item fade-item-2">
                    {slide.description}
                  </p>
                  <div className="chat-wrap flex-three fade-item fade-item-3 flex-wrap">
                    <Link className="sc-button" href={slide.detailUrl}>
                      <span>View details</span>
                      <i className="icon-carus-arright" />
                    </Link>
                    <div className="flex-three">
                      <div className="image">
                        <Image
                          className="img-item lazyload"
                          data-src="/assets/images/author/avata-slider.webp"
                          src={slide.authorImage}
                          alt={slide.authorName}
                          width={63}
                          height={63}
                        />
                      </div>
                      <div className="content-chat">
                        <div className="fs-16 text-color-1">
                          {slide.authorName}
                        </div>
                        <span className="fs-12 text-color-1">
                          {slide.authorTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}

      <div className="button-swiper">
        <div className="slider-vertical-counter">
          <div className="number top">
            {String(currentSlide + 1).padStart(2, "0")}
          </div>
          <div className="lines">
            {home04HeroSlides.map((slide, index) => (
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
            {String(home04HeroSlides.length).padStart(2, "0")}
          </div>
        </div>
        <div className="swiper-button-prev style-1" />
        <div className="swiper-button-next style-1" />
      </div>
    </Swiper>
  );
}

export default Hero;

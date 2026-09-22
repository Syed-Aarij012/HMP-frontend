"use client";

import Image from "@/components/common/AppImage";
import { useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import ListingDetailGalleryNavButtons from "@/components/common/listing-detail/ListingDetailGalleryNavButtons";
import ListingDetailGallerySlideContent from "@/components/common/listing-detail/ListingDetailGallerySlideContent";
import ListingDetailPhotoSwipeSource from "@/components/common/listing-detail/ListingDetailPhotoSwipeSource";
import type { ListingDetailGalleryImage } from "@/data/listingDetailV1Gallery";
import { LISTING_DETAIL_V1_GALLERY } from "@/data/listingDetailV1Gallery";
import { useListingDetailPhotoSwipe } from "@/hooks/useListingDetailPhotoSwipe";

import "swiper/css/thumbs";

type ListingDetailGalleryVariant = "style-1" | "style-2" | "style-3";

type ListingDetailGalleryProps = {
  images?: ListingDetailGalleryImage[];
  variant?: ListingDetailGalleryVariant;
};

function getNavigationClasses(variant: ListingDetailGalleryVariant) {
  if (variant === "style-2") {
    return {
      prevClass: "listing-detail-v2-main-prev",
      nextClass: "listing-detail-v2-main-next",
    };
  }

  if (variant === "style-3") {
    return {
      prevClass: "listing-detail-v3-main-prev",
      nextClass: "listing-detail-v3-main-next",
    };
  }

  return {
    prevClass: "listing-detail-main-prev",
    nextClass: "listing-detail-main-next",
  };
}

const THUMBS_SWIPER_CONFIG = {
  direction: "horizontal" as const,
  slidesPerView: 4,
  spaceBetween: 8,
  freeMode: true,
  watchSlidesProgress: true,
  slideToClickedSlide: true,
  breakpoints: {
    768: {
      direction: "vertical" as const,
      centeredSlides: false,
      centeredSlidesBounds: true,
    },
  },
};

export default function ListingDetailGallery({
  images = LISTING_DETAIL_V1_GALLERY,
  variant = "style-1",
}: ListingDetailGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { photoswipeSourceRef, openGallery } =
    useListingDetailPhotoSwipe(images);

  const { prevClass, nextClass } = getNavigationClasses(variant);

  return (
    <div className={`listing-gallery ${variant}`}>
      <div className="listing-detail-photos">
        <Swiper
          className="swiper slider-listing-details2"
          modules={[Navigation, Thumbs]}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          navigation={{
            prevEl: `.${prevClass}`,
            nextEl: `.${nextClass}`,
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          onSwiper={(swiper) => setActiveIndex(swiper.activeIndex)}
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.src}>
              <ListingDetailGallerySlideContent
                image={image}
                onImageClick={() => openGallery(index)}
                onOpenAllImages={() => openGallery(activeIndex)}
              />
            </SwiperSlide>
          ))}
          <ListingDetailGalleryNavButtons
            prevClass={prevClass}
            nextClass={nextClass}
          />
        </Swiper>
      </div>

      <Swiper
        className="swiper slider-listing-details1"
        modules={[Thumbs, FreeMode]}
        onSwiper={setThumbsSwiper}
        {...THUMBS_SWIPER_CONFIG}
      >
        {images.map((image) => (
          <SwiperSlide key={`thumb-${image.thumb}`}>
            <Image
              src={image.thumb}
              alt={image.alt}
              width={400}
              height={254}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <ListingDetailPhotoSwipeSource
        images={images}
        sourceRef={photoswipeSourceRef}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import ListingDetailGalleryNavButtons from "@/components/common/listing-detail/ListingDetailGalleryNavButtons";
import ListingDetailGallerySlideContent from "@/components/common/listing-detail/ListingDetailGallerySlideContent";
import ListingDetailPhotoSwipeSource from "@/components/common/listing-detail/ListingDetailPhotoSwipeSource";
import { LISTING_DETAIL_CAROUSEL_BREAKPOINTS } from "@/data/listingDetailGalleryShared";
import { LISTING_DETAIL_V4_GALLERY } from "@/data/listingDetailV4Gallery";
import type { ListingDetailGalleryImage } from "@/data/listingDetailV1Gallery";
import { useListingDetailPhotoSwipe } from "@/hooks/useListingDetailPhotoSwipe";

type ListingDetailV4GalleryProps = {
  images?: ListingDetailGalleryImage[];
};

function ListingDetailV4Gallery({
  images = LISTING_DETAIL_V4_GALLERY,
}: ListingDetailV4GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { photoswipeSourceRef, openGallery } = useListingDetailPhotoSwipe(images);

  return (
    <div className="listing-gallery style-4">
      <Swiper
        className="swiper slider-listing-details4"
        modules={[Navigation, Pagination]}
        slidesPerView={4}
        spaceBetween={8}
        navigation={{
          nextEl: ".listing-gallery.style-4 .swiper-button-next",
          prevEl: ".listing-gallery.style-4 .swiper-button-prev",
        }}
        pagination={{
          el: ".swiper-pagi-details4",
          clickable: true,
        }}
        breakpoints={LISTING_DETAIL_CAROUSEL_BREAKPOINTS}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
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
        <ListingDetailGalleryNavButtons />
        <span className="d-flex d-md-none sw-dot-default swiper-pagi-details4 justify-content-center" />
      </Swiper>

      <ListingDetailPhotoSwipeSource images={images} sourceRef={photoswipeSourceRef} />
    </div>
  );
}

export default ListingDetailV4Gallery;

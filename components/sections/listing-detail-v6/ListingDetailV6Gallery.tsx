"use client";

import Image from "@/components/common/AppImage";
import { useState } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import ListingDetailGalleryNavButtons from "@/components/common/listing-detail/ListingDetailGalleryNavButtons";
import ListingDetailGallerySlideContent from "@/components/common/listing-detail/ListingDetailGallerySlideContent";
import ListingDetailPhotoSwipeSource from "@/components/common/listing-detail/ListingDetailPhotoSwipeSource";
import {
  LISTING_DETAIL_V6_GALLERY,
  LISTING_DETAIL_V6_SIDE_IMAGE,
} from "@/data/listingDetailV6Gallery";
import type { ListingDetailGalleryImage } from "@/data/listingDetailV1Gallery";
import { useListingDetailPhotoSwipe } from "@/hooks/useListingDetailPhotoSwipe";

type ListingDetailV6SideImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type ListingDetailV6GalleryProps = {
  images?: ListingDetailGalleryImage[];
  sideImage?: ListingDetailV6SideImage;
};

function ListingDetailV6Gallery({
  images = LISTING_DETAIL_V6_GALLERY,
  sideImage = LISTING_DETAIL_V6_SIDE_IMAGE,
}: ListingDetailV6GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { photoswipeSourceRef, openGallery } = useListingDetailPhotoSwipe(images);

  return (
    <div className="listing-gallery style-6">
      <Swiper
        className="swiper slider-listing-details6"
        modules={[Navigation]}
        navigation={{
          prevEl: ".listing-gallery.style-6 .listing-detail-v6-main-prev",
          nextEl: ".listing-gallery.style-6 .listing-detail-v6-main-next",
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
      >
        {images.map((image, index) => (
          <SwiperSlide key={`main-${index}`}>
            <ListingDetailGallerySlideContent
              image={image}
              onImageClick={() => openGallery(index)}
              onOpenAllImages={() => openGallery(activeIndex)}
            />
          </SwiperSlide>
        ))}
        <ListingDetailGalleryNavButtons
          prevClass="listing-detail-v6-main-prev"
          nextClass="listing-detail-v6-main-next"
        />
      </Swiper>

      <div className="slider-listing-details6 listing-details6-right">
        <Image
          src={sideImage.src}
          alt={sideImage.alt}
          width={sideImage.width}
          height={sideImage.height}
        />
      </div>

      <ListingDetailPhotoSwipeSource images={images} sourceRef={photoswipeSourceRef} />
    </div>
  );
}

export default ListingDetailV6Gallery;

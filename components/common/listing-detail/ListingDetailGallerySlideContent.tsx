import Image from "@/components/common/AppImage";
import type { ListingDetailGalleryImage } from "@/data/listingDetailV1Gallery";

type ListingDetailGallerySlideContentProps = {
  image: ListingDetailGalleryImage;
  onImageClick: () => void;
  onOpenAllImages: () => void;
};

export default function ListingDetailGallerySlideContent({
  image,
  onImageClick,
  onOpenAllImages,
}: ListingDetailGallerySlideContentProps) {
  return (
    <>
      <button
        type="button"
        className="image border-0 bg-transparent p-0 w-100"
        onClick={onImageClick}
      >
        <Image
          className="lazyload"
          data-src={image.src}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
        />
      </button>
      <div className="specs-features-wrap flex-three">
        <a className="specs-features" href="#">
          <i className="icon-carus-videocamerass" />
          <span className="fw-7 fs-14 text-color-2 lh-16">Video</span>
        </a>
        <button
          type="button"
          className="specs-features"
          onClick={onOpenAllImages}
        >
          <i className="icon-carus-imagessquare" />
          <span className="fw-7 fs-14 text-color-2 lh-16">All image</span>
        </button>
      </div>
    </>
  );
}

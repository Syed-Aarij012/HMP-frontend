import Image from "@/components/common/AppImage";

const PARTNER_IMAGES = [
  "/assets/images/partner/par1.webp",
  "/assets/images/partner/par2.webp",
  "/assets/images/partner/par3.webp",
  "/assets/images/partner/par4.webp",
  "/assets/images/partner/par5.webp",
  "/assets/images/partner/par6.webp",
  "/assets/images/partner/par1.webp",
  "/assets/images/partner/par2.webp",
  "/assets/images/partner/par3.webp",
  "/assets/images/partner/par4.webp",
  "/assets/images/partner/par5.webp",
  "/assets/images/partner/par6.webp",
  "/assets/images/partner/par1.webp",
  "/assets/images/partner/par2.webp",
  "/assets/images/partner/par3.webp",
  "/assets/images/partner/par4.webp",
  "/assets/images/partner/par5.webp",
  "/assets/images/partner/par6.webp",
];

export default function PartnersSlider() {
  return (
    <div className="infiniteslide_wrap" style={{ overflow: "hidden" }}>
      <div className="infiniteslide tf-brand infinite-slider">
        {PARTNER_IMAGES.map((src, i) => (
          <div key={src + i} className="slogan-logo">
            <Image
              className="lazyload"
              data-src={src}
              src={src}
              alt="images"
              width={200}
              height={110}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import Image from "@/components/common/AppImage";

function Banner() {
  return (
    <>
      <section
        className="tf-section-banner tf-section"
        style={{ paddingTop: 40 }}
      >
        <div className="container">
          <div className="tf-grid-layout md-col-2 gap-48">
            <div className="tf-image-box home03-banner-card flex-one align-end wow fadeInUp">
              <div className="content">
                <h3 className="title">Are you looking to buy a car?</h3>
                <p className="sub">
                  If you&apos;re looking for a reliable car at a reasonable price,
                  let us help make your choice easier!
                </p>
                <Link href={`/dealer-listing`} className="find-cars">
                  <span>Find cars</span>
                  <i className="icon-carus-arright" />
                </Link>
              </div>
              <div className="image">
                <Image
                  className="ls-is-cached lazyloaded"
                  data-src="/assets/images/img-box/find-car-4.webp"
                  src="/assets/images/img-box/find-car-4.webp"
                  alt="images"
                  width={180}
                  height={180}
                />
              </div>
            </div>
            <div
              className="tf-image-box home03-banner-card home03-banner-card-blue flex-one align-end wow fadeInUp"
              data-wow-delay="0.2s"
            >
              <div className="content">
                <h3 className="title">Do you want to sell a car?</h3>
                <p className="sub">
                  You provide information about the car, we provide free
                  valuation and connect you with trusted buyers
                </p>
                <Link href={`/dealer-listing`} className="find-cars">
                  <span>Sell my car</span>
                  <i className="icon-carus-arright" />
                </Link>
              </div>
              <div className="image">
                <Image
                  className="ls-is-cached lazyloaded"
                  data-src="/assets/images/img-box/find-car-2.webp"
                  src="/assets/images/img-box/find-car-2.webp"
                  alt="images"
                  width={180}
                  height={180}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Banner;

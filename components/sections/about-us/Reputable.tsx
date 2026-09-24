import Image from "@/components/common/AppImage";
import Link from "next/link";
import Counter from "@/components/common/Counter";
function Reputable() {
  return (
    <>
      <section className="tf-section section-reputable bg-black">
        <div className="container">
          <div className="row">
            <div className="col-lg-5">
              <div className="reputable-image">
                <div className="tf-counter center">
                  <div className="number-counter">
                    <div className="number">
                      <Counter min={0} max={972} />
                    </div>
                    <span>K</span>
                  </div>
                  <p>Cars listing</p>
                </div>
                <div className="image">
                  <Image
                    className="lazyload"
                    data-src="/assets/images/section/reputable.webp"
                    src="/assets/images/section/reputable.webp"
                    alt="image"
                    width={1038}
                    height={506}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="reputable-content">
                <div className="image-logo">
                  <Image
                    className="lazyload"
                    data-src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png"
                    src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png"
                    alt="HMP"
                    width={200}
                    height={100}
                  />
                </div>
                <div className="heading-section">
                  <h2 className="heading-tittle text-color-1">
                    HMP is the largest and most reputable platform for car
                    listings
                  </h2>
                  <p>
                    As the largest and most reputable platform for car listings,
                    HMP provides buyers and sellers with unmatched
                    reliability, extensive options, and a trusted marketplace
                    for every automotive need.
                  </p>
                </div>
                <div className="tf-counter flex-three">
                  <div className="number-counter">
                    <div className="number">
                      <Counter min={0} max={748} />
                    </div>
                    <span>K</span>
                  </div>
                  <p className="fs-18 fw-4 text-color-1">
                    people found their dream car
                  </p>
                </div>
                <div className="btn-wrap">
                  <Link className="sc-button" href="/add-listing">
                    <span>Sell my car</span>
                    <i className="icon-carus-arright" />
                  </Link>
                  <Link className="sc-button" href="/listing-grid">
                    <span>Find a car</span>
                    <i className="icon-carus-arright" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Reputable;

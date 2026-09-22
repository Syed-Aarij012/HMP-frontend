import Image from "@/components/common/AppImage";

function AboutUs() {
  return (
    <>
      <section className="tf-section tf-section-about-us">
        <div className="container">
          <div className="row mb-50">
            <div className="col-lg-7">
              <div className="image-logo">
                <Image
                  className="lazyload"
                  data-src="/assets/images/logo/logo.png"
                  src="/assets/images/logo/logo.png"
                  alt="images"
                  width={329}
                  height={64}
                />
              </div>
            </div>
            <div className="col-lg-5">
              <div className="heading">
                <h2 className="heading-tittle">About us</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Suspendisse sit amet auctor dolor, quis gravida purus. Aliquam
                  gravida ipsum quis.
                </p>
              </div>
            </div>
          </div>
          <div className="row mb-40">
            <div className="col-lg-12">
              <div className="image-banner">
                <Image
                  className="lazyload"
                  data-src="/assets/images/section/banner-about.jpg"
                  src="/assets/images/section/banner-about.jpg"
                  alt="images"
                  width={2160}
                  height={725}
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3">
              <div className="about-box">
                <p>Lorem ipsum dolor sit amet</p>
                <h3>This Tiny Engine Fits In a Briefcase.</h3>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="about-box">
                <p>Lorem ipsum dolor sit amet</p>
                <h3>
                  This Tiny Engine Fits In a <br /> Briefcase.
                </h3>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="about-text">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Suspendisse sit amet auctor dolor, quis gravida purus. Aliquam
                  gravida ipsum quis.
                </p>
                <p>
                  Cras luctus ex massa, sit amet imperdiet diam luctus eget. Ut
                  elementum, felis vitae elementum mattis, arcu augue eleifend
                  elit, ac maximus ante nisi quis leo. Donec a tincidunt nisl.
                  Donec ut viverra neque. Integer dictum, nulla sit amet
                  condimentum posuere, erat elit bibendum purus, facilisis
                  rutrum sapien ligula eget eros. Sed sit amet urna eget libero
                  auctor finibus.
                </p>
                <p>
                  {" "}
                  Aliquam tristique vitae urna nec sollicitudin. Aenean sem
                  erat, pharetra nec urna quis, ornare eleifend ligula.
                  Curabitur placerat dapibus nunc. Proin id ornare mauris. Nam
                  neque ipsum, scelerisque nec enim a, sodales bibendum enim.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default AboutUs;

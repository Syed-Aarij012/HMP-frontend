import Image from "@/components/common/AppImage";

function WhyChooseUs() {
  return (
    <>
      <section className="tf-section3 section-why-choose-us">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 relative">
              <div className="circle-rotate style-left">
                <svg viewBox="0 0 300 300">
                  <defs>
                    <path
                      id="circlePath"
                      d="
          M 150,150
          m -120,0
          a 120,120 0 1,1 240,0
          a 120,120 0 1,1 -240,0
        "
                    />
                  </defs>
                  <text>
                    <textPath href="#circlePath">
                      Platform – HMP – Best Car Selling –
                    </textPath>
                  </text>
                </svg>
                <div className="circle-center">
                  <i className="icon-carus-arright" />
                </div>
              </div>
              <div className="image-wcs">
                <div className="image wow fadeInLeft">
                  <Image
                    className=" ls-is-cached lazyloaded"
                    data-src="/assets/images/section//wcu1.webp"
                    src="/assets/images/section/wcu1.webp"
                    alt="images"
                    width={486}
                    height={576}
                  />
                </div>
                <div className="image wow fadeInLeft" data-wow-delay="0.2s">
                  <Image
                    className=" ls-is-cached lazyloaded"
                    data-src="/assets/images/section//wcu2.webp"
                    src="/assets/images/section/wcu2.webp"
                    alt="images"
                    width={540}
                    height={837}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="content-wcs">
                <div className="heading-section wow fadeInUp">
                  <h2 className="heading-tittle">Why choose us</h2>
                  <p className="des">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Donec et odio sed orci scelerisque volutpat vel vel lectus.
                    Donec luctus, leo ut tempus accumsan, quam nisi dignissim
                    dui, ut porttitor turpis eros ornare libero.
                  </p>
                </div>
                <ul className="tf-icon-list wow fadeInUp" data-wow-delay="0.2s">
                  <li className="flex-three">
                    <i className=" icon-carus-check" />
                    <span className="fs-16 fw-4 text-color-2">
                      Car comparison and pricing made simple
                    </span>
                  </li>
                  <li className="flex-three">
                    <i className=" icon-carus-check" />
                    <span className="fs-16 fw-4 text-color-2">
                      Market values and car tools simplified
                    </span>
                  </li>
                  <li className="flex-three">
                    <i className=" icon-carus-check" />
                    <span className="fs-16 fw-4 text-color-2">
                      Helping buyers and sellers decide smarter
                    </span>
                  </li>
                </ul>
                <a
                  className="sc-button wow fadeInUp"
                  href="#"
                  data-wow-delay="0.4s"
                >
                  <span>View more</span>
                  <i className="icon-carus-arright" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default WhyChooseUs;

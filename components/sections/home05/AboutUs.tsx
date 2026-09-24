import Link from "next/link";
import Image from "@/components/common/AppImage";
import Counter from "@/components/common/Counter";
function AboutUs() {
  return (
    <>
      <section className="tf-section3">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="image-about-us relative">
                <div className="image wow fadeInLeft">
                  <Image
                    className="lazyload"
                    data-src="/assets/images/section/about-counter.jpg"
                    src="/assets/images/section/about-counter.jpg"
                    alt="image"
                    width={496}
                    height={616}
                  />
                </div>
                <div
                  className="counter-wrap wow fadeInLeft"
                  data-wow-delay="0.2s"
                >
                  <Image
                    className="lazyload logo-counter"
                    data-src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png"
                    src="/assets/images/WhatsApp_Image_2026-09-14_at_3.32.30_PM-removebg-preview.png"
                    alt="HMP"
                    width={200}
                    height={100}
                  />
                  <div className="tf-counter style-1 center">
                    <div className="tf-counter style-1 center">
                      <div className="number-counter">
                        <div>TOP 1</div>
                      </div>
                      <p>car sales platform</p>
                    </div>
                    <div className="tf-counter style-1 center">
                      <div className="number-counter">
                        <div className="number">
                          <Counter min={0} max={748} />
                        </div>
                        <span>M</span>
                      </div>
                      <p>Cars for sale</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="content-about-us">
                <div className="heading-section  wow fadeInUp">
                  <h2 className="heading-tittle">About Us</h2>
                  <p
                    className="wow fadeInUpSmall"
                    data-wow-delay="0.2s"
                    data-wow-duration="1000ms"
                  >
                    We deliver quality service, trusted expertise, and customer
                    focused solutions that build strong relationships.
                  </p>
                </div>
                <ul
                  className="tf-icon-list style-1  wow fadeInUp"
                  data-wow-delay="0.2s"
                >
                  <li className="flex">
                    <i className="icon-carus-circle" />
                    <span className="fs-16 fw-6 text-color-2">
                      User-Friendly and Intuitive Interface
                    </span>
                  </li>
                  <li className="flex">
                    <i className="icon-carus-circle" />
                    <span className="fs-16 fw-6 text-color-2">
                      Car comparison and pricing made simple
                    </span>
                  </li>
                  <li className="flex">
                    <i className="icon-carus-circle" />
                    <span className="fs-16 fw-6 text-color-2">
                      Supports buyers and sellers with tools to compare cars and
                      market values.
                    </span>
                  </li>
                </ul>
                <div
                  className="hotline-wrap flex-three  wow fadeInUp"
                  data-wow-delay="0.3s"
                >
                  <div className="icon">
                    <svg
                      width={44}
                      height={44}
                      viewBox="0 0 44 44"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M35.4738 25.3685C34.3738 24.2694 32.4557 24.2694 31.3548 25.3685L29.5641 27.1597C28.3591 28.3651 26.2334 28.3651 25.0284 27.1597L16.8389 18.9706C16.2334 18.3656 15.8998 17.5594 15.8998 16.7023C15.8998 15.848 16.2334 15.0418 16.8389 14.4368L18.6305 12.6456C19.7663 11.5103 19.7663 9.66094 18.6305 8.52565L12.7886 2.68282C12.7882 2.68282 12.7877 2.68282 12.7872 2.68053C11.6519 1.55257 9.80578 1.55028 8.67003 2.68282L5.20823 6.1469C3.03207 8.32261 1.83398 11.2129 1.83398 14.2892C1.83398 17.3683 3.03207 20.2585 5.20778 22.4347L21.5643 38.7908C23.74 40.9669 26.6326 42.165 29.7094 42.165C32.7862 42.165 35.6792 40.9669 37.8544 38.7908L41.3167 35.3294C42.4515 34.1942 42.4515 32.3471 41.3167 31.2118L35.4738 25.3685ZM10.4209 4.43778C10.5057 4.35298 10.617 4.30944 10.7284 4.30944C10.8402 4.30944 10.9516 4.35298 11.0364 4.43778L16.8779 10.2788C17.0474 10.4484 17.0474 10.7243 16.8779 10.8934L15.0862 12.6846C14.9776 12.7932 14.8772 12.9073 14.7787 13.0228L8.30749 6.55115L10.4209 4.43778ZM23.317 37.0381L6.95998 20.682C5.25269 18.9757 4.31265 16.7051 4.31265 14.2892C4.31265 12.0686 5.11703 9.97444 6.57498 8.32353L13.5916 15.3402C13.4834 15.7815 13.4211 16.2367 13.4211 16.7023C13.4211 18.2226 14.0128 19.6508 15.0867 20.7228L23.2748 28.9123C24.6682 30.3047 26.7453 30.7869 28.6172 30.3675L35.6737 37.4222C32.2082 40.4389 26.5959 40.3193 23.317 37.0381ZM39.5635 33.5768L37.4479 35.692L30.9748 29.2199C31.0917 29.1218 31.2077 29.0219 31.3172 28.9123L33.1074 27.1212C33.2518 26.9759 33.5768 26.9759 33.7207 27.1212L39.5631 32.9644C39.7322 33.1336 39.7322 33.4072 39.5635 33.5768Z"
                        fill="#24272C"
                      />
                      <path
                        d="M25.7088 17.8227H25.9058V19.8948C25.9058 20.6863 26.3747 21.4004 27.1003 21.7153C27.3551 21.8267 27.6237 21.8798 27.8904 21.8798C28.385 21.8798 28.8722 21.696 29.248 21.345L33.004 17.8231H38.1227C40.2549 17.8231 41.9897 16.0902 41.9897 13.9575V6.15074C41.9897 4.01811 40.2549 2.28516 38.1227 2.28516H25.7088C23.5766 2.28516 21.8418 4.01811 21.8418 6.15074V13.9571C21.8418 16.0897 23.5766 17.8227 25.7088 17.8227ZM24.3205 6.15074C24.3205 5.38578 24.9429 4.76382 25.7088 4.76382H38.1232C38.8886 4.76382 39.5115 5.38578 39.5115 6.15074V13.9571C39.5115 14.722 38.8886 15.344 38.1232 15.344H32.5145C32.1992 15.344 31.8967 15.465 31.6666 15.6781L28.3845 18.7572V16.5833C28.3845 15.8981 27.8295 15.344 27.1452 15.344H25.7088C24.9433 15.344 24.3205 14.722 24.3205 13.9571V6.15074Z"
                        fill="#405FF2"
                      />
                      <path
                        d="M28.3682 9.46499H35.4642C36.1484 9.46499 36.7035 8.91087 36.7035 8.22566C36.7035 7.54045 36.1484 6.98633 35.4642 6.98633H28.3682C27.6835 6.98633 27.1289 7.54045 27.1289 8.22566C27.1289 8.91041 27.6839 9.46499 28.3682 9.46499Z"
                        fill="#405FF2"
                      />
                      <path
                        d="M28.3682 13.0119H35.4642C36.1484 13.0119 36.7035 12.4577 36.7035 11.7725C36.7035 11.0873 36.1484 10.5332 35.4642 10.5332H28.3682C27.6835 10.5332 27.1289 11.0873 27.1289 11.7725C27.1289 12.4577 27.6839 13.0119 28.3682 13.0119Z"
                        fill="#405FF2"
                      />
                    </svg>
                  </div>
                  <div className="content">
                    <span className="fs-14 fw-4 text-color-2">
                      Online support:
                    </span>
                    <div className="number-phone text-color-2">
                      (808) 555-0111
                    </div>
                  </div>
                </div>
                <div className="btn-wrap  wow fadeInUp" data-wow-delay="0.4s">
                  <Link className="sc-button" href={`/dealer-listing`}>
                    <span>Sell my car</span>
                    <i className="icon-carus-arright" />
                  </Link>
                  <Link className="sc-button style-2" href={`/dealer-listing`}>
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

export default AboutUs;

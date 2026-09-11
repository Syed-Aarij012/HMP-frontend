"use client";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { popularListingTabs, getCarDetailHref } from "@/data/cars";
import ListingCardActions from "@/components/common/ListingCardActions";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { useHomepageListings } from "@/hooks/useHomepageListings";

function PopularListings() {
  const [activeTab, setActiveTab] = useState(popularListingTabs[0]);
  const { cars, loading, error } = useHomepageListings();

  const filteredCars = useMemo(() => {
    return cars.filter((car) => car.listingType?.includes(activeTab));
  }, [cars, activeTab]);

  return (
    <>
      <section className="tf-section3">
        <div className="container">
          <div className="heading-section flex align-center justify-space flex-wrap gap-20 wow fadeInUp">
            <h2 className="heading-tittle">Popular listings</h2>
            <Link href={`/listing-grid`} className="tf-btn-arrow">
              See all
              <i className="icon-carus-arrowcircleright" />
            </Link>
          </div>
          <div
            className="flat-tabs themesflat-tabs wow fadeInUp"
            data-wow-delay="0.2s"
          >
            <div className="box-tab center">
              <ul className="menu-tab tab-title style flex">
                {popularListingTabs.map((tab) => (
                  <li
                    key={tab}
                    className={`item-title${activeTab === tab ? " active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                    role="tab"
                    aria-selected={activeTab === tab}
                  >
                    <span className="inner">{tab}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="content-tab">
              <div className="content-inner tab-content">
                {loading && <p>Loading live listings...</p>}
                {error && <div className="alert alert-danger">{error}</div>}
                {!loading && !error && filteredCars.length === 0 && (
                  <p>No live listings in this category right now.</p>
                )}
                {!loading && !error && filteredCars.length > 0 && (
                <Swiper
                  key={activeTab}
                  className="swiper-container tf-swiper"
                  modules={[Pagination, Navigation]}
                  {...{
                    slidesPerView: 1,
                    spaceBetween: 15,
                    speed: 800,
                    observer: true,
                    observeParents: true,
                    slidesPerGroup: 1,
                    navigation: {
                      // clickable: true,
                      nextEl: ".nav-next-categories",
                      prevEl: ".nav-prev-categories",
                    },
                    pagination: {
                      el: ".sw-pagination-categories",
                      clickable: true,
                    },
                    breakpoints: {
                      "575": {
                        slidesPerView: 2,
                        spaceBetween: 15,
                        slidesPerGroup: 1,
                      },
                      "768": {
                        slidesPerView: 2,
                        spaceBetween: 15,
                        slidesPerGroup: 1,
                      },
                      "1200": {
                        slidesPerView: 4,
                        spaceBetween: 30,
                        slidesPerGroup: 1,
                      },
                    },
                  }}
                >
                  {filteredCars.map((car) => (
                    <SwiperSlide className="swiper-slide" key={car.id}>
                      <div className="box-car-list hv-one">
                        <div className="image-group relative">
                          <div className="top">
                            <ul className="d-flex gap-8">
                              <li className="flag-tag success">{car.tag}</li>
                              <li className="flag-tag style-1">
                                <div className="icon">
                                  <svg
                                    width={16}
                                    height={13}
                                    viewBox="0 0 16 13"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1.5 9L4.93933 5.56067C5.07862 5.42138 5.24398 5.31089 5.42597 5.2355C5.60796 5.16012 5.80302 5.12132 6 5.12132C6.19698 5.12132 6.39204 5.16012 6.57403 5.2355C6.75602 5.31089 6.92138 5.42138 7.06067 5.56067L10.5 9M9.5 8L10.4393 7.06067C10.5786 6.92138 10.744 6.81089 10.926 6.7355C11.108 6.66012 11.303 6.62132 11.5 6.62132C11.697 6.62132 11.892 6.66012 12.074 6.7355C12.256 6.81089 12.4214 6.92138 12.5607 7.06067L14.5 9M2.5 11.5H13.5C13.7652 11.5 14.0196 11.3946 14.2071 11.2071C14.3946 11.0196 14.5 10.7652 14.5 10.5V2.5C14.5 2.23478 14.3946 1.98043 14.2071 1.79289C14.0196 1.60536 13.7652 1.5 13.5 1.5H2.5C2.23478 1.5 1.98043 1.60536 1.79289 1.79289C1.60536 1.98043 1.5 2.23478 1.5 2.5V10.5C1.5 10.7652 1.60536 11.0196 1.79289 11.2071C1.98043 11.3946 2.23478 11.5 2.5 11.5ZM9.5 4H9.50533V4.00533H9.5V4ZM9.75 4C9.75 4.0663 9.72366 4.12989 9.67678 4.17678C9.62989 4.22366 9.5663 4.25 9.5 4.25C9.4337 4.25 9.37011 4.22366 9.32322 4.17678C9.27634 4.12989 9.25 4.0663 9.25 4C9.25 3.9337 9.27634 3.87011 9.32322 3.82322C9.37011 3.77634 9.4337 3.75 9.5 3.75C9.5663 3.75 9.62989 3.77634 9.67678 3.82322C9.72366 3.87011 9.75 3.9337 9.75 4Z"
                                      stroke="white"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                                {car.photoCount}
                              </li>
                            </ul>
                          </div>
                          <ListingCardActions car={car} />
                          <div className="img-style">
                            <Image
                              className="lazyload"
                              data-src={car.image}
                              src={car.image}
                              alt={car.title}
                              width={507}
                              height={365}
                            />
                          </div>
                        </div>
                        <div className="content">
                          <h3 className="link-style-1">
                            <Link href={getCarDetailHref(car.id)}>{car.title}</Link>
                          </h3>
                          <div className="icon-box flex flex-wrap">
                            <div className="icons flex-three">
                              <svg
                                width={18}
                                height={13}
                                viewBox="0 0 18 13"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M7.63794 8.8875L15.1379 1.3875C15.2268 1.3047 15.3443 1.25962 15.4658 1.26177C15.5872 1.26391 15.7031 1.3131 15.789 1.39899C15.8748 1.48487 15.924 1.60074 15.9262 1.72217C15.9283 1.84361 15.8832 1.96114 15.8004 2.05L8.30044 9.55C8.21158 9.6328 8.09406 9.67788 7.97262 9.67573C7.85118 9.67359 7.73531 9.6244 7.64943 9.53851C7.56355 9.45263 7.51435 9.33676 7.51221 9.21533C7.51007 9.09389 7.55514 8.97636 7.63794 8.8875ZM8.59419 3.4375C9.15411 3.43693 9.71038 3.52771 10.2411 3.70625C10.359 3.74593 10.4878 3.73715 10.5992 3.68184C10.7106 3.62653 10.7955 3.52923 10.8352 3.41133C10.8749 3.29343 10.8661 3.1646 10.8108 3.05318C10.7555 2.94175 10.6582 2.85687 10.5403 2.81719C9.56915 2.48983 8.53114 2.41269 7.52229 2.59289C6.51343 2.77309 5.56631 3.20482 4.76856 3.84813C3.9708 4.49144 3.34818 5.32556 2.95828 6.27332C2.56839 7.22108 2.42382 8.25186 2.53794 9.27031C2.55069 9.38549 2.60565 9.49187 2.69221 9.56891C2.77878 9.64596 2.89081 9.6882 3.00669 9.6875C3.02412 9.68864 3.04161 9.68864 3.05904 9.6875C3.1825 9.67375 3.29545 9.61156 3.37309 9.51459C3.45073 9.41762 3.4867 9.29379 3.4731 9.17031C3.45109 8.97889 3.43935 8.78643 3.43794 8.59375C3.4396 7.22674 3.98337 5.91618 4.95 4.94956C5.91663 3.98293 7.22718 3.43915 8.59419 3.4375ZM16.2504 4.67969C16.2223 4.6249 16.1837 4.57619 16.1368 4.53633C16.0898 4.49647 16.0355 4.46625 15.9769 4.44739C15.9183 4.42853 15.8565 4.42139 15.7951 4.4264C15.7338 4.43141 15.674 4.44845 15.6192 4.47656C15.5644 4.50467 15.5157 4.5433 15.4758 4.59024C15.436 4.63717 15.4058 4.6915 15.3869 4.75012C15.368 4.80874 15.3609 4.87049 15.3659 4.93187C15.3709 4.99324 15.388 5.05303 15.4161 5.10781C15.8881 6.03417 16.1672 7.04669 16.2365 8.08405C16.3058 9.12142 16.1638 10.1621 15.8192 11.143C15.8088 11.1743 15.7888 11.2015 15.762 11.2207C15.7352 11.2399 15.703 11.2502 15.67 11.25H1.52076C1.48759 11.2492 1.45548 11.2381 1.42879 11.2184C1.40209 11.1987 1.38211 11.1713 1.37154 11.1398C0.968609 9.98503 0.847536 8.75064 1.01841 7.53955C1.18928 6.32845 1.64715 5.17574 2.35386 4.17749C3.06056 3.17924 3.99563 2.36435 5.08113 1.80076C6.16663 1.23717 7.37111 0.941193 8.59419 0.9375H8.66451C9.8527 0.945088 11.0225 1.23198 12.0793 1.775C12.1343 1.80316 12.1943 1.82022 12.2559 1.82519C12.3175 1.83017 12.3795 1.82296 12.4383 1.80399C12.4971 1.78502 12.5515 1.75466 12.5986 1.71463C12.6457 1.6746 12.6844 1.62569 12.7126 1.5707C12.7407 1.51571 12.7578 1.45571 12.7627 1.39413C12.7677 1.33255 12.7605 1.27059 12.7415 1.21179C12.7226 1.15299 12.6922 1.09851 12.6522 1.05144C12.6122 1.00438 12.5632 0.965662 12.5083 0.9375C11.3208 0.328536 10.0068 0.00738987 8.67232 0H8.59419C7.22014 0.000678333 5.86625 0.330649 4.64597 0.962266C3.42568 1.59388 2.37454 2.50875 1.58061 3.63022C0.786669 4.7517 0.273063 6.04711 0.0828165 7.40793C-0.10743 8.76875 0.0312243 10.1554 0.487163 11.4516C0.562354 11.666 0.702084 11.8518 0.887157 11.9836C1.07223 12.1154 1.29357 12.1866 1.52076 12.1875H15.6668C15.8935 12.1869 16.1144 12.1163 16.2993 11.9852C16.4842 11.8542 16.6241 11.6691 16.6997 11.4555C17.0874 10.3545 17.2476 9.18621 17.1704 8.02148C17.0931 6.85676 16.7802 5.71985 16.2504 4.67969Z"
                                  fill="black"
                                />
                              </svg>
                              <span>{car.mileage} Km</span>
                            </div>
                            <div className="icons flex-three">
                              <i className="icon-carus-icon12" />
                              <span>{car.transmission}</span>
                            </div>
                            <div className="icons flex-three">
                              <i className="icon-carus-icon9" />
                              <span>{car.fuel}</span>
                            </div>
                          </div>
                          <div className="days-box flex justify-space align-center">
                            <div className="money fs-24 fw-7 lh-30 text-color-2">
                              ${car.price.toLocaleString()}
                            </div>
                            <Link
                              href={getCarDetailHref(car.id)}
                              className="view-car"
                            >
                              View <i className="icon-carus-arright" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                  <span className="d-flex d-xl-none sw-dot-default sw-pagination-categories justify-content-center" />
                </Swiper>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default PopularListings;

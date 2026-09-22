"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import LeaveReplyForm from "@/components/common/LeaveReplyForm";
import LatePriceListWidget from "@/components/common/LatePriceListWidget";
import MobileDealerSidebarShell from "@/components/common/MobileDealerSidebarShell";
import DealerSaleAgentSlider from "@/components/sections/dealer-detail/DealerSaleAgentSlider";
import DealerInventorySlider from "@/components/sections/dealer-detail/DealerInventorySlider";
import { useFilteredListings } from "@/hooks/useFilteredListings";
import { useAgents } from "@/hooks/useAgents";
import type { Dealer } from "@/types/dealers";

type DealerDetailProps = {
  dealer: Dealer;
};

function DealerDetail({ dealer }: DealerDetailProps) {
  const { cars: inventoryCars } = useFilteredListings({ organizationId: dealer.organizationId });
  const { agents: allAgents } = useAgents();
  const dealerAgents = dealer.organizationId
    ? allAgents.filter((agent) => agent.organizationId === dealer.organizationId)
    : [];

  return (
    <>
      <section className="tf-section3 listing-detail overflow-hidden">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 col-md-12">
              <div className="dealer-content-wrap">
                <h2 className="title mb-3">About {dealer.name}</h2>
                {dealer.description ? (
                  <p className="mb-3">{dealer.description}</p>
                ) : (
                  <>
                    <p className="mb-2">
                      Stay informed about emerging trends in the housing market,
                      such as the demand for sustainable homes, technological
                      advancements, and demographic shifts. Companies aligning with
                      these trends may present attractive investment opportunities.
                    </p>
                    <p className="mb-3">
                      Take a long-term investment approach if you believe in the
                      stability and growth potential of the housing sector. Look for
                      companies with solid fundamentals and a track record of
                      success. For short-term traders, capitalize on market
                      fluctuations driven by economic reports, interest rate
                      changes, or industry-specific news. Keep a close eye on
                      earnings reports and government housing data releases.
                    </p>
                  </>
                )}
                <div className="features-thumb mb-4">
                  <Image
                    src={dealer.image}
                    alt={dealer.name}
                    width={1416}
                    height={701}
                  />
                </div>
                {dealerAgents.length > 0 && (
                  <div className="tf-sale-agent-list over">
                    <div className="heading-section flex align-center justify-space flex-wrap gap-20">
                      <h2 className="title">Sale agent list</h2>
                      <Link href={`/sale-agents`} className="tf-btn-arrow">
                        See all
                        <i className="icon-carus-arrowcircleright" />
                      </Link>
                    </div>
                    <DealerSaleAgentSlider agents={dealerAgents} />
                  </div>
                )}
                {inventoryCars.length > 0 && (
                  <div className="tf-list-car-agent">
                    <div className="heading-section flex align-center justify-space flex-wrap gap-20">
                      <h2 className="heading-tittle">
                        Dealership inventory ({inventoryCars.length})
                      </h2>
                      <Link href={`/listing-grid`} className="tf-btn-arrow">
                        See all
                        <i className="icon-carus-arrowcircleright" />
                      </Link>
                    </div>
                    <DealerInventorySlider cars={inventoryCars} />
                  </div>
                )}
                <h2 className="mb-8">{dealer.name} servicing</h2>
                <p className="mb-3 fs-14">
                  Check out what {dealer.name} serves their customers
                </p>
                <div className="widget-book-apoint">
                  <h3>Book an appointment</h3>
                  <p className="mb-3">
                    You are interested in this dealership and want to book an
                    appointment with <br /> them? Just leave your contact and
                    preferred date and time
                  </p>
                  <a href="#">Book an appointment with Dealership</a>
                </div>
                <div
                  className="listing-reviews dealer-review flat-property-detail"
                  id="scrollspyHeading5"
                >
                  <div className="box-title mb-30">
                    <h2 className="title-ct">Car User Reviews &amp; Rating</h2>
                  </div>
                  <div className="widget-rating flex-three mb-50">
                    <div className="icon-star">
                      <i className="icon-carus-star" />
                    </div>
                    <div className="numbers font-2">{dealer.rating}</div>
                    <div className="content">
                      <p className="text-color-2">Overall Rating</p>
                      <p className="text-color-2">
                        Base on{" "}
                        <span className="fw-6">
                          {dealer.reviewCount.toLocaleString()} Reviews
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flat-tabs mb-50">
                    <div className="content-tab">
                      <div className="content-inner tab-content">
                        <div className="wrap-review  pd-0">
                          <div className="titles">
                            <h4>
                              {dealer.reviewCount > 0
                                ? `${dealer.reviewCount.toLocaleString()} Rating and Reviews`
                                : "No reviews yet"}
                            </h4>
                          </div>
                          {dealer.reviewCount === 0 && (
                            <p className="text-color-2">
                              This dealer has not been reviewed yet. Reviews left on their
                              individual listings will appear here.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <LeaveReplyForm />
                </div>
              </div>
            </div>
            <MobileDealerSidebarShell
              wrapperClassName="col-lg-4 col-md-12"
              openAriaLabel="Open dealer sidebar"
              closeAriaLabel="Close dealer sidebar"
            >
              <div className="widget-title-siderbar widget">
                <h2 className="title">{dealer.name}</h2>
                <ul className="icon-list flex-three flex-wrap">
                  <li className="flex-three">
                    <svg
                      width={13}
                      height={13}
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0 6.5C0 2.91 2.91 0 6.5 0C10.09 0 13 2.91 13 6.5C13 10.09 10.09 13 6.5 13C2.91 13 0 10.09 0 6.5ZM8.90667 5.29067C8.94667 5.23737 8.97561 5.17661 8.99179 5.11197C9.00797 5.04732 9.01107 4.98009 9.0009 4.91424C8.99073 4.84838 8.9675 4.78522 8.93257 4.72847C8.89764 4.67171 8.85172 4.62252 8.7975 4.58377C8.74329 4.54502 8.68188 4.5175 8.61687 4.50282C8.55187 4.48814 8.48459 4.48661 8.41899 4.49831C8.35338 4.51001 8.29078 4.5347 8.23485 4.57094C8.17893 4.60718 8.13081 4.65423 8.09333 4.70933L5.936 7.72933L4.85333 6.64667C4.75855 6.55835 4.63319 6.51026 4.50365 6.51255C4.37412 6.51484 4.25053 6.56731 4.15892 6.65892C4.06731 6.75053 4.01484 6.87412 4.01255 7.00365C4.01026 7.13319 4.05835 7.25855 4.14667 7.35333L5.64667 8.85333C5.69799 8.90462 5.75987 8.94412 5.82799 8.9691C5.89612 8.99407 5.96886 9.00392 6.04118 8.99796C6.11349 8.99199 6.18364 8.97036 6.24675 8.93457C6.30987 8.89877 6.36443 8.84967 6.40667 8.79067L8.90667 5.29067Z"
                        fill="#405FF2"
                      />
                    </svg>
                    <span>Certified seller</span>
                  </li>
                  <li className="flex-three">
                    <svg
                      width={13}
                      height={13}
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0 6.5C0 2.91 2.91 0 6.5 0C10.09 0 13 2.91 13 6.5C13 10.09 10.09 13 6.5 13C2.91 13 0 10.09 0 6.5ZM8.90667 5.29067C8.94667 5.23737 8.97561 5.17661 8.99179 5.11197C9.00797 5.04732 9.01107 4.98009 9.0009 4.91424C8.99073 4.84838 8.9675 4.78522 8.93257 4.72847C8.89764 4.67171 8.85172 4.62252 8.7975 4.58377C8.74329 4.54502 8.68188 4.5175 8.61687 4.50282C8.55187 4.48814 8.48459 4.48661 8.41899 4.49831C8.35338 4.51001 8.29078 4.5347 8.23485 4.57094C8.17893 4.60718 8.13081 4.65423 8.09333 4.70933L5.936 7.72933L4.85333 6.64667C4.75855 6.55835 4.63319 6.51026 4.50365 6.51255C4.37412 6.51484 4.25053 6.56731 4.15892 6.65892C4.06731 6.75053 4.01484 6.87412 4.01255 7.00365C4.01026 7.13319 4.05835 7.25855 4.14667 7.35333L5.64667 8.85333C5.69799 8.90462 5.75987 8.94412 5.82799 8.9691C5.89612 8.99407 5.96886 9.00392 6.04118 8.99796C6.11349 8.99199 6.18364 8.97036 6.24675 8.93457C6.30987 8.89877 6.36443 8.84967 6.40667 8.79067L8.90667 5.29067Z"
                        fill="#405FF2"
                      />
                    </svg>
                    <span>Verified contact</span>
                  </li>
                </ul>
                <div className="social-listing flex-three flex-wrap">
                  <p>Share this page:</p>
                  <div className="icon-social style1">
                    <a href="facebook.com">
                      <i className="icon-carus-facebook" />
                    </a>
                    <a href="linkeind.com">
                      <i className="icon-carus-in" />
                    </a>
                    <a href="x.com">
                      <i className="icon-carus-x" />
                    </a>
                    <a href="instagram.com">
                      <i className="icon-carus-instagram" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="widget-dealer-contact widget">
                <h3>Get in touch with the dealer</h3>
                <div className="infor flex-three gap-20">
                  <div className="image">
                    <Image
                      src={dealer.logo}
                      alt={dealer.name}
                      width={90}
                      height={90}
                      unoptimized={dealer.logo.startsWith("http")}
                    />
                  </div>
                  <div className="content">
                    <h4>{dealer.name}</h4>
                    <div className="verified flex-three">
                      <i className="icon-carus-shieldcheck" />
                      Verified dealer
                    </div>
                  </div>
                </div>
                <div className="button-contact">
                  <a href="#" className="button-form-1">
                    Contact dealer
                  </a>
                  <a href="#" className="button-form-2">
                    Chat via Whatsapp
                  </a>
                  <a
                    data-bs-target="#ModalTogglemess"
                    data-bs-toggle="modal"
                    className="button-form-3"
                  >
                    Send mesage
                  </a>
                </div>
                <div className="map-contact">
                  <div
                    id="map-single"
                    className="map-single"
                    data-map-zoom={16}
                    data-map-scroll="true"
                  />
                  <div className="address-dealer flex-three">
                    <i className="icon-carus-map" /> {dealer.address}
                  </div>
                </div>
              </div>
              <LatePriceListWidget footerHref="/listing-list" />
              <div className="widget-categori-car widget">
                <div className="listing-header">
                  <h3>Cars for sale</h3>
                </div>
                <ul>
                  <li className="flex-two">
                    <Link href={`/listing-list`} className="fs-16 fw-4">
                      Toyota
                    </Link>
                    <p>(2.972)</p>
                  </li>
                  <li className="flex-two">
                    <Link href={`/listing-list`} className="fs-16 fw-4">
                      Ford
                    </Link>
                    <p>(2.796)</p>
                  </li>
                  <li className="flex-two">
                    <Link href={`/listing-list`} className="fs-16 fw-4">
                      Mitsubishi
                    </Link>
                    <p>(2.346)</p>
                  </li>
                  <li className="flex-two">
                    <Link href={`/listing-list`} className="fs-16 fw-4">
                      Honda
                    </Link>
                    <p>(1.839)</p>
                  </li>
                  <li className="flex-two">
                    <Link href={`/listing-list`} className="fs-16 fw-4">
                      Nissan
                    </Link>
                    <p>(1.732)</p>
                  </li>
                  <li className="flex-two">
                    <Link href={`/listing-list`} className="fs-16 fw-4">
                      Subaru
                    </Link>
                    <p>(783)</p>
                  </li>
                  <li className="flex-two">
                    <Link href={`/listing-list`} className="fs-16 fw-4">
                      Hyundai
                    </Link>
                    <p>(417)</p>
                  </li>
                  <li className="flex-two">
                    <Link href={`/listing-list`} className="fs-16 fw-4">
                      Mazda
                    </Link>
                    <p>(369)</p>
                  </li>
                  <li className="flex-two">
                    <Link href={`/listing-list`} className="fs-16 fw-4">
                      Suzuki
                    </Link>
                    <p>(226)</p>
                  </li>
                </ul>
              </div>
            </MobileDealerSidebarShell>
          </div>
        </div>
      </section>
    </>
  );
}

export default DealerDetail;

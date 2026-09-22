"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import { home05Agents } from "@/data/agents";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

function MeetOurAgents() {
  return (
    <>
      <section className="tf-section3 overflow-hidden">
        <div className="container">
          <div className="heading-section">
            <h2 className="heading-tittle">Meet Our Agents</h2>
          </div>
          <div className="wow fadeInUp" data-wow-delay="0.2s">
            <Swiper
              modules={[Pagination, Navigation]}
              className="swiper tf-swiper b-shawdow"
              slidesPerView={2}
              spaceBetween={12}
              speed={800}
              observer
              observeParents
              slidesPerGroup={1}
              navigation={{
                nextEl: ".nav-next-categories",
                prevEl: ".nav-prev-categories",
              }}
              pagination={{
                el: ".about-us-agents-pagination",
                clickable: true,
              }}
              breakpoints={{
                575: { slidesPerView: 3, spaceBetween: 12, slidesPerGroup: 1 },
                769: { slidesPerView: 4, spaceBetween: 12, slidesPerGroup: 1 },
                1200: { slidesPerView: 6, spaceBetween: 30, slidesPerGroup: 1 },
              }}
            >
              {home05Agents.map((agent) => (
                <SwiperSlide key={agent.id}>
                  <div className="agent-item ">
                    <Link href={`/sale-agents-detail/${agent.id}`} className="image">
                      <Image
                        className="lazyload"
                        data-src={agent.image}
                        src={agent.image}
                        alt={agent.name}
                        width={208}
                        height={208}
                      />
                    </Link>
                    <div className="content center">
                      <div className="fs-18 fw-6 title text-color-2">
                        <Link href={`/sale-agents-detail/${agent.id}`}>{agent.name}</Link>
                      </div>
                      <p className="sub-title fs-12 fw-4">{agent.role}</p>
                    </div>
                    <div className="icon-box flex">
                      <a href={`tel:${agent.phone}`}>
                        <i className="icon-carus-phonecall" />
                      </a>
                      <a href={`mailto:${agent.email}`}>
                        <i className=" icon-carus-envelopesimple" />
                      </a>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
              <span className="d-flex d-xl-none sw-dot-default about-us-agents-pagination justify-content-center" />
            </Swiper>
          </div>
          <p className="center mt-40 wow fadeInUp" data-wow-delay="0.3s">
            Join us as an agent and earn the commission you deserve.{" "}
            <Link href={`/sale-agents`} className="fw-6 text-color-3">
              Reach out today!
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

export default MeetOurAgents;

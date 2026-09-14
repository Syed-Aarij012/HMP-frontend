"use client";

import Image from "next/image";
import type { Agent } from "@/types/agents";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

type DealerSaleAgentSliderProps = {
  agents: Agent[];
};

export default function DealerSaleAgentSlider({ agents }: DealerSaleAgentSliderProps) {
  if (agents.length === 0) {
    return null;
  }

  return (
    <Swiper
      modules={[Navigation, Pagination]}
      className="swiper tf-swiper b-shawdow overflow-hidden"
      slidesPerView={1}
      spaceBetween={12}
      speed={800}
      observer
      observeParents
      observeSlideChildren
      watchSlidesProgress
      slidesPerGroup={1}
      navigation={{
        nextEl: ".dealer-agent-nav-next",
        prevEl: ".dealer-agent-nav-prev",
      }}
      pagination={{
        el: ".dealer-agent-pagination",
        clickable: true,
      }}
      breakpoints={{
        575: { slidesPerView: 2, spaceBetween: 12, slidesPerGroup: 1 },
        768: { slidesPerView: 3, spaceBetween: 12, slidesPerGroup: 3 },
        1200: { slidesPerView: 4, spaceBetween: 30, slidesPerGroup: 1 },
      }}
    >
      {agents.map((agent) => (
        <SwiperSlide key={agent.id}>
          <div className="agent-item box-shadow-us">
            <div className="image">
              <Image
                className="lazyload"
                data-src={agent.image}
                src={agent.image}
                alt={agent.name}
                width={208}
                height={208}
              />
            </div>
            <div className="content center">
              <div className="fs-18 fw-6 title text-color-2">{agent.name}</div>
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
      <span className="d-flex sw-dot-default dealer-agent-pagination justify-content-center" />
      <div className="nav-next-categories dealer-agent-nav-next" />
      <div className="nav-prev-categories dealer-agent-nav-prev" />
    </Swiper>
  );
}

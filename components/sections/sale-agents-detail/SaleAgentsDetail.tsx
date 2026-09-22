"use client";

import Image from "@/components/common/AppImage";
import Link from "next/link";
import MobileDealerSidebarShell from "@/components/common/MobileDealerSidebarShell";
import SaleAgentListingsPanel from "@/components/sections/sale-agents-detail/SaleAgentListingsPanel";
import { getDealerById } from "@/data/dealers";
import { useDealers } from "@/hooks/useDealers";
import { getDealerHref } from "@/lib/mapApiDealer";
import type { Agent } from "@/types/agents";

type SaleAgentsDetailProps = {
  agent: Agent;
};

function SaleAgentsDetail({ agent }: SaleAgentsDetailProps) {
  // A real agent's "dealer" card must resolve their actual employer, not a fake one — the
  // mock dealerId field is never set on a real agent (see types/agents.ts).
  const { dealers } = useDealers();
  const realDealer = dealers.find((d) => d.organizationId === agent.organizationId);
  const dealer = agent.isReal ? realDealer : getDealerById(agent.dealerId ?? 1)!;

  return (
    <>
      <section className="tf-section3 listing-detail">
        <div className="container3">
          <div className="sale-agents-detail flex gap-48">
            <MobileDealerSidebarShell
              noWrapper
              sidebarClassName="sale-agent-sidebar"
              openAriaLabel="Open agent sidebar"
              closeAriaLabel="Close agent sidebar"
            >
              <div className="widget-title-siderbar widget">
                <Image
                  src={agent.image}
                  alt={agent.name}
                  className="avata-agent"
                  width={582}
                  height={570}
                />
                <div className="flex-two gap-20 ">
                  <h2 className="title">{agent.name}</h2>
                  <div className="reating flex-three">
                    <i className="icon-carus-star" />
                    <span>{(agent.rating ?? 5).toFixed(1)}/5</span>
                  </div>
                </div>
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
                <p className="des">
                  {agent.bio ??
                    "Focused on matching every buyer with the right car, fast and fair pricing every time."}
                </p>
                <ul className="contact-agent">
                  <li className="flex-three">
                    <i className="icon-carus-phone" />
                    {agent.phone}
                  </li>
                  <li className="flex-three">
                    <i className="icon-carus-envelopesimple" />
                    {agent.email}
                  </li>
                </ul>
                <div className="social-listing">
                  <div className="icon-social style1">
                    <a
                      href="https://www.facebook.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="icon-carus-facebook" />
                    </a>
                    <a
                      href="https://www.linkedin.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="icon-carus-in" />
                    </a>
                    <a
                      href="https://x.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="icon-carus-x" />
                    </a>
                    <a
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="icon-carus-instagram" />
                    </a>
                  </div>
                </div>
              </div>
              {dealer && (
                <div className="widget-dealer-contact widget">
                  <h3>Get in touch with the dealer</h3>
                  <div className="infor flex-three gap-20">
                    <Link href={getDealerHref(dealer)} className="image d-block">
                      <Image
                        src={dealer.logo}
                        alt={dealer.name}
                        width={90}
                        height={90}
                        unoptimized={dealer.logo.startsWith("http")}
                      />
                    </Link>
                    <div className="content">
                      <h4>
                        <Link href={getDealerHref(dealer)}>{dealer.name}</Link>
                      </h4>
                      <div className="verified flex-three">
                        <i className="icon-carus-shieldcheck" />
                        Verified dealer
                      </div>
                    </div>
                  </div>
                  <div className="button-contact">
                    <Link href={getDealerHref(dealer)} className="button-form-1">
                      Contact dealer
                    </Link>
                    <Link href={getDealerHref(dealer)} className="button-form-2">
                      Chat via Whatsapp
                    </Link>
                    <Link href={getDealerHref(dealer)} className="button-form-3">
                      Send mesage
                    </Link>
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
              )}
            </MobileDealerSidebarShell>
            <SaleAgentListingsPanel agent={agent} />
          </div>
        </div>
      </section>
    </>
  );
}

export default SaleAgentsDetail;

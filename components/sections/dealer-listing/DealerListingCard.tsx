import Link from "next/link";
import Image from "next/image";
import { getDealerHref } from "@/lib/mapApiDealer";
import type { Dealer } from "@/types/dealers";

type DealerListingCardProps = {
  dealer: Dealer;
};

export default function DealerListingCard({ dealer }: DealerListingCardProps) {
  return (
    <div className="tf-dealer-list">
      <div className="infor-dealder">
        <div className="thumbnail">
          <Image
            src={dealer.image}
            alt={dealer.name}
            width={507}
            height={273}
            style={{ width: "100%", height: "auto" }}
          />
          <div className="car">
            <Image
              src={dealer.logo}
              alt=""
              width={64}
              height={35}
              unoptimized={dealer.logo.startsWith("http")}
            />
          </div>
        </div>
        <div className="content">
          <h4>
            <Link href={getDealerHref(dealer)}>{dealer.name}</Link>
          </h4>
          <div className="rating">
            {dealer.reviewCount.toLocaleString()} Reviews
            <div className="icon-star fs-12">
              {Array.from({ length: 5 }).map((_, index) => (
                <i key={index} className="icon-carus-star" aria-hidden="true" />
              ))}
            </div>
            <span>{dealer.rating}/5</span>
          </div>
        </div>
      </div>
      <div className="dealer-phone">
        <h4>{dealer.phone}</h4>
        <a href={`tel:${dealer.phone.replace(/[^\d+]/g, "")}`}>
          <i className="icon-carus-phonecall" />
          Show number
        </a>
      </div>
      <div className="dealer-address">
        <i className="icon-carus-map" />
        {dealer.address}
      </div>
      <div className="dealder-button">
        <Link href={getDealerHref(dealer)}>Dealer detail</Link>
      </div>
    </div>
  );
}

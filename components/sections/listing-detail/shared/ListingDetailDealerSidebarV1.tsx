"use client";

import Link from "next/link";
import Image from "@/components/common/AppImage";
import LatePriceListWidget from "@/components/common/LatePriceListWidget";
import ListingDetailActionIcons from "@/components/common/listing-detail/ListingDetailActionIcons";
import ListingDetailDealerSidebarShell from "@/components/common/listing-detail/ListingDetailDealerSidebarShell";
import { useContactDealer } from "@/components/common/ContactDealerContext";
import type { Car } from "@/types/cars";

type ListingDetailDealerSidebarV1Props = {
  detailHref?: string;
  car: Car;
};

export default function ListingDetailDealerSidebarV1({
  detailHref = "/listing-detail-v1",
  car,
}: ListingDetailDealerSidebarV1Props) {
  const { setContactDealerTarget } = useContactDealer();
  return (
    <ListingDetailDealerSidebarShell>
        <div className="widget-listing widget">
          <div className="heading-widget">
            <div className="money text-color-3 font">${car.price.toLocaleString()}</div>
            <div className="price-wrap">
              <p className="fs-14 lh-16 text-color-2">
                Monthly installment payment:{" "}
                <span className="fs-14 fw-6 font">$4,000</span>
              </p>
              <p className="fs-14 lh-16">New car price: $100.000</p>
            </div>
            <ul className="action-icon flex flex-wrap">
              <ListingDetailActionIcons car={car} />
            </ul>
          </div>
        </div>
        <div className="widget-dealer-contact widget">
          <h3>Get in touch with the dealer</h3>
          <div className="infor flex-three gap-20">
            <div className="image">
              <Image
                src="/assets/images/section/avata-inf.png"
                alt="image"
                width={90}
                height={90}
              />
            </div>
            <div className="content">
              <h4>Car by Themesflat</h4>
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
              onClick={() => setContactDealerTarget(car)}
            >
              Send mesage
            </a>
          </div>
          <div className="map-contact">
            <iframe
              className="map-content"
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d7302.453092836291!2d90.47477022812872!3d23.77494577893369!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1svi!2s!4v1627293157601!5m2!1svi!2s"
              allowFullScreen
              loading="lazy"
            />
            <div className="address-dealer flex-three">
              <i className="icon-carus-map" /> 4517 Washington Ave. Manchester,
              Kentucky 39495
            </div>
          </div>
        </div>
        <LatePriceListWidget detailHref={detailHref} />
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
    </ListingDetailDealerSidebarShell>
  );
}

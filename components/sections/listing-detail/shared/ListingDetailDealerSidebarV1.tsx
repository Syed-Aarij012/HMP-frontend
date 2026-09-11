import Link from "next/link";
import Image from "next/image";
import LatePriceListWidget from "@/components/common/LatePriceListWidget";
import ListingDetailFavoriteCompareActions from "@/components/common/listing-detail/ListingDetailFavoriteCompareActions";
import ListingDetailDealerSidebarShell from "@/components/common/listing-detail/ListingDetailDealerSidebarShell";
import type { Car } from "@/types/cars";

type ListingDetailDealerSidebarV1Props = {
  detailHref?: string;
  car: Car;
};

export default function ListingDetailDealerSidebarV1({
  detailHref = "/listing-detail-v1",
  car,
}: ListingDetailDealerSidebarV1Props) {
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
              <ListingDetailFavoriteCompareActions car={car} />
              <li>
                <a href="#" className="icon">
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.5671 8.3083L12.3171 2.0583C12.2298 1.97084 12.1184 1.91126 11.9972 1.88707C11.876 1.86289 11.7503 1.87521 11.6361 1.92245C11.5218 1.9697 11.4242 2.04976 11.3555 2.15252C11.2867 2.25527 11.25 2.37609 11.25 2.49971V5.65205C9.22339 5.82549 6.98511 6.81768 5.1437 8.3794C2.92651 10.2606 1.54605 12.6849 1.2562 15.2052C1.23355 15.4011 1.27328 15.5992 1.36974 15.7713C1.46619 15.9433 1.61446 16.0806 1.79343 16.1635C1.97241 16.2464 2.17298 16.2707 2.36659 16.2331C2.56021 16.1954 2.73701 16.0976 2.87183 15.9536C3.7312 15.0388 6.78901 12.1458 11.25 11.8911V14.9997C11.25 15.1233 11.2867 15.2442 11.3555 15.3469C11.4242 15.4497 11.5218 15.5297 11.6361 15.577C11.7503 15.6242 11.876 15.6365 11.9972 15.6123C12.1184 15.5882 12.2298 15.5286 12.3171 15.4411L18.5671 9.19112C18.684 9.07395 18.7497 8.91521 18.7497 8.74971C18.7497 8.58421 18.684 8.42547 18.5671 8.3083ZM12.5 13.4911V11.2497C12.5 11.084 12.4341 10.925 12.3169 10.8078C12.1997 10.6906 12.0407 10.6247 11.875 10.6247C9.6812 10.6247 7.54448 11.1974 5.52417 12.3278C4.49522 12.9061 3.53652 13.6014 2.66714 14.3997C3.12026 12.5372 4.26245 10.7661 5.9523 9.33252C7.76636 7.79424 9.98042 6.87471 11.875 6.87471C12.0407 6.87471 12.1997 6.80886 12.3169 6.69165C12.4341 6.57444 12.5 6.41547 12.5 6.24971V4.00909L17.2414 8.74971L12.5 13.4911Z"
                      fill="#24272C"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a href="#" className="icon">
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.7711 5.625H15.625V3.125C15.625 2.95924 15.5592 2.80027 15.4419 2.68306C15.3247 2.56585 15.1658 2.5 15 2.5H5C4.83424 2.5 4.67527 2.56585 4.55806 2.68306C4.44085 2.80027 4.375 2.95924 4.375 3.125V5.625H3.22891C2.1375 5.625 1.25 6.46641 1.25 7.5V13.75C1.25 13.9158 1.31585 14.0747 1.43306 14.1919C1.55027 14.3092 1.70924 14.375 1.875 14.375H4.375V16.875C4.375 17.0408 4.44085 17.1997 4.55806 17.3169C4.67527 17.4342 4.83424 17.5 5 17.5H15C15.1658 17.5 15.3247 17.4342 15.4419 17.3169C15.5592 17.1997 15.625 17.0408 15.625 16.875V14.375H18.125C18.2908 14.375 18.4497 14.3092 18.5669 14.1919C18.6842 14.0747 18.75 13.9158 18.75 13.75V7.5C18.75 6.46641 17.8625 5.625 16.7711 5.625ZM5.625 3.75H14.375V5.625H5.625V3.75ZM14.375 16.25H5.625V12.5H14.375V16.25ZM17.5 13.125H15.625V11.875C15.625 11.7092 15.5592 11.5503 15.4419 11.4331C15.3247 11.3158 15.1658 11.25 15 11.25H5C4.83424 11.25 4.67527 11.3158 4.55806 11.4331C4.44085 11.5503 4.375 11.7092 4.375 11.875V13.125H2.5V7.5C2.5 7.15547 2.82734 6.875 3.22891 6.875H16.7711C17.1727 6.875 17.5 7.15547 17.5 7.5V13.125ZM15.625 9.0625C15.625 9.24792 15.57 9.42918 15.467 9.58335C15.364 9.73752 15.2176 9.85768 15.0463 9.92864C14.875 9.99959 14.6865 10.0182 14.5046 9.98199C14.3227 9.94581 14.1557 9.85652 14.0246 9.72541C13.8935 9.5943 13.8042 9.42725 13.768 9.2454C13.7318 9.06354 13.7504 8.87504 13.8214 8.70373C13.8923 8.53243 14.0125 8.38601 14.1667 8.283C14.3208 8.17998 14.5021 8.125 14.6875 8.125C14.9361 8.125 15.1746 8.22377 15.3504 8.39959C15.5262 8.5754 15.625 8.81386 15.625 9.0625Z"
                      fill="#24272C"
                    />
                  </svg>
                </a>
              </li>
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

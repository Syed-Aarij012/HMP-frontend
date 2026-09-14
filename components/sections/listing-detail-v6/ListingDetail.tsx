import ListingDetailFavoriteCompareActions from "@/components/common/listing-detail/ListingDetailFavoriteCompareActions";
import type { ListingDetailSectionProps } from "@/lib/listing-detail-page";
import ListingDetailV6Gallery from "@/components/sections/listing-detail-v6/ListingDetailV6Gallery";
import ListingDetailScrollspy from "@/components/sections/listing-detail/shared/ListingDetailScrollspy";
import ListingDetailDealerSidebar from "@/components/sections/listing-detail/shared/ListingDetailDealerSidebar";
import {
  LISTING_DETAIL_V6_GALLERY,
  LISTING_DETAIL_V6_SIDE_IMAGE,
} from "@/data/listingDetailV6Gallery";
import { toListingDetailGalleryImages } from "@/lib/listingDetailGalleryImages";

// v6's layout is a main carousel plus one separate "side" showcase image (not part of
// the carousel/lightbox sequence). For a real listing, the last real photo becomes the
// side image and the rest go in the carousel; a single-photo listing reuses it for both.
function resolveV6Gallery(car: ListingDetailSectionProps["car"]) {
  const hasRealImages = Boolean(car.publicId) && car.images && car.images.length > 0;

  if (!hasRealImages) {
    return {
      images: LISTING_DETAIL_V6_GALLERY,
      sideImage: LISTING_DETAIL_V6_SIDE_IMAGE,
    };
  }

  const realImages = car.images as string[];
  const mainSrcs = realImages.length > 1 ? realImages.slice(0, -1) : realImages;
  const sideSrc = realImages[realImages.length - 1];

  return {
    images: toListingDetailGalleryImages(mainSrcs, car.title, 1488, 723),
    sideImage: { src: sideSrc, alt: car.title, width: 660, height: 723 },
  };
}

function ListingDetail({ title, car }: ListingDetailSectionProps) {
  const { images: v6GalleryImages, sideImage: v6SideImage } = resolveV6Gallery(car);

  return (
    <>
      <section className="tf-section3 listing-detail style-2 style-3">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <ListingDetailV6Gallery images={v6GalleryImages} sideImage={v6SideImage} />
              <div className="headings-wrap flex-one gap-20 flex-wrap">
                <div className="headings-widget">
                  <h2 className="title">{title}</h2>
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
                      <span>1032 Km</span>
                    </div>
                    <div className="icons flex-three">
                      <i className="icon-carus-usercheck" />
                      <span>First owner</span>
                    </div>
                    <div className="icons flex-three">
                      <i className="icon-carus-icon9" />
                      <span>Petrol</span>
                    </div>
                  </div>
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
              <div className="heading-widget">
                <div className="money text-color-3 font">$73,000</div>
                <div className="price-wrap">
                  <p className="fs-14 lh-16 text-color-2">
                    Monthly installment payment:{" "}
                    <span className="fs-14 fw-6 font">$4,000</span>
                  </p>
                  <p className="fs-14 lh-16">New car price: $100.000</p>
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="listing-detail-wrap">
                <div className="row">
                  <div className="col-lg-12">
                    <ListingDetailScrollspy car={car} />
                  </div>
                </div>
              </div>
            </div>
            <ListingDetailDealerSidebar detailHref="/listing-detail-v6" car={car} />
          </div>
        </div>
      </section>
    </>
  );
}

export default ListingDetail;

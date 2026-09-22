"use client";

import Image from "@/components/common/AppImage";
import { useMemo, useState } from "react";
import LeaveReplyForm from "@/components/common/LeaveReplyForm";
import { useAuth } from "@/contexts/AuthContext";
import { useListingReviews } from "@/hooks/useListingReviews";
import {
  LISTING_REVIEWS,
  LISTING_REVIEWS_OVERALL_RATING,
  LISTING_REVIEW_TABS,
  type ListingReview,
  type ListingReviewTabId,
} from "@/data/listingReviews";
import type { Car } from "@/types/cars";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="icon-star flex-three">
      {Array.from({ length: rating }, (_, index) => (
        <i key={index} className="icon-carus-star" />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ListingReview }) {
  return (
    <li>
      <div className="comment-list-wrap flex">
        <div className="images flex-none">
          <Image
            src={review.avatar}
            alt={review.author}
            width={90}
            height={90}
          />
        </div>
        <div className="content">
          <div className="flex-two">
            <h5 className="fs-18 fw-5">{review.author}</h5>
            <p className="fs-12 fw-4 lh-16">{review.date}</p>
          </div>
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p className="texts text-color-2">{review.text}</p>
      {review.images?.length ? (
        <div className="flex-three gap-16 flex-wrap mb-16">
          {review.images.map((image) => (
            <Image
              key={image}
              width={141}
              height={79}
              src={image}
              alt="Review attachment"
            />
          ))}
        </div>
      ) : null}
      <div className="flex-three">
        <p className="fs-14 fw-4">Is this review helpful?</p>
        <div className="helpful">
          <a href="#" className="fs-12 fw-4 font-2">
            Yes
          </a>
          <a href="#" className="fs-12 fw-4 font-2">
            No
          </a>
        </div>
      </div>
    </li>
  );
}

type ListingDetailReviewsSectionProps = {
  car: Car;
};

export default function ListingDetailReviewsSection({
  car,
}: ListingDetailReviewsSectionProps) {
  const [activeTab, setActiveTab] = useState<ListingReviewTabId>("all");
  const isRealListing = Boolean(car.publicId);
  const { user } = useAuth();
  const {
    reviews: realReviews,
    averageRating,
    loading,
    error,
    submitReview,
  } = useListingReviews(car.publicId);

  // Mock/demo listings (no publicId) keep showing the existing sample reviews so the
  // demo browsing experience doesn't regress; real listings show their own real reviews
  // (which may be an empty list) fetched by useListingReviews above.
  const reviews = isRealListing ? realReviews : LISTING_REVIEWS;
  const overallRating = isRealListing ? averageRating : LISTING_REVIEWS_OVERALL_RATING;

  const filteredReviews = useMemo(() => {
    if (activeTab === "all") {
      return reviews;
    }

    return reviews.filter((review) => review.categories.includes(activeTab));
  }, [activeTab, reviews]);

  const reviewCountLabel = `${filteredReviews.length} Rating and Reviews`;

  return (
    <div className="listing-reviews flat-property-detail">
      <div className="box-title">
        <h2 className="title-ct">Car User Reviews &amp; Rating</h2>
      </div>
      <div className="widget-rating flex-three mb-30 mt-30">
        <div className="icon-star">
          <i className="icon-carus-star" />
        </div>
        <div className="numbers">{overallRating ?? "–"}</div>
        <div className="content">
          <p className="text-color-2">Overall Rating</p>
          <p className="text-color-2">
            Base on{" "}
            <span className="fw-6">{reviews.length} Reviews</span>
          </p>
        </div>
      </div>
      {isRealListing && error && (
        <p className="text-color-2 mb-30">{error}</p>
      )}
      <div className="flat-tabs mb-60">
        <div className="box-tab style5  center">
          <ul className="menu-tab tab-title flex  ">
            {LISTING_REVIEW_TABS.map((tab) => (
              <li
                key={tab.id}
                className={`item-title style${activeTab === tab.id ? " active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveTab(tab.id);
                  }
                }}
                role="tab"
                aria-selected={activeTab === tab.id}
                tabIndex={0}
              >
                <span className="inner fs-16 fw-5 lh-20">{tab.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="content-tab">
          <div className="content-inner tab-content">
            <div className="wrap-review  pd-0">
              <div className="titles">
                <h4>{reviewCountLabel}</h4>
              </div>
              <div className="comment-list">
                {isRealListing && loading ? (
                  <p className="text-color-2 mb-30">Loading reviews…</p>
                ) : filteredReviews.length > 0 ? (
                  <ol className="mb-30">
                    {filteredReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </ol>
                ) : (
                  <p className="text-color-2 mb-30">
                    No reviews found for this category.
                  </p>
                )}
                <a className="link-btn flex-three" href="#">
                  <span>View more reviews</span>
                  <i className="icon-carus-chev-up" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LeaveReplyForm
        onSubmit={isRealListing && user ? submitReview : undefined}
        disabledMessage={
          isRealListing && !user ? "Please log in to leave a review." : undefined
        }
      />
    </div>
  );
}

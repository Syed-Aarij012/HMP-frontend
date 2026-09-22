"use client";

import Pagination from "@/components/common/Pagination";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import Image from "@/components/common/AppImage";
import { useMemo, useState } from "react";
import { useMyReviews, type MyReview } from "@/hooks/useMyReviews";
import { useReceivedReviews } from "@/hooks/useReceivedReviews";

const REVIEWS_PER_PAGE = 5;

function StarRatingReview({ rating }: { rating: number }) {
  return (
    <div className="star-rating-review">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`star disabled-click icon-carus-star${
            star <= rating ? " active" : ""
          }`}
          data-rating={star}
        />
      ))}
    </div>
  );
}

function ReviewItem({ review }: { review: MyReview }) {
  return (
    <li className="comment-by-user">
      <div className="group-author">
        <Image
          loading="lazy"
          className="avatar"
          width={56}
          height={56}
          src={review.avatar}
          alt={review.author}
        />
        <div className="group-name">
          <div className="review-name">
            <b>{review.author}</b>
            <span className="review-date">{review.date}</span>
          </div>
          <div className="rating-wrap">
            <div className="form-group">
              <StarRatingReview rating={review.rating} />
            </div>
          </div>
        </div>
      </div>
      <div className="content">
        {review.listingTitle && (
          <p className="mb-1">
            <b>Review for:</b> {review.listingTitle}
          </p>
        )}
        <p>{review.text || "No comment left for this review."}</p>
      </div>
    </li>
  );
}

function ReviewList({
  reviews,
  loading,
  error,
  emptyMessage,
}: {
  reviews: MyReview[];
  loading: boolean;
  error: string | null;
  emptyMessage: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    return reviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [reviews, currentPage]);

  if (loading) {
    return <p className="tfcl-empty-data">Loading reviews...</p>;
  }

  if (error) {
    return <p className="tfcl-empty-data">{error}</p>;
  }

  if (reviews.length === 0) {
    return <p className="tfcl-empty-data">{emptyMessage}</p>;
  }

  return (
    <>
      <ul>
        {paginatedReviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </ul>
      {totalPages > 1 && (
        <Pagination
          variant="tfcl"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
}

function Dashboard() {
  const received = useReceivedReviews();
  const written = useMyReviews();

  return (
    <>
      <div id="themesflat-content">
        <DashboardToggle />
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="content-area">
                <main id="main" className="main-content">
                  <div className="tfcl-dashboard">
                    <h1 className="admin-title mb-3">Reviews on my listings</h1>
                    <div className="tfcl-dashboard-middle-right mb-4">
                      <div className="tfcl-card tfcl-dashboard-reviews">
                        <ReviewList
                          reviews={received.reviews}
                          loading={received.loading}
                          error={received.error}
                          emptyMessage="No one has reviewed your listings yet."
                        />
                      </div>
                    </div>

                    <h1 className="admin-title mb-3">Reviews I&apos;ve written</h1>
                    <div className="tfcl-dashboard-middle-right">
                      <div className="tfcl-card tfcl-dashboard-reviews">
                        <ReviewList
                          reviews={written.reviews}
                          loading={written.loading}
                          error={written.error}
                          emptyMessage="You haven't left any reviews yet."
                        />
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;

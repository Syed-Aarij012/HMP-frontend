"use client";

import Pagination from "@/components/common/Pagination";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useMyReviews, type MyReview } from "@/hooks/useMyReviews";

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

function Dashboard() {
  const { reviews, loading, error } = useMyReviews();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    return reviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [reviews, currentPage]);

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
                    <h1 className="admin-title mb-3">All review</h1>
                    <div className="tfcl-dashboard-middle-right">
                      <div className="tfcl-card tfcl-dashboard-reviews">
                        {loading ? (
                          <p className="tfcl-empty-data">
                            Loading your reviews...
                          </p>
                        ) : error ? (
                          <p className="tfcl-empty-data">{error}</p>
                        ) : reviews.length === 0 ? (
                          <p className="tfcl-empty-data">
                            You haven&apos;t left any reviews yet.
                          </p>
                        ) : (
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
                        )}
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

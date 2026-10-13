"use client";

import Image from "@/components/common/AppImage";
import { useMemo, useState } from "react";
import { useMyReviews, type MyReview } from "@/hooks/useMyReviews";
import { useReceivedReviews } from "@/hooks/useReceivedReviews";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, EmptyState, ErrorNotice, LoadingRows, Pager } from "@/components/ui/kit";

const REVIEWS_PER_PAGE = 5;

function StarRatingReview({ rating }: { rating: number }) {
  return (
    <span className="ha-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={`icon-carus-star${star <= rating ? " is-on" : ""}`} aria-hidden="true" />
      ))}
    </span>
  );
}

function ReviewItem({ review }: { review: MyReview }) {
  return (
    <li className="ha-review">
      <Image loading="lazy" className="ha-review-avatar" width={40} height={40} src={review.avatar} alt="" />
      <div className="ha-review-body">
        <div className="ha-review-head">
          <b>{review.author}</b>
          <StarRatingReview rating={review.rating} />
          <span className="ha-sub">{review.date}</span>
        </div>
        {review.listingTitle && <div className="ha-sub">Review for {review.listingTitle}</div>}
        <p>{review.text || <span className="ha-muted">No comment left for this review.</span>}</p>
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
    return <LoadingRows rows={3} label="Loading reviews" />;
  }

  if (error) {
    return <ErrorNotice message={error} />;
  }

  if (reviews.length === 0) {
    return <EmptyState icon="icon-carus-chatcircledots" title="No reviews yet" text={emptyMessage} />;
  }

  return (
    <>
      <ul className="ha-review-list">
        {paginatedReviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </ul>
      {totalPages > 1 && <Pager page={currentPage} lastPage={totalPages} total={reviews.length} onChange={setCurrentPage} />}
    </>
  );
}

function Dashboard() {
  const received = useReceivedReviews();
  const written = useMyReviews();

  return (
    <DashboardPage title="Reviews" description="What buyers say about your listings, and the reviews you've written.">
      <Card className="mb-4" title="Reviews on my listings">
        <ReviewList
          reviews={received.reviews}
          loading={received.loading}
          error={received.error}
          emptyMessage="No one has reviewed your listings yet."
        />
      </Card>

      <Card title="Reviews I've written">
        <ReviewList
          reviews={written.reviews}
          loading={written.loading}
          error={written.error}
          emptyMessage="You haven't left any reviews yet."
        />
      </Card>
    </DashboardPage>
  );
}

export default Dashboard;

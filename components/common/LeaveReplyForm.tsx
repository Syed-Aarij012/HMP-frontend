"use client";

import { FormEvent, useState } from "react";
import ReviewRatingInput from "@/components/common/ReviewRatingInput";
import { describeApiError } from "@/lib/api-client";

type LeaveReplyFormProps = {
  onSubmit?: (rating: number, comment: string) => Promise<void>;
  disabledMessage?: string;
};

export default function LeaveReplyForm({ onSubmit, disabledMessage }: LeaveReplyFormProps) {
  const [replyRating, setReplyRating] = useState(0);
  const [replyMessage, setReplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReplySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (replyRating === 0) {
      setError("Please choose a star rating.");
      return;
    }

    setError(null);
    setSuccess(false);

    if (!onSubmit) {
      setReplyMessage("");
      setReplyRating(0);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(replyRating, replyMessage.trim());
      setReplyMessage("");
      setReplyRating(0);
      setSuccess(true);
    } catch (err) {
      setError(describeApiError(err, "Could not post your review right now."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wrap-contact wrap-form pd-0">
      <div className="title">
        <h2 className="fs-30 fw-5">Leave a Reply</h2>
        <p>Your email address will not be published</p>
      </div>
      <div id="reviews" className="comments">
        {disabledMessage ? (
          <p className="text-color-2">{disabledMessage}</p>
        ) : (
          <>
            <div className="reating-comment">
              <h6 className="mb-16">Whats your rating?</h6>
              <ReviewRatingInput value={replyRating} onChange={setReplyRating} />
            </div>
            <div className="respond-comment">
              <form
                id="contactform"
                className="comment-form form-submit"
                onSubmit={handleReplySubmit}
              >
                <fieldset className="message-wrap">
                  <label className="fw-5 fs-18">Review</label>
                  <textarea
                    id="comment-message"
                    name="message"
                    rows={4}
                    tabIndex={4}
                    placeholder="Your Message:"
                    aria-required="true"
                    value={replyMessage}
                    disabled={submitting}
                    onChange={(event) => setReplyMessage(event.target.value)}
                  />
                </fieldset>
                {error && <p className="text-danger fs-14 mb-3">{error}</p>}
                {success && <p className="text-success fs-14 mb-3">Review posted.</p>}
                <button className="sc-button" type="submit" disabled={submitting}>
                  <span>{submitting ? "Posting..." : "Post Comment"}</span>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

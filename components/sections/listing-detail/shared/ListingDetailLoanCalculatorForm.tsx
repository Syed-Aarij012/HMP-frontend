"use client";

import { useState, type FormEvent } from "react";
import NiceSelect from "@/components/common/NiceSelect";
import { LISTING_LOAN_PERIOD_OPTIONS } from "@/data/niceSelectOptions";
import { apiFetch, ApiError } from "@/lib/api-client";

type FinanceQuote = {
  apr: string;
  monthly_payment: string;
  total_amount_payable: string;
};

// Same representative-example endpoint as index/LoanCalculatorForm.tsx — see that file's
// docblock for why this quotes Hire Purchase specifically.
const PRODUCT_TYPE = "hp";

function formatCurrency(value: string) {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ListingDetailLoanCalculatorForm() {
  const [totalPrice, setTotalPrice] = useState("");
  const [downPaymentPct, setDownPaymentPct] = useState("");
  const [termMonths, setTermMonths] = useState<number>(12);
  const [quote, setQuote] = useState<FinanceQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const depositAmount =
    (Number(totalPrice) || 0) * ((Number(downPaymentPct) || 0) / 100);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setQuote(null);
    setSubmitting(true);

    try {
      const result = await apiFetch<FinanceQuote>("/finance-quotes", {
        method: "POST",
        auth: false,
        body: {
          product_type: PRODUCT_TYPE,
          cash_price: Number(totalPrice) || 0,
          deposit_amount: depositAmount,
          term_months: termMonths,
        },
      });
      setQuote(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not calculate a quote right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      id="loan-calculator"
      className="comment-form form-submit"
      acceptCharset="utf-8"
      onSubmit={handleSubmit}
    >
      <fieldset className="name-wrap">
        <label className="font-1 fs-14 fw-5">Total Price</label>
        <input
          type="number"
          className="tb-my-input"
          name="total_price"
          placeholder="$"
          value={totalPrice}
          onChange={(e) => setTotalPrice(e.target.value)}
          required
          min={0}
        />
      </fieldset>
      <div className="grid-sw-2">
        <fieldset className="email-wrap style-text">
          <label className="font-1 fs-14 fw-5">Down payment</label>
          <input
            type="number"
            className="tb-my-input"
            name="down_payment"
            placeholder="0%"
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(e.target.value)}
            required
            min={0}
            max={99}
          />
        </fieldset>
        <fieldset className="phone-wrap style-text">
          <label className="font-1 fs-14 fw-5">Terms (Months)</label>
          <NiceSelect
            options={LISTING_LOAN_PERIOD_OPTIONS}
            defaultValue={12}
            className="relative"
            listClassName="style"
            onChange={(value) => setTermMonths(Number(value))}
          />
        </fieldset>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="list-total">
        <ul>
          <li className="flex-three">
            <div className="title-total fs-16 fw-5 lh-20 text-color-2 font">
              Down payment amount
            </div>
            <div className="fs-16 fw-5 lh-20 text-color-2 font">
              {formatCurrency(String(depositAmount))}
            </div>
          </li>
          <li className="flex-three">
            <div className="title-total fs-16 fw-5 lh-20 text-color-2 font">APR</div>
            <div className="fs-16 fw-5 lh-20 text-color-2 font">
              {quote ? `${quote.apr}%` : "-"}
            </div>
          </li>
          <li className="flex-three">
            <div className="title-total fs-16 fw-5 lh-20 text-color-2 font">
              Amount financed
            </div>
            <div className="fs-16 fw-5 lh-20 text-color-2 font">
              {formatCurrency(String((Number(totalPrice) || 0) - depositAmount))}
            </div>
          </li>
          <li className="flex-three">
            <div className="title-total fs-16 fw-5 lh-20 text-color-3 font">
              Monthly payment
            </div>
            <div className="fs-16 fw-5 lh-20 text-color-3 font">
              {quote ? formatCurrency(quote.monthly_payment) : "$0.00"}
            </div>
          </li>
        </ul>
      </div>
      <div className="button-boxs">
        <button className="sc-button" name="submit" type="submit" disabled={submitting}>
          <span>{submitting ? "Calculating..." : "Apply for a loan"}</span>
        </button>
      </div>
    </form>
  );
}

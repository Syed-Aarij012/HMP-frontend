"use client";

import { useState, type FormEvent } from "react";
import NiceSelect from "@/components/common/NiceSelect";
import { LOAN_PERIOD_OPTIONS } from "@/data/niceSelectOptions";
import { apiFetch, ApiError } from "@/lib/api-client";

type FinanceQuote = {
  apr: string;
  monthly_payment: string;
  total_amount_payable: string;
};

// The homepage calculator only ever asks for total price, deposit % and a term — there's no
// product-type picker in this template — so it quotes on Hire Purchase, the one product type
// that doesn't need a balloon/residual-value input the form doesn't collect.
const PRODUCT_TYPE = "hp";

function formatCurrency(value: string) {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function LoanCalculatorForm() {
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
    <form id="loan-calculator" className="comment-form form-submit" onSubmit={handleSubmit}>
      <fieldset className="name-wrap">
        <label className="font-1 fs-14 fw-7">Total Price</label>
        <input
          type="number"
          id="total_price"
          className="tb-my-input format-currency"
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
          <label className="font-1 fs-14 fw-7">Down payment</label>
          <input
            type="number"
            id="down_payment"
            className="tb-my-input format-percent"
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
          <label className="font-1 fs-14 fw-7">Terms (Months)</label>
          <NiceSelect
            options={LOAN_PERIOD_OPTIONS}
            defaultValue={12}
            className="relative"
            listClassName="style"
            id="period-select"
            onChange={(value) => setTermMonths(Number(value))}
          />
        </fieldset>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="list-total">
        <ul>
          <li className="flex-three">
            <div className="title-total fs-16 fw-7 lh-20 text-color-2 font">
              Down payment amount
            </div>
            <div id="res_down_payment" className="fs-16 fw-5 lh-20 text-color-2 font">
              {formatCurrency(String(depositAmount))}
            </div>
          </li>
          <li className="flex-three">
            <div className="title-total fs-16 fw-7 lh-20 text-color-2 font">APR</div>
            <div className="fs-16 fw-5 lh-20 text-color-2 font">
              {quote ? `${quote.apr}%` : "-"}
            </div>
          </li>
          <li className="flex-three">
            <div className="title-total fs-16 fw-7 lh-20 text-color-2 font">
              Amount financed
            </div>
            <div id="res_amount_financed" className="fs-16 fw-5 lh-20 text-color-2 font">
              {formatCurrency(String((Number(totalPrice) || 0) - depositAmount))}
            </div>
          </li>
          <li className="flex-three">
            <div className="title-total fs-16 fw-7 lh-20 text-color-3 font">
              Monthly payment
            </div>
            <div id="res_monthly_payment" className="fs-16 fw-5 lh-20 text-color-3 font">
              {quote ? formatCurrency(quote.monthly_payment) : "$0.00"}
            </div>
          </li>
        </ul>
      </div>
      <div className="button-boxs">
        <button className="sc-button" id="submit-loan" name="submit" type="submit" disabled={submitting}>
          <span>{submitting ? "Calculating..." : "Calculate"}</span>
        </button>
      </div>
    </form>
  );
}

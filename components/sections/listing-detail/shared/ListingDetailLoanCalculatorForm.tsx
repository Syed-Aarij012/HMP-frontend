"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import NiceSelect, { type NiceSelectOption } from "@/components/common/NiceSelect";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { Car } from "@/types/cars";

type ProductType = "hp" | "pcp" | "pch";

const PRODUCT_OPTIONS: NiceSelectOption[] = [
  { label: "Hire Purchase (HP)", value: "hp" },
  { label: "PCP", value: "pcp" },
  { label: "Personal Contract Hire (PCH)", value: "pch" },
];

type RateCardProduct = { apr: string; terms: number[] | null };
type RateCard = { version_label: string; products: Record<string, RateCardProduct> };

type Illustration = {
  apr: string;
  amount_of_credit: string;
  monthly_payment: string;
  balloon_amount: string;
  total_amount_payable: string;
  representative_example: string;
};

const FALLBACK_TERMS = [24, 36, 48];

function formatCurrency(value: string | number) {
  return `£${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * FR-E-040: the interactive HP/PCP/PCH calculator embedded on this specific listing's
 * detail page — cash price is fixed to the listing's own price (not re-enterable, unlike
 * the generic homepage estimator in sections/index/LoanCalculatorForm.tsx), and every
 * figure, including the representative-example disclosure text, comes straight from
 * GET/POST against the backend's centrally versioned rate card — never computed here, so
 * the figures can never drift from what the finance application flow itself would show.
 */
export default function ListingDetailLoanCalculatorForm({ car }: { car: Car }) {
  const [rateCard, setRateCard] = useState<RateCard | null>(null);
  const [product, setProduct] = useState<ProductType>("hp");
  const [depositPct, setDepositPct] = useState("10");
  const [termMonths, setTermMonths] = useState<number>(36);
  const [quote, setQuote] = useState<Illustration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      apiFetch<{ data: RateCard }>("/finance-rate-card", { auth: false })
        .then((response) => setRateCard(response.data))
        .catch(() => undefined);
    });
  }, []);

  const terms = useMemo(() => rateCard?.products[product]?.terms ?? FALLBACK_TERMS, [rateCard, product]);
  const termOptions: NiceSelectOption[] = terms.map((months) => ({ label: `${months} months`, value: months }));
  const depositAmount = car.price * ((Number(depositPct) || 0) / 100);

  // The term NiceSelect visually resets to its new defaultValue whenever `product` changes
  // (via its `key={product}` below), but that's display-only — it never calls onChange on
  // mount, so termMonths itself has to be kept in sync here or a stale term from the
  // previous product (not necessarily valid for the new one) would silently get submitted.
  useEffect(() => {
    queueMicrotask(() => {
      setTermMonths((current) => (terms.includes(current) ? current : terms[Math.min(1, terms.length - 1)]));
    });
  }, [terms]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!car.publicId) return;
    setError(null);
    setQuote(null);
    setSubmitting(true);

    try {
      const response = await apiFetch<{ data: Illustration }>(`/listings/${car.publicId}/finance-illustration`, {
        method: "POST",
        auth: false,
        body: {
          product_type: product,
          deposit_amount: depositAmount,
          term_months: termMonths,
        },
      });
      setQuote(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not calculate a quote right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form id="loan-calculator" className="comment-form form-submit" acceptCharset="utf-8" onSubmit={handleSubmit}>
      <div className="grid-sw-2">
        <fieldset className="name-wrap">
          <label className="font-1 fs-14 fw-5">Cash price</label>
          <input type="text" className="tb-my-input" value={formatCurrency(car.price)} disabled readOnly />
        </fieldset>
        <fieldset className="email-wrap style-text">
          <label className="font-1 fs-14 fw-5">Finance type</label>
          <NiceSelect
            options={PRODUCT_OPTIONS}
            defaultValue="hp"
            className="relative"
            listClassName="style"
            onChange={(value) => {
              setProduct(value as ProductType);
              setQuote(null);
            }}
          />
        </fieldset>
      </div>
      <div className="grid-sw-2">
        <fieldset className="email-wrap style-text">
          <label className="font-1 fs-14 fw-5">Deposit</label>
          <input
            type="number"
            className="tb-my-input"
            name="down_payment"
            placeholder="0%"
            value={depositPct}
            onChange={(e) => setDepositPct(e.target.value)}
            required
            min={0}
            max={99}
          />
        </fieldset>
        <fieldset className="phone-wrap style-text">
          <label className="font-1 fs-14 fw-5">Term</label>
          <NiceSelect
            key={product}
            options={termOptions}
            defaultValue={termOptions[1]?.value ?? termOptions[0]?.value}
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
            <div className="title-total fs-16 fw-5 lh-20 text-color-2 font">Deposit amount</div>
            <div className="fs-16 fw-5 lh-20 text-color-2 font">{formatCurrency(depositAmount)}</div>
          </li>
          <li className="flex-three">
            <div className="title-total fs-16 fw-5 lh-20 text-color-2 font">APR representative</div>
            <div className="fs-16 fw-5 lh-20 text-color-2 font">{quote ? `${quote.apr}%` : "-"}</div>
          </li>
          <li className="flex-three">
            <div className="title-total fs-16 fw-5 lh-20 text-color-2 font">Amount financed</div>
            <div className="fs-16 fw-5 lh-20 text-color-2 font">{quote ? formatCurrency(quote.amount_of_credit) : "-"}</div>
          </li>
          <li className="flex-three">
            <div className="title-total fs-16 fw-5 lh-20 text-color-3 font">Monthly payment</div>
            <div className="fs-16 fw-5 lh-20 text-color-3 font">{quote ? formatCurrency(quote.monthly_payment) : "-"}</div>
          </li>
          {product !== "hp" && (
            <li className="flex-three">
              <div className="title-total fs-16 fw-5 lh-20 text-color-2 font">
                {product === "pcp" ? "Optional final payment" : "Never paid (PCH)"}
              </div>
              <div className="fs-16 fw-5 lh-20 text-color-2 font">{quote ? formatCurrency(quote.balloon_amount) : "-"}</div>
            </li>
          )}
          <li className="flex-three">
            <div className="title-total fs-16 fw-5 lh-20 text-color-2 font">Total amount payable</div>
            <div className="fs-16 fw-5 lh-20 text-color-2 font">{quote ? formatCurrency(quote.total_amount_payable) : "-"}</div>
          </li>
        </ul>
      </div>

      {quote && <p className="fs-13 text-color-2 mt-2">{quote.representative_example}</p>}

      <div className="button-boxs">
        <button className="sc-button" name="submit" type="submit" disabled={submitting}>
          <span>{submitting ? "Calculating..." : "Get my quote"}</span>
        </button>
      </div>
    </form>
  );
}

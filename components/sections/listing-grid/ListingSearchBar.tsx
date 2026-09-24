"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import {
  LISTING_SORTS,
  type ListingSearchParams,
  type SearchInterpretation,
} from "@/hooks/useSearchListings";

type Props = {
  params: ListingSearchParams;
  interpretation: SearchInterpretation | null;
  locationArea: string | null;
  searchError: string | null;
  onChange: (params: ListingSearchParams) => void;
};

/**
 * Search box for the listing grid: free text ("blue automatic golf under 15k"), postcode +
 * radius (FR-B-003), monthly budget (FR-B-004) and sort — plus a line showing how the server
 * read the query, with any typo/synonym corrections it applied (FR-B-006).
 */
export default function ListingSearchBar({ params, interpretation, locationArea, searchError, onChange }: Props) {
  const [draft, setDraft] = useState(params);
  const { user } = useAuth();
  const { save } = useSavedSearches();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function saveSearch() {
    const query: Record<string, unknown> = {};
    if (draft.query.trim()) query.q = draft.query.trim();
    const failure = await save(query);
    setSaveMessage(failure ?? "Saved. Manage alerts under Saved searches.");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onChange(draft);
  }

  const set = <K extends keyof ListingSearchParams>(key: K, value: ListingSearchParams[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const chips =
    interpretation?.mode === "text"
      ? Object.entries(interpretation.filters).map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
      : [];
  const corrections = interpretation ? Object.entries(interpretation.corrections) : [];

  return (
    <div className="container mb-3">
      <form onSubmit={submit}>
        <div className="flex gap-10 align-center" style={{ flexWrap: "wrap" }}>
          <input
            type="search"
            className="form-control"
            style={{ flex: "1 1 320px" }}
            placeholder="Try: blue automatic golf under 15k, or a number plate"
            value={draft.query}
            onChange={(e) => set("query", e.target.value)}
            aria-label="Search vehicles"
          />
          <button type="submit" className="sc-button">
            <span>Search</span>
          </button>
          {user && (
            <button type="button" className="sc-button" onClick={saveSearch}>
              <span>Save this search</span>
            </button>
          )}
          <select
            className="form-control"
            style={{ flex: "0 0 220px" }}
            value={draft.sort}
            onChange={(e) => {
              set("sort", e.target.value);
              onChange({ ...draft, sort: e.target.value });
            }}
            aria-label="Sort listings"
          >
            {LISTING_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-10 align-center mt-2" style={{ flexWrap: "wrap" }}>
          <input
            type="text"
            className="form-control"
            style={{ flex: "0 0 150px" }}
            placeholder="Postcode e.g. LS1"
            value={draft.postcode}
            onChange={(e) => set("postcode", e.target.value)}
            aria-label="Postcode"
          />
          <select
            className="form-control"
            style={{ flex: "0 0 130px" }}
            value={draft.radius}
            onChange={(e) => set("radius", Number(e.target.value))}
            aria-label="Search radius"
          >
            {[10, 20, 30, 50, 100, 200].map((miles) => (
              <option key={miles} value={miles}>
                Within {miles} mi
              </option>
            ))}
          </select>

          <input
            type="number"
            min={0}
            className="form-control"
            style={{ flex: "0 0 150px" }}
            placeholder="Max £ / month"
            value={draft.monthlyMax}
            onChange={(e) => set("monthlyMax", e.target.value)}
            aria-label="Maximum monthly payment"
          />
          <input
            type="number"
            min={0}
            className="form-control"
            style={{ flex: "0 0 130px" }}
            placeholder="Deposit £"
            value={draft.deposit}
            onChange={(e) => set("deposit", e.target.value)}
            aria-label="Deposit"
          />
          <select
            className="form-control"
            style={{ flex: "0 0 120px" }}
            value={draft.term}
            onChange={(e) => set("term", Number(e.target.value))}
            aria-label="Finance term"
          >
            {[24, 36, 48, 60].map((months) => (
              <option key={months} value={months}>
                {months} months
              </option>
            ))}
          </select>
          <select
            className="form-control"
            style={{ flex: "0 0 100px" }}
            value={draft.product}
            onChange={(e) => set("product", e.target.value as "pcp" | "hp")}
            aria-label="Finance product"
          >
            <option value="pcp">PCP</option>
            <option value="hp">HP</option>
          </select>
        </div>
      </form>

      {saveMessage && <p className="text-color-1 mt-2">{saveMessage}</p>}
      {searchError && <div className="alert alert-warning mt-2">{searchError}</div>}

      {(chips.length > 0 || corrections.length > 0 || locationArea) && (
        <p className="text-color-1 mt-2">
          {chips.length > 0 && <>Understood as {chips.join(", ")}. </>}
          {corrections.map(([from, to]) => (
            <span key={from}>
              Showing results for <b>{to}</b> (searched: {from}).{" "}
            </span>
          ))}
          {locationArea && (
            <>
              Near <b>{locationArea}</b> (approximate, by postcode area).
            </>
          )}
        </p>
      )}
    </div>
  );
}

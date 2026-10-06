"use client";

import { useState, type FormEvent } from "react";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { describeApiError } from "@/lib/api-client";

export type AccountType = "private_buyer" | "private_seller" | "trade_buyer" | "dealer";

/** The accounts anyone can open themselves (SRS §2.2 P1–P4); staff accounts are created by HMP. */
export const ACCOUNT_TYPES: { value: AccountType; title: string; text: string; points: string[] }[] = [
  {
    value: "private_buyer",
    title: "I'm buying a car",
    text: "Private buyer",
    points: ["Save cars and searches", "Message sellers, make offers", "Buy online, book test drives"],
  },
  {
    value: "private_seller",
    title: "I'm selling my car",
    text: "Private seller",
    points: ["List your car with a VRM lookup", "Answer messages and offers", "Or take an instant trade offer"],
  },
  {
    value: "trade_buyer",
    title: "I buy for the trade",
    text: "Independent trade buyer",
    points: ["Trade auction catalogue", "Live and proxy bidding", "Trade credit and Buy Now"],
  },
  {
    value: "dealer",
    title: "I run a dealership",
    text: "Franchise or independent dealer",
    points: ["Your own dealer page and stock", "Team, rooftops and leads", "Consign stock to auction"],
  },
];

/**
 * Sign up as any self-service account type — buyer, seller, trade buyer or dealership. Two steps:
 * choose what kind of account, then the details (a dealership also gives its business name and
 * becomes its first Org Admin). `onSignedUp` receives the new user so the caller can send them home.
 */
export default function SignUpForm({ onSignedUp, initialType }: { onSignedUp: (user: AuthUser) => void; initialType?: AccountType }) {
  const { register, registerDealer } = useAuth();
  const [type, setType] = useState<AccountType | null>(initialType ?? null);
  const [form, setForm] = useState({ organization_name: "", name: "", email: "", phone: "", password: "", password_confirmation: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const chosen = ACCOUNT_TYPES.find((option) => option.value === type);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!type) return;
    setBusy(true);
    setError(null);
    const common = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password,
      password_confirmation: form.password_confirmation,
    };
    try {
      const user = type === "dealer"
        ? await registerDealer({ ...common, organization_name: form.organization_name.trim() })
        : await register({ ...common, user_type: type });
      onSignedUp(user);
    } catch (err) {
      setError(describeApiError(err, "We couldn't create your account. Please check the details."));
    } finally {
      setBusy(false);
    }
  }

  if (!type) {
    return (
      <div>
        <p className="text-color-1 mb-3">What would you like to do on HMP?</p>
        <div className="hmp-auth-types">
          {ACCOUNT_TYPES.map((option) => (
            <button key={option.value} type="button" className="hmp-auth-type" onClick={() => setType(option.value)}>
              <span className="hmp-auth-type-title">{option.title}</span>
              <span className="hmp-auth-type-text">{option.text}</span>
              <ul>
                {option.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </button>
          ))}
        </div>
        <p className="fs-13 text-color-1 mt-3 mb-0">
          HMP staff (auctioneers, inspectors, support and admins) don&apos;t sign up here — your account is created for you. Just sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="hmp-auth-form" noValidate>
      <div className="hmp-auth-chosen mb-3">
        <div>
          <div className="fw-bold">{chosen?.title}</div>
          <div className="fs-13 text-color-1">{chosen?.text}</div>
        </div>
        <button type="button" className="hmp-auth-link" onClick={() => setType(null)}>Change</button>
      </div>

      {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

      {type === "dealer" && (
        <>
          <label className="hmp-auth-label" htmlFor="signup-org">Dealership name</label>
          <input id="signup-org" className="form-control mb-3" placeholder="e.g. Riverside Motors" value={form.organization_name} onChange={set("organization_name")} required />
        </>
      )}

      <label className="hmp-auth-label" htmlFor="signup-name">{type === "dealer" ? "Your full name" : "Full name"}</label>
      <input id="signup-name" className="form-control mb-3" placeholder="e.g. Sam Smith" value={form.name} onChange={set("name")} autoComplete="name" required />

      <div className="row">
        <div className="col-md-7">
          <label className="hmp-auth-label" htmlFor="signup-email">Email address</label>
          <input id="signup-email" type="email" className="form-control mb-3" placeholder="you@example.com" value={form.email} onChange={set("email")} autoComplete="email" suppressHydrationWarning required />
        </div>
        <div className="col-md-5">
          <label className="hmp-auth-label" htmlFor="signup-phone">Phone (optional)</label>
          <input id="signup-phone" type="tel" className="form-control mb-3" placeholder="07700 900000" value={form.phone} onChange={set("phone")} autoComplete="tel" />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <label className="hmp-auth-label" htmlFor="signup-password">Password</label>
          <div className="hmp-auth-password mb-3">
            <input id="signup-password" type={show ? "text" : "password"} className="form-control" value={form.password} onChange={set("password")} autoComplete="new-password" required />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
          </div>
        </div>
        <div className="col-md-6">
          <label className="hmp-auth-label" htmlFor="signup-confirm">Confirm password</label>
          <input id="signup-confirm" type={show ? "text" : "password"} className="form-control mb-1" value={form.password_confirmation} onChange={set("password_confirmation")} autoComplete="new-password" required />
          {form.password_confirmation !== "" && form.password !== form.password_confirmation && <div className="fs-13 text-danger mb-2">Passwords don&apos;t match.</div>}
        </div>
      </div>
      <p className="fs-13 text-color-1">At least 8 characters.</p>

      <button
        type="submit"
        className="sc-button w-100"
        disabled={busy || !form.name || !form.email || !form.password || form.password !== form.password_confirmation || (type === "dealer" && !form.organization_name)}
      >
        <span>{busy ? "Creating your account..." : type === "dealer" ? "Create dealership account" : "Create account"}</span>
      </button>
    </form>
  );
}

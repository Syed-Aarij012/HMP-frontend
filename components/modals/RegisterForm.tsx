"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { describeApiError } from "@/lib/api-client";

const USER_TYPE_OPTIONS: Array<{
  value: "private_buyer" | "private_seller" | "trade_buyer";
  label: string;
}> = [
  { value: "private_buyer", label: "I'm buying" },
  { value: "private_seller", label: "I'm selling my car" },
  { value: "trade_buyer", label: "I'm a trade buyer" },
];

function closeModal(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  void import("bootstrap/js/dist/modal").then(({ default: Modal }) => {
    Modal.getOrCreateInstance(element).hide();
  });
}

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [userType, setUserType] = useState<
    "private_buyer" | "private_seller" | "trade_buyer"
  >("private_buyer");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name,
        email,
        phone: phone.trim() ? phone.trim() : undefined,
        password,
        password_confirmation: passwordConfirmation,
        user_type: userType,
      });
      closeModal("popup_bid2");
      router.push("/dashboard");
    } catch (err) {
      setError(describeApiError(err, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="comment-form form-submit"
      onSubmit={handleSubmit}
    >
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <fieldset className="t">
        <label className="fw-6">Full name</label>
        <input
          type="text"
          className="tb-my-input"
          name="name"
          placeholder="e.g john doe"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </fieldset>
      <fieldset className="t">
        <label className="fw-6">Email address</label>
        <input
          type="email"
          className="tb-my-input"
          name="email"
          // See ForgotPassForm.tsx: some browser extensions inject attributes into every
          // email input before hydration — a real, expected, harmless mismatch.
          suppressHydrationWarning
          placeholder="e.g john doe"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </fieldset>
      <fieldset className="t">
        <label className="fw-6">Phone number (optional)</label>
        <input
          type="tel"
          className="tb-my-input"
          name="phone"
          placeholder="e.g 07700 900000"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </fieldset>

      <fieldset className="t">
        <label className="fw-6">I&apos;m registering as</label>
        <div className="flex gap-30 flex-wrap">
          {USER_TYPE_OPTIONS.map((option) => (
            <span key={option.value} className="flex-three fw-6 mb-0">
              <input
                type="radio"
                id={`user_type_${option.value}`}
                name="user_type"
                checked={userType === option.value}
                onChange={() => setUserType(option.value)}
              />
              <label htmlFor={`user_type_${option.value}`} className="text-p font-2">
                {option.label}
              </label>
            </span>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-30">
        <fieldset className="w-50">
          <label className="fw-6">Password</label>
          <input
            id="password-field"
            type="password"
            className="input-form password-input"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </fieldset>
        <fieldset className="w-50">
          <label className="fw-6">Confirm password</label>
          <input
            id="password-field1"
            type="password"
            className="input-form password-input"
            placeholder="Confirm password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />
        </fieldset>
      </div>
      <button className="sc-button" type="submit" disabled={submitting}>
        <span>{submitting ? "Signing up..." : "Sign Up"}</span>
      </button>
    </form>
  );
}

"use client";

import { useCallback, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * NFR-S-005 self-service TOTP enrollment — the flow a trade_buyer (or any account) needs to
 * complete before a bid at/above the step-up threshold (see useStepUp) can succeed, and
 * before EnsureTwoFactorIsEnabled would otherwise block an enforced role entirely.
 */
export function useTwoFactor() {
  const { user, refreshUser } = useAuth();
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEnabled = Boolean(user?.mfa_enabled);

  const start = useCallback(async (currentPassword: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/user/two-factor-authentication", {
        method: "POST",
        body: { current_password: currentPassword },
      });
      const qr = await apiFetch<{ svg: string; url: string }>("/user/two-factor-qr-code");
      setQrSvg(qr.svg);
    } catch (err) {
      setError(describeApiError(err, "Could not start two-factor enrollment right now."));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const confirm = useCallback(
    async (code: string) => {
      setError(null);
      setSubmitting(true);
      try {
        const result = await apiFetch<{ recovery_codes: string[] }>("/user/confirmed-two-factor-authentication", {
          method: "POST",
          body: { code },
        });
        setRecoveryCodes(result.recovery_codes);
        setQrSvg(null);
        await refreshUser();
      } catch (err) {
        setError(describeApiError(err, "That code didn't match. Try again."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshUser]
  );

  const disable = useCallback(
    async (currentPassword: string) => {
      setError(null);
      setSubmitting(true);
      try {
        await apiFetch("/user/two-factor-authentication", {
          method: "DELETE",
          body: { current_password: currentPassword },
        });
        setRecoveryCodes(null);
        await refreshUser();
      } catch (err) {
        setError(describeApiError(err, "Could not disable two-factor authentication right now."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshUser]
  );

  return { isEnabled, qrSvg, recoveryCodes, submitting, error, start, confirm, disable };
}

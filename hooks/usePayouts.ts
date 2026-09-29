"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import {
  mapApiBankAccount,
  mapApiPayout,
  mapApiPayoutBalance,
  type ApiBankAccount,
  type ApiPayout,
  type ApiPayoutBalance,
} from "@/lib/mapApiPayouts";
import type { BankAccount, Payout, PayoutBalance } from "@/types/payouts";

type ApiListResponse<T> = { data: T[] };

/**
 * FR-E-013: the signed-in seller's own bank accounts, or their org's — the same set
 * BankAccountController::mine() returns. Adding an account is self-service; verifying one
 * is not (finance_ops only), so a freshly added account sits at "unverified" until reviewed.
 */
export function useBankAccounts() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ApiListResponse<ApiBankAccount>>("/my-bank-accounts")
      .then((response) => {
        setBankAccounts(response.data.map(mapApiBankAccount));
        setError(null);
      })
      .catch(() => setError("Could not load your bank accounts from the server."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const addBankAccount = useCallback(
    async (accountName: string, sortCode: string, accountNumber: string): Promise<boolean> => {
      setAdding(true);
      setAddError(null);
      try {
        await apiFetch("/bank-accounts", {
          method: "POST",
          body: { account_name: accountName, sort_code: sortCode, account_number: accountNumber },
        });
        load();
        return true;
      } catch (err) {
        setAddError(describeApiError(err, "Could not add this bank account."));
        return false;
      } finally {
        setAdding(false);
      }
    },
    [load],
  );

  return { bankAccounts, loading, error, addBankAccount, adding, addError, reload: load };
}

/**
 * FR-E-013: the signed-in seller's own payout history, or their org's, plus requesting a new
 * one — the same self-service path StorePayoutRequest now authorizes for a bank account's
 * owner, still subject to the balance/verification/Confirmation-of-Payee/fraud-review checks
 * PayoutService enforces server-side.
 */
export function usePayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ApiListResponse<ApiPayout>>("/my-payouts")
      .then((response) => {
        setPayouts(response.data.map(mapApiPayout));
        setError(null);
      })
      .catch(() => setError("Could not load your payouts from the server."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const requestPayout = useCallback(
    async (bankAccountId: number, amount: string): Promise<boolean> => {
      setRequesting(true);
      setRequestError(null);
      try {
        await apiFetch(`/bank-accounts/${bankAccountId}/payouts`, {
          method: "POST",
          body: { amount },
        });
        load();
        return true;
      } catch (err) {
        setRequestError(describeApiError(err, "Could not request this payout."));
        return false;
      } finally {
        setRequesting(false);
      }
    },
    [load],
  );

  return { payouts, loading, error, requestPayout, requesting, requestError, reload: load };
}

/** FR-E-013: what the seller is currently owed and could request as a payout right now. */
export function usePayoutBalance() {
  const [balance, setBalance] = useState<PayoutBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<{ data: ApiPayoutBalance }>("/my-payout-balance")
      .then((response) => {
        setBalance(mapApiPayoutBalance(response.data));
        setError(null);
      })
      .catch(() => setError("Could not load your balance from the server."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return { balance, loading, error, reload: load };
}

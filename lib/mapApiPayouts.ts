import type { BankAccount, Payout, PayoutBalance } from "@/types/payouts";

export type ApiBankAccount = {
  id: number;
  account_name: string;
  account_number_last_4: string;
  verification_status: BankAccount["verificationStatus"];
  is_default: boolean;
};

export function mapApiBankAccount(api: ApiBankAccount): BankAccount {
  return {
    id: api.id,
    accountName: api.account_name,
    accountNumberLast4: api.account_number_last_4,
    verificationStatus: api.verification_status,
    isDefault: api.is_default,
  };
}

export type ApiPayout = {
  id: number;
  payee_type: Payout["payeeType"];
  payee_id: number;
  amount: string;
  bank_account_id: number;
  status: Payout["status"];
  fraud_review_status: Payout["fraudReviewStatus"];
  sent_at: string | null;
};

export function mapApiPayout(api: ApiPayout): Payout {
  return {
    id: api.id,
    payeeType: api.payee_type,
    amount: Number(api.amount),
    bankAccountId: api.bank_account_id,
    status: api.status,
    fraudReviewStatus: api.fraud_review_status,
    sentAt: api.sent_at,
  };
}

export type ApiPayoutBalance = { amount: string; currency: string };

export function mapApiPayoutBalance(api: ApiPayoutBalance): PayoutBalance {
  return { amount: Number(api.amount), currency: api.currency };
}

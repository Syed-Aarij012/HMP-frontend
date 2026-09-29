// FR-E-013: seller payouts & bank accounts.

export type BankAccount = {
  id: number;
  accountName: string;
  accountNumberLast4: string;
  verificationStatus: "unverified" | "penny_drop" | "open_banking" | "verified";
  isDefault: boolean;
};

export type Payout = {
  id: number;
  payeeType: "user" | "organization";
  amount: number;
  bankAccountId: number;
  status: "pending" | "sent" | "failed";
  fraudReviewStatus: "not_required" | "pending" | "cleared" | "held";
  sentAt: string | null;
};

export type PayoutBalance = {
  amount: number;
  currency: string;
};

"use client";

import { useId, useState, type FormEvent } from "react";
import DashboardPage from "@/components/dashboard/DashboardPage";
import {
  Badge,
  Card,
  DataTable,
  DataToolbar,
  EmptyState,
  ErrorNotice,
  LoadingRows,
  LoadingTable,
  NoMatches,
  Notice,
  StatCard,
  Stats,
  StatusBadge,
  formatDate,
  formatMoney,
  useListControls,
} from "@/components/ui/kit";
import { useBankAccounts, usePayoutBalance, usePayouts } from "@/hooks/usePayouts";
import type { BankAccount, Payout } from "@/types/payouts";

const VERIFICATION_LABELS: Record<BankAccount["verificationStatus"], string> = {
  unverified: "Awaiting verification",
  penny_drop: "Verified (penny drop)",
  open_banking: "Verified (open banking)",
  verified: "Verified",
};

function AddBankAccountForm({
  onAdd,
  adding,
  addError,
}: {
  onAdd: (accountName: string, sortCode: string, accountNumber: string) => Promise<boolean>;
  adding: boolean;
  addError: string | null;
}) {
  const [accountName, setAccountName] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const fieldId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const ok = await onAdd(accountName, sortCode, accountNumber);
    if (ok) {
      setAccountName("");
      setSortCode("");
      setAccountNumber("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ha-card-body" aria-labelledby={`${fieldId}-title`} style={{ borderTop: "1px solid var(--hmp-border)" }}>
      <h3 id={`${fieldId}-title`} className="ha-primary-text mb-3" style={{ fontSize: 14 }}>
        Add a bank account
      </h3>
      {addError && <Notice tone="danger">{addError}</Notice>}
      <div className="ha-form-grid">
        <div className="ha-field">
          <label htmlFor={`${fieldId}-name`}>Account name</label>
          <input
            id={`${fieldId}-name`}
            type="text"
            className="ha-input"
            placeholder="Name on the account"
            autoComplete="name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
        </div>
        <div className="ha-field">
          <label htmlFor={`${fieldId}-sort`}>Sort code</label>
          <input
            id={`${fieldId}-sort`}
            type="text"
            inputMode="numeric"
            className="ha-input"
            placeholder="12-34-56"
            value={sortCode}
            onChange={(e) => setSortCode(e.target.value)}
            required
          />
        </div>
        <div className="ha-field">
          <label htmlFor={`${fieldId}-number`}>Account number</label>
          <input
            id={`${fieldId}-number`}
            type="text"
            inputMode="numeric"
            className="ha-input"
            placeholder="12345678"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </div>
      </div>
      <button type="submit" className="ha-btn is-primary" disabled={adding} aria-busy={adding}>
        {adding ? "Adding…" : "Add account"}
      </button>
    </form>
  );
}

function RequestPayoutForm({
  bankAccounts,
  availableAmount,
  onRequest,
  requesting,
  requestError,
}: {
  bankAccounts: BankAccount[];
  availableAmount: number | null;
  onRequest: (bankAccountId: number, amount: string) => Promise<boolean>;
  requesting: boolean;
  requestError: string | null;
}) {
  const verifiedAccounts = bankAccounts.filter((account) => account.verificationStatus !== "unverified");
  const [bankAccountId, setBankAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const fieldId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!bankAccountId) return;
    const ok = await onRequest(Number(bankAccountId), amount);
    if (ok) setAmount("");
  }

  if (bankAccounts.length === 0) {
    return <EmptyState icon="icon-carus-power" title="Add a bank account first" text="Add a bank account before you can request a payout." />;
  }

  if (verifiedAccounts.length === 0) {
    return (
      <EmptyState
        icon="icon-carus-clock"
        title="Awaiting verification"
        text="Your bank account is awaiting verification. Once it's verified you'll be able to request a payout here."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ha-card-body">
      {requestError && <Notice tone="danger">{requestError}</Notice>}
      <div className="ha-field">
        <label htmlFor={`${fieldId}-account`}>Pay into</label>
        <select id={`${fieldId}-account`} className="ha-select" value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} required>
          <option value="">Choose an account…</option>
          {verifiedAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountName} · …{account.accountNumberLast4}
            </option>
          ))}
        </select>
      </div>
      <div className="ha-field">
        <label htmlFor={`${fieldId}-amount`}>Amount (£)</label>
        <input
          id={`${fieldId}-amount`}
          type="number"
          step="0.01"
          min="0.01"
          max={availableAmount ?? undefined}
          className="ha-input"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        {availableAmount !== null && <div className="ha-hint">Up to {formatMoney(availableAmount, { pence: true })} available</div>}
      </div>
      <button type="submit" className="ha-btn is-primary" disabled={requesting || availableAmount === 0} aria-busy={requesting}>
        {requesting ? "Requesting…" : "Request payout"}
      </button>
    </form>
  );
}

export default function Dashboard() {
  const { bankAccounts, loading: accountsLoading, error: accountsError, addBankAccount, adding, addError } = useBankAccounts();
  const { payouts, loading: payoutsLoading, error: payoutsError, requestPayout, requesting, requestError } = usePayouts();
  const { balance, loading: balanceLoading, error: balanceError } = usePayoutBalance();

  const controls = useListControls<Payout>({
    items: payouts,
    filters: [
      { key: "status", label: "Status", get: (payout) => payout.status },
      { key: "review", label: "Fraud review", get: (payout) => payout.fraudReviewStatus },
    ],
    sorts: [
      { value: "recent", label: "Most recent", compare: (a, b) => (b.sentAt ?? "9999").localeCompare(a.sentAt ?? "9999") || b.id - a.id },
      { value: "amount", label: "Largest amount", compare: (a, b) => b.amount - a.amount },
    ],
  });

  return (
    <DashboardPage title="My payouts" description="Add a bank account, track what you're owed, and request a payout.">
      <Stats>
        <StatCard
          label="Available to withdraw"
          icon="icon-carus-power"
          value={balanceLoading ? "—" : balance ? formatMoney(balance.amount, { pence: true }) : "—"}
        />
      </Stats>
      {balanceError && <Notice tone="danger">{balanceError}</Notice>}

      <div className="ha-grid is-2 mb-4" style={{ alignItems: "start" }}>
        <Card title="Request a payout">
          {accountsLoading || balanceLoading ? (
            <LoadingRows rows={3} label="Loading" />
          ) : (
            <RequestPayoutForm
              bankAccounts={bankAccounts}
              availableAmount={balance?.amount ?? null}
              onRequest={requestPayout}
              requesting={requesting}
              requestError={requestError}
            />
          )}
        </Card>

        <Card title="Bank accounts">
          {accountsError && <ErrorNotice message={accountsError} />}
          {accountsLoading && <LoadingRows rows={2} label="Loading bank accounts" />}
          {!accountsLoading && bankAccounts.length > 0 && (
            <DataTable caption="Your bank accounts">
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {bankAccounts.map((account) => (
                  <tr key={account.id}>
                    <td data-label="Account">
                      <div className="ha-primary-text">
                        {account.accountName} {account.isDefault && <Badge tone="primary" plain>Default</Badge>}
                      </div>
                      <div className="ha-sub ha-num">…{account.accountNumberLast4}</div>
                    </td>
                    <td data-label="Status">
                      <Badge tone={account.verificationStatus === "unverified" ? "warning" : "success"}>{VERIFICATION_LABELS[account.verificationStatus]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
          {!accountsLoading && <AddBankAccountForm onAdd={addBankAccount} adding={adding} addError={addError} />}
        </Card>
      </div>

      <Card title="Payout history">
        {payoutsLoading && <LoadingTable label="Loading your payouts" />}
        {payoutsError && <ErrorNotice message={payoutsError} />}
        {!payoutsLoading && !payoutsError && payouts.length === 0 && (
          <EmptyState icon="icon-carus-power" title="No payouts yet" text="Payouts you request will be listed here with their status." />
        )}

        {payouts.length > 0 && (
          <>
            <DataToolbar controls={controls} noun="payout" />
            {controls.results.length === 0 ? (
              <NoMatches onClear={controls.clearAll} />
            ) : (
              <DataTable caption="Payout history">
                <thead>
                  <tr>
                    <th scope="col" className="is-num">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Fraud review</th>
                    <th scope="col">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {controls.results.map((payout) => (
                    <tr key={payout.id}>
                      <td data-label="Amount" className="is-num ha-primary-text">
                        {formatMoney(payout.amount, { pence: true })}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={payout.status} />
                      </td>
                      <td data-label="Fraud review">
                        <StatusBadge status={payout.fraudReviewStatus} tone={payout.fraudReviewStatus === "not_required" ? "neutral" : undefined} />
                      </td>
                      <td data-label="Sent">{payout.sentAt ? formatDate(payout.sentAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </>
        )}
      </Card>
    </DashboardPage>
  );
}

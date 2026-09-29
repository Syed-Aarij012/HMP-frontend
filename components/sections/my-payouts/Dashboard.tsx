"use client";

import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useBankAccounts, usePayoutBalance, usePayouts } from "@/hooks/usePayouts";
import type { BankAccount } from "@/types/payouts";

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
    <form onSubmit={handleSubmit} className="tfcl-card p-3 mb-3">
      <h4 className="mb-2">Add a bank account</h4>
      {addError && <div className="alert alert-danger">{addError}</div>}
      <div className="row">
        <div className="col-md-4 form-group">
          <label>Account name</label>
          <input
            type="text"
            className="form-control"
            placeholder="Name on the account"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
        </div>
        <div className="col-md-4 form-group">
          <label>Sort code</label>
          <input
            type="text"
            className="form-control"
            placeholder="12-34-56"
            value={sortCode}
            onChange={(e) => setSortCode(e.target.value)}
            required
          />
        </div>
        <div className="col-md-4 form-group">
          <label>Account number</label>
          <input
            type="text"
            className="form-control"
            placeholder="12345678"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </div>
      </div>
      <button type="submit" className="sc-button" disabled={adding}>
        <span>{adding ? "Adding..." : "Add account"}</span>
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!bankAccountId) return;
    const ok = await onRequest(Number(bankAccountId), amount);
    if (ok) setAmount("");
  }

  if (bankAccounts.length === 0) {
    return <p className="tfcl-empty-data">Add a bank account before you can request a payout.</p>;
  }

  if (verifiedAccounts.length === 0) {
    return (
      <p className="tfcl-empty-data">
        Your bank account is awaiting verification. Once it&apos;s verified you&apos;ll be able to request a payout here.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="tfcl-card p-3 mb-3">
      <h4 className="mb-2">Request a payout</h4>
      {requestError && <div className="alert alert-danger">{requestError}</div>}
      <div className="row">
        <div className="col-md-6 form-group">
          <label>Pay into</label>
          <select className="form-control" value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} required>
            <option value="">Choose an account...</option>
            {verifiedAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountName} · ...{account.accountNumberLast4}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6 form-group">
          <label>Amount (£)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={availableAmount ?? undefined}
            className="form-control"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>
      <button type="submit" className="sc-button" disabled={requesting || availableAmount === 0}>
        <span>{requesting ? "Requesting..." : "Request payout"}</span>
      </button>
    </form>
  );
}

export default function Dashboard() {
  const { bankAccounts, loading: accountsLoading, error: accountsError, addBankAccount, adding, addError } = useBankAccounts();
  const { payouts, loading: payoutsLoading, error: payoutsError, requestPayout, requesting, requestError } = usePayouts();
  const { balance, loading: balanceLoading, error: balanceError } = usePayoutBalance();

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">My payouts</h1>
                  <p className="text-color-1 mb-3">Add a bank account, track what you&apos;re owed, and request a payout.</p>

                  <div className="tfcl-card p-3 mb-4">
                    <div className="text-color-1 mb-1">Available to withdraw</div>
                    {balanceLoading && <div style={{ fontSize: 28, fontWeight: 600 }}>...</div>}
                    {balanceError && <div className="alert alert-danger">{balanceError}</div>}
                    {balance && <div style={{ fontSize: 28, fontWeight: 600 }}>£{balance.amount.toLocaleString()}</div>}
                  </div>

                  {accountsError && <div className="alert alert-danger">{accountsError}</div>}
                  {!accountsLoading && <AddBankAccountForm onAdd={addBankAccount} adding={adding} addError={addError} />}

                  {!accountsLoading && bankAccounts.length > 0 && (
                    <div className="table-responsive mb-4">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Number</th>
                            <th>Status</th>
                            <th>Default</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bankAccounts.map((account) => (
                            <tr key={account.id}>
                              <td>{account.accountName}</td>
                              <td>...{account.accountNumberLast4}</td>
                              <td>{VERIFICATION_LABELS[account.verificationStatus]}</td>
                              <td>{account.isDefault ? "Yes" : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!accountsLoading && !balanceLoading && (
                    <RequestPayoutForm
                      bankAccounts={bankAccounts}
                      availableAmount={balance?.amount ?? null}
                      onRequest={requestPayout}
                      requesting={requesting}
                      requestError={requestError}
                    />
                  )}

                  <h4 className="mb-2">Payout history</h4>
                  {payoutsLoading && <p>Loading your payouts...</p>}
                  {payoutsError && <div className="alert alert-danger">{payoutsError}</div>}
                  {!payoutsLoading && !payoutsError && payouts.length === 0 && (
                    <p className="tfcl-empty-data">You have no payouts yet.</p>
                  )}

                  {payouts.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Fraud review</th>
                            <th>Sent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payouts.map((payout) => (
                            <tr key={payout.id}>
                              <td>£{payout.amount.toLocaleString()}</td>
                              <td className="text-capitalize">{payout.status}</td>
                              <td className="text-capitalize">{payout.fraudReviewStatus.replace("_", " ")}</td>
                              <td>{payout.sentAt ? new Date(payout.sentAt).toLocaleDateString() : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

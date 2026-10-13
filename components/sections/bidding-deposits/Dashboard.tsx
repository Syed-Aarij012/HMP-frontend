"use client";

import { useState, type FormEvent } from "react";
import { useBiddingDeposits } from "@/hooks/useBiddingDeposits";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, DataTable, EmptyState, ErrorNotice, LoadingTable, Notice, StatusBadge, formatMoney } from "@/components/ui/kit";

function Dashboard() {
  const { deposits, loading, error, actionError, submitting, placeDeposit, refundDeposit } =
    useBiddingDeposits();
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    try {
      await placeDeposit(amount);
      setAmount("");
      setNotice("Deposit placed and held.");
    } catch {
      // actionError already surfaces the reason from the server.
    }
  }

  async function handleRefund(depositId: number) {
    setNotice(null);
    try {
      await refundDeposit(depositId);
      setNotice("Deposit refunded.");
    } catch {
      // actionError already surfaces the reason from the server.
    }
  }

  return (
    <DashboardPage title="Bidding deposits" description="A refundable deposit funds your bidding headroom alongside (or instead of) a trade credit account.">
      {notice && <Notice tone="success">{notice}</Notice>}
      {actionError && <Notice tone="danger">{actionError}</Notice>}

      <div className="ha-grid is-2" style={{ alignItems: "start" }}>
        <Card title="Place a new deposit" description="Held until you ask for it back.">
          <form onSubmit={handleSubmit} className="ha-card-body">
            <div className="ha-field">
              <label htmlFor="deposit-amount">Amount (£)</label>
              <input
                id="deposit-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="ha-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="ha-btn is-primary" disabled={submitting} aria-busy={submitting}>
              {submitting ? "Placing…" : "Place deposit"}
            </button>
          </form>
        </Card>

        <Card title="Your deposits">
          {loading && <LoadingTable label="Loading your deposits" columns={3} rows={3} />}
          {error && <ErrorNotice message={error} />}

          {!loading && !error && deposits.length === 0 && (
            <EmptyState icon="icon-carus-power" title="No deposits yet" text="Deposits you place will be listed here." />
          )}

          {!loading && !error && deposits.length > 0 && (
            <DataTable caption="Your bidding deposits">
              <thead>
                <tr>
                  <th scope="col" className="is-num">Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="ha-visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td data-label="Amount" className="is-num ha-primary-text">
                      {formatMoney(deposit.amount)}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={deposit.status} tone={deposit.status === "held" ? "primary" : undefined} />
                    </td>
                    <td data-label="" className="ha-right">
                      {deposit.status === "held" && (
                        <button type="button" className="ha-btn is-sm" disabled={submitting} onClick={() => handleRefund(deposit.id)}>
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </DashboardPage>
  );
}

export default Dashboard;

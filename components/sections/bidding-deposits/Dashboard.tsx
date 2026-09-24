"use client";

import { useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useBiddingDeposits } from "@/hooks/useBiddingDeposits";

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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Bidding deposits</h1>
                  <p className="text-color-1 mb-3">
                    A refundable deposit funds your bidding headroom alongside (or instead of) a
                    trade credit account.
                  </p>

                  {notice && <div className="alert alert-success mb-3">{notice}</div>}
                  {actionError && <div className="alert alert-danger mb-3">{actionError}</div>}

                  <form onSubmit={handleSubmit} className="tfcl-card mb-4">
                    <h4 className="mb-2">Place a new deposit</h4>
                    <div className="form-group">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control"
                        placeholder="Amount (£)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="sc-button" disabled={submitting}>
                      <span>{submitting ? "Placing..." : "Place deposit"}</span>
                    </button>
                  </form>

                  {loading && <p>Loading your deposits...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {!loading && !error && deposits.length === 0 && (
                    <p className="tfcl-empty-data">You have no bidding deposits yet.</p>
                  )}

                  {!loading && !error && deposits.length > 0 && (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Amount</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {deposits.map((deposit) => (
                            <tr key={deposit.id}>
                              <td>£{deposit.amount.toLocaleString()}</td>
                              <td className="text-capitalize">{deposit.status}</td>
                              <td>
                                {deposit.status === "held" && (
                                  <button
                                    type="button"
                                    className="sc-button"
                                    disabled={submitting}
                                    onClick={() => handleRefund(deposit.id)}
                                  >
                                    <span>Refund</span>
                                  </button>
                                )}
                              </td>
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

export default Dashboard;

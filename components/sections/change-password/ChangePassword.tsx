"use client";

import { useState } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api-client";

function ChangePassword() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== passwordConfirmation) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, password, passwordConfirmation);
      setSuccess(true);
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not change your password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div id="themesflat-content">
        <DashboardToggle />
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="content-area">
                <main id="main" className="main-content">
                  <div className="tfcl-dashboard">
                    <h1 className="admin-title mb-3">Change Password</h1>
                    <div className="tfcl-add-listing profile-inner">
                      <h3>Change passwords</h3>
                      <form className="tfcl-add-listing profile-password" onSubmit={handleSubmit}>
                        {error && <p className="text-danger mb-3">{error}</p>}
                        {success && <p className="text-success mb-3">Password updated.</p>}
                        <div className="form-group">
                          <label htmlFor="current_password">Old password</label>
                          <input
                            type="password"
                            className="form-control"
                            id="current_password"
                            name="current_password"
                            placeholder="Old password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="new_password">New password</label>
                          <input
                            type="password"
                            className="form-control"
                            id="new_password"
                            name="new_password"
                            placeholder="New password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={8}
                            required
                          />
                        </div>
                        <ul className="list-check-req mb-3">
                          <li className="check">
                            <span>One number</span>
                          </li>
                          <li>
                            <span>One lowercase character</span>
                          </li>
                          <li>
                            <span>One uppercase character</span>
                          </li>
                          <li>
                            <span>8 characters minimum</span>
                          </li>
                        </ul>
                        <div className="form-group">
                          <label htmlFor="confirm_password">Confirm password</label>
                          <input
                            type="password"
                            className="form-control"
                            id="confirm_password"
                            name="confirm_password"
                            placeholder="Confirm password"
                            value={passwordConfirmation}
                            onChange={(event) => setPasswordConfirmation(event.target.value)}
                            required
                          />
                        </div>
                        <div className="group-button-submit left mb-0">
                          <button className="pre-btn" type="submit" disabled={submitting}>
                            {submitting ? "Changing..." : "Change passwords"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChangePassword;

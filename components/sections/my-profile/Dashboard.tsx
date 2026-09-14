"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useAuth } from "@/contexts/AuthContext";
import { describeApiError } from "@/lib/api-client";

function Dashboard() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(
    typeof user?.phone === "string" ? user.phone : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await updateProfile(name, phone || undefined);
      setSuccess(true);
    } catch (err) {
      setError(describeApiError(err, "Could not save your profile right now."));
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
                    <h1 className="admin-title mb-3">Edit profile</h1>
                    <div className="tfcl-add-listing profile-inner">
                      <div className="profile-group mb-3">
                        <h3 className="form-title">Information</h3>
                        <form onSubmit={handleSubmit}>
                          <div className="grid-2 gap-30">
                            <div className="form-group">
                              <label htmlFor="profile_name">Name</label>
                              <input
                                id="profile_name"
                                type="text"
                                className="form-control"
                                placeholder="Your name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="profile_phone">Phone</label>
                              <input
                                id="profile_phone"
                                type="tel"
                                className="form-control"
                                placeholder="Your phone"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="profile_email">Email address</label>
                            <input
                              id="profile_email"
                              type="email"
                              className="form-control"
                              value={user?.email ?? ""}
                              disabled
                              readOnly
                            />
                          </div>

                          {error && <p className="text-danger mb-3">{error}</p>}
                          {success && (
                            <p className="text-success mb-3">Profile updated.</p>
                          )}

                          <div className="group-button-submit left">
                            <button className="pre-btn" type="submit" disabled={submitting}>
                              {submitting ? "Saving..." : "Save & Update"}
                            </button>
                          </div>
                        </form>
                      </div>
                      <div className="profile-group mb-3">
                        <h3 className="form-title">Password</h3>
                        <p className="fs-14">
                          To change your password, use the{" "}
                          <Link href="/change-password">Change Password</Link> page.
                        </p>
                      </div>
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

export default Dashboard;

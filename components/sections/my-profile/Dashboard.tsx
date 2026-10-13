"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import ProfileImageUpload from "@/components/sections/my-profile/ProfileImageUpload";
import DealerStorefrontSection from "@/components/sections/my-profile/DealerStorefrontSection";
import { useAuth } from "@/contexts/AuthContext";
import { describeApiError } from "@/lib/api-client";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, Notice } from "@/components/ui/kit";

function Dashboard() {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuth();

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
    <DashboardPage title="Profile" description="Your name, photo and contact details.">
      <div className="ha-profile-grid">
        <Card title="Photo" className="mb-4">
          <div className="ha-card-body">
            <ProfileImageUpload
              currentImageSrc={typeof user?.avatar_url === "string" ? user.avatar_url : null}
              onUpload={uploadAvatar}
              onRemove={removeAvatar}
            />
          </div>
        </Card>

        <Card title="Your details" className="mb-4">
          <form onSubmit={handleSubmit} className="ha-card-body">
            <div className="ha-form-grid">
              <div className="ha-field">
                <label htmlFor="profile_name">Name</label>
                <input
                  id="profile_name"
                  type="text"
                  className="ha-input"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="ha-field">
                <label htmlFor="profile_phone">Phone</label>
                <input
                  id="profile_phone"
                  type="tel"
                  className="ha-input"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>
            <div className="ha-field">
              <label htmlFor="profile_email">Email address</label>
              <input id="profile_email" type="email" className="ha-input" value={user?.email ?? ""} disabled readOnly aria-describedby="profile_email_hint" />
              <div id="profile_email_hint" className="ha-hint">
                Your sign-in email can&apos;t be changed here.
              </div>
            </div>

            {error && <Notice tone="danger">{error}</Notice>}
            {success && <Notice tone="success">Profile updated.</Notice>}

            <button className="ha-btn is-primary" type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </form>
        </Card>
      </div>

      <DealerStorefrontSection />

      <Card
        title="Password"
        description="Change the password you sign in with."
        actions={
          <Link href="/change-password" className="ha-btn is-sm">
            Change password
          </Link>
        }
      >
        {null}
      </Card>
    </DashboardPage>
  );
}

export default Dashboard;

"use client";

import { useEffect, useState, type FormEvent } from "react";
import ProfileImageUpload from "@/components/sections/my-profile/ProfileImageUpload";
import { useDealerStorefrontProfile } from "@/hooks/useDealerStorefrontProfile";
import { describeApiError } from "@/lib/api-client";
import { Card, LoadingRows, Notice } from "@/components/ui/kit";

const DEFAULT_LOGO = "/assets/images/section/dealer-list1.webp";

function DealerStorefrontSection() {
  const { storefront, loading, update, uploadLogo, removeLogo } = useDealerStorefrontProfile();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [disclosures, setDisclosures] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!storefront) return;
    queueMicrotask(() => {
      setDisplayName(storefront.display_name ?? "");
      setPhone(storefront.tracked_phone_number ?? "");
      setDescription(storefront.description ?? "");
      setDisclosures(storefront.disclosures ?? "");
    });
  }, [storefront]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await update({
        display_name: displayName,
        tracked_phone_number: phone,
        description,
        disclosures,
      });
      setSuccess(true);
    } catch (err) {
      setError(describeApiError(err, "Could not save your dealer storefront right now."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card title="Dealer storefront" className="mb-4">
        <LoadingRows rows={3} label="Loading your storefront" />
      </Card>
    );
  }

  if (!storefront) {
    return null;
  }

  return (
    <Card title="Dealer storefront" description="This is what buyers see on your public dealer page." className="mb-4">
      <div className="ha-card-body">
      <ProfileImageUpload
        currentImageSrc={storefront.logo_url}
        onUpload={uploadLogo}
        onRemove={removeLogo}
        altText="Your dealer logo"
        uploadLabel="Upload a new Logo"
        defaultImageSrc={DEFAULT_LOGO}
      />
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="ha-form-grid">
          <div className="ha-field">
            <label htmlFor="storefront_name">Storefront name</label>
            <input
              id="storefront_name"
              type="text"
              className="ha-input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>
          <div className="ha-field">
            <label htmlFor="storefront_phone">Public contact phone</label>
            <input
              id="storefront_phone"
              type="tel"
              className="ha-input"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
        </div>
        <div className="ha-field">
          <label htmlFor="storefront_description">Description</label>
          <textarea
            id="storefront_description"
            className="ha-textarea"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="ha-field">
          <label htmlFor="storefront_disclosures">Disclosures</label>
          <textarea
            id="storefront_disclosures"
            className="ha-textarea"
            rows={2}
            value={disclosures}
            onChange={(event) => setDisclosures(event.target.value)}
          />
        </div>

        {error && <Notice tone="danger">{error}</Notice>}
        {success && <Notice tone="success">Storefront updated.</Notice>}

        <button className="ha-btn is-primary" type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Saving…" : "Save storefront"}
        </button>
      </form>
      </div>
    </Card>
  );
}

export default DealerStorefrontSection;

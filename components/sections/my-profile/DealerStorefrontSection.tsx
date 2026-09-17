"use client";

import { useEffect, useState, type FormEvent } from "react";
import ProfileImageUpload from "@/components/sections/my-profile/ProfileImageUpload";
import { useDealerStorefrontProfile } from "@/hooks/useDealerStorefrontProfile";
import { describeApiError } from "@/lib/api-client";

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
      <div className="profile-group mb-3">
        <h3 className="form-title">Dealer Storefront</h3>
        <p>Loading your storefront...</p>
      </div>
    );
  }

  if (!storefront) {
    return null;
  }

  return (
    <div className="profile-group mb-3">
      <h3 className="form-title">Dealer Storefront</h3>
      <p className="fs-14 mb-3">
        This is what buyers see on your public dealer page.
      </p>
      <ProfileImageUpload
        currentImageSrc={storefront.logo_url}
        onUpload={uploadLogo}
        onRemove={removeLogo}
        altText="Your dealer logo"
        uploadLabel="Upload a new Logo"
        defaultImageSrc={DEFAULT_LOGO}
      />
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="grid-2 gap-30">
          <div className="form-group">
            <label htmlFor="storefront_name">Storefront name</label>
            <input
              id="storefront_name"
              type="text"
              className="form-control"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="storefront_phone">Public contact phone</label>
            <input
              id="storefront_phone"
              type="tel"
              className="form-control"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="storefront_description">Description</label>
          <textarea
            id="storefront_description"
            className="form-control"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="storefront_disclosures">Disclosures</label>
          <textarea
            id="storefront_disclosures"
            className="form-control"
            rows={2}
            value={disclosures}
            onChange={(event) => setDisclosures(event.target.value)}
          />
        </div>

        {error && <p className="text-danger mb-3">{error}</p>}
        {success && <p className="text-success mb-3">Storefront updated.</p>}

        <div className="group-button-submit left">
          <button className="pre-btn" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save & Update"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DealerStorefrontSection;

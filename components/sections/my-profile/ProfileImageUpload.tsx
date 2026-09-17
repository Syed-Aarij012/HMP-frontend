"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { describeApiError } from "@/lib/api-client";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const DEFAULT_AVATAR = "/assets/images/dashboard/avt-profile.jpg";

type ProfileImageUploadProps = {
  currentImageSrc: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  altText?: string;
  uploadLabel?: string;
  defaultImageSrc?: string;
};

function ProfileImageUpload({
  currentImageSrc,
  onUpload,
  onRemove,
  altText = "Your avatar",
  uploadLabel = "Upload a new Avatar",
  defaultImageSrc = DEFAULT_AVATAR,
}: ProfileImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Please choose a PNG, JPG, or WEBP file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be 4 MB or less.");
      event.target.value = "";
      return;
    }

    setError("");
    const objectUrl = URL.createObjectURL(file);
    setPreviewSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return objectUrl;
    });

    setSaving(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(describeApiError(err, "Could not upload this photo."));
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const handleRemove = async () => {
    setError("");
    setSaving(true);
    try {
      await onRemove();
      setPreviewSrc((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    } catch (err) {
      setError(describeApiError(err, "Could not remove this photo."));
    } finally {
      setSaving(false);
    }
  };

  const displaySrc = previewSrc ?? currentImageSrc ?? defaultImageSrc;

  return (
    <div className="tfcl_choose_avatar">
      <div className="avatar">
        <div className="form-group">
          <Image
            loading="lazy"
            decoding="async"
            width={158}
            height={138}
            src={displaySrc}
            alt={altText}
            unoptimized={displaySrc.startsWith("blob:") || displaySrc.startsWith("http")}
          />
        </div>
        <div className="choose-box">
          <label>{uploadLabel}</label>
          <div className="form-group">
            <input
              ref={inputRef}
              type="file"
              hidden
              className="form-control"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              disabled={saving}
            />
            <label
              onClick={() => inputRef.current?.click()}
              style={{ cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Uploading..." : "Choose file"}
            </label>
            {(previewSrc ?? currentImageSrc) && (
              <button
                type="button"
                className="btn-action tfcl-dashboard-action-delete"
                onClick={handleRemove}
                disabled={saving}
              >
                Remove
              </button>
            )}
          </div>
          <span className="notify-avatar">
            PNG, JPG or WEBP, max file size 4 MB
          </span>
          {error ? (
            <span className="notify-avatar d-block mt-1" style={{ color: "#f26740" }}>
              {error}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ProfileImageUpload;

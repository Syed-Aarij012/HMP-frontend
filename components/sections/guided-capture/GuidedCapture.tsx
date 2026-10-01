"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { usePhotoGuidance } from "@/hooks/useListingTools";
import { useGuidedCapture } from "@/hooks/useGuidedCapture";
import { useBackgroundReplacement } from "@/hooks/useBackgroundReplacement";

type ShotState = { status: "pending" | "passed" | "failed"; message: string | null; photoId: number | null };

const BACKGROUND_COLOR_OPTIONS = [
  { label: "Light grey", value: "#F5F5F5" },
  { label: "White", value: "#FFFFFF" },
  { label: "Showroom blue", value: "#D6E4F0" },
];

/** FR-A-015: opt-in background replacement for the shot just captured. */
function BackgroundReplacementControl({ vehiclePublicId, photoId }: { vehiclePublicId: string; photoId: number }) {
  const { replace, processing, error } = useBackgroundReplacement(vehiclePublicId);
  const [color, setColor] = useState(BACKGROUND_COLOR_OPTIONS[0].value);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleReplace() {
    const url = await replace(photoId, color);
    if (url) setPreviewUrl(url);
  }

  return (
    <div className="mt-2">
      <div className="flex gap-10" style={{ alignItems: "center" }}>
        <select className="form-control" value={color} onChange={(e) => setColor(e.target.value)} style={{ maxWidth: 180 }}>
          {BACKGROUND_COLOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button type="button" className="sc-button" disabled={processing} onClick={handleReplace}>
          <span>{processing ? "Processing..." : "Try background replacement"}</span>
        </button>
      </div>
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      {previewUrl && (
        <div className="mt-2">
          <p className="text-color-1 mb-1">Preview (the original photo is kept either way):</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Background-replaced preview" style={{ maxWidth: 320, borderRadius: 6 }} />
        </div>
      )}
    </div>
  );
}

/**
 * FR-A-014: walks a seller through each recommended shot one at a time, uploading and
 * validating it against the real media-QA pipeline (GdMediaQaProvider) immediately — a
 * failed shot is flagged with why before the seller ever moves on, rather than finding out
 * after the fact that a blurred photo silently never made it into the gallery.
 */
export default function GuidedCapture({ vehiclePublicId }: { vehiclePublicId: string }) {
  const { guidance, loading } = usePhotoGuidance(vehiclePublicId);
  const { uploadShot, uploading } = useGuidedCapture(vehiclePublicId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shotIndex, setShotIndex] = useState(0);
  const [shotStates, setShotStates] = useState<Record<string, ShotState>>({});

  if (loading || !guidance) {
    return (
      <div id="themesflat-content">
        <DashboardToggle />
        <div className="container">
          <p className="mt-3">Loading shot guide...</p>
        </div>
      </div>
    );
  }

  const shots = guidance.shots;
  const currentShot = shots[shotIndex];
  const requiredCount = shots.filter((s) => s.required).length;
  const requiredPassedCount = shots.filter((s) => s.required && shotStates[s.key]?.status === "passed").length;
  const allRequiredDone = requiredPassedCount >= requiredCount;

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !currentShot) return;

    setShotStates((prev) => ({ ...prev, [currentShot.key]: { status: "pending", message: null, photoId: null } }));

    const result = await uploadShot(file);

    setShotStates((prev) => ({
      ...prev,
      [currentShot.key]: { status: result.status, message: result.message, photoId: result.photoId },
    }));

    if (result.status === "passed" && shotIndex < shots.length - 1) {
      setShotIndex(shotIndex + 1);
    }
  }

  const currentState = currentShot ? shotStates[currentShot.key] : undefined;

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Guided photo capture</h1>
                  <p className="text-color-1 mb-3">
                    {requiredPassedCount} of {requiredCount} required shots done.
                  </p>

                  {allRequiredDone && (
                    <div className="alert alert-success mb-3">
                      All required shots are captured. You can retake any shot below, or{" "}
                      <Link href="/my-listing">go back to My listing</Link>.
                    </div>
                  )}

                  <div className="row mb-3">
                    {shots.map((shot, i) => {
                      const state = shotStates[shot.key];
                      return (
                        <div className="col-md-4 mb-2" key={shot.key}>
                          <button
                            type="button"
                            className="tfcl-card p-2"
                            style={{
                              width: "100%",
                              textAlign: "left",
                              border: i === shotIndex ? "2px solid #2a78d6" : undefined,
                            }}
                            onClick={() => setShotIndex(i)}
                          >
                            <div className="flex gap-10" style={{ justifyContent: "space-between" }}>
                              <span>
                                {shot.label}
                                {shot.required ? " *" : ""}
                              </span>
                              {state?.status === "passed" && <span style={{ color: "#1baf7a" }}>✓</span>}
                              {state?.status === "failed" && <span style={{ color: "#e74c3c" }}>✕</span>}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {currentShot && (
                    <div className="tfcl-card p-3">
                      <h4 className="mb-2">{currentShot.label}</h4>
                      <p className="text-color-1 mb-2">{currentShot.tip}</p>

                      {currentState?.status === "failed" && currentState.message && (
                        <div className="alert alert-danger mb-2">{currentState.message}</div>
                      )}
                      {currentState?.status === "passed" && (
                        <div className="alert alert-success mb-2">{currentState.message ?? "Looks good."}</div>
                      )}

                      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFileSelected} />
                      <button type="button" className="sc-button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                        <span>
                          {uploading
                            ? "Checking..."
                            : currentState?.status === "failed"
                              ? "Retake this shot"
                              : "Capture this shot"}
                        </span>
                      </button>

                      {currentState?.status === "passed" && currentState.photoId && (
                        <BackgroundReplacementControl vehiclePublicId={vehiclePublicId} photoId={currentState.photoId} />
                      )}
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

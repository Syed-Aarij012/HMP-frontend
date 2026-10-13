"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePhotoGuidance } from "@/hooks/useListingTools";
import { useGuidedCapture } from "@/hooks/useGuidedCapture";
import { useBackgroundReplacement } from "@/hooks/useBackgroundReplacement";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { LoadingRows, Notice } from "@/components/ui/kit";

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
        <select className="ha-select" value={color} onChange={(e) => setColor(e.target.value)} style={{ maxWidth: 180 }}>
          {BACKGROUND_COLOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button type="button" className="ha-btn" disabled={processing} onClick={handleReplace}>{processing ? "Processing…" : "Try background replacement"}</button>
      </div>
      {error && <Notice tone="danger">{error}</Notice>}
      {previewUrl && (
        <div className="mt-2">
          <p className="ha-muted mb-1">Preview (the original photo is kept either way):</p>
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
  const { user } = useAuth();
  // FR-A-015: background replacement is dealer-opt-in only — a private seller never sees it.
  const isDealer = typeof user?.organization_id === "number";
  const { guidance, loading } = usePhotoGuidance(vehiclePublicId);
  const { uploadShot, uploading } = useGuidedCapture(vehiclePublicId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shotIndex, setShotIndex] = useState(0);
  const [shotStates, setShotStates] = useState<Record<string, ShotState>>({});

  if (loading || !guidance) {
    return (
      <DashboardPage title="Guided photo capture">
        <LoadingRows rows={4} label="Loading the shot guide" />
      </DashboardPage>
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
    <DashboardPage
      eyebrow={<Link href="/my-listing">← My listings</Link>}
      title="Guided photo capture"
      description={`${requiredPassedCount} of ${requiredCount} required shots done.`}
    >
      {allRequiredDone && (
        <Notice tone="success">
          All required shots are captured. You can retake any shot below, or{" "}
          <Link href="/my-listing">go back to My listing</Link>.
        </Notice>
      )}

      <div className="ha-meter mb-4" role="progressbar" aria-label="Required shots captured" aria-valuenow={requiredPassedCount} aria-valuemin={0} aria-valuemax={requiredCount}>
        <span style={{ width: `${requiredCount ? (requiredPassedCount / requiredCount) * 100 : 0}%` }} />
      </div>

      <ol className="ha-shot-list" aria-label="Shots">
        {shots.map((shot, i) => {
          const state = shotStates[shot.key];
          const label = state?.status === "passed" ? "done" : state?.status === "failed" ? "needs a retake" : state?.status === "pending" ? "checking" : "not taken";
          return (
            <li key={shot.key}>
              <button
                type="button"
                className={`ha-shot${i === shotIndex ? " is-current" : ""}${state?.status ? ` is-${state.status}` : ""}`}
                aria-current={i === shotIndex ? "step" : undefined}
                onClick={() => setShotIndex(i)}
              >
                <span className="ha-shot-mark" aria-hidden="true">
                  {state?.status === "passed" ? "✓" : state?.status === "failed" ? "!" : i + 1}
                </span>
                <span className="ha-shot-label">
                  {shot.label}
                  {shot.required ? <span className="ha-sub"> · required</span> : null}
                </span>
                <span className="ha-visually-hidden">, {label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {currentShot && (
        <div className="ha-card ha-card-body">
          <h2 className="hd-card-title">{currentShot.label}</h2>
          <p className="ha-muted mb-2">{currentShot.tip}</p>

          {currentState?.status === "failed" && currentState.message && (
            <Notice tone="danger">{currentState.message}</Notice>
          )}
          {currentState?.status === "passed" && (
            <Notice tone="success">{currentState.message ?? "Looks good."}</Notice>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFileSelected} />
          <button type="button" className="ha-btn is-primary" disabled={uploading} aria-busy={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? "Checking…" : currentState?.status === "failed" ? "Retake this shot" : "Capture this shot"}
          </button>

          {isDealer && currentState?.status === "passed" && currentState.photoId && (
            <BackgroundReplacementControl vehiclePublicId={vehiclePublicId} photoId={currentState.photoId} />
          )}
        </div>
      )}
    </DashboardPage>
  );
}

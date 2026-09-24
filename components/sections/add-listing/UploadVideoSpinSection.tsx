"use client";

import { useRef, useState, type ChangeEvent } from "react";

// FR-A-010 (M): mirrors the backend's config('media.max_video_duration_seconds') /
// min_spin_set_frames — this is only the UI's own pre-submit guardrail so a seller isn't
// surprised by a 422 after picking files; the server re-validates both independently.
const MAX_VIDEO_DURATION_SECONDS = 240;
const MIN_SPIN_SET_FRAMES = 36;

export type VideoSelection = { file: File; durationSeconds: number } | null;

type UploadVideoSpinSectionProps = {
  onVideoChange?: (video: VideoSelection) => void;
  onSpinFramesChange?: (files: File[]) => void;
};

export default function UploadVideoSpinSection({
  onVideoChange,
  onSpinFramesChange,
}: UploadVideoSpinSectionProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const spinInputRef = useRef<HTMLInputElement>(null);

  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [spinError, setSpinError] = useState<string | null>(null);

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setVideoError(null);

    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(probe.src);
      const durationSeconds = Math.round(probe.duration);

      if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        setVideoError(`This video is longer than ${MAX_VIDEO_DURATION_SECONDS / 60} minutes.`);
        setVideoName(null);
        onVideoChange?.(null);
        return;
      }

      setVideoName(file.name);
      onVideoChange?.({ file, durationSeconds });
    };
    probe.src = URL.createObjectURL(file);
  };

  const handleSpinFramesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (!files.length) return;

    if (files.length < MIN_SPIN_SET_FRAMES) {
      setSpinError(`A 360 spin set needs at least ${MIN_SPIN_SET_FRAMES} frames (you selected ${files.length}).`);
      setSpinCount(0);
      onSpinFramesChange?.([]);
      return;
    }

    setSpinError(null);
    setSpinCount(files.length);
    onSpinFramesChange?.(files);
  };

  return (
    <div className="tfcl-add-listing upload-photo">
      <h3>Video &amp; 360 spin (optional)</h3>
      <div className="grid-2 gap-30">
        <div className="form-group mb-0">
          <label>Walk-around video</label>
          <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoChange} />
          <button type="button" className="sc-button style-2" onClick={() => videoInputRef.current?.click()}>
            <span>{videoName ?? "Select video"}</span>
          </button>
          <p className="text-color-1 mt-2">Up to {MAX_VIDEO_DURATION_SECONDS / 60} minutes.</p>
          {videoError && <div className="alert alert-danger mt-2">{videoError}</div>}
        </div>
        <div className="form-group mb-0">
          <label>360 spin set</label>
          <input
            ref={spinInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleSpinFramesChange}
          />
          <button type="button" className="sc-button style-2" onClick={() => spinInputRef.current?.click()}>
            <span>{spinCount > 0 ? `${spinCount} frames selected` : "Select turntable frames"}</span>
          </button>
          <p className="text-color-1 mt-2">At least {MIN_SPIN_SET_FRAMES} frames, one set per vehicle.</p>
          {spinError && <div className="alert alert-danger mt-2">{spinError}</div>}
        </div>
      </div>
    </div>
  );
}

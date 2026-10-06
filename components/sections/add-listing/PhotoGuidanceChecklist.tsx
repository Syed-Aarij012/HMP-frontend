"use client";

import { usePhotoGuidance } from "@/hooks/useListingTools";

/**
 * FR-C-003: "photo guidance" — the shot list a good listing carries, shown alongside the
 * uploader so a seller knows what to capture before they submit.
 */
export default function PhotoGuidanceChecklist() {
  const { guidance, loading } = usePhotoGuidance();

  if (loading || !guidance) return null;

  return (
    <div className="tfcl-card p-3 mb-3">
      <h4 className="mb-2">Photo guide</h4>
      <p className="text-color-2 mb-2">
        Listings with at least {guidance.recommendedStillCount} clear photos get noticed more.
        The starred shots matter most.
      </p>
      <ul className="mb-0" style={{ columns: 2, listStyle: "disc", paddingLeft: 18 }}>
        {guidance.shots.map((shot) => (
          <li key={shot.key} title={shot.tip}>
            {shot.label}
            {shot.required ? " *" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

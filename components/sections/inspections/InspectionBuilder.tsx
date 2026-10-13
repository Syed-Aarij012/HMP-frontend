"use client";

import { useMemo, useState, type MouseEvent } from "react";
import EnrichmentPanel from "@/components/sections/inspections/EnrichmentPanel";
import {
  useActiveGradingMatrix,
  useConditionReportSubmission,
  useCvDamageSuggestions,
  useInspectorVehicle,
  useVehicleMedia,
} from "@/hooks/useInspection";
import type { DraftDamageItem, InspectionMedia } from "@/types/inspection";
import Link from "next/link";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, EmptyState, LoadingRows, LoadingTable, Notice, StatusBadge } from "@/components/ui/kit";

const QA_STATUS_LABELS: Record<InspectionMedia["qaStatus"], string> = {
  passed: "QA passed",
  failed: "QA failed",
  pending: "QA pending",
};

const SEVERITY_COLOR: Record<string, string> = {
  minor: "#f1c40f",
  moderate: "#e67e22",
  severe: "#e74c3c",
};

type PendingPin = {
  panel: string;
  damageType: string;
  severity: "minor" | "moderate" | "severe";
  cvSuggested: boolean;
  lockedToMediaId: number | null;
};

function PhotoWithPins({
  media,
  items,
  pending,
  onPhotoClick,
  onRemoveItem,
}: {
  media: InspectionMedia;
  items: DraftDamageItem[];
  pending: PendingPin | null;
  onPhotoClick: (mediaId: number, event: MouseEvent<HTMLDivElement>) => void;
  onRemoveItem: (key: string) => void;
}) {
  const canAcceptPin = pending !== null && (pending.lockedToMediaId === null || pending.lockedToMediaId === media.id);

  return (
    <div className="ha-card" style={{ position: "relative", padding: 8 }}>
      <div
        onClick={canAcceptPin ? (e) => onPhotoClick(media.id, e) : undefined}
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "70%",
          cursor: canAcceptPin ? "crosshair" : "default",
          backgroundImage: `url(${media.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 6,
          outline: canAcceptPin ? "2px dashed var(--hmp-primary)" : "none",
        }}
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            title={`${item.panel} · ${item.damageType} · ${item.severity}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveItem(item.key);
            }}
            style={{
              position: "absolute",
              left: `${(item.frameX ?? 0) * 100}%`,
              top: `${(item.frameY ?? 0) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "2px solid #fff",
              background: SEVERITY_COLOR[item.severity] ?? "#999",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <div className="d-flex justify-content-between align-items-center mt-2">
        <span className="text-capitalize">{media.type}</span>
        <Badge tone={media.qaStatus === "failed" ? "danger" : media.qaStatus === "passed" ? "success" : "neutral"}>{QA_STATUS_LABELS[media.qaStatus]}</Badge>
      </div>
    </div>
  );
}

export default function InspectionBuilder({ vehiclePublicId }: { vehiclePublicId: string }) {
  const { vehicle, loading: vehicleLoading, error: vehicleError, reload: reloadVehicle } = useInspectorVehicle(vehiclePublicId);
  const { media, loading: mediaLoading, error: mediaError } = useVehicleMedia(vehiclePublicId);
  const { suggestions } = useCvDamageSuggestions(vehiclePublicId);
  const { matrix, loading: matrixLoading, error: matrixError } = useActiveGradingMatrix();
  const { submit, submitting, submitError, report, publish, publishing, publishError } = useConditionReportSubmission(
    vehicle?.id ?? null,
  );

  const [vehicleCategory, setVehicleCategory] = useState<"car" | "lcv" | "motorcycle" | "bev">("car");
  const [driveStatus, setDriveStatus] = useState<"runs_and_drives" | "non_runner">("runs_and_drives");
  const [warningLamps, setWarningLamps] = useState("");
  const [serviceHistoryVerified, setServiceHistoryVerified] = useState(false);
  const [tyreFl, setTyreFl] = useState("6");
  const [tyreFr, setTyreFr] = useState("6");
  const [tyreRl, setTyreRl] = useState("6");
  const [tyreRr, setTyreRr] = useState("6");
  const [sohPercentage, setSohPercentage] = useState("90");
  const [chargeCableInventory, setChargeCableInventory] = useState("Type 2");
  const [chargingSessionVerified, setChargingSessionVerified] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [capturingGeo, setCapturingGeo] = useState(false);

  const [damageItems, setDamageItems] = useState<DraftDamageItem[]>([]);
  const [pending, setPending] = useState<PendingPin | null>(null);

  const [manualPanel, setManualPanel] = useState("");
  const [manualDamageType, setManualDamageType] = useState("");
  const [manualSeverity, setManualSeverity] = useState("");

  const panels = useMemo(() => [...new Set((matrix?.entries ?? []).map((e) => e.panel))], [matrix]);
  const damageTypes = useMemo(
    () => [...new Set((matrix?.entries ?? []).filter((e) => e.panel === manualPanel).map((e) => e.damageType))],
    [matrix, manualPanel],
  );
  const severities = useMemo(
    () =>
      [...new Set(
        (matrix?.entries ?? [])
          .filter((e) => e.panel === manualPanel && e.damageType === manualDamageType)
          .map((e) => e.severity),
      )],
    [matrix, manualPanel, manualDamageType],
  );

  function startManualPin() {
    if (!manualPanel || !manualDamageType || !manualSeverity) return;
    setPending({
      panel: manualPanel,
      damageType: manualDamageType,
      severity: manualSeverity as DraftDamageItem["severity"],
      cvSuggested: false,
      lockedToMediaId: null,
    });
  }

  function startCvPin(suggestion: (typeof suggestions)[number]) {
    setPending({
      panel: suggestion.panel,
      damageType: suggestion.damageType,
      severity: suggestion.severity,
      cvSuggested: true,
      lockedToMediaId: suggestion.vehicleMediaId,
    });
  }

  function handlePhotoClick(mediaId: number, event: MouseEvent<HTMLDivElement>) {
    if (!pending) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const frameX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const frameY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    setDamageItems((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random()}`,
        panel: pending.panel,
        damageType: pending.damageType,
        severity: pending.severity,
        vehicleMediaId: mediaId,
        frameX,
        frameY,
        cvSuggested: pending.cvSuggested,
      },
    ]);
    setPending(null);
    setManualPanel("");
    setManualDamageType("");
    setManualSeverity("");
  }

  function removeItem(key: string) {
    setDamageItems((prev) => prev.filter((item) => item.key !== key));
  }

  function captureGeo() {
    if (!navigator.geolocation) {
      setGeoError("Location isn't available in this browser.");
      return;
    }
    setCapturingGeo(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({ lat: position.coords.latitude, lng: position.coords.longitude });
        setCapturingGeo(false);
      },
      () => {
        setGeoError("Could not get your location — you can still submit without it.");
        setCapturingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSubmit() {
    const ok = await submit(
      vehicleCategory,
      {
        drive_status: driveStatus,
        warning_lamps: warningLamps.split(",").map((s) => s.trim()).filter(Boolean),
        service_history_verified: serviceHistoryVerified,
        tyre_depths: { fl: Number(tyreFl), fr: Number(tyreFr), rl: Number(tyreRl), rr: Number(tyreRr) },
        ...(vehicleCategory === "bev" ? { charging_session_verified: chargingSessionVerified } : {}),
      },
      damageItems,
      vehicleCategory === "bev"
        ? {
            sohPercentage: Number(sohPercentage),
            chargeCableInventory: chargeCableInventory.split(",").map((s) => s.trim()).filter(Boolean),
          }
        : undefined,
      geo ?? undefined,
    );
    if (ok) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (vehicleLoading) {
    return (
      <DashboardPage title="Condition report">
        <LoadingRows rows={5} label="Loading vehicle" />
      </DashboardPage>
    );
  }
  if (vehicleError || !vehicle) {
    return (
      <DashboardPage eyebrow={<Link href="/inspections">← My inspections</Link>} title="Condition report">
        <Notice tone="danger">{vehicleError ?? "Vehicle not found."}</Notice>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      eyebrow={<Link href="/inspections">← My inspections</Link>}
      title={<>Condition report — {vehicle.make} {vehicle.model} {vehicle.derivative}</>}
      description={
        <>
          VIN <code>{vehicle.vin}</code> · VRM {vehicle.currentVrm ?? "—"} · Provenance <StatusBadge status={vehicle.provenanceStatus} />
        </>
      }
    >
      {!report && <EnrichmentPanel vehiclePublicId={vehiclePublicId} vin={vehicle.vin} onEnriched={reloadVehicle} />}

      {report && (
        <Notice tone={report.status === "published" ? "success" : "info"}>
          Report #{report.id} — <StatusBadge status={report.status} />
          {report.conditionGrade !== null && <> · Condition grade {report.conditionGrade}</>}
          {report.mechanicalGrade !== null && <> · Mechanical grade {report.mechanicalGrade}</>}
          {report.status === "draft" && (
            <div className="mt-2">
              <button type="button" className="ha-btn is-primary" disabled={publishing} aria-busy={publishing} onClick={publish}>{publishing ? "Publishing…" : "Publish"}</button>
            </div>
          )}
          {publishError && <Notice tone="danger">{publishError}</Notice>}
        </Notice>
      )}

      {!report && (
        <>
          <div className="ha-card ha-card-body mb-4">
            <h2 className="hd-card-title">Checklist</h2>
            <div className="ha-form-grid">
              <div className="ha-field">
                <label htmlFor="ib-vehicle-category">Vehicle category</label>
                <select id="ib-vehicle-category" className="ha-select" value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value as typeof vehicleCategory)}>
                  <option value="car">Car</option>
                  <option value="lcv">LCV</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bev">BEV</option>
                </select>
              </div>
              <div className="ha-field">
                <label htmlFor="ib-drive-status">Drive status</label>
                <select id="ib-drive-status" className="ha-select" value={driveStatus} onChange={(e) => setDriveStatus(e.target.value as typeof driveStatus)}>
                  <option value="runs_and_drives">Runs and drives</option>
                  <option value="non_runner">Non-runner</option>
                </select>
              </div>
              <div className="ha-field">
                <label htmlFor="ib-warning-lamps-comma-separated">Warning lamps (comma-separated)</label>
                <input id="ib-warning-lamps-comma-separated" type="text" className="ha-input" placeholder="e.g. abs, airbag" value={warningLamps} onChange={(e) => setWarningLamps(e.target.value)} />
              </div>
              <div className="ha-field">
                <label className="ha-check">
                  <input type="checkbox" checked={serviceHistoryVerified} onChange={(e) => setServiceHistoryVerified(e.target.checked)} />
                  Service history verified
                </label>
              </div>
            </div>
            <div className="ha-form-grid">
              <div className="ha-field">
                <label htmlFor="ib-tyre-depth-fl-mm">Tyre depth FL (mm)</label>
                <input id="ib-tyre-depth-fl-mm" type="number" step="0.5" className="ha-input" value={tyreFl} onChange={(e) => setTyreFl(e.target.value)} />
              </div>
              <div className="ha-field">
                <label htmlFor="ib-tyre-depth-fr-mm">Tyre depth FR (mm)</label>
                <input id="ib-tyre-depth-fr-mm" type="number" step="0.5" className="ha-input" value={tyreFr} onChange={(e) => setTyreFr(e.target.value)} />
              </div>
              <div className="ha-field">
                <label htmlFor="ib-tyre-depth-rl-mm">Tyre depth RL (mm)</label>
                <input id="ib-tyre-depth-rl-mm" type="number" step="0.5" className="ha-input" value={tyreRl} onChange={(e) => setTyreRl(e.target.value)} />
              </div>
              <div className="ha-field">
                <label htmlFor="ib-tyre-depth-rr-mm">Tyre depth RR (mm)</label>
                <input id="ib-tyre-depth-rr-mm" type="number" step="0.5" className="ha-input" value={tyreRr} onChange={(e) => setTyreRr(e.target.value)} />
              </div>
            </div>
            {vehicleCategory === "bev" && (
              <div className="ha-form-grid">
                <div className="ha-field">
                  <label htmlFor="ib-state-of-health">State of health (%)</label>
                  <input id="ib-state-of-health" type="number" className="ha-input" value={sohPercentage} onChange={(e) => setSohPercentage(e.target.value)} />
                </div>
                <div className="ha-field">
                  <label htmlFor="ib-charge-cable-inventory-comma-s">Charge cable inventory (comma-separated)</label>
                  <input id="ib-charge-cable-inventory-comma-s" type="text" className="ha-input" value={chargeCableInventory} onChange={(e) => setChargeCableInventory(e.target.value)} />
                </div>
                <div className="ha-field">
                  <label className="ha-check">
                    <input type="checkbox" checked={chargingSessionVerified} onChange={(e) => setChargingSessionVerified(e.target.checked)} />
                    Charging session verified
                  </label>
                </div>
              </div>
            )}
            <div className="ha-form-grid">
              <div className="ha-field">
                <span className="ha-label">Location of capture</span>
                <div className="ha-actions is-start">
                  <button type="button" className="ha-btn" disabled={capturingGeo} onClick={captureGeo}>{capturingGeo ? "Getting location…" : geo ? "Re-capture location" : "Capture my location"}</button>
                  {geo && (
                    <span className="ha-muted">
                      {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
                    </span>
                  )}
                </div>
                {geoError && <p className="ha-error-text mb-0" role="alert">{geoError}</p>}
              </div>
            </div>
          </div>

          {matrixLoading && <LoadingTable label="Loading the active grading matrix" />}
          {matrixError && <Notice tone="danger">{matrixError}</Notice>}

          {matrix && (
            <div className="ha-card ha-card-body mb-4">
              <h2 className="hd-card-title">Add damage manually</h2>
              <div className="ha-form-grid">
                <div className="ha-field">
                  <label htmlFor="ib-panel">Panel</label>
                  <select id="ib-panel" className="ha-select" value={manualPanel} onChange={(e) => { setManualPanel(e.target.value); setManualDamageType(""); setManualSeverity(""); }}>
                    <option value="">Choose...</option>
                    {panels.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="ha-field">
                  <label htmlFor="ib-damage-type">Damage type</label>
                  <select id="ib-damage-type" className="ha-select" value={manualDamageType} onChange={(e) => { setManualDamageType(e.target.value); setManualSeverity(""); }} disabled={!manualPanel}>
                    <option value="">Choose...</option>
                    {damageTypes.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="ha-field">
                  <label htmlFor="ib-severity">Severity</label>
                  <select id="ib-severity" className="ha-select" value={manualSeverity} onChange={(e) => setManualSeverity(e.target.value)} disabled={!manualDamageType}>
                    <option value="">Choose...</option>
                    {severities.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button type="button" className="ha-btn is-primary" disabled={!manualSeverity} onClick={startManualPin}>{pending && !pending.cvSuggested ? "Click a photo below to place it" : "Place on a photo"}</button>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="ha-card ha-card-body mb-4">
              <h2 className="hd-card-title">CV-suggested damage</h2>
              <p className="ha-muted mb-2">Proposals only — nothing here affects the grade until you confirm it by pinning it to the photo.</p>
              {suggestions.map((s, i) => (
                <div key={i} className="ha-actions is-start mb-2">
                  <span>{s.panel} · {s.damageType} · {s.severity}</span>
                  <button type="button" className="ha-btn is-sm" onClick={() => startCvPin(s)}>
                    <span>{pending?.cvSuggested && pending.lockedToMediaId === s.vehicleMediaId ? "Click the highlighted photo" : "Confirm on photo"}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {pending && (
            <Notice tone="info">
              Placing: {pending.panel} · {pending.damageType} · {pending.severity} —{" "}
              {pending.lockedToMediaId ? "click the highlighted photo" : "click any photo"} to pin it, or{" "}
              <button type="button" className="ha-link-btn" onClick={() => setPending(null)}>cancel</button>
            </Notice>
          )}

          <h2 className="hd-section-title">Photos</h2>
          {mediaLoading && <LoadingTable label="Loading photos" />}
          {mediaError && <Notice tone="danger">{mediaError}</Notice>}
          {!mediaLoading && media.length === 0 && <EmptyState icon="icon-carus-imagessquare" title="No photos uploaded yet" />}

          <div className="ha-grid mb-4">
            {media.map((m) => (
              <div key={m.id}>
                <PhotoWithPins
                  media={m}
                  items={damageItems.filter((item) => item.vehicleMediaId === m.id)}
                  pending={pending}
                  onPhotoClick={handlePhotoClick}
                  onRemoveItem={removeItem}
                />
              </div>
            ))}
          </div>

          {damageItems.filter((i) => i.vehicleMediaId === null).length > 0 && (
            <div className="ha-card ha-card-body mb-4">
              <h2 className="hd-card-title">Unpinned damage</h2>
              {damageItems.filter((i) => i.vehicleMediaId === null).map((item) => (
                <div key={item.key} className="ha-actions is-start mb-2">
                  <span>{item.panel} · {item.damageType} · {item.severity}</span>
                  <button type="button" className="ha-btn is-sm is-danger" onClick={() => removeItem(item.key)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {submitError && <Notice tone="danger">{submitError}</Notice>}

          <div className="ha-form-footer">
            <button type="button" className="ha-btn is-primary" disabled={submitting} aria-busy={submitting} onClick={handleSubmit}>
              {submitting ? "Submitting…" : "Submit condition report"}
            </button>
          </div>
        </>
      )}
    </DashboardPage>
  );
}

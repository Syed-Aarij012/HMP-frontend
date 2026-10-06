"use client";

import { useMemo, useState, type MouseEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import EnrichmentPanel from "@/components/sections/inspections/EnrichmentPanel";
import {
  useActiveGradingMatrix,
  useConditionReportSubmission,
  useCvDamageSuggestions,
  useInspectorVehicle,
  useVehicleMedia,
} from "@/hooks/useInspection";
import type { DraftDamageItem, InspectionMedia } from "@/types/inspection";

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
    <div className="tfcl-card p-2" style={{ position: "relative" }}>
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
          outline: canAcceptPin ? "2px dashed #2a78d6" : "none",
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
      <div className="flex gap-10 mt-1" style={{ justifyContent: "space-between" }}>
        <span className="text-capitalize">{media.type}</span>
        <span className={media.qaStatus === "failed" ? "text-color-danger" : "text-color-2"}>
          {QA_STATUS_LABELS[media.qaStatus]}
        </span>
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

  if (vehicleLoading) return <p>Loading vehicle...</p>;
  if (vehicleError || !vehicle) {
    return (
      <div id="themesflat-content">
        <DashboardToggle />
        <div className="container">
          <div className="alert alert-danger mt-3">{vehicleError ?? "Vehicle not found."}</div>
        </div>
      </div>
    );
  }

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">
                    Condition report — {vehicle.make} {vehicle.model} {vehicle.derivative}
                  </h1>
                  <p className="text-color-2 mb-3">
                    VIN {vehicle.vin} · VRM {vehicle.currentVrm ?? "-"} · Provenance: {vehicle.provenanceStatus}
                  </p>

                  {!report && <EnrichmentPanel vehiclePublicId={vehiclePublicId} vin={vehicle.vin} onEnriched={reloadVehicle} />}

                  {report && (
                    <div className={`alert ${report.status === "published" ? "alert-success" : "alert-info"} mb-3`}>
                      Report #{report.id} — status: {report.status}
                      {report.conditionGrade !== null && <> · Condition grade {report.conditionGrade}</>}
                      {report.mechanicalGrade !== null && <> · Mechanical grade {report.mechanicalGrade}</>}
                      {report.status === "draft" && (
                        <div className="mt-2">
                          <button type="button" className="sc-button" disabled={publishing} onClick={publish}>
                            <span>{publishing ? "Publishing..." : "Publish"}</span>
                          </button>
                        </div>
                      )}
                      {publishError && <div className="alert alert-danger mt-2">{publishError}</div>}
                    </div>
                  )}

                  {!report && (
                    <>
                      <div className="tfcl-card p-3 mb-3">
                        <h4 className="mb-2">Checklist</h4>
                        <div className="row">
                          <div className="col-md-3 form-group">
                            <label>Vehicle category</label>
                            <select className="form-control" value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value as typeof vehicleCategory)}>
                              <option value="car">Car</option>
                              <option value="lcv">LCV</option>
                              <option value="motorcycle">Motorcycle</option>
                              <option value="bev">BEV</option>
                            </select>
                          </div>
                          <div className="col-md-3 form-group">
                            <label>Drive status</label>
                            <select className="form-control" value={driveStatus} onChange={(e) => setDriveStatus(e.target.value as typeof driveStatus)}>
                              <option value="runs_and_drives">Runs and drives</option>
                              <option value="non_runner">Non-runner</option>
                            </select>
                          </div>
                          <div className="col-md-3 form-group">
                            <label>Warning lamps (comma-separated)</label>
                            <input type="text" className="form-control" placeholder="e.g. abs, airbag" value={warningLamps} onChange={(e) => setWarningLamps(e.target.value)} />
                          </div>
                          <div className="col-md-3 form-group">
                            <label className="flex gap-10" style={{ alignItems: "center" }}>
                              <input type="checkbox" checked={serviceHistoryVerified} onChange={(e) => setServiceHistoryVerified(e.target.checked)} />
                              Service history verified
                            </label>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-3 form-group">
                            <label>Tyre depth FL (mm)</label>
                            <input type="number" step="0.5" className="form-control" value={tyreFl} onChange={(e) => setTyreFl(e.target.value)} />
                          </div>
                          <div className="col-md-3 form-group">
                            <label>Tyre depth FR (mm)</label>
                            <input type="number" step="0.5" className="form-control" value={tyreFr} onChange={(e) => setTyreFr(e.target.value)} />
                          </div>
                          <div className="col-md-3 form-group">
                            <label>Tyre depth RL (mm)</label>
                            <input type="number" step="0.5" className="form-control" value={tyreRl} onChange={(e) => setTyreRl(e.target.value)} />
                          </div>
                          <div className="col-md-3 form-group">
                            <label>Tyre depth RR (mm)</label>
                            <input type="number" step="0.5" className="form-control" value={tyreRr} onChange={(e) => setTyreRr(e.target.value)} />
                          </div>
                        </div>
                        {vehicleCategory === "bev" && (
                          <div className="row">
                            <div className="col-md-4 form-group">
                              <label>State of health (%)</label>
                              <input type="number" className="form-control" value={sohPercentage} onChange={(e) => setSohPercentage(e.target.value)} />
                            </div>
                            <div className="col-md-5 form-group">
                              <label>Charge cable inventory (comma-separated)</label>
                              <input type="text" className="form-control" value={chargeCableInventory} onChange={(e) => setChargeCableInventory(e.target.value)} />
                            </div>
                            <div className="col-md-3 form-group">
                              <label className="flex gap-10" style={{ alignItems: "center" }}>
                                <input type="checkbox" checked={chargingSessionVerified} onChange={(e) => setChargingSessionVerified(e.target.checked)} />
                                Charging session verified
                              </label>
                            </div>
                          </div>
                        )}
                        <div className="row">
                          <div className="col-md-12 form-group">
                            <label>Location of capture</label>
                            <div className="flex gap-10" style={{ alignItems: "center" }}>
                              <button type="button" className="sc-button" disabled={capturingGeo} onClick={captureGeo}>
                                <span>{capturingGeo ? "Getting location..." : geo ? "Re-capture location" : "Capture my location"}</span>
                              </button>
                              {geo && (
                                <span className="text-color-2">
                                  {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
                                </span>
                              )}
                            </div>
                            {geoError && <p className="text-color-danger mb-0">{geoError}</p>}
                          </div>
                        </div>
                      </div>

                      {matrixLoading && <p>Loading the active grading matrix...</p>}
                      {matrixError && <div className="alert alert-danger mb-3">{matrixError}</div>}

                      {matrix && (
                        <div className="tfcl-card p-3 mb-3">
                          <h4 className="mb-2">Add damage manually</h4>
                          <div className="row">
                            <div className="col-md-4 form-group">
                              <label>Panel</label>
                              <select className="form-control" value={manualPanel} onChange={(e) => { setManualPanel(e.target.value); setManualDamageType(""); setManualSeverity(""); }}>
                                <option value="">Choose...</option>
                                {panels.map((p) => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div className="col-md-4 form-group">
                              <label>Damage type</label>
                              <select className="form-control" value={manualDamageType} onChange={(e) => { setManualDamageType(e.target.value); setManualSeverity(""); }} disabled={!manualPanel}>
                                <option value="">Choose...</option>
                                {damageTypes.map((d) => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div className="col-md-4 form-group">
                              <label>Severity</label>
                              <select className="form-control" value={manualSeverity} onChange={(e) => setManualSeverity(e.target.value)} disabled={!manualDamageType}>
                                <option value="">Choose...</option>
                                {severities.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                          <button type="button" className="sc-button" disabled={!manualSeverity} onClick={startManualPin}>
                            <span>{pending && !pending.cvSuggested ? "Click a photo below to place it" : "Place on a photo"}</span>
                          </button>
                        </div>
                      )}

                      {suggestions.length > 0 && (
                        <div className="tfcl-card p-3 mb-3">
                          <h4 className="mb-2">CV-suggested damage</h4>
                          <p className="text-color-2 mb-2">Proposals only — nothing here affects the grade until you confirm it by pinning it to the photo.</p>
                          {suggestions.map((s, i) => (
                            <div key={i} className="flex gap-10 mb-1" style={{ alignItems: "center" }}>
                              <span>{s.panel} · {s.damageType} · {s.severity}</span>
                              <button type="button" className="sc-button" onClick={() => startCvPin(s)}>
                                <span>{pending?.cvSuggested && pending.lockedToMediaId === s.vehicleMediaId ? "Click the highlighted photo" : "Confirm on photo"}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {pending && (
                        <div className="alert alert-info mb-3">
                          Placing: {pending.panel} · {pending.damageType} · {pending.severity} —{" "}
                          {pending.lockedToMediaId ? "click the highlighted photo" : "click any photo"} to pin it, or{" "}
                          <button type="button" className="sc-button" onClick={() => setPending(null)}><span>cancel</span></button>
                        </div>
                      )}

                      <h4 className="mb-2">Photos</h4>
                      {mediaLoading && <p>Loading photos...</p>}
                      {mediaError && <div className="alert alert-danger">{mediaError}</div>}
                      {!mediaLoading && media.length === 0 && <p className="tfcl-empty-data">No photos uploaded yet.</p>}

                      <div className="row mb-3">
                        {media.map((m) => (
                          <div className="col-md-4 mb-3" key={m.id}>
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
                        <div className="tfcl-card p-3 mb-3">
                          <h4 className="mb-2">Unpinned damage</h4>
                          {damageItems.filter((i) => i.vehicleMediaId === null).map((item) => (
                            <div key={item.key} className="flex gap-10 mb-1">
                              <span>{item.panel} · {item.damageType} · {item.severity}</span>
                              <button type="button" className="sc-button" onClick={() => removeItem(item.key)}><span>Remove</span></button>
                            </div>
                          ))}
                        </div>
                      )}

                      {submitError && <div className="alert alert-danger mb-3">{submitError}</div>}

                      <button type="button" className="sc-button" disabled={submitting} onClick={handleSubmit}>
                        <span>{submitting ? "Submitting..." : "Submit condition report"}</span>
                      </button>
                    </>
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

"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AttachmentsSection from "@/components/sections/add-listing/AttachmentsSection";
import FeaturesSpecsFields, {
  EMPTY_EXTRAS,
  extrasToCreatePayload,
  type ExtrasForm,
} from "@/components/sections/add-listing/FeaturesSpecsFields";
import PhotoGuidanceChecklist from "@/components/sections/add-listing/PhotoGuidanceChecklist";
import UploadPhotoSection from "@/components/sections/add-listing/UploadPhotoSection";
import UploadVideoSpinSection, {
  type VideoSelection,
} from "@/components/sections/add-listing/UploadVideoSpinSection";
import { canAny, useAuth } from "@/contexts/AuthContext";
import { useResumableUpload } from "@/hooks/useResumableUpload";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { useOrganizationSubscription } from "@/hooks/useOrganizationSubscription";
import { usePricingSuggestion, useVrmLookup } from "@/hooks/useListingTools";
import { apiFetch, describeApiError } from "@/lib/api-client";
import {
  ADD_LISTING_BODY_TYPE_OPTIONS,
  ADD_LISTING_FUEL_TYPE_OPTIONS,
  ADD_LISTING_PRICE_TYPE_OPTIONS,
  ADD_LISTING_TRANSMISSION_OPTIONS,
  ADD_LISTING_V5C_STATUS_OPTIONS,
  ADD_LISTING_YEAR_OPTIONS,
  COLOR_OPTIONS,
  DOOR_OPTIONS,
  SEAT_OPTIONS,
} from "@/data/niceSelectOptions";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, EmptyState, Notice, Select, formatMoney } from "@/components/ui/kit";

type ApiVehicle = { data: { id: string } };
type ApiListing = { data: { id: string } };

// COLOR_OPTIONS' fixed 6-colour list is also used as a search filter elsewhere (Filters.tsx,
// ListingSidebarFilterForm.tsx) where an "Other" entry wouldn't correspond to anything
// matchable — so this is a local addition just for the listing form, not a change to the
// shared list.
const COLOR_OTHER_VALUE = "__other__";
const COLOR_OPTIONS_WITH_OTHER = [...COLOR_OPTIONS, { label: "Other (type your own)", value: COLOR_OTHER_VALUE }];

// Roles allowed to create a listing at all — matches manage-own-listings /
// manage-org-listings in RolesAndPermissionsSeeder. private_buyer and trade_buyer hold
// neither, so StoreVehicleRequest/StoreListingRequest would 403 them regardless of what
// they fill in — checked here too so they see why up front, not after filling in the form.

/**
 * FR-C-003's ID-verification gate only blocks a *private* seller going live
 * (ListingLifecycleService::assertSellerMayGoLive) — never a dealer.
 */
function IdentityVerificationGate() {
  const { status, loading, submitting, error, submit } = useIdentityVerification();
  const [documentType, setDocumentType] = useState<"passport" | "driving_licence">("passport");
  const [documentNumber, setDocumentNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [open, setOpen] = useState(false);

  if (loading || !status || !status.requiredToList || status.status === "verified") {
    return null;
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    const failure = await submit({ documentType, documentNumber, dateOfBirth });
    if (!failure) setOpen(false);
  }

  return (
    <div>
      <Notice tone="warning">
        <p className="mb-2">
          <b>Identity verification required.</b> Private sellers must verify their identity
          before a listing can go live — you can still save a draft and upload photos first.
        </p>
        {!open ? (
          <button type="button" className="ha-btn" onClick={() => setOpen(true)}>
            Verify my identity
          </button>
        ) : (
          <form onSubmit={handleVerify} className="ha-form-grid">
            <div className="ha-field">
              <label htmlFor="idv_document_type">Document type</label>
              <Select id="idv_document_type"
                options={[
                  { label: "Passport", value: "passport" },
                  { label: "Driving licence", value: "driving_licence" },
                ]}
                defaultValue="passport"
                onChange={(value) => setDocumentType(value as "passport" | "driving_licence")}
              />
            </div>
            <div className="ha-field">
              <label htmlFor="idv_document_number">Document number</label>
              <input
                id="idv_document_number"
                type="text"
                className="ha-input"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                required
              />
            </div>
            <div className="ha-field">
              <label htmlFor="idv_dob">Date of birth</label>
              <input
                id="idv_dob"
                type="date"
                className="ha-input"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            <div className="ha-field" style={{ alignSelf: "end" }}>
              <button className="ha-btn is-primary" type="submit" disabled={submitting}>
                {submitting ? "Verifying…" : "Submit"}
              </button>
            </div>
          </form>
        )}
        {error && <p className="ha-error-text mt-2" role="alert">{error}</p>}
      </Notice>
    </div>
  );
}

/**
 * FR-C-020: SubscriptionService::assertCanCreateListing blocks a dealer org with no active
 * subscription row (status='active') from creating a listing — shown up front here, before
 * they fill in the whole form, rather than as a submit-time error.
 */
function SubscriptionRequiredNotice() {
  const { subscription, loading, isDealer } = useOrganizationSubscription();

  if (!isDealer || loading || subscription !== null) {
    return null;
  }

  return (
    <div>
      <Notice tone="warning">
        <p className="mb-2">
          <b>No active subscription.</b> Your dealership needs an active subscription plan
          before you can list a vehicle — choose a plan to get started.
        </p>
        <Link href="/subscription" className="ha-btn">
          Choose a subscription plan
        </Link>
      </Notice>
    </div>
  );
}

function AddListing() {
  const router = useRouter();
  const { user } = useAuth();

  // Step 1: vehicle spec — becomes read-only once the vehicle record exists (step 2).
  const [step, setStep] = useState<"spec" | "price">("spec");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [creatingVehicle, setCreatingVehicle] = useState(false);

  const [vrm, setVrm] = useState("");
  const { lookup: lookupVrm, loading: vrmLoading, error: vrmError } = useVrmLookup();
  const [vrmMessage, setVrmMessage] = useState<string | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [derivative, setDerivative] = useState("");
  const [vin, setVin] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [v5cStatus, setV5cStatus] = useState("");
  const [extras, setExtras] = useState<ExtrasForm>(EMPTY_EXTRAS);
  const [doors, setDoors] = useState<number | "">("");
  const [seats, setSeats] = useState<number | "">("");
  const [colour, setColour] = useState("");
  // Sticky once chosen, so the free-text box doesn't disappear the moment it's cleared back
  // to "" while typing — the `|| (colour && !known)` half also catches a VRM-prefilled colour
  // that isn't one of the 6 presets, so that shows as "Other" + the real value too.
  const [useCustomColour, setUseCustomColour] = useState(false);
  const showCustomColourInput = useCustomColour || (colour !== "" && !COLOR_OPTIONS.some((option) => option.value === colour));
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("fixed");
  const [description, setDescription] = useState("");

  const { suggestion, loading: suggestionLoading, fetchSuggestion } = usePricingSuggestion();

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [video, setVideo] = useState<VideoSelection>(null);
  const [spinFrames, setSpinFrames] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { upload: uploadFileResumable, uploading: fileUploading, progress: fileUploadProgress, clearSession: clearFileUploadSession } = useResumableUpload();
  const [photoUploadStatus, setPhotoUploadStatus] = useState<string | null>(null);

  const handlePhotosChange = useCallback((files: File[]) => {
    setPhotoFiles(files);
  }, []);

  async function handleVrmLookup() {
    setVrmMessage(null);
    const preview = await lookupVrm(vrm);
    if (!preview) return;

    if (preview.make) setMake(preview.make);
    if (preview.model) setModel(preview.model);
    if (preview.colour) setColour(preview.colour.toLowerCase());
    if (preview.fuelType) setFuelType(preview.fuelType);
    setVrmMessage("Prefilled from the plate lookup — check everything before continuing.");
  }

  async function handleContinueToPricing(event: FormEvent) {
    event.preventDefault();
    setError(null);

    // Body/Year/Transmission/Fuel type use the custom NiceSelect dropdown, which isn't a
    // real <select> — the browser's `required` attribute can't validate it, so an unselected
    // dropdown would otherwise sail past submission and fail as an opaque 422 from the API.
    if (!bodyType || !year || !transmission || !fuelType) {
      setError("Please select a body type, year, transmission and fuel type.");
      return;
    }

    // FR-F-011: a listing can't go live without the V5C status, so ask before creating anything
    // rather than leaving a draft car behind when publishing is refused.
    if (!v5cStatus) {
      setError("Please say whether you have the V5C (logbook) or have applied for one.");
      return;
    }

    setCreatingVehicle(true);
    try {
      const vehicleResponse = await apiFetch<ApiVehicle>("/vehicles", {
        method: "POST",
        body: {
          make,
          model,
          derivative: derivative || undefined,
          vin: vin || undefined,
          current_vrm: vrm || undefined,
          body_type: bodyType,
          fuel_type: fuelType,
          transmission,
          v5c_status: v5cStatus,
          // Additional specs + features checklist (only what the seller filled in).
          ...extrasToCreatePayload(extras),
          colour: colour || undefined,
          doors: doors === "" ? undefined : doors,
          seats: seats === "" ? undefined : seats,
          year: Number(year),
          current_mileage: Number(mileage),
        },
      });

      setVehicleId(vehicleResponse.data.id);
      setStep("price");
      fetchSuggestion(vehicleResponse.data.id);
    } catch (err) {
      setError(describeApiError(err, "Could not save these vehicle details right now."));
    } finally {
      setCreatingVehicle(false);
    }
  }

  async function submitListing(publish: boolean) {
    if (!vehicleId) return;
    setError(null);
    setSubmitting(true);

    try {
      // FR-A-010: every still, same as the video below, goes through a resumable chunked
      // session — any one of up to 100 photos can hit a dropped mobile connection, not just
      // the single video.
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        setPhotoUploadStatus(`Uploading photo ${i + 1} of ${photoFiles.length}...`);
        const uploadSessionId = await uploadFileResumable(file);
        if (!uploadSessionId) {
          setError(`Could not upload photo ${i + 1}. Please try again.`);
          setSubmitting(false);
          setPhotoUploadStatus(null);
          return;
        }
        await apiFetch(`/vehicles/${vehicleId}/photos/from-upload`, {
          method: "POST",
          body: { upload_session_id: uploadSessionId },
        });
        clearFileUploadSession(file);
      }
      setPhotoUploadStatus(null);

      if (video) {
        // Uploaded in chunks against a resumable session — if this tab reloads mid-upload,
        // re-selecting the same file resumes from whichever chunks already landed instead of
        // starting over.
        const uploadSessionId = await uploadFileResumable(video.file);
        if (!uploadSessionId) {
          setError("Could not upload the video. Please try again.");
          setSubmitting(false);
          return;
        }
        await apiFetch(`/vehicles/${vehicleId}/videos/from-upload`, {
          method: "POST",
          body: { upload_session_id: uploadSessionId, duration_seconds: video.durationSeconds },
        });
        clearFileUploadSession(video.file);
      }

      if (spinFrames.length > 0) {
        const formData = new FormData();
        spinFrames.forEach((frame) => formData.append("frames[]", frame));
        await apiFetch(`/vehicles/${vehicleId}/spin-sets`, {
          method: "POST",
          body: formData,
        });
      }

      const listingResponse = await apiFetch<ApiListing>("/listings", {
        method: "POST",
        body: {
          vehicle_master_record_id: vehicleId,
          price: Number(price),
          price_type: priceType,
          description: description || undefined,
        },
      });

      // FR-C-001: a new listing is submitted for review — a moderator checks it and puts it live.
      if (publish) {
        await apiFetch(`/listings/${listingResponse.data.id}`, {
          method: "PATCH",
          body: { status: "pending_checks" },
        });
      }

      router.push(publish ? "/my-listing?submitted=1" : "/my-listing");
    } catch (err) {
      setError(describeApiError(err, "Could not create this listing right now."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitListing(true);
  }

  // SRS §2.2: listing is a seller capability (P2 private seller, P3 dealer staff).
  const canSell = canAny(user, ["manage-own-listings", "manage-org-listings"]);

  if (!canSell) {
    return (
      <DashboardPage title="Add listing">
        <Card>
          <EmptyState
            icon="icon-carus-car"
            title="Listing isn't available on this account"
            text="Your account type doesn't support creating listings. Only private sellers and dealer accounts can list a vehicle."
          />
        </Card>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title="Add listing"
      description={step === "spec" ? "Tell buyers about your car. You'll add photos and a price next." : "Add photos and set your price, then submit for review."}
    >
      {user?.user_type === "private_seller" && <IdentityVerificationGate />}
      <SubscriptionRequiredNotice />

      <ol className="ha-steps" aria-label="Progress">
        <li className={step === "spec" ? "is-current" : "is-done"} aria-current={step === "spec" ? "step" : undefined}>
          <span aria-hidden="true">{step === "spec" ? "1" : "✓"}</span> Vehicle details
        </li>
        <li className={step === "spec" ? undefined : "is-current"} aria-current={step === "spec" ? undefined : "step"}>
          <span aria-hidden="true">2</span> Photos &amp; price
        </li>
      </ol>

                  {step === "spec" ? (
                    <form onSubmit={handleContinueToPricing}>
                      <Card className="mb-4" title="Find your car by number plate" description="Optional — fills in the details below for you.">
                      <div className="ha-card-body">
                        <div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_vrm">Number plate (optional)</label>
                            <div className="ha-actions is-start" style={{ flexWrap: "nowrap", maxWidth: 420 }}>
                              <input
                                id="add_listing_vrm"
                                type="text"
                                className="ha-input"
                                placeholder="e.g. AB12 CDE"
                                value={vrm}
                                onChange={(e) => setVrm(e.target.value)}
                                maxLength={10}
                              />
                              <button
                                type="button"
                                className="ha-btn"
                                disabled={!vrm.trim() || vrmLoading}
                                onClick={handleVrmLookup}
                              >
                                {vrmLoading ? "Looking up..." : "Look up"}
                              </button>
                            </div>
                            {vrmMessage && <p className="ha-hint mt-1" role="status">{vrmMessage}</p>}
                            {vrmError && <p className="ha-error-text mt-1" role="alert">{vrmError}</p>}
                          </div>
                        </div>
                      </div>
                      </Card>
                      <Card className="mb-4" title="Car details" description="Fields marked * are required.">
                      <div className="ha-card-body">
                        <div className="ha-form-grid">
                          <div className="ha-field">
                            <label htmlFor="add_listing_make">Make *</label>
                            <input
                              id="add_listing_make"
                              type="text"
                              className="ha-input"
                              placeholder="e.g. Ford"
                              value={make}
                              onChange={(e) => setMake(e.target.value)}
                              required
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_model">Model *</label>
                            <input
                              id="add_listing_model"
                              type="text"
                              className="ha-input"
                              placeholder="e.g. Focus"
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              required
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_body">Body *</label>
                            <Select id="add_listing_body"
                              options={ADD_LISTING_BODY_TYPE_OPTIONS}
                              value={bodyType}
                              defaultValue=""
                              onChange={(value) => setBodyType(String(value))}
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_year">Year *</label>
                            <Select id="add_listing_year"
                              options={ADD_LISTING_YEAR_OPTIONS}
                              defaultValue=""
                              onChange={(value) => setYear(String(value))}
                            />
                          </div>
                        </div>
                        <div className="ha-form-grid">
                          <div className="ha-field">
                            <label htmlFor="add_listing_derivative">Trim / derivative</label>
                            <input
                              id="add_listing_derivative"
                              type="text"
                              className="ha-input"
                              placeholder="e.g. Titanium"
                              value={derivative}
                              onChange={(e) => setDerivative(e.target.value)}
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_vin">VIN</label>
                            <input
                              id="add_listing_vin"
                              type="text"
                              className="ha-input"
                              placeholder="Leave blank if unknown"
                              value={vin}
                              onChange={(e) => setVin(e.target.value)}
                              maxLength={17}
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_mileage">Mileage (miles) *</label>
                            <input
                              id="add_listing_mileage"
                              type="number"
                              className="ha-input"
                              placeholder="e.g. 32000"
                              value={mileage}
                              onChange={(e) => setMileage(e.target.value)}
                              required
                              min={0}
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_transmission">Transmission *</label>
                            <Select id="add_listing_transmission"
                              options={ADD_LISTING_TRANSMISSION_OPTIONS}
                              value={transmission}
                              defaultValue=""
                              onChange={(value) => setTransmission(String(value))}
                            />
                          </div>
                        </div>
                        <div className="ha-form-grid">
                          <div className="ha-field">
                            <label htmlFor="add_listing_fuel">Fuel type *</label>
                            <Select id="add_listing_fuel"
                              options={ADD_LISTING_FUEL_TYPE_OPTIONS}
                              value={fuelType}
                              defaultValue=""
                              onChange={(value) => setFuelType(String(value))}
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_v5c">V5C (logbook) *</label>
                            <Select id="add_listing_v5c"
                              options={ADD_LISTING_V5C_STATUS_OPTIONS}
                              value={v5cStatus}
                              defaultValue=""
                              onChange={(value) => setV5cStatus(String(value))}
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_doors">Doors</label>
                            <Select id="add_listing_doors"
                              options={DOOR_OPTIONS}
                              defaultValue=""
                              onChange={(value) => setDoors(value === "" ? "" : Number(value))}
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_seats">Seats</label>
                            <Select id="add_listing_seats"
                              options={SEAT_OPTIONS}
                              defaultValue=""
                              onChange={(value) => setSeats(value === "" ? "" : Number(value))}
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_color">Color</label>
                            <Select id="add_listing_color"
                              options={COLOR_OPTIONS_WITH_OTHER}
                              value={showCustomColourInput ? COLOR_OTHER_VALUE : colour}
                              defaultValue=""
                              onChange={(value) => {
                                if (value === COLOR_OTHER_VALUE) {
                                  setUseCustomColour(true);
                                  setColour("");
                                } else {
                                  setUseCustomColour(false);
                                  setColour(String(value));
                                }
                              }}
                            />
                            {showCustomColourInput && (
                              <input
                                type="text"
                                className="ha-input mt-2"
                                aria-label="Colour"
                                placeholder="e.g. British Racing Green"
                                maxLength={40}
                                value={colour}
                                onChange={(e) => setColour(e.target.value)}
                                autoFocus
                              />
                            )}
                          </div>
                        </div>
                        <div className="ha-field">
                          <label htmlFor="add_listing_description">Description</label>
                          <textarea
                            id="add_listing_description"
                            className="ha-textarea"
                            placeholder="Your description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                      </div>
                      </Card>

                      {/* Optional: buyers see these under Specifications / Features on the listing. */}
                      <FeaturesSpecsFields value={extras} onChange={setExtras} />

                      {error && <Notice tone="danger">{error}</Notice>}

                      <div className="ha-form-footer">
                        <button className="ha-btn is-primary" type="submit" disabled={creatingVehicle} aria-busy={creatingVehicle}>
                          {creatingVehicle ? "Saving…" : "Continue to photos & price"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <Card className="mb-4" title="Photos, video and documents">
                        <div className="ha-card-body hd-template-section">
                          <PhotoGuidanceChecklist />
                          <UploadPhotoSection onPhotosChange={handlePhotosChange} />
                          <UploadVideoSpinSection onVideoChange={setVideo} onSpinFramesChange={setSpinFrames} />
                          <AttachmentsSection />
                        </div>
                      </Card>
                      <Card className="mb-4" title="Price">
                      <div className="ha-card-body">
                        {suggestionLoading && <p className="ha-sub" role="status">Getting a pricing suggestion…</p>}
                        {suggestion && suggestion.suggestedPrice !== null && (
                          <Notice tone="info">
                            Similar cars suggest around{" "}
                            <b>{formatMoney(suggestion.suggestedPrice)}</b>
                            {suggestion.rangeLow !== null && suggestion.rangeHigh !== null && (
                              <> ({formatMoney(suggestion.rangeLow)}–{formatMoney(suggestion.rangeHigh)})</>
                            )}
                            , based on {suggestion.comparables} comparable listing
                            {suggestion.comparables === 1 ? "" : "s"}.{" "}
                            <button
                              type="button"
                              className="ha-btn is-sm"
                              onClick={() => setPrice(String(suggestion.suggestedPrice))}
                            >
                              Use this price
                            </button>
                          </Notice>
                        )}
                        {suggestion && suggestion.suggestedPrice === null && suggestion.message && (
                          <Notice tone="info">{suggestion.message}</Notice>
                        )}
                        <div className="ha-form-grid">
                          <div className="ha-field">
                            <label htmlFor="add_listing_price">Price *</label>
                            <input
                              id="add_listing_price"
                              type="number"
                              className="ha-input"
                              placeholder="Your price"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              required
                              min={0}
                            />
                          </div>
                          <div className="ha-field">
                            <label htmlFor="add_listing_price_type">Price type *</label>
                            <Select id="add_listing_price_type"
                              options={ADD_LISTING_PRICE_TYPE_OPTIONS}
                              defaultValue="fixed"
                              onChange={(value) => setPriceType(String(value))}
                            />
                          </div>
                        </div>
                      </div>
                      </Card>

                      {error && <Notice tone="danger">{error}</Notice>}
                      {(photoUploadStatus || fileUploading) && (
                        <div className="mb-3" role="status" aria-live="polite">
                          <div className="ha-sub mb-1">
                            {photoUploadStatus ?? "Uploading video…"} {fileUploading ? `${fileUploadProgress}%` : ""}
                          </div>
                          {fileUploading && (
                            <div className="ha-meter" role="progressbar" aria-label="Upload progress" aria-valuenow={fileUploadProgress} aria-valuemin={0} aria-valuemax={100}>
                              <span style={{ width: `${fileUploadProgress}%` }} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="ha-form-footer">
                        <button className="ha-btn is-primary" type="submit" disabled={submitting} aria-busy={submitting}>
                          {submitting ? "Submitting…" : "Submit for review"}
                        </button>
                        <button className="ha-btn" type="button" disabled={submitting} onClick={() => submitListing(false)}>
                          Save as draft
                        </button>
                        <button className="ha-btn is-ghost" type="button" disabled={submitting} onClick={() => setStep("spec")} style={{ marginLeft: "auto" }}>
                          ← Back to vehicle details
                        </button>
                      </div>
                    </form>
                  )}
    </DashboardPage>
  );
}

export default AddListing;

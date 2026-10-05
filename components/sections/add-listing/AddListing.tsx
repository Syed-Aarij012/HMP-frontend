"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import NiceSelect from "@/components/common/NiceSelect";
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
import { useAuth } from "@/contexts/AuthContext";
import { useResumableUpload } from "@/hooks/useResumableUpload";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
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

type ApiVehicle = { data: { id: string } };
type ApiListing = { data: { id: string } };

// Roles allowed to create a listing at all — matches manage-own-listings /
// manage-org-listings in RolesAndPermissionsSeeder. private_buyer and trade_buyer hold
// neither, so StoreVehicleRequest/StoreListingRequest would 403 them regardless of what
// they fill in — checked here too so they see why up front, not after filling in the form.
const SELLER_USER_TYPES = ["private_seller", "dealer_user"];

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
    <div className="tfcl-add-listing">
      <div className="alert alert-warning">
        <p className="mb-2">
          <b>Identity verification required.</b> Private sellers must verify their identity
          before a listing can go live — you can still save a draft and upload photos first.
        </p>
        {!open ? (
          <button type="button" className="second-btn" onClick={() => setOpen(true)}>
            Verify my identity
          </button>
        ) : (
          <form onSubmit={handleVerify} className="form-group-4">
            <div className="form-group">
              <label htmlFor="idv_document_type">Document type</label>
              <NiceSelect
                options={[
                  { label: "Passport", value: "passport" },
                  { label: "Driving licence", value: "driving_licence" },
                ]}
                defaultValue="passport"
                className="form-control"
                onChange={(value) => setDocumentType(value as "passport" | "driving_licence")}
              />
            </div>
            <div className="form-group">
              <label htmlFor="idv_document_number">Document number</label>
              <input
                id="idv_document_number"
                type="text"
                className="form-control"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="idv_dob">Date of birth</label>
              <input
                id="idv_dob"
                type="date"
                className="form-control"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ alignSelf: "end" }}>
              <button className="pre-btn" type="submit" disabled={submitting}>
                {submitting ? "Verifying..." : "Submit"}
              </button>
            </div>
          </form>
        )}
        {error && <p className="text-color-1 mt-2">{error}</p>}
      </div>
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

      if (publish) {
        await apiFetch(`/listings/${listingResponse.data.id}`, {
          method: "PATCH",
          body: { status: "live" },
        });
      }

      router.push("/my-listing");
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

  const canSell = Boolean(user && SELLER_USER_TYPES.includes(user.user_type));

  if (!canSell) {
    return (
      <div id="themesflat-content">
        <DashboardToggle />
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="content-area">
                <main id="main" className="main-content">
                  <div className="tfcl-dashboard">
                    <h1 className="admin-title mb-3">Add listing</h1>
                    <p>
                      Your account type doesn&apos;t support creating listings. Only
                      private sellers and dealer accounts can list a vehicle.
                    </p>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="themesflat-content">
        <DashboardToggle />
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="content-area">
                <main id="main" className="main-content">
                  {user?.user_type === "private_seller" && <IdentityVerificationGate />}

                  {step === "spec" ? (
                    <form className="tfcl-dashboard add-list" onSubmit={handleContinueToPricing}>
                      <h1 className="admin-title mb-3">Add listing</h1>
                      <div className="tfcl-add-listing car-details">
                        <h3>Find your car by number plate</h3>
                        <div className="form-group-4">
                          <div className="form-group">
                            <label htmlFor="add_listing_vrm">Number plate (optional)</label>
                            <div className="flex gap-10">
                              <input
                                id="add_listing_vrm"
                                type="text"
                                className="form-control"
                                placeholder="e.g. AB12 CDE"
                                value={vrm}
                                onChange={(e) => setVrm(e.target.value)}
                                maxLength={10}
                              />
                              <button
                                type="button"
                                className="second-btn"
                                disabled={!vrm.trim() || vrmLoading}
                                onClick={handleVrmLookup}
                              >
                                {vrmLoading ? "Looking up..." : "Look up"}
                              </button>
                            </div>
                            {vrmMessage && <p className="text-color-1 mt-1">{vrmMessage}</p>}
                            {vrmError && <p className="text-color-1 mt-1">{vrmError}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="tfcl-add-listing car-details">
                        <h3>Car details</h3>
                        <div className="form-group-4">
                          <div className="form-group">
                            <label htmlFor="add_listing_make">Make *</label>
                            <input
                              id="add_listing_make"
                              type="text"
                              className="form-control"
                              placeholder="e.g. Ford"
                              value={make}
                              onChange={(e) => setMake(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_model">Model *</label>
                            <input
                              id="add_listing_model"
                              type="text"
                              className="form-control"
                              placeholder="e.g. Focus"
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_body">Body *</label>
                            <NiceSelect
                              options={ADD_LISTING_BODY_TYPE_OPTIONS}
                              value={bodyType}
                              defaultValue=""
                              className="form-control"
                              onChange={(value) => setBodyType(String(value))}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_year">Year *</label>
                            <NiceSelect
                              options={ADD_LISTING_YEAR_OPTIONS}
                              defaultValue=""
                              className="form-control"
                              onChange={(value) => setYear(String(value))}
                            />
                          </div>
                        </div>
                        <div className="form-group-4">
                          <div className="form-group">
                            <label htmlFor="add_listing_derivative">Trim / derivative</label>
                            <input
                              id="add_listing_derivative"
                              type="text"
                              className="form-control"
                              placeholder="e.g. Titanium"
                              value={derivative}
                              onChange={(e) => setDerivative(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_vin">VIN</label>
                            <input
                              id="add_listing_vin"
                              type="text"
                              className="form-control"
                              placeholder="Leave blank if unknown"
                              value={vin}
                              onChange={(e) => setVin(e.target.value)}
                              maxLength={17}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_mileage">Mileage (miles) *</label>
                            <input
                              id="add_listing_mileage"
                              type="number"
                              className="form-control"
                              placeholder="e.g. 32000"
                              value={mileage}
                              onChange={(e) => setMileage(e.target.value)}
                              required
                              min={0}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_transmission">Transmission *</label>
                            <NiceSelect
                              options={ADD_LISTING_TRANSMISSION_OPTIONS}
                              value={transmission}
                              defaultValue=""
                              className="form-control"
                              onChange={(value) => setTransmission(String(value))}
                            />
                          </div>
                        </div>
                        <div className="form-group-4">
                          <div className="form-group">
                            <label htmlFor="add_listing_fuel">Fuel type *</label>
                            <NiceSelect
                              options={ADD_LISTING_FUEL_TYPE_OPTIONS}
                              value={fuelType}
                              defaultValue=""
                              className="form-control"
                              onChange={(value) => setFuelType(String(value))}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_v5c">V5C (logbook) *</label>
                            <NiceSelect
                              options={ADD_LISTING_V5C_STATUS_OPTIONS}
                              value={v5cStatus}
                              defaultValue=""
                              className="form-control"
                              onChange={(value) => setV5cStatus(String(value))}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_doors">Doors</label>
                            <NiceSelect
                              options={DOOR_OPTIONS}
                              defaultValue=""
                              className="form-control"
                              onChange={(value) => setDoors(value === "" ? "" : Number(value))}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_seats">Seats</label>
                            <NiceSelect
                              options={SEAT_OPTIONS}
                              defaultValue=""
                              className="form-control"
                              onChange={(value) => setSeats(value === "" ? "" : Number(value))}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="add_listing_color">Color</label>
                            <NiceSelect
                              options={COLOR_OPTIONS}
                              value={colour}
                              defaultValue=""
                              className="form-control"
                              onChange={(value) => setColour(String(value))}
                            />
                          </div>
                        </div>
                        <div className="form-group mb-0">
                          <label htmlFor="add_listing_description">Description</label>
                          <textarea
                            id="add_listing_description"
                            className="form-control"
                            placeholder="Your description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Optional: buyers see these under Specifications / Features on the listing. */}
                      <FeaturesSpecsFields value={extras} onChange={setExtras} />

                      {error && <div className="alert alert-danger">{error}</div>}

                      <div className="group-button-submit">
                        <button className="pre-btn" type="submit" disabled={creatingVehicle}>
                          {creatingVehicle ? "Saving..." : "Continue to pricing & photos"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form className="tfcl-dashboard add-list" onSubmit={handleSubmit}>
                      <h1 className="admin-title mb-3">Add listing</h1>
                      <PhotoGuidanceChecklist />
                      <UploadPhotoSection onPhotosChange={handlePhotosChange} />
                      <UploadVideoSpinSection onVideoChange={setVideo} onSpinFramesChange={setSpinFrames} />
                      <AttachmentsSection />
                      <div className="tfcl-add-listing car-price">
                        <h3>Car price</h3>
                        {suggestionLoading && <p>Getting a pricing suggestion...</p>}
                        {suggestion && suggestion.suggestedPrice !== null && (
                          <div className="alert alert-info mb-3">
                            Similar cars suggest around{" "}
                            <b>£{suggestion.suggestedPrice.toLocaleString()}</b>
                            {suggestion.rangeLow !== null && suggestion.rangeHigh !== null && (
                              <> (£{suggestion.rangeLow.toLocaleString()}–£{suggestion.rangeHigh.toLocaleString()})</>
                            )}
                            , based on {suggestion.comparables} comparable listing
                            {suggestion.comparables === 1 ? "" : "s"}.{" "}
                            <button
                              type="button"
                              className="second-btn"
                              onClick={() => setPrice(String(suggestion.suggestedPrice))}
                            >
                              Use this price
                            </button>
                          </div>
                        )}
                        {suggestion && suggestion.suggestedPrice === null && suggestion.message && (
                          <p className="tfcl-empty-data mb-2">{suggestion.message}</p>
                        )}
                        <div className="grid-2 gap-30">
                          <div className="form-group mb-0">
                            <label htmlFor="add_listing_price">Price *</label>
                            <input
                              id="add_listing_price"
                              type="number"
                              className="form-control"
                              placeholder="Your price"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              required
                              min={0}
                            />
                          </div>
                          <div className="form-group mb-0">
                            <label htmlFor="add_listing_price_type">Price type *</label>
                            <NiceSelect
                              options={ADD_LISTING_PRICE_TYPE_OPTIONS}
                              defaultValue="fixed"
                              className="form-control"
                              onChange={(value) => setPriceType(String(value))}
                            />
                          </div>
                        </div>
                      </div>

                      {error && <div className="alert alert-danger">{error}</div>}
                      {photoUploadStatus && <p className="text-color-1">{photoUploadStatus} {fileUploading ? `(${fileUploadProgress}%)` : ""}</p>}
                      {!photoUploadStatus && fileUploading && <p className="text-color-1">Uploading video... {fileUploadProgress}%</p>}

                      <div className="group-button-submit">
                        <button className="pre-btn" type="submit" disabled={submitting}>
                          {submitting ? "Submitting..." : "List Now"}
                        </button>
                        <button
                          className="second-btn"
                          type="button"
                          disabled={submitting}
                          onClick={() => submitListing(false)}
                        >
                          Save as Draft
                        </button>
                        <button
                          className="second-btn"
                          type="button"
                          disabled={submitting}
                          onClick={() => setStep("spec")}
                        >
                          Back to vehicle details
                        </button>
                      </div>
                    </form>
                  )}
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddListing;

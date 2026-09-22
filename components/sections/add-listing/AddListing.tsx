"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import NiceSelect from "@/components/common/NiceSelect";
import AttachmentsSection from "@/components/sections/add-listing/AttachmentsSection";
import UploadPhotoSection from "@/components/sections/add-listing/UploadPhotoSection";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, describeApiError } from "@/lib/api-client";
import {
  ADD_LISTING_BODY_TYPE_OPTIONS,
  ADD_LISTING_FUEL_TYPE_OPTIONS,
  ADD_LISTING_PRICE_TYPE_OPTIONS,
  ADD_LISTING_TRANSMISSION_OPTIONS,
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

function AddListing() {
  const router = useRouter();
  const { user } = useAuth();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [derivative, setDerivative] = useState("");
  const [vin, setVin] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [doors, setDoors] = useState<number | "">("");
  const [seats, setSeats] = useState<number | "">("");
  const [colour, setColour] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("fixed");
  const [description, setDescription] = useState("");

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotosChange = useCallback((files: File[]) => {
    setPhotoFiles(files);
  }, []);

  async function submitListing(publish: boolean) {
    setError(null);

    // Body/Year/Transmission/Fuel type use the custom NiceSelect dropdown, which isn't a
    // real <select> — the browser's `required` attribute can't validate it, so an unselected
    // dropdown would otherwise sail past submission and fail as an opaque 422 from the API.
    if (!bodyType || !year || !transmission || !fuelType) {
      setError("Please select a body type, year, transmission and fuel type.");
      return;
    }

    setSubmitting(true);

    try {
      const vehicleResponse = await apiFetch<ApiVehicle>("/vehicles", {
        method: "POST",
        body: {
          make,
          model,
          derivative: derivative || undefined,
          vin: vin || undefined,
          body_type: bodyType,
          fuel_type: fuelType,
          transmission,
          colour: colour || undefined,
          doors: doors === "" ? undefined : doors,
          seats: seats === "" ? undefined : seats,
          year: Number(year),
          current_mileage: Number(mileage),
        },
      });

      for (const file of photoFiles) {
        const formData = new FormData();
        formData.append("photo", file);
        await apiFetch(`/vehicles/${vehicleResponse.data.id}/photos`, {
          method: "POST",
          body: formData,
        });
      }

      const listingResponse = await apiFetch<ApiListing>("/listings", {
        method: "POST",
        body: {
          vehicle_master_record_id: vehicleResponse.data.id,
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
                  <form className="tfcl-dashboard add-list" onSubmit={handleSubmit}>
                    <h1 className="admin-title mb-3">Add listing</h1>
                    <UploadPhotoSection onPhotosChange={handlePhotosChange} />
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
                            defaultValue=""
                            className="form-control"
                            onChange={(value) => setFuelType(String(value))}
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
                    <AttachmentsSection />
                    <div className="tfcl-add-listing car-price">
                      <h3>Car price</h3>
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
                    </div>
                  </form>
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

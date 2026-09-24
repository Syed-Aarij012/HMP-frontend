"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import NiceSelect from "@/components/common/NiceSelect";
import UploadPhotoSection from "@/components/sections/add-listing/UploadPhotoSection";
import UploadVideoSpinSection, {
  type VideoSelection,
} from "@/components/sections/add-listing/UploadVideoSpinSection";
import { useCreateTradeFixedPriceListing } from "@/hooks/useCreateTradeFixedPriceListing";
import {
  ADD_LISTING_BODY_TYPE_OPTIONS,
  ADD_LISTING_FUEL_TYPE_OPTIONS,
  ADD_LISTING_TRANSMISSION_OPTIONS,
  ADD_LISTING_YEAR_OPTIONS,
} from "@/data/niceSelectOptions";

/**
 * FR-A-030 (M): self-service listing on the Fixed-Price Trade ("Buy Now") channel — same
 * vehicle self-declaration as Consign Vehicle, priced as an instant-buy asking price instead
 * of an auction reserve.
 */
function ListFixedPrice() {
  const router = useRouter();
  const { create, submitting, error } = useCreateTradeFixedPriceListing();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [derivative, setDerivative] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [colour, setColour] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [video, setVideo] = useState<VideoSelection>(null);
  const [spinFrames, setSpinFrames] = useState<File[]>([]);

  const handlePhotosChange = useCallback((files: File[]) => {
    setPhotoFiles(files);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!bodyType || !fuelType || !transmission || !year || !askingPrice) {
      setFormError("Please select a body type, year, fuel type, transmission and asking price.");
      return;
    }

    try {
      const listing = await create({
        make,
        model,
        derivative: derivative || undefined,
        bodyType,
        fuelType,
        transmission,
        colour: colour || undefined,
        year: Number(year),
        mileage: Number(mileage),
        askingPrice: Number(askingPrice),
        photoFiles,
        video,
        spinFrames,
      });
      router.push(`/my-fixed-price-listings?created=${listing.id}`);
    } catch {
      // `error` from the hook already carries the server's reason.
    }
  }

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <form className="tfcl-dashboard add-list" onSubmit={handleSubmit}>
                  <h1 className="admin-title mb-3">List a vehicle at a fixed price</h1>
                  <p className="text-color-1 mb-3">
                    Describe your vehicle and set an asking price. It goes live for instant
                    purchase by other trade buyers as soon as it has a published condition
                    report.
                  </p>

                  {(error || formError) && (
                    <div className="alert alert-danger mb-3">{error ?? formError}</div>
                  )}

                  <UploadPhotoSection onPhotosChange={handlePhotosChange} />
                  <UploadVideoSpinSection onVideoChange={setVideo} onSpinFramesChange={setSpinFrames} />

                  <div className="tfcl-add-listing car-details">
                    <div className="form-group-4">
                      <div className="form-group">
                        <label htmlFor="fp_make">Make *</label>
                        <input
                          id="fp_make"
                          type="text"
                          className="form-control"
                          placeholder="e.g. BMW"
                          value={make}
                          onChange={(e) => setMake(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fp_model">Model *</label>
                        <input
                          id="fp_model"
                          type="text"
                          className="form-control"
                          placeholder="e.g. X5"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fp_derivative">Trim / derivative</label>
                        <input
                          id="fp_derivative"
                          type="text"
                          className="form-control"
                          placeholder="e.g. M Sport"
                          value={derivative}
                          onChange={(e) => setDerivative(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fp_body">Body *</label>
                        <NiceSelect
                          options={ADD_LISTING_BODY_TYPE_OPTIONS}
                          defaultValue=""
                          className="form-control"
                          onChange={(value) => setBodyType(String(value))}
                        />
                      </div>
                    </div>
                    <div className="form-group-4">
                      <div className="form-group">
                        <label htmlFor="fp_year">Year *</label>
                        <NiceSelect
                          options={ADD_LISTING_YEAR_OPTIONS}
                          defaultValue=""
                          className="form-control"
                          onChange={(value) => setYear(String(value))}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fp_fuel">Fuel type *</label>
                        <NiceSelect
                          options={ADD_LISTING_FUEL_TYPE_OPTIONS}
                          defaultValue=""
                          className="form-control"
                          onChange={(value) => setFuelType(String(value))}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fp_transmission">Transmission *</label>
                        <NiceSelect
                          options={ADD_LISTING_TRANSMISSION_OPTIONS}
                          defaultValue=""
                          className="form-control"
                          onChange={(value) => setTransmission(String(value))}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fp_colour">Colour</label>
                        <input
                          id="fp_colour"
                          type="text"
                          className="form-control"
                          value={colour}
                          onChange={(e) => setColour(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group-4">
                      <div className="form-group">
                        <label htmlFor="fp_mileage">Mileage *</label>
                        <input
                          id="fp_mileage"
                          type="number"
                          min="0"
                          className="form-control"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fp_asking_price">Asking price (£) *</label>
                        <input
                          id="fp_asking_price"
                          type="number"
                          min="1"
                          className="form-control"
                          value={askingPrice}
                          onChange={(e) => setAskingPrice(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="sc-button" disabled={submitting}>
                    <span>{submitting ? "Listing..." : "List at fixed price"}</span>
                  </button>
                </form>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListFixedPrice;

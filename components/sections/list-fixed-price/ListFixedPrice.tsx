"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
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
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Card, Notice, Select } from "@/components/ui/kit";

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
    <DashboardPage
      title="List a vehicle at a fixed price"
      description="Describe your vehicle and set an asking price. It goes live for instant purchase by other trade buyers as soon as it has a published condition report."
    >
      <form onSubmit={handleSubmit}>
        <Card title="Photos and video" className="mb-4">
          <div className="ha-card-body hd-template-section">
            <UploadPhotoSection onPhotosChange={handlePhotosChange} />
            <UploadVideoSpinSection onVideoChange={setVideo} onSpinFramesChange={setSpinFrames} />
          </div>
        </Card>

        <Card title="Vehicle and price" description="Fields marked * are required." className="mb-4">
<div className="ha-card-body">
                    <div className="ha-form-grid">
                      <div className="ha-field">
                        <label htmlFor="fp_make">Make *</label>
                        <input
                          id="fp_make"
                          type="text"
                          className="ha-input"
                          placeholder="e.g. BMW"
                          value={make}
                          onChange={(e) => setMake(e.target.value)}
                          required
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="fp_model">Model *</label>
                        <input
                          id="fp_model"
                          type="text"
                          className="ha-input"
                          placeholder="e.g. X5"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          required
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="fp_derivative">Trim / derivative</label>
                        <input
                          id="fp_derivative"
                          type="text"
                          className="ha-input"
                          placeholder="e.g. M Sport"
                          value={derivative}
                          onChange={(e) => setDerivative(e.target.value)}
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="fp_body">Body *</label>
                        <Select id="fp_body"
                          options={ADD_LISTING_BODY_TYPE_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setBodyType(String(value))}
                        />
                      </div>
                    </div>
                    <div className="ha-form-grid">
                      <div className="ha-field">
                        <label htmlFor="fp_year">Year *</label>
                        <Select id="fp_year"
                          options={ADD_LISTING_YEAR_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setYear(String(value))}
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="fp_fuel">Fuel type *</label>
                        <Select id="fp_fuel"
                          options={ADD_LISTING_FUEL_TYPE_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setFuelType(String(value))}
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="fp_transmission">Transmission *</label>
                        <Select id="fp_transmission"
                          options={ADD_LISTING_TRANSMISSION_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setTransmission(String(value))}
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="fp_colour">Colour</label>
                        <input
                          id="fp_colour"
                          type="text"
                          className="ha-input"
                          value={colour}
                          onChange={(e) => setColour(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="ha-form-grid">
                      <div className="ha-field">
                        <label htmlFor="fp_mileage">Mileage *</label>
                        <input
                          id="fp_mileage"
                          type="number"
                          min="0"
                          className="ha-input"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          required
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="fp_asking_price">Asking price (£) *</label>
                        <input
                          id="fp_asking_price"
                          type="number"
                          min="1"
                          className="ha-input"
                          value={askingPrice}
                          onChange={(e) => setAskingPrice(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
        </Card>

        {(error || formError) && <Notice tone="danger">{error ?? formError}</Notice>}

        <div className="ha-form-footer">
          <button type="submit" className="ha-btn is-primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Listing…" : "List at fixed price"}
          </button>
        </div>
      </form>
    </DashboardPage>
  );
}

export default ListFixedPrice;

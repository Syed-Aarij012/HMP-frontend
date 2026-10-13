"use client";

import DashboardPage from "@/components/dashboard/DashboardPage";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import UploadPhotoSection from "@/components/sections/add-listing/UploadPhotoSection";
import UploadVideoSpinSection, {
  type VideoSelection,
} from "@/components/sections/add-listing/UploadVideoSpinSection";
import { useAuctionSales } from "@/hooks/useAuctionSales";
import { useConsignVehicle } from "@/hooks/useConsignVehicle";
import {
  ADD_LISTING_BODY_TYPE_OPTIONS,
  ADD_LISTING_FUEL_TYPE_OPTIONS,
  ADD_LISTING_TRANSMISSION_OPTIONS,
  ADD_LISTING_V5C_STATUS_OPTIONS,
  ADD_LISTING_YEAR_OPTIONS,
  VAT_STATUS_OPTIONS,
} from "@/data/niceSelectOptions";
import { Card, Notice, Select } from "@/components/ui/kit";

function ConsignVehicle() {
  const router = useRouter();
  const { sales, loading: salesLoading } = useAuctionSales();
  const { consign, submitting, error, stage } = useConsignVehicle();

  const [saleId, setSaleId] = useState<number | "">("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [derivative, setDerivative] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [colour, setColour] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [v5cStatus, setV5cStatus] = useState("");
  const [vatStatus, setVatStatus] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [video, setVideo] = useState<VideoSelection>(null);
  const [spinFrames, setSpinFrames] = useState<File[]>([]);

  const handlePhotosChange = useCallback((files: File[]) => {
    setPhotoFiles(files);
  }, []);

  const shownError = error ?? formError;
  useEffect(() => {
    if (shownError) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [shownError]);

  const openSales = sales.filter((sale) => sale.status === "scheduled");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!saleId || !bodyType || !fuelType || !transmission || !year) {
      setFormError("Please choose a sale, body type, year, fuel type and transmission.");
      return;
    }

    // Without these the lot can be cataloged but never published into the auction.
    if (!v5cStatus || !vatStatus) {
      setFormError("Please say whether you have the V5C (logbook) and what the vehicle's VAT status is.");
      return;
    }
    if (vatStatus === "margin_scheme" && acquisitionCost === "") {
      setFormError("The margin scheme needs the price you acquired the vehicle for.");
      return;
    }

    try {
      const lot = await consign({
        saleId: Number(saleId),
        make,
        model,
        derivative: derivative || undefined,
        bodyType,
        fuelType,
        transmission,
        colour: colour || undefined,
        year: Number(year),
        mileage: Number(mileage),
        v5cStatus,
        vatStatus,
        acquisitionCost: vatStatus === "margin_scheme" ? Number(acquisitionCost) : undefined,
        photoFiles,
        video,
        spinFrames,
      });
      router.push(`/auction/${lot.id}`);
    } catch {
      // `error` from the hook already carries the server's reason.
    }
  }

  return (
    <DashboardPage
      title="Consign a vehicle to auction"
      description={<>Describe your vehicle and choose an upcoming sale still accepting consignments. It enters the catalogue as &quot;cataloged&quot;, and goes live once the VAT and V5C details below are in, an inspector has published a condition report, and the auction team publishes it.</>}
    >
      <form onSubmit={handleSubmit} className="ha-form-flow">
        <Card title="Photos and video" className="mb-4">
          <div className="ha-card-body hd-template-section">
            <UploadPhotoSection onPhotosChange={handlePhotosChange} />
            <UploadVideoSpinSection onVideoChange={setVideo} onSpinFramesChange={setSpinFrames} />
          </div>
        </Card>

        <Card title="Vehicle and sale" description="Fields marked * are required." className="mb-4">
<div className="ha-card-body">
                    <div className="ha-form-grid">
                      <div className="ha-field">
                        <label htmlFor="consign_sale">Sale *</label>
                        {salesLoading ? (
                          <p className="ha-sub" role="status">Loading sales…</p>
                        ) : openSales.length === 0 ? (
                          <Notice tone="warning">No sales are currently accepting consignments.</Notice>
                        ) : (
                          <Select
                            options={[
                              { label: "Select a sale", value: "" },
                              ...openSales.map((sale) => ({ label: sale.name, value: sale.id })),
                            ]}
                            defaultValue=""
                            onChange={(value) => setSaleId(value === "" ? "" : Number(value))}
                          />
                        )}
                      </div>
                      <div className="ha-field">
                        <label htmlFor="consign_make">Make *</label>
                        <input
                          id="consign_make"
                          type="text"
                          className="ha-input"
                          placeholder="e.g. BMW"
                          value={make}
                          onChange={(e) => setMake(e.target.value)}
                          required
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="consign_model">Model *</label>
                        <input
                          id="consign_model"
                          type="text"
                          className="ha-input"
                          placeholder="e.g. X5"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          required
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="consign_derivative">Trim / derivative</label>
                        <input
                          id="consign_derivative"
                          type="text"
                          className="ha-input"
                          placeholder="e.g. M Sport"
                          value={derivative}
                          onChange={(e) => setDerivative(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="ha-form-grid">
                      <div className="ha-field">
                        <label htmlFor="consign_body">Body *</label>
                        <Select id="consign_body"
                          options={ADD_LISTING_BODY_TYPE_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setBodyType(String(value))}
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="consign_year">Year *</label>
                        <Select id="consign_year"
                          options={ADD_LISTING_YEAR_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setYear(String(value))}
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="consign_fuel">Fuel type *</label>
                        <Select id="consign_fuel"
                          options={ADD_LISTING_FUEL_TYPE_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setFuelType(String(value))}
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="consign_transmission">Transmission *</label>
                        <Select id="consign_transmission"
                          options={ADD_LISTING_TRANSMISSION_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setTransmission(String(value))}
                        />
                      </div>
                    </div>
                    <div className="ha-form-grid">
                      <div className="ha-field">
                        <label htmlFor="consign_colour">Colour</label>
                        <input
                          id="consign_colour"
                          type="text"
                          className="ha-input"
                          value={colour}
                          onChange={(e) => setColour(e.target.value)}
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="consign_mileage">Mileage *</label>
                        <input
                          id="consign_mileage"
                          type="number"
                          min="0"
                          className="ha-input"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          required
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="consign_v5c">V5C (logbook) *</label>
                        <Select id="consign_v5c"
                          options={ADD_LISTING_V5C_STATUS_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setV5cStatus(String(value))}
                        />
                      </div>
                      <div className="ha-field">
                        <label htmlFor="consign_vat">VAT status *</label>
                        <Select id="consign_vat"
                          options={VAT_STATUS_OPTIONS}
                          defaultValue=""
                          onChange={(value) => setVatStatus(String(value))}
                        />
                      </div>
                      {vatStatus === "margin_scheme" && (
                        <div className="ha-field">
                          <label htmlFor="consign_acquisition">Acquisition cost (£) *</label>
                          <input
                            id="consign_acquisition"
                            type="number"
                            min="0"
                            step="0.01"
                            className="ha-input"
                            value={acquisitionCost}
                            onChange={(e) => setAcquisitionCost(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
        </Card>

        {/* Next to the button, not at the top of this long form: after clicking Consign the
            reason for a refusal has to be on screen, not scrolled out of sight. */}
        {(error || formError) && (
          <div ref={errorRef}>
            <Notice tone="danger">{error ?? formError}</Notice>
          </div>
        )}

        <div className="ha-form-footer">
          <button type="submit" className="ha-btn is-primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? (stage ?? "Consigning…") : "Consign vehicle"}
          </button>
        </div>
      </form>
    </DashboardPage>
  );
}

export default ConsignVehicle;

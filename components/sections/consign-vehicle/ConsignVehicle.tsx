"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import NiceSelect from "@/components/common/NiceSelect";
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
  ADD_LISTING_YEAR_OPTIONS,
} from "@/data/niceSelectOptions";

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
  const [formError, setFormError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [video, setVideo] = useState<VideoSelection>(null);
  const [spinFrames, setSpinFrames] = useState<File[]>([]);

  const handlePhotosChange = useCallback((files: File[]) => {
    setPhotoFiles(files);
  }, []);

  const openSales = sales.filter((sale) => sale.status === "scheduled");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!saleId || !bodyType || !fuelType || !transmission || !year) {
      setFormError("Please choose a sale, body type, year, fuel type and transmission.");
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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <form className="tfcl-dashboard add-list" onSubmit={handleSubmit}>
                  <h1 className="admin-title mb-3">Consign a vehicle to auction</h1>
                  <p className="text-color-1 mb-3">
                    Describe your vehicle and choose an upcoming sale still accepting
                    consignments. It enters the catalog in a &quot;cataloged&quot; state until
                    it&apos;s published to a lane.
                  </p>

                  {(error || formError) && (
                    <div className="alert alert-danger mb-3">{error ?? formError}</div>
                  )}

                  <UploadPhotoSection onPhotosChange={handlePhotosChange} />
                  <UploadVideoSpinSection onVideoChange={setVideo} onSpinFramesChange={setSpinFrames} />

                  <div className="tfcl-add-listing car-details">
                    <div className="form-group-4">
                      <div className="form-group">
                        <label htmlFor="consign_sale">Sale *</label>
                        {salesLoading ? (
                          <p>Loading sales...</p>
                        ) : openSales.length === 0 ? (
                          <p className="tfcl-empty-data">No sales are currently accepting consignments.</p>
                        ) : (
                          <NiceSelect
                            options={[
                              { label: "Select a sale", value: "" },
                              ...openSales.map((sale) => ({ label: sale.name, value: sale.id })),
                            ]}
                            defaultValue=""
                            className="form-control"
                            onChange={(value) => setSaleId(value === "" ? "" : Number(value))}
                          />
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="consign_make">Make *</label>
                        <input
                          id="consign_make"
                          type="text"
                          className="form-control"
                          placeholder="e.g. BMW"
                          value={make}
                          onChange={(e) => setMake(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="consign_model">Model *</label>
                        <input
                          id="consign_model"
                          type="text"
                          className="form-control"
                          placeholder="e.g. X5"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="consign_derivative">Trim / derivative</label>
                        <input
                          id="consign_derivative"
                          type="text"
                          className="form-control"
                          placeholder="e.g. M Sport"
                          value={derivative}
                          onChange={(e) => setDerivative(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group-4">
                      <div className="form-group">
                        <label htmlFor="consign_body">Body *</label>
                        <NiceSelect
                          options={ADD_LISTING_BODY_TYPE_OPTIONS}
                          defaultValue=""
                          className="form-control"
                          onChange={(value) => setBodyType(String(value))}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="consign_year">Year *</label>
                        <NiceSelect
                          options={ADD_LISTING_YEAR_OPTIONS}
                          defaultValue=""
                          className="form-control"
                          onChange={(value) => setYear(String(value))}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="consign_fuel">Fuel type *</label>
                        <NiceSelect
                          options={ADD_LISTING_FUEL_TYPE_OPTIONS}
                          defaultValue=""
                          className="form-control"
                          onChange={(value) => setFuelType(String(value))}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="consign_transmission">Transmission *</label>
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
                        <label htmlFor="consign_colour">Colour</label>
                        <input
                          id="consign_colour"
                          type="text"
                          className="form-control"
                          value={colour}
                          onChange={(e) => setColour(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="consign_mileage">Mileage *</label>
                        <input
                          id="consign_mileage"
                          type="number"
                          min="0"
                          className="form-control"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="sc-button" disabled={submitting}>
                    <span>{submitting ? (stage ?? "Consigning...") : "Consign vehicle"}</span>
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

export default ConsignVehicle;

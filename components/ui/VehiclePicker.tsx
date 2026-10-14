"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Badge, useDebouncedValue } from "@/components/ui/kit";
import { apiFetch, describeApiError } from "@/lib/api-client";

export type PickedVehicle = {
  /** The vehicle's public ID — handled by the form, never typed or shown. */
  id: string;
  title: string;
  vrm: string | null;
  mileage: number | null;
  assigned_to: { inspector_id: number; name: string | null }[];
};

const MIN_CHARS = 2;

/**
 * Find a vehicle by typing its registration or make/model/year ("bx23", "ford focus") and pick it
 * from the list, so nobody ever types or sees a public ID. An accessible combobox: arrow keys
 * move, Enter picks, Escape closes the list. The list opens inline (not as a floating layer) so
 * it never gets clipped inside a dialog.
 */
export default function VehiclePicker({ value, onChange, endpoint = "/inspection-assignments/vehicles", label = "Vehicle", hint, inspectorId, required = false, showAssignments = true }: {
  value: PickedVehicle | null;
  onChange: (vehicle: PickedVehicle | null) => void;
  endpoint?: string;
  label?: string;
  hint?: string;
  /** Flags a result already assigned to this inspector. */
  inspectorId?: number | null;
  required?: boolean;
  /** Show which inspector a vehicle is already assigned to (only meaningful for inspections). */
  showAssignments?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const term = useDebouncedValue(query.trim(), 250);
  const searchable = term.length >= MIN_CHARS;

  useEffect(() => {
    if (value || !searchable) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      apiFetch<{ data: PickedVehicle[] }>(`${endpoint}?q=${encodeURIComponent(term)}`)
        .then((response) => {
          if (cancelled) return;
          setResults(response.data);
          setActive(0);
        })
        .catch((err) => {
          if (!cancelled) {
            setResults([]);
            setError(describeApiError(err, "Couldn't search vehicles."));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [term, searchable, value, endpoint]);

  function pick(vehicle: PickedVehicle) {
    onChange(vehicle);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setResults([]);
    queueMicrotask(() => inputRef.current?.focus());
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const showing = open && searchable && results.length > 0;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!searchable) return;
      event.preventDefault();
      setOpen(true);
      if (results.length) setActive((current) => (current + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
    } else if (event.key === "Enter" && showing) {
      event.preventDefault(); // pick, don't submit the surrounding form
      pick(results[active]);
    } else if (event.key === "Escape" && open) {
      event.stopPropagation(); // close the list, not the dialog around it
      setOpen(false);
    }
  }

  // A vehicle is chosen: show it as a card with a way to change it.
  if (value) {
    const duplicate = showAssignments && inspectorId != null && value.assigned_to.some((a) => a.inspector_id === inspectorId);
    return (
      <div className="ha-field">
        <span className="ha-label">{label}</span>
        <div className="vp-chosen">
          <div className="vp-chosen-text">
            <b>{value.title || "Vehicle"}</b>
            <span className="ha-sub">
              {value.vrm ? <span className="vp-plate">{value.vrm}</span> : "No registration"}
              {value.mileage != null && <> · {value.mileage.toLocaleString("en-GB")} mi</>}
            </span>
          </div>
          <button type="button" className="ha-btn is-sm" onClick={clear}>
            Change
          </button>
        </div>
        {duplicate ? (
          <div className="ha-hint" role="status">
            Already assigned to this inspector — assigning again won&apos;t create a duplicate.
          </div>
        ) : showAssignments && value.assigned_to.length > 0 ? (
          <div className="ha-hint" role="status">
            Also assigned to {value.assigned_to.map((a) => a.name ?? "another inspector").join(", ")}.
          </div>
        ) : null}
      </div>
    );
  }

  const listId = `${id}-list`;
  const showList = open && searchable;

  return (
    <div className="ha-field">
      <label htmlFor={`${id}-input`}>{label}</label>
      <div className="ha-search" style={{ maxWidth: "none" }}>
        <i className="icon-carus-search" aria-hidden="true" />
        <input
          ref={inputRef}
          id={`${id}-input`}
          className="ha-input"
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Registration, or make and model — e.g. BX23 or Ford Focus"
          value={query}
          required={required}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          aria-describedby={`${id}-status`}
        />
      </div>

      <div id={`${id}-status`} className="ha-visually-hidden" role="status" aria-live="polite">
        {showList && !loading && (error ?? (results.length === 0 ? "No vehicles found." : `${results.length} vehicle${results.length === 1 ? "" : "s"} found. Use the arrow keys to choose.`))}
      </div>

      {!open || !searchable ? (
        <div className="ha-hint">{hint ?? `Type at least ${MIN_CHARS} characters of the registration, make or model.`}</div>
      ) : (
        <div className="vp-panel">
          {loading && results.length === 0 ? (
            <div className="vp-note" aria-hidden="true">
              Searching…
            </div>
          ) : error ? (
            <div className="vp-note is-error">{error}</div>
          ) : results.length === 0 ? (
            <div className="vp-note">No vehicles match “{term}”. Try the registration, or just the make.</div>
          ) : (
            <ul id={listId} role="listbox" aria-label={`${label} results`} className="vp-list" style={{ opacity: loading ? 0.6 : 1 }}>
              {results.map((vehicle, index) => (
                <li
                  key={vehicle.id}
                  id={`${id}-opt-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={index === active ? "is-active" : undefined}
                  onPointerEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()} // keep focus in the input
                  onClick={() => pick(vehicle)}
                >
                  <span className="vp-plate">{vehicle.vrm ?? "No VRM"}</span>
                  <span className="vp-option-text">
                    <b>{vehicle.title || "Vehicle"}</b>
                    {vehicle.mileage != null && <span className="ha-sub">{vehicle.mileage.toLocaleString("en-GB")} mi</span>}
                  </span>
                  {showAssignments && vehicle.assigned_to.length > 0 && (
                    <Badge tone="warning" plain>
                      With {vehicle.assigned_to.length === 1 ? (vehicle.assigned_to[0].name ?? "an inspector") : `${vehicle.assigned_to.length} inspectors`}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

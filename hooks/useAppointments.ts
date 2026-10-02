"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiAppointment, type ApiAppointment } from "@/lib/mapApiMarketplaceTools";
import type { Appointment } from "@/types/marketplaceTools";

type ApiListResponse<T> = { data: T[] };

/**
 * FR-C-033: the user's test drives / dealer appointments — the ones they booked as a buyer,
 * and on the dealer side, the ones booked on their (org's) listings, which they can mark
 * completed or a no-show once the time has passed.
 */
export function useMyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    apiFetch<ApiListResponse<ApiAppointment>>("/my-appointments")
      .then((response) => {
        setAppointments(response.data.map(mapApiAppointment));
        setError(null);
      })
      .catch(() => setError("Could not load your appointments from the server."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const cancel = useCallback(
    async (appointmentId: number) => {
      setActionError(null);
      setBusyId(appointmentId);
      try {
        await apiFetch(`/appointments/${appointmentId}/cancel`, { method: "POST" });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not cancel this appointment."));
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const markOutcome = useCallback(
    async (appointmentId: number, outcome: "complete" | "no-show") => {
      setActionError(null);
      setBusyId(appointmentId);
      try {
        await apiFetch(`/appointments/${appointmentId}/${outcome}`, { method: "POST" });
        load();
      } catch (err) {
        setActionError(describeApiError(err, "Could not update this appointment."));
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  return { appointments, loading, error, actionError, busyId, cancel, markOutcome };
}

/** FR-C-033: booking a test drive on a specific listing. */
export function useBookAppointment(listingId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const submit = useCallback(
    async (scheduledAtIso: string): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await apiFetch(`/listings/${listingId}/appointments`, {
          method: "POST",
          body: { scheduled_at: scheduledAtIso },
        });
        setBooked(true);
        return true;
      } catch (err) {
        setError(describeApiError(err, "Could not book this appointment."));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [listingId],
  );

  return { submit, submitting, error, booked };
}

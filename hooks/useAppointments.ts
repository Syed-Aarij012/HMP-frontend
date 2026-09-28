"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";
import { mapApiAppointment, type ApiAppointment } from "@/lib/mapApiMarketplaceTools";
import type { Appointment } from "@/types/marketplaceTools";

type ApiListResponse<T> = { data: T[] };

/** FR-C-033: the buyer's own booked test drives / dealer appointments. */
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

  return { appointments, loading, error, actionError, busyId, cancel };
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { hasRole, useAuth } from "@/contexts/AuthContext";
import { apiFetch, describeApiError } from "@/lib/api-client";
import {
  mapApiOrganizationSubscription,
  mapApiPlanChangeProration,
  type ApiOrganizationSubscription,
  type ApiPlanChangeProration,
  type OrganizationSubscription,
  type PlanChangeProration,
} from "@/lib/mapApiOrganizationSubscription";

/**
 * FR-C-020: the signed-in dealer org's current package, its live stock-slot usage, and the
 * pro-rated upgrade/downgrade flow. Any org member can read it; only an Org Admin
 * (manage-org-subscriptions) can change it — the backend enforces that, `canManage` just
 * keeps the UI from offering an action that would 403.
 */
export function useOrganizationSubscription() {
  const { user } = useAuth();
  const organizationId = typeof user?.organization_id === "number" ? user.organization_id : null;
  const canManage = hasRole(user, "dealer_org_admin") || hasRole(user, "super_admin");
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [loading, setLoading] = useState(organizationId !== null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (organizationId === null) {
      setLoading(false);
      return;
    }

    apiFetch<{ data: ApiOrganizationSubscription | null }>(`/organizations/${organizationId}/subscription`)
      .then((response) => {
        setSubscription(response.data ? mapApiOrganizationSubscription(response.data) : null);
        setError(null);
      })
      .catch(() => setError("Could not load your subscription from the server."))
      .finally(() => setLoading(false));
  }, [organizationId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const previewChange = useCallback(
    async (subscriptionPlanId: number): Promise<{ proration: PlanChangeProration | null; error: string | null }> => {
      if (!subscription) return { proration: null, error: "No active subscription to change." };

      try {
        const response = await apiFetch<{ data: ApiPlanChangeProration }>(
          `/organization-subscriptions/${subscription.id}/change-preview?subscription_plan_id=${subscriptionPlanId}`
        );
        return { proration: mapApiPlanChangeProration(response.data), error: null };
      } catch (err) {
        return { proration: null, error: describeApiError(err, "Could not price this plan change right now.") };
      }
    },
    [subscription]
  );

  const changePlan = useCallback(
    async (subscriptionPlanId: number): Promise<{ proration: PlanChangeProration | null; error: string | null }> => {
      if (!subscription) return { proration: null, error: "No active subscription to change." };

      try {
        const response = await apiFetch<{ data: ApiOrganizationSubscription; proration: ApiPlanChangeProration }>(
          `/organization-subscriptions/${subscription.id}`,
          { method: "PATCH", body: { subscription_plan_id: subscriptionPlanId } }
        );
        setSubscription(mapApiOrganizationSubscription(response.data));
        return { proration: mapApiPlanChangeProration(response.proration), error: null };
      } catch (err) {
        return { proration: null, error: describeApiError(err, "Could not change your plan right now.") };
      }
    },
    [subscription]
  );

  return {
    subscription,
    loading,
    error,
    isDealer: organizationId !== null,
    canManage,
    previewChange,
    changePlan,
    reload: load,
  };
}

/**
 * FR-C-020 media entitlements, for disabling video/360° inputs up front rather than letting a
 * dealer upload a large file only to have it rejected. Users outside a dealer org (private
 * sellers, trade buyers) are never subject to package entitlements.
 */
export function useMediaEntitlements() {
  const { subscription, loading, isDealer } = useOrganizationSubscription();

  if (!isDealer) {
    return { loading: false, canUploadVideo: true, canUpload360: true, isDealer };
  }

  return {
    loading,
    canUploadVideo: Boolean(subscription?.plan.entitlements.media_video),
    canUpload360: Boolean(subscription?.plan.entitlements.media_360),
    isDealer,
  };
}

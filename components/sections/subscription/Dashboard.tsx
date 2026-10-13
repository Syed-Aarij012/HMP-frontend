"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrganizationSubscription } from "@/hooks/useOrganizationSubscription";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { entitlementFeatures } from "@/lib/mapApiSubscriptionPlan";
import type { MappedPricingPlan } from "@/lib/mapApiSubscriptionPlan";
import type { PlanChangeProration } from "@/lib/mapApiOrganizationSubscription";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { Badge, Card, EmptyState, LoadingRows, Notice, StatusBadge } from "@/components/ui/kit";

const money = (amount: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-";

const interval = (plan: MappedPricingPlan) => (plan.billingInterval === "annual" ? "year" : "month");

function ProrationBreakdown({ proration, currentPlanName, newPlanName }: {
  proration: PlanChangeProration;
  currentPlanName: string;
  newPlanName: string;
}) {
  return (
    <table className="ha-table ha-proration">
      <caption className="ha-visually-hidden">Cost of this plan change</caption>
      <tbody>
        <tr>
          <td>Credit for unused {currentPlanName} ({proration.remainingDays} of {proration.cycleDays} days)</td>
          <td className="is-num">-{money(proration.credit, proration.currency)}</td>
        </tr>
        <tr>
          <td>{newPlanName} for the rest of this cycle (to {date(proration.cycleEndsAt)})</td>
          <td className="is-num">{money(proration.charge, proration.currency)}</td>
        </tr>
        <tr className="ha-primary-text">
          <td>{proration.net >= 0 ? "Charged today" : "Refunded to your original payment method"}</td>
          <td className="is-num">{money(Math.abs(proration.net), proration.currency)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default function Dashboard() {
  const { subscription, loading, error, isDealer, canManage, previewChange, changePlan } = useOrganizationSubscription();
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const [pendingPlan, setPendingPlan] = useState<MappedPricingPlan | null>(null);
  const [preview, setPreview] = useState<PlanChangeProration | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ proration: PlanChangeProration; fromPlan: string; toPlan: string } | null>(null);

  async function handleSelect(plan: MappedPricingPlan) {
    setActionError(null);
    setResult(null);
    setPendingPlan(plan);
    setPreview(null);
    setBusy(true);
    const { proration, error: previewError } = await previewChange(plan.subscriptionPlanId);
    setBusy(false);
    if (previewError) {
      setActionError(previewError);
      setPendingPlan(null);
      return;
    }
    setPreview(proration);
  }

  async function handleConfirm() {
    if (!pendingPlan || !subscription) return;

    setBusy(true);
    const fromPlan = subscription.plan.title;
    const { proration, error: changeError } = await changePlan(pendingPlan.subscriptionPlanId);
    setBusy(false);
    if (changeError || !proration) {
      setActionError(changeError);
      return;
    }
    setResult({ proration, fromPlan, toPlan: pendingPlan.title });
    setPendingPlan(null);
    setPreview(null);
  }

  function handleCancel() {
    setPendingPlan(null);
    setPreview(null);
  }

  const otherPlans = plans.filter((plan) => plan.subscriptionPlanId !== subscription?.plan.subscriptionPlanId);
  const usagePercent = subscription && subscription.stockSlotCount > 0 && subscription.activeListings !== null
    ? Math.min(100, Math.round((subscription.activeListings / subscription.stockSlotCount) * 100))
    : 0;

  return (
    <DashboardPage title="Subscription" description={isDealer ? "Your plan, how many listing slots you're using, and plan changes." : undefined}>
      {!isDealer && (
        <Card>
          <EmptyState icon="icon-carus-sliders" title="Dealer accounts only" text="Subscriptions are for dealer accounts only." />
        </Card>
      )}
      {isDealer && loading && <LoadingRows rows={4} label="Loading your subscription" />}
      {isDealer && error && <Notice tone="danger">{error}</Notice>}

      {isDealer && !loading && !error && !subscription && (
        <Card>
          <EmptyState
            icon="icon-carus-sliders"
            title="No active subscription"
            text="Your organisation has no active subscription, so it can't list stock yet."
            action={
              <Link className="ha-btn is-primary" href="/pricing">
                Choose a plan
              </Link>
            }
          />
        </Card>
      )}

      {result && (
        <Notice tone="success">
          <p className="mb-2">
            Switched from {result.fromPlan} to {result.toPlan}. The new entitlements apply now, and your
            renewal date is unchanged.
          </p>
          <ProrationBreakdown proration={result.proration} currentPlanName={result.fromPlan} newPlanName={result.toPlan} />
        </Notice>
      )}

      {subscription && (
        <>
          <div className="ha-card ha-card-body mb-4">
            <div className="d-flex justify-content-between flex-wrap gap-10">
              <div>
                <span className="ha-eyebrow">Current plan</span>
                <h2 className="hd-card-title mb-1" style={{ fontSize: 20 }}>{subscription.plan.title}</h2>
                <p className="mb-0">
                  <span className="ha-num">{money(subscription.plan.price)}</span> / {interval(subscription.plan)} <StatusBadge status={subscription.status} />
                </p>
              </div>
              <div className="text-md-end">
                <span className="ha-eyebrow">Current cycle</span>
                <p className="mb-0">
                  {date(subscription.startedAt)} – {date(subscription.endsAt)}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="ha-primary-text">Active listing slots</span>
                <span className="ha-num">
                  {subscription.activeListings ?? "—"} of {subscription.stockSlotCount} used
                </span>
              </div>
              <div
                className={`ha-meter${usagePercent >= 100 ? " is-danger" : usagePercent >= 80 ? " is-warning" : ""}`}
                role="progressbar"
                aria-label="Stock slots used"
                aria-valuenow={usagePercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${usagePercent}%` }} />
              </div>
              {usagePercent >= 100 && (
                <p className="ha-inline-error mt-1 mb-0">
                  Every slot is in use. Withdraw or sell stock, or upgrade, to list more.
                </p>
              )}
            </div>

            <ul className="ha-feature-list mt-3 mb-0">
              {entitlementFeatures(subscription.plan.entitlements).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <h2 className="hd-section-title">Change plan</h2>
          {!canManage && <Notice tone="info">Only your organisation admin can change the plan.</Notice>}
          {actionError && <Notice tone="danger">{actionError}</Notice>}
          {plansLoading && <LoadingRows rows={3} label="Loading plans" />}

          <div className="ha-grid">
            {otherPlans.map((plan) => {
              const isUpgrade = plan.price > subscription.plan.price;
              const isPending = pendingPlan?.subscriptionPlanId === plan.subscriptionPlanId;

              return (
                <div key={plan.subscriptionPlanId}>
                  <div className={`ha-card ha-card-body h-100 d-flex flex-column${isPending ? " ha-plan-pending" : ""}`}>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <h3 className="hd-card-title mb-1">{plan.title}</h3>
                      <Badge tone={isUpgrade ? "primary" : "neutral"} plain>
                        {isUpgrade ? "Upgrade" : "Downgrade"}
                      </Badge>
                    </div>
                    <p className="mb-3">
                      <span className="ha-plan-price ha-num">{money(plan.price)}</span> / {interval(plan)}
                    </p>
                    <ul className="ha-feature-list mb-3">
                      {entitlementFeatures(plan.entitlements).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    {isPending && preview && (
                      <div className="mb-2">
                        <ProrationBreakdown
                          proration={preview}
                          currentPlanName={subscription.plan.title}
                          newPlanName={plan.title}
                        />
                        <div className="ha-actions is-start">
                          <button type="button" className="ha-btn is-primary" onClick={handleConfirm} disabled={busy} aria-busy={busy}>{busy ? "Switching…" : `Confirm ${isUpgrade ? "upgrade" : "downgrade"}`}</button>
                          <button type="button" className="ha-btn is-ghost" onClick={handleCancel} disabled={busy}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {canManage && !isPending && (
                      <button
                        type="button"
                        className={`ha-btn mt-auto${isUpgrade ? " is-primary" : ""}`}
                        onClick={() => handleSelect(plan)}
                        disabled={busy}
                      >
                        <span>{isUpgrade ? "Upgrade" : "Downgrade"} to {plan.title}</span>
                      </button>
                    )}
                    {isPending && !preview && (
                      <p className="ha-sub mb-0" role="status">
                        Pricing the change…
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardPage>
  );
}

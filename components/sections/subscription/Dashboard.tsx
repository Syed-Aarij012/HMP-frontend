"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useOrganizationSubscription } from "@/hooks/useOrganizationSubscription";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { entitlementFeatures } from "@/lib/mapApiSubscriptionPlan";
import type { MappedPricingPlan } from "@/lib/mapApiSubscriptionPlan";
import type { PlanChangeProration } from "@/lib/mapApiOrganizationSubscription";

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
    <table className="table mb-2">
      <tbody>
        <tr>
          <td>Credit for unused {currentPlanName} ({proration.remainingDays} of {proration.cycleDays} days)</td>
          <td className="text-end">-{money(proration.credit, proration.currency)}</td>
        </tr>
        <tr>
          <td>{newPlanName} for the rest of this cycle (to {date(proration.cycleEndsAt)})</td>
          <td className="text-end">{money(proration.charge, proration.currency)}</td>
        </tr>
        <tr className="fw-6">
          <td>{proration.net >= 0 ? "Charged today" : "Refunded to your original payment method"}</td>
          <td className="text-end">{money(Math.abs(proration.net), proration.currency)}</td>
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
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Subscription</h1>

                  {!isDealer && <p className="tfcl-empty-data">Subscriptions are for dealer accounts only.</p>}
                  {isDealer && loading && <p>Loading your subscription...</p>}
                  {isDealer && error && <div className="alert alert-danger">{error}</div>}

                  {isDealer && !loading && !error && !subscription && (
                    <div className="tfcl-card p-3">
                      <p className="mb-2">Your organization has no active subscription, so it can&apos;t list stock yet.</p>
                      <Link className="sc-button" href="/pricing">
                        <span>Choose a plan</span>
                      </Link>
                    </div>
                  )}

                  {result && (
                    <div className="alert alert-success">
                      <p className="mb-2">
                        Switched from {result.fromPlan} to {result.toPlan}. The new entitlements apply now, and your
                        renewal date is unchanged.
                      </p>
                      <ProrationBreakdown proration={result.proration} currentPlanName={result.fromPlan} newPlanName={result.toPlan} />
                    </div>
                  )}

                  {subscription && (
                    <>
                      <div className="tfcl-card p-3 mb-4">
                        <div className="d-flex justify-content-between flex-wrap gap-10">
                          <div>
                            <div className="text-color-1 mb-1">Current plan</div>
                            <h3 className="mb-1">{subscription.plan.title}</h3>
                            <p className="mb-0">
                              {money(subscription.plan.price)} / {interval(subscription.plan)} ·{" "}
                              <span className="text-capitalize">{subscription.status}</span>
                            </p>
                          </div>
                          <div className="text-md-end">
                            <div className="text-color-1 mb-1">Current cycle</div>
                            <p className="mb-0">
                              {date(subscription.startedAt)} – {date(subscription.endsAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Active listing slots</span>
                            <span>
                              {subscription.activeListings ?? "-"} of {subscription.stockSlotCount} used
                            </span>
                          </div>
                          <div
                            className="progress"
                            role="progressbar"
                            aria-label="Stock slots used"
                            aria-valuenow={usagePercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={`progress-bar${usagePercent >= 100 ? " bg-danger" : usagePercent >= 80 ? " bg-warning" : ""}`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                          {usagePercent >= 100 && (
                            <p className="text-danger fs-14 mt-1 mb-0">
                              Every slot is in use. Withdraw or sell stock, or upgrade, to list more.
                            </p>
                          )}
                        </div>

                        <ul className="mt-3 mb-0">
                          {entitlementFeatures(subscription.plan.entitlements).map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      </div>

                      <h4 className="mb-2">Change plan</h4>
                      {!canManage && (
                        <p className="tfcl-empty-data">Only your organization admin can change the plan.</p>
                      )}
                      {actionError && <div className="alert alert-danger">{actionError}</div>}
                      {plansLoading && <p>Loading plans...</p>}

                      <div className="row">
                        {otherPlans.map((plan) => {
                          const isUpgrade = plan.price > subscription.plan.price;
                          const isPending = pendingPlan?.subscriptionPlanId === plan.subscriptionPlanId;

                          return (
                            <div key={plan.subscriptionPlanId} className="col-md-6 col-lg-4 mb-3">
                              <div className="tfcl-card p-3 h-100 d-flex flex-column">
                                <h4 className="mb-1">{plan.title}</h4>
                                <p className="mb-2">
                                  {money(plan.price)} / {interval(plan)}
                                </p>
                                <ul className="mb-3">
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
                                    <div className="flex gap-10">
                                      <button type="button" className="sc-button" onClick={handleConfirm} disabled={busy}>
                                        <span>{busy ? "Switching..." : `Confirm ${isUpgrade ? "upgrade" : "downgrade"}`}</span>
                                      </button>
                                      <button type="button" className="sc-button" onClick={handleCancel} disabled={busy}>
                                        <span>Cancel</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {canManage && !isPending && (
                                  <button
                                    type="button"
                                    className="sc-button mt-auto"
                                    onClick={() => handleSelect(plan)}
                                    disabled={busy}
                                  >
                                    <span>{isUpgrade ? "Upgrade" : "Downgrade"} to {plan.title}</span>
                                  </button>
                                )}
                                {isPending && !preview && <p className="mb-0">Pricing the change...</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

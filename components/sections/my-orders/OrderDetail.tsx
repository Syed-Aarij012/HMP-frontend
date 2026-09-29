"use client";

import Link from "next/link";
import DashboardToggle from "@/components/dashboard/DashboardToggle";
import { useRetailOrder } from "@/hooks/useDirectBuy";

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function OrderDetail({ publicId }: { publicId: string }) {
  const { order, loading, error, cancel, payBalance, acting, actionError } = useRetailOrder(publicId);

  return (
    <div id="themesflat-content">
      <DashboardToggle />
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="content-area">
              <main id="main" className="main-content">
                <div className="tfcl-dashboard">
                  <h1 className="admin-title mb-3">Order details</h1>
                  <p className="mb-3">
                    <Link href="/my-orders">← Back to my orders</Link>
                  </p>

                  {loading && <p>Loading your order...</p>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  {order && (
                    <>
                      <div className="tfcl-card p-3 mb-3">
                        <h4 className="mb-2">{order.car?.title ?? "Vehicle"}</h4>
                        {order.car && <p className="mb-1">Asking price: £{order.car.price.toLocaleString()}</p>}
                        <p className="mb-0">Deposit paid: £{order.depositAmount.toLocaleString()}</p>
                      </div>

                      {actionError && <div className="alert alert-danger mb-3">{actionError}</div>}

                      {order.status === "deposit_held" && (
                        <div className="tfcl-card p-3 mb-3">
                          <h4 className="mb-2">Cooling-off period active</h4>
                          <p className="mb-2">
                            You can cancel for a full refund until{" "}
                            {formatDate(order.disclosure?.cancellationDeadline ?? order.coolingOffEndsAt)}. After
                            that, your purchase will be confirmed automatically and you&apos;ll be asked to pay the
                            remaining balance.
                          </p>
                          <button type="button" className="sc-button" disabled={acting} onClick={cancel}>
                            <span>{acting ? "Cancelling..." : "Cancel and get a refund"}</span>
                          </button>
                        </div>
                      )}

                      {order.status === "cancelled_cooling_off" && (
                        <div className="tfcl-card p-3 mb-3">
                          <h4 className="mb-2">Cancelled</h4>
                          <p className="mb-0">
                            This order was cancelled on {formatDate(order.cancelledAt)} and your deposit has been
                            refunded.
                          </p>
                        </div>
                      )}

                      {order.status === "confirmed" && (
                        <div className="tfcl-card p-3 mb-3">
                          <h4 className="mb-2">Purchase confirmed</h4>
                          <p className="mb-2">
                            {order.car
                              ? `Pay the remaining balance of £${(order.car.price - order.depositAmount).toLocaleString()} to complete your purchase.`
                              : "Pay the remaining balance to complete your purchase."}
                          </p>
                          <button type="button" className="sc-button" disabled={acting} onClick={payBalance}>
                            <span>{acting ? "Paying..." : "Pay remaining balance"}</span>
                          </button>
                        </div>
                      )}

                      {order.status === "paid" && (
                        <div className="tfcl-card p-3 mb-3">
                          <h4 className="mb-2">Paid in full</h4>
                          <p className="mb-0">
                            Paid on {formatDate(order.balancePaidAt)}. Our team will be in touch to arrange
                            collection or delivery.
                          </p>
                        </div>
                      )}

                      {order.disclosure && (
                        <div className="tfcl-card p-3">
                          <h4 className="mb-2">Distance-selling disclosure</h4>
                          <p className="mb-1">Seller type: {order.disclosure.sellerType}</p>
                          <p className="mb-1">Goods: {order.disclosure.goodsDescription}</p>
                          <p className="mb-1">Price: £{order.disclosure.price.toLocaleString()}</p>
                          <p className="mb-1">Deposit: £{order.disclosure.depositAmount.toLocaleString()}</p>
                          <p className="mb-0">
                            Right to cancel: {order.disclosure.rightToCancelDays} days (until{" "}
                            {formatDate(order.disclosure.cancellationDeadline)})
                          </p>
                        </div>
                      )}
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

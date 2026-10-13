"use client";

import Link from "next/link";
import { DocumentsSection, ReleaseSection, TransportSection } from "@/components/sections/post-sale/PostSaleSections";
import { useRetailOrder } from "@/hooks/useDirectBuy";
import { usePostSaleRecords } from "@/hooks/usePostSaleRecords";
import DashboardPage from "@/components/dashboard/DashboardPage";
import { LoadingRows, Notice, StatCard, Stats, StatusBadge, formatDate as formatDateTime, formatMoney } from "@/components/ui/kit";

const formatDate = (value: string | null) => formatDateTime(value, { time: true });

const STATUS_LABELS: Record<string, string> = {
  deposit_held: "Cooling-off active",
  cancelled_cooling_off: "Cancelled",
  confirmed: "Confirmed — balance due",
  paid: "Paid in full",
};

export default function OrderDetail({ publicId }: { publicId: string }) {
  const { order, loading, error, cancel, payBalance, acting, actionError, reload } = useRetailOrder(publicId);
  // FR-F-010/012: release code and document vault (incl. the FR-C-030 distance-selling pack).
  const records = usePostSaleRecords({ kind: "retail", publicId }, order?.releaseNoteId ?? null);

  return (
    <DashboardPage
      eyebrow={<Link href="/my-orders">← My orders</Link>}
      title={order?.car?.title ?? "Order details"}
      description={order ? <StatusBadge status={order.status} label={STATUS_LABELS[order.status]} /> : undefined}
    >

      {loading && <LoadingRows label="Loading your order" />}
      {error && <Notice tone="danger">{error}</Notice>}

      {order && (
        <>
          <Stats>
            {order.car && <StatCard label="Asking price" value={formatMoney(order.car.price)} />}
            <StatCard label="Deposit paid" value={formatMoney(order.depositAmount)} />
            {order.car && order.status !== "paid" && order.status !== "cancelled_cooling_off" && (
              <StatCard label="Balance remaining" value={formatMoney(order.car.price - order.depositAmount)} />
            )}
          </Stats>

          {actionError && <Notice tone="danger">{actionError}</Notice>}

          {order.status === "deposit_held" && (
            <div className="ha-card ha-card-body mb-4">
              <h2 className="hd-card-title">Cooling-off period active</h2>
              <p className="mb-2">
                You can cancel for a full refund until{" "}
                {formatDate(order.disclosure?.cancellationDeadline ?? order.coolingOffEndsAt)}. After
                that, your purchase will be confirmed automatically and you&apos;ll be asked to pay the
                remaining balance.
              </p>
              <button type="button" className="ha-btn is-danger" disabled={acting} onClick={cancel}>{acting ? "Cancelling…" : "Cancel and get a refund"}</button>
            </div>
          )}

          {order.status === "cancelled_cooling_off" && (
            <div className="ha-card ha-card-body mb-4">
              <h2 className="hd-card-title">Cancelled</h2>
              <p className="mb-0">
                This order was cancelled on {formatDate(order.cancelledAt)} and your deposit has been
                refunded.
              </p>
            </div>
          )}

          {order.status === "confirmed" && (
            <div className="ha-card ha-card-body mb-4">
              <h2 className="hd-card-title">Purchase confirmed</h2>
              <p className="mb-2">
                {order.car
                  ? `Pay the remaining balance of £${(order.car.price - order.depositAmount).toLocaleString()} to complete your purchase.`
                  : "Pay the remaining balance to complete your purchase."}
              </p>
              <button type="button" className="ha-btn is-primary" disabled={acting} onClick={payBalance}>{acting ? "Paying…" : "Pay remaining balance"}</button>
            </div>
          )}

          {order.status === "paid" && (
            <div className="ha-card ha-card-body mb-4">
              <h2 className="hd-card-title">Paid in full</h2>
              <p className="mb-0">
                Paid on {formatDate(order.balancePaidAt)}. Book delivery below, or collect the vehicle
                yourself using your release code.
              </p>
            </div>
          )}

          {/* FR-C-030: handover/delivery scheduling handoff to Module F, once paid. */}
          {order.status === "paid" && (
            <div className="ha-card ha-card-body mb-4">
              <TransportSection
                jobId={order.transportJobId}
                order={{ kind: "retail", publicId: order.publicId }}
                defaultPickup={order.collectionPostcode ?? ""}
                onChanged={reload}
              />
              <ReleaseSection releaseNoteId={order.releaseNoteId} release={records.release} />
            </div>
          )}

          {order.disclosure && (
            <div className="ha-card ha-card-body mb-4">
              <h2 className="hd-card-title">Distance-selling disclosure</h2>
              <dl className="ha-dl mb-3">
                {order.disclosure.sellerName && (
                  <div>
                    <dt>Seller</dt>
                    <dd>{order.disclosure.sellerName}</dd>
                  </div>
                )}
                <div>
                  <dt>Seller type</dt>
                  <dd>{order.disclosure.sellerType}</dd>
                </div>
                <div>
                  <dt>Goods</dt>
                  <dd>{order.disclosure.goodsDescription}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{formatMoney(order.disclosure.price)}</dd>
                </div>
                <div>
                  <dt>Deposit</dt>
                  <dd>{formatMoney(order.disclosure.depositAmount)}</dd>
                </div>
                {order.disclosure.balanceDue !== null && (
                  <div>
                    <dt>Balance due after cooling-off</dt>
                    <dd>{formatMoney(order.disclosure.balanceDue)}</dd>
                  </div>
                )}
                <div>
                  <dt>Right to cancel</dt>
                  <dd>
                    {order.disclosure.rightToCancelDays} days (until {formatDate(order.disclosure.cancellationDeadline)})
                  </dd>
                </div>
              </dl>
              <p className="mb-0 ha-muted">
                The full information and cancellation pack, including a model cancellation form, is in
                your documents below.
              </p>
            </div>
          )}

          {records.documents && (
            <div className="ha-card ha-card-body">
              <DocumentsSection documents={records.documents} />
            </div>
          )}
        </>
      )}
    </DashboardPage>
  );
}

import type {
  AuctionBid,
  AuctionExposure,
  AuctionLot,
  AuctionSale,
  BiddingDeposit,
  ConditionReport,
  FeeEstimate,
  MyBid,
  MyProxyBid,
  ProvisionalSale,
  TradeOrder,
} from "@/types/auction";

export type ApiAuctionSale = {
  id: number;
  name: string;
  sale_type: string;
  status: string;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  lot_count: number | null;
};

export type ApiAuctionLotVehicle = {
  id: string;
  make: string;
  model: string;
  derivative: string | null;
  body_type: string;
  fuel_type: string;
  transmission: string;
  colour: string | null;
  year: number;
  current_mileage: number;
  photos?: { id: number; type: string; url: string; is_360: boolean; sequence: number }[];
};

export type ApiConditionReportDamageItem = {
  panel: string;
  damage_type: string;
  severity: string;
  repair_cost_band: string | null;
  vehicle_media_id: number | null;
  frame_x: string | number | null;
  frame_y: string | number | null;
  cv_suggested: boolean;
  confirmed_by_inspector: boolean;
};

export type ApiConditionReport = {
  id: number;
  vehicle_category: string;
  condition_grade: number | null;
  mechanical_grade: string | null;
  published_at: string | null;
  summary?: { overview?: string; [key: string]: unknown } | null;
  damage_items?: ApiConditionReportDamageItem[];
};

export type ApiAuctionLot = {
  id: string;
  status: string;
  is_hmp_assured: boolean;
  run_order: number | null;
  current_price: string | number | null;
  reserve_met: boolean | null;
  reserve_price: string | number | null;
  opened_at: string | null;
  closes_at: string | null;
  closed_at: string | null;
  sale: { id: number | null; name: string | null; sale_type: string | null; status: string | null } | null;
  lane: { id: number; name: string; status: string } | null;
  vehicle: ApiAuctionLotVehicle | null;
  condition_report?: ApiConditionReport | null;
};

export type ApiAuctionBid = {
  id: number;
  amount: string | number;
  channel: string;
  sequence_number: number;
  status: string;
  created_at: string;
  bidder: string;
};

export type ApiMyBid = {
  id: number;
  amount: string | number;
  channel: string;
  status: string;
  created_at: string;
  is_leading: boolean;
  lot: {
    id: string | null;
    status: string | null;
    current_price: string | number | null;
    sale_name: string | null;
    vehicle: string | null;
  } | null;
};

export type ApiBiddingDeposit = {
  id: number;
  amount: string | number;
  type: string;
  status: string;
};

export type ApiListResponse<T> = { data: T[] };

export function mapApiSale(sale: ApiAuctionSale): AuctionSale {
  return {
    id: sale.id,
    name: sale.name,
    saleType: sale.sale_type,
    status: sale.status,
    scheduledStartAt: sale.scheduled_start_at,
    scheduledEndAt: sale.scheduled_end_at,
    lotCount: sale.lot_count,
  };
}

export function mapApiLot(lot: ApiAuctionLot): AuctionLot {
  return {
    id: lot.id,
    status: lot.status,
    isHmpAssured: Boolean(lot.is_hmp_assured),
    runOrder: lot.run_order,
    currentPrice: lot.current_price !== null ? Number(lot.current_price) : null,
    reserveMet: lot.reserve_met,
    reservePrice: lot.reserve_price !== null && lot.reserve_price !== undefined ? Number(lot.reserve_price) : null,
    openedAt: lot.opened_at,
    closesAt: lot.closes_at,
    closedAt: lot.closed_at,
    saleId: lot.sale?.id ?? null,
    saleName: lot.sale?.name ?? null,
    saleStatus: lot.sale?.status ?? null,
    laneName: lot.lane?.name ?? null,
    vehicle: lot.vehicle
      ? {
          id: lot.vehicle.id,
          make: lot.vehicle.make,
          model: lot.vehicle.model,
          derivative: lot.vehicle.derivative,
          bodyType: lot.vehicle.body_type,
          fuelType: lot.vehicle.fuel_type,
          transmission: lot.vehicle.transmission,
          colour: lot.vehicle.colour,
          year: lot.vehicle.year,
          mileage: lot.vehicle.current_mileage,
          photos: (lot.vehicle.photos ?? []).map((photo) => ({
            id: photo.id,
            type: photo.type,
            url: photo.url,
            is360: photo.is_360,
            sequence: photo.sequence,
          })),
        }
      : null,
    conditionReport: lot.condition_report ? mapApiConditionReport(lot.condition_report) : null,
  };
}

export function mapApiConditionReport(report: ApiConditionReport): ConditionReport {
  return {
    id: report.id,
    vehicleCategory: report.vehicle_category,
    conditionGrade: report.condition_grade,
    mechanicalGrade: report.mechanical_grade,
    publishedAt: report.published_at,
    summaryText: report.summary?.overview ?? null,
    damageItems: (report.damage_items ?? []).map((item) => ({
      panel: item.panel,
      damageType: item.damage_type,
      severity: item.severity,
      repairCostBand: item.repair_cost_band,
      vehicleMediaId: item.vehicle_media_id,
      frameX: item.frame_x !== null && item.frame_x !== undefined ? Number(item.frame_x) : null,
      frameY: item.frame_y !== null && item.frame_y !== undefined ? Number(item.frame_y) : null,
      cvSuggested: Boolean(item.cv_suggested),
      confirmedByInspector: Boolean(item.confirmed_by_inspector),
    })),
  };
}

export function mapApiBid(bid: ApiAuctionBid): AuctionBid {
  return {
    id: bid.id,
    amount: Number(bid.amount),
    channel: bid.channel,
    sequenceNumber: bid.sequence_number,
    status: bid.status,
    createdAt: bid.created_at,
    bidder: bid.bidder,
  };
}

export function mapApiMyBid(bid: ApiMyBid): MyBid {
  return {
    id: bid.id,
    amount: Number(bid.amount),
    channel: bid.channel,
    status: bid.status,
    createdAt: bid.created_at,
    isLeading: bid.is_leading,
    lotId: bid.lot?.id ?? null,
    lotStatus: bid.lot?.status ?? null,
    currentPrice: bid.lot?.current_price !== null && bid.lot?.current_price !== undefined ? Number(bid.lot.current_price) : null,
    saleName: bid.lot?.sale_name ?? null,
    vehicleLabel: bid.lot?.vehicle ?? null,
  };
}

export function mapApiDeposit(deposit: ApiBiddingDeposit): BiddingDeposit {
  return {
    id: deposit.id,
    amount: Number(deposit.amount),
    type: deposit.type,
    status: deposit.status,
  };
}

export function mapApiExposure(exposure: { committed_exposure: string; available_headroom: string }): AuctionExposure {
  return {
    committedExposure: Number(exposure.committed_exposure),
    availableHeadroom: Number(exposure.available_headroom),
  };
}

export type ApiFeeEstimate = {
  hammer_price: string;
  buyers_premium: string;
  vat_on_premium: string;
  vehicle_vat: string;
  vat_status: string | null;
  assurance_fee: string;
  is_hmp_assured: boolean;
  transport_estimate: string;
  total_before_transport: string;
  total_with_transport: string;
  fee_schedule_label: string;
};

export function mapApiFeeEstimate(estimate: ApiFeeEstimate): FeeEstimate {
  return {
    hammerPrice: Number(estimate.hammer_price),
    buyersPremium: Number(estimate.buyers_premium),
    vatOnPremium: Number(estimate.vat_on_premium),
    vehicleVat: Number(estimate.vehicle_vat),
    vatStatus: estimate.vat_status,
    assuranceFee: Number(estimate.assurance_fee),
    isHmpAssured: estimate.is_hmp_assured,
    transportEstimate: Number(estimate.transport_estimate),
    totalBeforeTransport: Number(estimate.total_before_transport),
    totalWithTransport: Number(estimate.total_with_transport),
    feeScheduleLabel: estimate.fee_schedule_label,
  };
}

export type ApiMyProxyBid = {
  id: number;
  status: string;
  lodged_at: string | null;
  lot: {
    id: string | null;
    status: string | null;
    current_price: string | number | null;
    sale_name: string | null;
    vehicle: string | null;
  } | null;
};

export function mapApiMyProxyBid(proxy: ApiMyProxyBid): MyProxyBid {
  return {
    id: proxy.id,
    status: proxy.status,
    lodgedAt: proxy.lodged_at,
    lotId: proxy.lot?.id ?? null,
    lotStatus: proxy.lot?.status ?? null,
    currentPrice: proxy.lot?.current_price !== null && proxy.lot?.current_price !== undefined ? Number(proxy.lot.current_price) : null,
    saleName: proxy.lot?.sale_name ?? null,
    vehicleLabel: proxy.lot?.vehicle ?? null,
  };
}

export type ApiTradeOrder = {
  id: number;
  lot_id: string;
  vehicle: { make: string; model: string; derivative: string | null; year: number } | null;
  hammer_price: string;
  status: string;
  paid_at: string | null;
  invoice: {
    invoice_number: string;
    subtotal: string;
    vat_total: string;
    total: string;
    issued_at: string | null;
  } | null;
  fee_lines: { fee_type: string; amount: string; vat_amount: string }[];
  transport_job_id: number | null;
  transport_job_status: string | null;
  release_note_id?: number | null;
  release_status?: string | null;
  title_transfer_id?: number | null;
  is_hmp_assured?: boolean;
  assurance_claim_window_closes_at?: string | null;
};

export function mapApiTradeOrder(order: ApiTradeOrder): TradeOrder {
  return {
    id: order.id,
    lotId: order.lot_id,
    vehicle: order.vehicle,
    hammerPrice: Number(order.hammer_price),
    status: order.status,
    paidAt: order.paid_at,
    invoice: order.invoice
      ? {
          invoiceNumber: order.invoice.invoice_number,
          subtotal: Number(order.invoice.subtotal),
          vatTotal: Number(order.invoice.vat_total),
          total: Number(order.invoice.total),
          issuedAt: order.invoice.issued_at,
        }
      : null,
    feeLines: order.fee_lines.map((line) => ({
      feeType: line.fee_type,
      amount: Number(line.amount),
      vatAmount: Number(line.vat_amount),
    })),
    transportJobId: order.transport_job_id,
    transportJobStatus: order.transport_job_status,
    releaseNoteId: order.release_note_id ?? null,
    releaseStatus: order.release_status ?? null,
    titleTransferId: order.title_transfer_id ?? null,
    isHmpAssured: Boolean(order.is_hmp_assured),
    assuranceClaimWindowClosesAt: order.assurance_claim_window_closes_at ?? null,
  };
}

export type ApiProvisionalSale = {
  id: number;
  lot: { id: string; status: string; vehicle: string | null };
  highest_bid_amount: string | number | null;
  reserve_price: string | number | null;
  seller_decision: string;
  counter_amount: string | number | null;
  buyer_response: string | null;
  decision_deadline_at: string | null;
  resolved_at: string | null;
  is_awaiting_seller: boolean;
  is_awaiting_buyer: boolean;
};

export function mapApiProvisionalSale(sale: ApiProvisionalSale): ProvisionalSale {
  return {
    id: sale.id,
    lotId: sale.lot.id,
    lotStatus: sale.lot.status,
    vehicleLabel: sale.lot.vehicle,
    highestBidAmount: sale.highest_bid_amount !== null ? Number(sale.highest_bid_amount) : null,
    reservePrice: sale.reserve_price !== null && sale.reserve_price !== undefined ? Number(sale.reserve_price) : null,
    sellerDecision: sale.seller_decision,
    counterAmount: sale.counter_amount !== null && sale.counter_amount !== undefined ? Number(sale.counter_amount) : null,
    buyerResponse: sale.buyer_response,
    decisionDeadlineAt: sale.decision_deadline_at,
    resolvedAt: sale.resolved_at,
    isAwaitingSeller: sale.is_awaiting_seller,
    isAwaitingBuyer: sale.is_awaiting_buyer,
  };
}

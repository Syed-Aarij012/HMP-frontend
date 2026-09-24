export type AuctionSale = {
  id: number;
  name: string;
  saleType: string;
  status: string;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  lotCount: number | null;
};

export type AuctionLotVehiclePhoto = {
  id: number;
  type: string;
  url: string;
  is360: boolean;
  sequence: number;
};

export type AuctionLotVehicle = {
  id: string;
  make: string;
  model: string;
  derivative: string | null;
  bodyType: string;
  fuelType: string;
  transmission: string;
  colour: string | null;
  year: number;
  mileage: number;
  photos: AuctionLotVehiclePhoto[];
};

export type ConditionReportDamageItem = {
  panel: string;
  damageType: string;
  severity: string;
  repairCostBand: string | null;
  vehicleMediaId: number | null;
  frameX: number | null;
  frameY: number | null;
  cvSuggested: boolean;
  confirmedByInspector: boolean;
};

// FR-A-023: the trade-detail projection — only ever present when the viewer holds
// view-condition-report-trade (see ConditionReportResource); a retail/anonymous viewer's
// lot response simply omits damageItems and gets a plainer summary.
export type ConditionReport = {
  id: number;
  vehicleCategory: string;
  conditionGrade: number | null;
  mechanicalGrade: string | null;
  publishedAt: string | null;
  summaryText: string | null;
  damageItems: ConditionReportDamageItem[];
};

export type AuctionLot = {
  id: string;
  status: string;
  isHmpAssured: boolean;
  runOrder: number | null;
  currentPrice: number | null;
  reserveMet: boolean | null;
  reservePrice: number | null;
  openedAt: string | null;
  closesAt: string | null;
  closedAt: string | null;
  saleId: number | null;
  saleName: string | null;
  saleStatus: string | null;
  laneName: string | null;
  vehicle: AuctionLotVehicle | null;
  conditionReport: ConditionReport | null;
};

export type AuctionBid = {
  id: number;
  amount: number;
  channel: string;
  sequenceNumber: number;
  status: string;
  createdAt: string;
  bidder: string;
};

export type MyBid = {
  id: number;
  amount: number;
  channel: string;
  status: string;
  createdAt: string;
  isLeading: boolean;
  lotId: string | null;
  lotStatus: string | null;
  currentPrice: number | null;
  saleName: string | null;
  vehicleLabel: string | null;
};

export type BiddingDeposit = {
  id: number;
  amount: number;
  type: string;
  status: string;
};

export type AuctionExposure = {
  committedExposure: number;
  availableHeadroom: number;
};

export type FeeEstimate = {
  hammerPrice: number;
  buyersPremium: number;
  vatOnPremium: number;
  vehicleVat: number;
  vatStatus: string | null;
  assuranceFee: number;
  isHmpAssured: boolean;
  transportEstimate: number;
  totalBeforeTransport: number;
  totalWithTransport: number;
  feeScheduleLabel: string;
};

export type MyProxyBid = {
  id: number;
  status: string;
  lodgedAt: string | null;
  lotId: string | null;
  lotStatus: string | null;
  currentPrice: number | null;
  saleName: string | null;
  vehicleLabel: string | null;
};

export type TradeOrderFeeLine = {
  feeType: string;
  amount: number;
  vatAmount: number;
};

export type TradeOrder = {
  id: number;
  lotId: string;
  vehicle: { make: string; model: string; derivative: string | null; year: number } | null;
  hammerPrice: number;
  status: string;
  paidAt: string | null;
  invoice: {
    invoiceNumber: string;
    subtotal: number;
    vatTotal: number;
    total: number;
    issuedAt: string | null;
  } | null;
  feeLines: TradeOrderFeeLine[];
  transportJobId: number | null;
  transportJobStatus: string | null;
};

export type ProvisionalSale = {
  id: number;
  lotId: string;
  lotStatus: string;
  vehicleLabel: string | null;
  highestBidAmount: number | null;
  reservePrice: number | null;
  sellerDecision: string;
  counterAmount: number | null;
  buyerResponse: string | null;
  decisionDeadlineAt: string | null;
  resolvedAt: string | null;
  isAwaitingSeller: boolean;
  isAwaitingBuyer: boolean;
};

// FR-C-032/033/034: offers, test-drive appointments and the free valuation tool.

export type OfferEvent = {
  id: number;
  eventType: string;
  amount: number | null;
  actorUserId: number;
  createdAt: string;
};

export type Offer = {
  id: number;
  amount: number;
  status: string;
  expiresAt: string | null;
  isAwaitingBuyer: boolean;
  listing: {
    id: string;
    price: number;
    vehicleLabel: string | null;
  } | null;
  events: OfferEvent[];
  // FR-C-032: present when the buyer declared a part-exchange; low/high null if it couldn't
  // be valued instantly (too few comparable sales).
  partExchange: { low: number | null; high: number | null; mileage: number | null } | null;
};

export type Appointment = {
  id: number;
  status: string;
  scheduledAt: string;
  calendarRef: string | null;
  listing: {
    id: string;
    vehicleLabel: string | null;
  } | null;
  // FR-C-033: whether the viewer is the dealer side (who can mark completed / no-show), and
  // for them, who booked and how many earlier appointments with this dealer they missed.
  isDealerSide: boolean;
  buyerName: string | null;
  buyerNoShows: number | null;
};

export type ValuationResult = {
  id: number;
  privateSaleValue: number | null;
  partExchangeValue: number | null;
  instantOfferValue: number | null;
  confidenceBand: "insufficient_data" | "low" | "medium" | "high";
  // FR-C-034: what the blended figure rests on.
  internal: { value: number | null; comparables: number };
  licensed: { value: number | null; source: string } | null;
  vehicle: { vrm: string; make: string | null; model: string | null; year: number | null; colour: string | null } | null;
};

export type PricingSuggestion = {
  suggestedPrice: number | null;
  rangeLow: number | null;
  rangeHigh: number | null;
  confidence: string;
  comparables: number;
  message: string | null;
};

export type PhotoGuidanceShot = {
  key: string;
  label: string;
  tip: string;
  required: boolean;
};

export type PhotoGuidance = {
  shots: PhotoGuidanceShot[];
  requiredShots: number;
  recommendedStillCount: number;
  stillCount: number | null;
  meetsRecommendation: boolean | null;
};

export type DealerAnalytics = {
  periodDays: number;
  searchImpressions: number;
  periodDetailViews: number;
  periodCalls: number;
  series: { date: string; impressions: number; views: number; calls: number }[];
  activeListingsCount: number;
  totalDetailPageViews: number;
  leads: {
    total: number;
    byStatus: { new: number; contacted: number; converted: number; lost: number };
    conversionRate: number | null;
  };
  appointments: { booked: number; completed: number; noShow: number; cancelled: number; noShowRate: number | null };
  averageDaysToSell: number | null;
};

export type AdProduct = {
  id: number;
  code: string;
  name: string;
  type: string;
  price: number;
  requiresConsent: boolean;
};

export type AdCampaign = {
  id: number;
  product: { code: string; name: string; type: string };
  status: string;
  running: boolean;
  startsAt: string;
  endsAt: string;
  listingId: string | null;
  targetMake: string | null;
  targetModel: string | null;
  impressions: number;
  clicks: number;
  leads: number;
  clickThroughRate: number | null;
};

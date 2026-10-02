import type {
  AdCampaign,
  AdProduct,
  Appointment,
  DealerAnalytics,
  Offer,
  PhotoGuidance,
  PricingSuggestion,
  ValuationResult,
} from "@/types/marketplaceTools";

export type ApiOfferEvent = {
  id: number;
  event_type: string;
  amount: string | null;
  actor_user_id: number;
  created_at: string;
};

export type ApiOffer = {
  id: number;
  amount: string;
  status: string;
  expires_at: string | null;
  listing: {
    id: string;
    price: string;
    vehicle_master_record?: { make?: string; model?: string; year?: number } | null;
  } | null;
  events: ApiOfferEvent[];
  part_exchange_vehicle_master_record_id?: number | null;
  part_exchange_appraisal?: { trade_in_range?: { low: string; high: string } | null; mileage?: number } | null;
};

export function mapApiOffer(api: ApiOffer, viewerId: number): Offer {
  const lastEvent = [...(api.events ?? [])].sort((a, b) => b.id - a.id)[0];
  const vehicle = api.listing?.vehicle_master_record;

  return {
    id: api.id,
    amount: Number(api.amount),
    status: api.status,
    expiresAt: api.expires_at,
    isAwaitingBuyer: api.status === "countered" && lastEvent?.actor_user_id !== viewerId,
    listing: api.listing
      ? {
          id: api.listing.id,
          price: Number(api.listing.price),
          vehicleLabel: vehicle ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") : null,
        }
      : null,
    partExchange: api.part_exchange_vehicle_master_record_id
      ? {
          low: api.part_exchange_appraisal?.trade_in_range ? Number(api.part_exchange_appraisal.trade_in_range.low) : null,
          high: api.part_exchange_appraisal?.trade_in_range ? Number(api.part_exchange_appraisal.trade_in_range.high) : null,
          mileage: api.part_exchange_appraisal?.mileage ?? null,
        }
      : null,
    events: (api.events ?? []).map((event) => ({
      id: event.id,
      eventType: event.event_type,
      amount: event.amount !== null ? Number(event.amount) : null,
      actorUserId: event.actor_user_id,
      createdAt: event.created_at,
    })),
  };
}

export type ApiAppointment = {
  id: number;
  status: string;
  scheduled_at: string;
  calendar_ref: string | null;
  listing?: { id: string; vehicle_master_record?: { make?: string; model?: string; year?: number } | null } | null;
  is_dealer_side?: boolean;
  buyer?: { id: number; name: string } | null;
  buyer_no_shows?: number | null;
};

export function mapApiAppointment(api: ApiAppointment): Appointment {
  const vehicle = api.listing?.vehicle_master_record;

  return {
    id: api.id,
    status: api.status,
    scheduledAt: api.scheduled_at,
    calendarRef: api.calendar_ref,
    isDealerSide: api.is_dealer_side ?? false,
    buyerName: api.buyer?.name ?? null,
    buyerNoShows: api.buyer_no_shows ?? null,
    listing: api.listing
      ? { id: api.listing.id, vehicleLabel: vehicle ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") : null }
      : null,
  };
}

export type ApiValuation = {
  id: number;
  private_sale_value: string | null;
  part_exchange_value: string | null;
  instant_offer_value: string | null;
  confidence_band: ValuationResult["confidenceBand"];
  sources: {
    internal: { value: string | null; comparables: number | null };
    licensed: { value: string | null; source: string } | null;
  };
};

export type ApiValuationVehicle = { vrm: string; make: string | null; model: string | null; year: number | null; colour: string | null };

export function mapApiValuation(api: ApiValuation, vehicle: ApiValuationVehicle | null = null): ValuationResult {
  return {
    id: api.id,
    privateSaleValue: api.private_sale_value !== null ? Number(api.private_sale_value) : null,
    partExchangeValue: api.part_exchange_value !== null ? Number(api.part_exchange_value) : null,
    instantOfferValue: api.instant_offer_value !== null ? Number(api.instant_offer_value) : null,
    confidenceBand: api.confidence_band,
    internal: {
      value: api.sources.internal.value !== null ? Number(api.sources.internal.value) : null,
      comparables: api.sources.internal.comparables ?? 0,
    },
    licensed: api.sources.licensed
      ? { value: api.sources.licensed.value !== null ? Number(api.sources.licensed.value) : null, source: api.sources.licensed.source }
      : null,
    vehicle,
  };
}

export type ApiPricingSuggestion = {
  suggested_price: number | null;
  range_low: number | null;
  range_high: number | null;
  confidence: string;
  comparables: number;
  message: string | null;
};

export function mapApiPricingSuggestion(api: ApiPricingSuggestion): PricingSuggestion {
  return {
    suggestedPrice: api.suggested_price,
    rangeLow: api.range_low,
    rangeHigh: api.range_high,
    confidence: api.confidence,
    comparables: api.comparables,
    message: api.message,
  };
}

export type ApiPhotoGuidance = {
  shots: { key: string; label: string; tip: string; required: boolean }[];
  required_shots: number;
  recommended_still_count: number;
  still_count: number | null;
  meets_recommendation: boolean | null;
};

export function mapApiPhotoGuidance(api: ApiPhotoGuidance): PhotoGuidance {
  return {
    shots: api.shots,
    requiredShots: api.required_shots,
    recommendedStillCount: api.recommended_still_count,
    stillCount: api.still_count,
    meetsRecommendation: api.meets_recommendation,
  };
}

export type ApiDealerAnalytics = {
  period_days: number;
  search_impressions: number;
  period_detail_views: number;
  period_calls: number;
  series: { date: string; impressions: number; views: number; calls: number }[];
  active_listings_count: number;
  total_detail_page_views: number;
  leads: {
    total: number;
    by_status: { new: number; contacted: number; converted: number; lost: number };
    conversion_rate: number | null;
  };
  appointments: { booked: number; completed: number; no_show: number; cancelled: number; no_show_rate: number | null };
  average_days_to_sell: number | null;
};

export function mapApiDealerAnalytics(api: ApiDealerAnalytics): DealerAnalytics {
  return {
    periodDays: api.period_days,
    searchImpressions: api.search_impressions,
    periodDetailViews: api.period_detail_views,
    periodCalls: api.period_calls,
    series: api.series,
    activeListingsCount: api.active_listings_count,
    totalDetailPageViews: api.total_detail_page_views,
    leads: {
      total: api.leads.total,
      byStatus: api.leads.by_status,
      conversionRate: api.leads.conversion_rate,
    },
    appointments: {
      booked: api.appointments.booked,
      completed: api.appointments.completed,
      noShow: api.appointments.no_show,
      cancelled: api.appointments.cancelled,
      noShowRate: api.appointments.no_show_rate,
    },
    averageDaysToSell: api.average_days_to_sell,
  };
}

export type ApiAdProduct = {
  id: number;
  code: string;
  name: string;
  type: string;
  price: string;
  requires_consent: boolean;
};

export function mapApiAdProduct(api: ApiAdProduct): AdProduct {
  return { id: api.id, code: api.code, name: api.name, type: api.type, price: Number(api.price), requiresConsent: api.requires_consent };
}

export type ApiAdCampaign = {
  id: number;
  product: { code: string; name: string; type: string };
  status: string;
  running: boolean;
  starts_at: string;
  ends_at: string;
  listing_id: string | null;
  target_make: string | null;
  target_model: string | null;
  impressions: number;
  clicks: number;
  leads: number;
  click_through_rate: number | null;
};

export function mapApiAdCampaign(api: ApiAdCampaign): AdCampaign {
  return {
    id: api.id,
    product: api.product,
    status: api.status,
    running: api.running,
    startsAt: api.starts_at,
    endsAt: api.ends_at,
    listingId: api.listing_id,
    targetMake: api.target_make,
    targetModel: api.target_model,
    impressions: api.impressions,
    clicks: api.clicks,
    leads: api.leads,
    clickThroughRate: api.click_through_rate,
  };
}

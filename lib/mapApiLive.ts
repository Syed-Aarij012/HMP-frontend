import type {
  ConsoleLot,
  LiveLane,
  LotSnapshot,
  NextBid,
  ReserveIndicator,
  RostrumConsole,
} from "@/types/liveAuction";

type ApiNextBid = { minimum: string; increment: string } | null;

export type ApiSnapshot = {
  server_time: number;
  lot: {
    status: string;
    current_price: string | null;
    sequence: number;
    closes_at: string | null;
    reserve_met: boolean | null;
    lane_status: string | null;
    sale_type: string | null;
    next_bid: ApiNextBid;
  };
  you: { is_leading: boolean; has_bid: boolean };
  retracted_sequences: number[];
};

export type ApiLiveLanes = {
  max_concurrent_lanes: number;
  lanes: {
    id: number;
    name: string;
    status: string;
    sale: { id: number; name: string; sale_type: string };
    current_lot: {
      id: string;
      status: string;
      current_price: string | null;
      closes_at: string | null;
      vehicle: string | null;
    } | null;
  }[];
};

type ApiConsole = {
  server_time: number;
  lane: { id: number; name: string; status: string; sale_type: string };
  current_lot: {
    id: string;
    status: string;
    vehicle: string | null;
    current_price: string | null;
    reserve: { state: ReserveIndicator["state"]; reserve_price: string | null; band: ReserveIndicator["band"] };
    next_bid: ApiNextBid;
    sequence: number;
    bid_feed: {
      id: number;
      sequence_number: number;
      amount: string;
      channel: string;
      paddle: string;
      created_at: string;
    }[];
  } | null;
  next_lots: { id: string; run_order: number; vehicle: string | null }[];
};

function mapNextBid(next: ApiNextBid): NextBid | null {
  return next ? { minimum: Number(next.minimum), increment: Number(next.increment) } : null;
}

export function mapApiSnapshot(api: ApiSnapshot): LotSnapshot {
  return {
    serverTime: api.server_time,
    status: api.lot.status,
    currentPrice: api.lot.current_price !== null ? Number(api.lot.current_price) : null,
    sequence: api.lot.sequence,
    closesAt: api.lot.closes_at,
    reserveMet: api.lot.reserve_met,
    laneStatus: api.lot.lane_status,
    saleType: api.lot.sale_type,
    nextBid: mapNextBid(api.lot.next_bid),
    isLeading: api.you.is_leading,
    hasBid: api.you.has_bid,
    retractedSequences: api.retracted_sequences,
  };
}

export function mapApiLiveLanes(api: ApiLiveLanes): { maxLanes: number; lanes: LiveLane[] } {
  return {
    maxLanes: api.max_concurrent_lanes,
    lanes: api.lanes.map((lane) => ({
      id: lane.id,
      name: lane.name,
      status: lane.status,
      saleName: lane.sale.name,
      saleType: lane.sale.sale_type,
      currentLot: lane.current_lot
        ? {
            id: lane.current_lot.id,
            status: lane.current_lot.status,
            currentPrice: lane.current_lot.current_price !== null ? Number(lane.current_lot.current_price) : null,
            closesAt: lane.current_lot.closes_at,
            vehicle: lane.current_lot.vehicle,
          }
        : null,
    })),
  };
}

function mapConsoleLot(lot: NonNullable<ApiConsole["current_lot"]>): ConsoleLot {
  return {
    id: lot.id,
    status: lot.status,
    vehicle: lot.vehicle,
    currentPrice: lot.current_price !== null ? Number(lot.current_price) : null,
    reserve: {
      state: lot.reserve.state,
      reservePrice: lot.reserve.reserve_price !== null ? Number(lot.reserve.reserve_price) : null,
      band: lot.reserve.band,
    },
    nextBid: mapNextBid(lot.next_bid),
    sequence: lot.sequence,
    bidFeed: lot.bid_feed.map((bid) => ({
      id: bid.id,
      sequenceNumber: bid.sequence_number,
      amount: Number(bid.amount),
      channel: bid.channel,
      paddle: bid.paddle,
      createdAt: bid.created_at,
    })),
  };
}

export function mapApiConsole(api: ApiConsole): RostrumConsole {
  return {
    serverTime: api.server_time,
    lane: { id: api.lane.id, name: api.lane.name, status: api.lane.status, saleType: api.lane.sale_type },
    currentLot: api.current_lot ? mapConsoleLot(api.current_lot) : null,
    nextLots: api.next_lots.map((lot) => ({ id: lot.id, runOrder: lot.run_order, vehicle: lot.vehicle })),
  };
}

export type { ApiConsole };

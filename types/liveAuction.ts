// FR-D-030..035: shapes returned by the live-protocol endpoints (snapshot, lanes, console).

export type NextBid = { minimum: number; increment: number };

export type LotSnapshot = {
  serverTime: number;
  status: string;
  currentPrice: number | null;
  sequence: number;
  closesAt: string | null;
  reserveMet: boolean | null;
  laneStatus: string | null;
  saleType: string | null;
  nextBid: NextBid | null;
  isLeading: boolean;
  hasBid: boolean;
  retractedSequences: number[];
};

export type LiveLane = {
  id: number;
  name: string;
  status: string;
  saleName: string;
  saleType: string;
  currentLot: {
    id: string;
    status: string;
    currentPrice: number | null;
    closesAt: string | null;
    vehicle: string | null;
  } | null;
};

export type ReserveIndicator = {
  state: "no_reserve" | "met" | "not_met";
  reservePrice: number | null;
  band: "within_5_percent" | "within_15_percent" | "far" | null;
};

export type ConsoleBid = {
  id: number;
  sequenceNumber: number;
  amount: number;
  channel: string;
  paddle: string;
  createdAt: string;
};

export type ConsoleLot = {
  id: string;
  status: string;
  vehicle: string | null;
  currentPrice: number | null;
  reserve: ReserveIndicator;
  nextBid: NextBid | null;
  sequence: number;
  bidFeed: ConsoleBid[];
};

export type RostrumConsole = {
  serverTime: number;
  lane: { id: number; name: string; status: string; saleType: string };
  currentLot: ConsoleLot | null;
  nextLots: { id: string; runOrder: number; vehicle: string | null }[];
};

// FR-D-036: the thinner spectator-tier read model — no "you" section, no bid-by-bid feed.
export type SpectatorLotState = {
  serverTime: number;
  status: string;
  currentPrice: number | null;
  closesAt: string | null;
  reserveMet: boolean | null;
  laneStatus: string | null;
};

// FR-D-033: a lane's audio/video stream descriptor.
export type LaneVideoStream = {
  protocol: "webrtc" | "ll-hls";
  url: string;
  glassToGlassTargetMs: number;
  available: boolean;
};

// FR-F-001/002/010/012/020: post-sale records as the API returns them.

export type CarrierQuote = { carrier_id: number; carrier: string; amount: string };

export type TransportEvent = {
  event_type: string;
  notes: string | null;
  gps: { lat: number; lng: number } | null;
  photos: string[] | null;
  signed_by: string | null;
  created_at: string;
};

export type TransportJob = {
  id: number;
  status: "quoted" | "booked" | "assigned" | "in_transit" | "delivered" | "pod_confirmed" | "exception";
  carrier_id: number | null;
  pickup_address: { postcode?: string; line1?: string };
  dropoff_address: { postcode?: string; line1?: string };
  vehicle_class: string;
  transport_type: string;
  quote_amount: string;
  distance_miles: string | number | null;
  carrier_quotes: CarrierQuote[] | null;
  consolidation_group_id: string | null;
  eta_at: string | null;
  last_position: { lat: number; lng: number; at: string } | null;
  collected_at: string | null;
  delivered_at: string | null;
  exception_code: string | null;
  events?: TransportEvent[];
};

export type ReleaseNote = {
  id: number;
  status: "pending" | "released" | "held";
  hold_reason: string | null;
  released_at: string | null;
  release_code?: string;
  release_qr_svg?: string;
  signed_at: string | null;
  handover_checklist: Record<string, boolean> | null;
};

export type VaultDocument = { download_url: string; retain_until: string };

export type DocumentManifest = {
  invoices: (VaultDocument & { id: number; invoice_number: string; total: string })[];
  release_note: (VaultDocument & { status: string }) | null;
  condition_report: (VaultDocument & { condition_grade: number | null }) | null;
  title_transfer: (VaultDocument & { status: string }) | null;
  proof_of_delivery: VaultDocument | null;
  mot_history_download: VaultDocument;
  vehicle_documents: (VaultDocument & { id: number; type: string; original_name: string })[];
};

export type AssuranceClaim = {
  id: number;
  claim_type: string;
  description: string;
  status: "submitted" | "in_triage" | "resolved" | "rejected";
  triage_due_at: string;
  triage_overdue: boolean;
  resolution: string | null;
  resolution_amount: string | null;
  resolution_notes: string | null;
  created_at: string;
};

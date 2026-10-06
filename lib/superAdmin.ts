/**
 * SRS §2.2 P7 — Global Super Admin console types. These mirror the backend's /api/admin/*
 * responses (Api\Admin\* controllers, AdminUserResource, AdminActionRequestResource).
 */

export type Justification = { reason: string; ticket_reference: string };

/**
 * A Laravel page: a plain paginator has its paging fields at the top level, a resource
 * collection nests them under `meta`. pageInfo() reads either.
 */
export type Paginated<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
  meta?: { current_page: number; last_page: number; total: number };
};

export function pageInfo(page: Paginated<unknown>) {
  return {
    page: page.meta?.current_page ?? page.current_page ?? 1,
    lastPage: page.meta?.last_page ?? page.last_page ?? 1,
    total: page.meta?.total ?? page.total ?? page.data.length,
  };
}

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  user_type: string;
  status: "active" | "suspended" | "banned";
  kyc_status: string;
  mfa_enabled: boolean;
  roles: string[];
  organization: { id: number; name: string; status: string } | null;
  created_at: string | null;
};

export type AdminOrganization = {
  id: number;
  name: string;
  legal_name: string | null;
  type: "dealer_group" | "platform";
  companies_house_number: string | null;
  kyb_status: string;
  status: "active" | "suspended";
  users_count: number;
  listings_count: number;
  created_at: string | null;
};

export type AdminListing = {
  id: string;
  title: string;
  vrm: string | null;
  status: string;
  price: string;
  seller: { kind: "dealer" | "private"; name: string | null };
  taken_down_at: string | null;
  takedown_reason: string | null;
  published_at: string | null;
};

export type AdminActionRequest = {
  id: number;
  action: string;
  target_kind: "user" | "listing" | "organization" | "role" | "record";
  target_id: number;
  target_label: string | null;
  payload: Record<string, unknown>;
  reason: string;
  ticket_reference: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  requested_by: { id: number; name: string } | null;
  decided_by: { id: number; name: string } | null;
  decision_note: string | null;
  decided_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  can_decide: boolean;
  can_cancel: boolean;
};

export type FeatureFlag = {
  id: number;
  key: string;
  description: string | null;
  enabled: boolean;
  updated_by: { id: number; name: string } | null;
  updated_at: string | null;
};

export type PrivilegeElevation = {
  id: number;
  scope: string;
  reason: string;
  ticket_reference: string;
  active: boolean;
  expires_at: string;
  revoked_at: string | null;
  created_at: string | null;
};

export type RoleMatrixRow = {
  name: string;
  label: string;
  scope: "platform" | "organization" | null;
  users_count: number;
  permissions: string[];
  added_since_baseline: string[];
  removed_since_baseline: string[];
};

export type RoleMatrixResponse = { data: RoleMatrixRow[]; permissions: string[]; policy_version: string };

export type AuditLogRow = {
  id: number;
  actor: { id: number; name: string; email: string } | null;
  actor_role: string | null;
  action: string;
  resource_type: string;
  resource_id: number | null;
  decision: string | null;
  policy_version: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

export type SuperAdminOverview = {
  users: { total: number; frozen: number; super_admins: number };
  organizations: { total: number; suspended: number };
  listings: { live: number; taken_down: number; awaiting_review: number };
  pending_approvals: number;
  awaiting_my_approval: number;
  feature_flags: { total: number; enabled: number };
  my_active_elevations: number;
};

/** The pending-request body the backend returns (HTTP 202) for a four-eyes action. */
export type FourEyesResponse = { data: AdminActionRequest; message: string };

export const ACTION_LABELS: Record<string, string> = {
  freeze_account: "Freeze account",
  unfreeze_account: "Unfreeze account",
  assign_role: "Assign role",
  revoke_role: "Revoke role",
  takedown_listing: "Take down listing",
  restore_listing: "Restore listing",
  suspend_organization: "Suspend organization",
  reactivate_organization: "Reactivate organization",
  grant_permission: "Grant permission to role",
  revoke_permission: "Revoke permission from role",
};

export const actionLabel = (action: string) => ACTION_LABELS[action] ?? action.replace(/_/g, " ");

export const TICKET_PATTERN = /^[A-Z][A-Z0-9]{1,9}-\d{1,8}$/;

export const formatWhen = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-";

export const roleLabel = (role: string) => role.replace(/_/g, " ");

// ---------------------------------------------------------------- Listing moderation (FR-C-001)

export type ModerationQueueItem = {
  id: string;
  title: string;
  vrm: string | null;
  price: string;
  status: string;
  seller: { kind: "dealer" | "private"; name: string | null };
  photo_url: string | null;
  photos_count: number;
  documents_count: number;
  submitted_at: string | null;
  review_note: string | null;
  taken_down_at: string | null;
};

export type ModerationDetail = {
  listing: {
    id: string;
    title: string;
    status: string;
    price: string;
    price_type: string;
    description: string | null;
    postcode: string | null;
    created_at: string | null;
    published_at: string | null;
    expires_at: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    review_note: string | null;
    taken_down_at: string | null;
    takedown_reason: string | null;
  };
  seller: {
    kind: "dealer" | "private";
    name: string | null;
    email: string | null;
    phone: string | null;
    kyc_status: string | null;
    account_status: string | null;
    member_since: string | null;
    organization: { name: string; kyb_status: string; status: string } | null;
    other_listings: number;
  };
  vehicle: Record<string, string | number | null> & { id: string; features: string[] };
  media: { id: number; type: string; url: string | null; qa_status: string; qa_message: string | null }[];
  documents: {
    id: number;
    type: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    uploaded_by: string | null;
    uploaded_at: string | null;
    download_path: string;
  }[];
  provenance_checks: { check_type: string; result: string; category: string | null; checked_at: string | null }[];
  condition_report: { version: number; condition_grade: string | null; mechanical_grade: string | null; consumer_summary: unknown; published_at: string | null } | null;
  history: { from: string | null; to: string; by: string | null; reason: string | null; at: string | null }[];
  blockers: { code: string; message: string }[];
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  v5c: "V5C logbook",
  mot: "MOT certificate",
  service_history: "Service history",
  other: "Other document",
};

export const humanize = (value: string | null | undefined) => (value ? value.replace(/_/g, " ") : "—");

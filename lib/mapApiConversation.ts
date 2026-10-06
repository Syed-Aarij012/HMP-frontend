export type ApiMessage = {
  id: number;
  sender_id: number;
  // Who wrote it (on a dealer's side, any teammate) — absent on older responses.
  sender?: { id: number; name: string; avatar_url: string | null } | null;
  body: string;
  attachments: string[] | null;
  is_mine: boolean;
  created_at: string;
};

export type ApiConversation = {
  id: number;
  listing: {
    id: string;
    vehicle?: { make?: string; model?: string; derivative?: string } | null;
  } | null;
  buyer: { id: number; name: string; avatar_url: string | null } | null;
  // id is null when the seller is a dealer organization rather than a person.
  seller: { id: number | null; name: string; avatar_url: string | null } | null;
  // Which side of the thread the viewer is on, and who is on the other side — worked out by
  // the server, since a dealer's teammate isn't the seller_user_id and ids alone can't say.
  viewer_role?: "buyer" | "seller";
  other_party?: OtherParty | null;
  last_message_at: string | null;
  unread_count?: number;
  messages: ApiMessage[];
};

export type OtherParty = {
  kind: "user" | "dealer";
  role: "buyer" | "seller";
  name: string;
  avatar_url: string | null;
  // Where to view their profile, when they have a public one (a dealer's storefront page).
  profile_path: string | null;
};

export type ApiConversationsResponse = {
  data: ApiConversation[];
};

/** The listing's title, or the other party's name if it has none loaded — always something to show in a conversation list row. */
export function conversationTitle(conversation: ApiConversation, viewerId: number | undefined): string {
  const vehicle = conversation.listing?.vehicle;
  const listingTitle = vehicle
    ? [vehicle.make, vehicle.derivative ?? vehicle.model].filter(Boolean).join(" ")
    : null;

  if (listingTitle) return listingTitle;

  const otherParty = conversation.buyer?.id === viewerId ? conversation.seller : conversation.buyer;
  return otherParty?.name ?? "Conversation";
}

export function otherPartyName(conversation: ApiConversation, viewerId: number | undefined): string {
  if (conversation.other_party) return conversation.other_party.name;

  const otherParty = conversation.buyer?.id === viewerId ? conversation.seller : conversation.buyer;
  return otherParty?.name ?? "Unknown";
}

export function otherPartyAvatar(conversation: ApiConversation, viewerId: number | undefined): string | null {
  if (conversation.other_party) return conversation.other_party.avatar_url;

  const otherParty = conversation.buyer?.id === viewerId ? conversation.seller : conversation.buyer;
  return otherParty?.avatar_url ?? null;
}

/** "Dealer", "Seller" or "Buyer" — who the viewer is talking to. */
export function otherPartyRoleLabel(conversation: ApiConversation): string | null {
  const party = conversation.other_party;
  if (!party) return null;
  if (party.kind === "dealer") return "Dealer";
  return party.role === "seller" ? "Seller" : "Buyer";
}

/** The listing the thread is about, e.g. "Volvo XC60". */
export function conversationListingTitle(conversation: ApiConversation): string | null {
  const vehicle = conversation.listing?.vehicle;
  if (!vehicle) return null;
  return [vehicle.make, vehicle.derivative ?? vehicle.model].filter(Boolean).join(" ") || null;
}

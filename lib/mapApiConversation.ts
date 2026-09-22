export type ApiMessage = {
  id: number;
  sender_id: number;
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
  seller: { id: number; name: string; avatar_url: string | null } | null;
  last_message_at: string | null;
  unread_count?: number;
  messages: ApiMessage[];
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
  const otherParty = conversation.buyer?.id === viewerId ? conversation.seller : conversation.buyer;
  return otherParty?.name ?? "Unknown";
}

export function otherPartyAvatar(conversation: ApiConversation, viewerId: number | undefined): string | null {
  const otherParty = conversation.buyer?.id === viewerId ? conversation.seller : conversation.buyer;
  return otherParty?.avatar_url ?? null;
}

import type { Agent } from "@/types/agents";

// A real agent's id is a plain integer too, so — unlike a listing's ULID — it can't be
// told apart from a mock agent's by shape alone; the route carries an explicit prefix
// instead (see lib/agent-detail-page.tsx's REAL_AGENT_ID_PREFIX, which must match this).
export function getAgentHref(agent: Agent): string {
  return `/sale-agents-detail/${agent.isReal ? `agent-${agent.id}` : agent.id}`;
}

export type ApiAgent = {
  id: number;
  name: string;
  phone?: string | null;
  email: string;
  title: string;
  organization?: { id: number; name: string } | null;
  rooftop?: { name?: string; city?: string } | null;
  listings_count?: number;
};

export type ApiAgentsResponse = {
  data: ApiAgent[];
};

// The backend has no headshot of its own — cycle through the template's bundled agent
// photos, same placeholder approach as mapApiListingToCar's car photos.
const AGENT_PHOTO_COUNT = 23;

export function mapApiAgentToAgent(agent: ApiAgent): Agent {
  const photoNumber = (agent.id % AGENT_PHOTO_COUNT) + 1;

  return {
    id: agent.id,
    image: `/assets/images/agent/agent-${photoNumber}.jpg`,
    name: agent.name,
    role: agent.title,
    phone: agent.phone ?? "",
    email: agent.email,
    address: agent.rooftop?.city,
    isReal: true,
    organizationId: agent.organization?.id,
    listingsCount: agent.listings_count,
  };
}

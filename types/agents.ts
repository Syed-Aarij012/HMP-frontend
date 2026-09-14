export type Agent = {
  id: number;
  image: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  rating?: number;
  bio?: string;
  address?: string;
  dealerId?: number;
  // Real agents only: a real user id is a plain small integer just like a mock agent's,
  // so it can't be told apart by shape alone the way a listing's ULID can — isReal flags
  // it explicitly instead. See lib/agent-detail-page.tsx / hooks/useAgents.ts.
  isReal?: boolean;
  organizationId?: number;
  listingsCount?: number;
};

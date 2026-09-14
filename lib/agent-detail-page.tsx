import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { saleAgents, getAgentById, getAgentDetailTitle } from "@/data/agents";
import { apiFetch } from "@/lib/api-client";
import { mapApiAgentToAgent, type ApiAgent } from "@/lib/mapApiAgent";
import type { Agent } from "@/types/agents";

type AgentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export type AgentDetailSectionProps = {
  agent: Agent;
};

// A real agent's id is a plain integer too (it's just the user's row id), so it can't be
// told apart from a mock agent's by shape alone the way a listing's ULID can — real agent
// links carry an explicit "agent-" prefix instead (see hooks/useAgents.ts).
const REAL_AGENT_ID_PREFIX = "agent-";

async function resolveAgent(id: string): Promise<{ agent: Agent; title: string } | null> {
  if (id.startsWith(REAL_AGENT_ID_PREFIX)) {
    const realId = id.slice(REAL_AGENT_ID_PREFIX.length);

    try {
      const response = await apiFetch<{ data: ApiAgent }>(`/agents/${realId}`, { auth: false });
      const agent = mapApiAgentToAgent(response.data);
      return { agent, title: agent.name };
    } catch {
      return null;
    }
  }

  const agentId = Number(id);
  const agent = Number.isInteger(agentId) ? getAgentById(agentId) : undefined;

  return agent ? { agent, title: getAgentDetailTitle(agentId) } : null;
}

export function createAgentDetailPageConfig(
  Hero: ComponentType<{ agent: Agent }>,
  SaleAgentsDetail: ComponentType<AgentDetailSectionProps>,
) {
  function generateStaticParams() {
    return saleAgents.map((agent) => ({ id: String(agent.id) }));
  }

  async function generateMetadata({
    params,
  }: AgentDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    const resolved = await resolveAgent(id);

    if (!resolved) {
      return {
        title: "Sale Agents Detail | HMP - Car Dealer, Rental & Listing",
      };
    }

    return {
      title: `${resolved.title} | HMP`,
      description: "HMP - Car Dealer, Rental & Listing",
    };
  }

  async function Page({ params }: AgentDetailPageProps) {
    const { id } = await params;
    const resolved = await resolveAgent(id);

    if (!resolved) {
      notFound();
    }

    const { agent } = resolved;

    return (
      <>
        <Hero agent={agent} />
        <SaleAgentsDetail agent={agent} />
      </>
    );
  }

  return { generateStaticParams, generateMetadata, default: Page };
}

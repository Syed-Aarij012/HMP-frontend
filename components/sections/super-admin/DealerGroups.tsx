"use client";

import { useState } from "react";
import SuperAdminShell from "./SuperAdminShell";
import JustifiedAction from "./JustifiedAction";
import { Badge, Card, EmptyState, ErrorNotice, LoadingRows } from "@/components/admin/ui";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import type { AdminOrganization, Paginated } from "@/lib/superAdmin";

type Group = {
  id: number;
  name: string;
  status: string;
  dealerships: { id: number; name: string; status: string; kyb_status: string }[];
  group_admins: { id: number; name: string; email: string }[];
};

function AddDealership({ group, onDone }: { group: Group; onDone: () => void }) {
  const orgs = useAdminResource<Paginated<AdminOrganization & { dealer_group_id?: number | null }>>("/admin/organizations?per_page=100");
  const [orgId, setOrgId] = useState("");
  const candidates = (orgs.data?.data ?? []).filter((o) => o.type === "dealer_group" && !group.dealerships.some((d) => d.id === o.id));

  return (
    <JustifiedAction
      label="Add dealership"
      title={`Add a dealership to ${group.name}`}
      description="It joins the group; its Org Admin keeps running it day to day."
      path={`/admin/dealer-groups/${group.id}/dealerships`}
      extra={{ organization_id: Number(orgId) }}
      canSubmit={orgId !== ""}
      extraFields={
        <div className="ha-field">
          <label htmlFor={`add-org-${group.id}`}>Dealership</label>
          <select id={`add-org-${group.id}`} className="ha-select" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">Choose a dealership...</option>
            {candidates.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      }
      onDone={() => { setOrgId(""); onDone(); }}
    />
  );
}

function CreateGroup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  return (
    <JustifiedAction
      label="+ New dealer group"
      title="Create a dealer group"
      description="A group sits above several dealerships. Add dealerships to it afterwards, then appoint a Group Admin from Users & roles."
      path="/admin/dealer-groups"
      extra={{ name: name.trim() }}
      primary
      canSubmit={name.trim().length > 1}
      extraFields={
        <div className="ha-field">
          <label htmlFor="group-name">Group name</label>
          <input id="group-name" className="ha-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
        </div>
      }
      onDone={() => { setName(""); onDone(); }}
    />
  );
}

/**
 * REQ RBAC-003 tenant management: dealer groups (dealer group → dealership → rooftop → user).
 * Appointing a Group Admin is a role grant, so it's done from Users & roles (four-eyes).
 */
export default function DealerGroups() {
  const { data, loading, error, reload } = useAdminResource<{ data: Group[] }>("/admin/dealer-groups");

  return (
    <SuperAdminShell
      title="Dealer groups"
      intro="A dealer group runs several dealerships as one. Create the group, add its dealerships, then appoint a Group Admin (assign the “dealer group admin” role to one of its Org Admins from Users & roles — it needs a second Super Admin's approval)."
      actions={<CreateGroup onDone={reload} />}
    >
      {loading && !data && <Card><LoadingRows /></Card>}
      {error && <Card><ErrorNotice message={error} /></Card>}
      {data && data.data.length === 0 && <Card><EmptyState icon="icon-carus-usercheck" title="No dealer groups yet" text="Create one with “New dealer group”." /></Card>}
      {data?.data.map((group) => (
        <Card key={group.id} title={group.name} actions={<AddDealership group={group} onDone={reload} />}>
          <div className="ha-card-body">
            <div className="ha-sub" style={{ marginBottom: 6, fontWeight: 600 }}>Group Admins</div>
            {group.group_admins.length === 0 ? <span className="ha-sub">None appointed yet.</span> : <div className="ha-chips">{group.group_admins.map((a) => <Badge key={a.id} plain tone="primary">{a.name} · {a.email}</Badge>)}</div>}
          </div>
          {group.dealerships.length === 0 ? (
            <EmptyState icon="icon-carus-car" title="No dealerships in this group yet" />
          ) : (
            <div className="ha-table-wrap">
              <table className="ha-table">
                <tbody>
                  {group.dealerships.map((d) => (
                    <tr key={d.id}>
                      <td className="ha-primary-text">{d.name}</td>
                      <td><Badge tone={d.kyb_status === "verified" ? "success" : "warning"}>KYB {d.kyb_status}</Badge></td>
                      <td><Badge tone={d.status === "active" ? "success" : "danger"}>{d.status}</Badge></td>
                      <td className="ha-right">
                        <JustifiedAction label="Remove" title={`Remove ${d.name} from ${group.name}`} description="Its Group Admins lose the group role." path={`/admin/dealer-groups/${group.id}/dealerships/${d.id}/remove`} danger onDone={reload} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </SuperAdminShell>
  );
}

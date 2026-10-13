"use client";

import { useRef, useState, type FormEvent } from "react";
import SuperAdminShell from "./SuperAdminShell";
import {
  Badge,
  Card,
  EmptyState,
  ErrorNotice,
  LoadingRows,
  Modal,
  useToast,
} from "@/components/admin/ui";
import AppImage from "@/components/common/AppImage";
import { useAdminResource } from "@/hooks/useSuperAdmin";
import { apiFetch, describeApiError } from "@/lib/api-client";

type Brand = {
  id: number;
  name: string;
  slug: string;
  logo_path: string | null;
  logo_url: string | null;
  display_order: number;
  is_active: boolean;
};

type Dialog = { kind: "create" } | { kind: "edit"; brand: Brand } | null;

/**
 * Admin management of the homepage "Search By Brand" rail (previously hardcoded frontend
 * data). Plain CRUD behind 'manage-taxonomy' — see BrandController's docblock for why this
 * isn't built on the versioned make/model/derivative taxonomy below it in the nav: a
 * marketing rail's logo/order needs to take effect the moment it's saved, not go through a
 * draft/publish release.
 */
export default function Brands() {
  const { notify } = useToast();
  const { data, loading, error, reload } = useAdminResource<Brand[]>("/admin/brands");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [logoBusyId, setLogoBusyId] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  function open(next: Dialog) {
    setFormError(null);
    if (next?.kind === "create") {
      setName("");
      setDisplayOrder("0");
      setIsActive(true);
    } else if (next?.kind === "edit") {
      setName(next.brand.name);
      setDisplayOrder(String(next.brand.display_order));
      setIsActive(next.brand.is_active);
    }
    setDialog(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!dialog) return;
    setBusy(true);
    setFormError(null);
    try {
      const body = {
        name: name.trim(),
        display_order: Number(displayOrder) || 0,
        is_active: isActive,
      };
      if (dialog.kind === "create") {
        await apiFetch("/admin/brands", { method: "POST", body });
        notify(`${body.name} added.`);
      } else {
        await apiFetch(`/admin/brands/${dialog.brand.id}`, { method: "PATCH", body });
        notify(`${body.name} updated.`);
      }
      setDialog(null);
      reload();
    } catch (err) {
      setFormError(describeApiError(err, "Could not save this brand."));
    } finally {
      setBusy(false);
    }
  }

  async function remove(brand: Brand) {
    if (!window.confirm(`Remove ${brand.name} from the homepage brand list? This can't be undone.`)) {
      return;
    }
    try {
      await apiFetch(`/admin/brands/${brand.id}`, { method: "DELETE" });
      notify(`${brand.name} removed.`);
      reload();
    } catch (err) {
      notify(describeApiError(err, "Could not remove this brand."), { error: true });
    }
  }

  async function uploadLogo(brand: Brand, file: File) {
    setLogoBusyId(brand.id);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      await apiFetch(`/admin/brands/${brand.id}/logo`, { method: "POST", body: formData });
      reload();
    } catch (err) {
      notify(describeApiError(err, "Could not upload this logo."), { error: true });
    } finally {
      setLogoBusyId(null);
    }
  }

  async function removeLogo(brand: Brand) {
    setLogoBusyId(brand.id);
    try {
      await apiFetch(`/admin/brands/${brand.id}/logo`, { method: "DELETE" });
      reload();
    } catch (err) {
      notify(describeApiError(err, "Could not remove this logo."), { error: true });
    } finally {
      setLogoBusyId(null);
    }
  }

  return (
    <SuperAdminShell
      title="Brands"
      intro={
        <>
          Manage the brand logos shown in the homepage &ldquo;Search By Brand&rdquo; rail.
          Listing counts are live — pulled straight from current inventory, not set by hand.
        </>
      }
      actions={
        <button type="button" className="ha-btn is-primary" onClick={() => open({ kind: "create" })}>
          + New brand
        </button>
      }
    >
      <Card>
        {loading && !data && <LoadingRows />}
        {error && <ErrorNotice message={error} />}
        {data && data.length === 0 && (
          <EmptyState icon="icon-carus-car" title="No brands yet" text='Add one with "New brand".' />
        )}
        {data && data.length > 0 && (
          <div className="ha-table-wrap">
            <table className="ha-table"><caption className="ha-visually-hidden">Brands</caption>
              <thead>
                <tr>
                  <th scope="col">Logo</th>
                  <th scope="col">Name</th>
                  <th scope="col">Order</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="ha-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((brand) => (
                  <tr key={brand.id}>
                    <td>
                      {brand.logo_url ? (
                        // fill (not width/height) — an admin-uploaded logo can be any aspect
                        // ratio, and fixed width/height props mismatch the actual rendered box
                        // the moment that ratio isn't exactly 64:36.
                        <div style={{ position: "relative", width: 64, height: 36 }}>
                          <AppImage
                            src={brand.logo_url}
                            alt={brand.name}
                            fill
                            sizes="64px"
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      ) : (
                        <span className="ha-sub">No logo</span>
                      )}
                    </td>
                    <td>
                      <div>{brand.name}</div>
                      <div className="ha-sub">{brand.slug}</div>
                    </td>
                    <td>{brand.display_order}</td>
                    <td>
                      <Badge tone={brand.is_active ? "success" : "neutral"}>
                        {brand.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </td>
                    <td>
                      <div className="ha-actions">
                        <input
                          ref={(el) => {
                            fileInputs.current[brand.id] = el;
                          }}
                          type="file"
                          hidden
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) uploadLogo(brand, file);
                          }}
                        />
                        <button
                          type="button"
                          className="ha-btn is-sm"
                          disabled={logoBusyId === brand.id}
                          onClick={() => fileInputs.current[brand.id]?.click()}
                        >
                          {logoBusyId === brand.id ? "..." : brand.logo_url ? "Replace logo" : "Add logo"}
                        </button>
                        {brand.logo_url && (
                          <button
                            type="button"
                            className="ha-btn is-sm"
                            disabled={logoBusyId === brand.id}
                            onClick={() => removeLogo(brand)}
                          >
                            Remove logo
                          </button>
                        )}
                        <button type="button" className="ha-btn is-sm" onClick={() => open({ kind: "edit", brand })}>
                          Edit
                        </button>
                        <button type="button" className="ha-btn is-sm is-danger" onClick={() => remove(brand)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={dialog !== null}
        onClose={() => !busy && setDialog(null)}
        title={dialog?.kind === "edit" ? `Edit ${dialog.brand.name}` : "New brand"}
        description={dialog === null ? undefined : "The logo is uploaded separately, from the table, once the brand is saved."}
      >
        <form onSubmit={submit}>
          <div className="ha-field">
            <label htmlFor="brand-name">Name</label>
            <input
              id="brand-name"
              className="ha-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
            />
            <div className="ha-hint">Matched against each listing&apos;s vehicle make to count its live cars.</div>
          </div>
          <div className="ha-field">
            <label htmlFor="brand-order">Display order</label>
            <input
              id="brand-order"
              type="number"
              min={0}
              className="ha-input"
              value={displayOrder}
              onChange={(event) => setDisplayOrder(event.target.value)}
            />
            <div className="ha-hint">Lower numbers show first.</div>
          </div>
          <label className="ha-check" style={{ marginBottom: 14 }}>
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Show
            on the homepage
          </label>
          {formError && (
            <div className="ha-alert is-danger" role="alert">
              {formError}
            </div>
          )}
          <div className="ha-modal-foot" style={{ padding: "4px 0 0" }}>
            <button type="button" className="ha-btn" onClick={() => setDialog(null)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="ha-btn is-primary" disabled={busy || !name.trim()}>
              {busy ? "Saving..." : dialog?.kind === "create" ? "Create brand" : "Save changes"}
            </button>
          </div>
        </form>
      </Modal>
    </SuperAdminShell>
  );
}

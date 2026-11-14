"use client";

import { Select } from "@lexta/ui";
import { CRM_ORG_KINDS, type CrmOrganisation, type Region } from "@lexta/db";
import { saveOrganisation } from "@/app/(app)/systems/crm/actions";
import FormAlerts from "./FormAlerts";
import type { Option } from "./LeadForm";
import { useCrmForm } from "./useCrmForm";

export default function OrganisationForm({
  mode, organisation, regions, stockists, productBrands, myBrandIds, linked, ownerOptions,
}: {
  mode: "new" | "edit" | "view";
  organisation?: CrmOrganisation;
  regions: Pick<Region, "id" | "name" | "is_in_ghana">[];
  stockists: Option[];
  productBrands: Option[];
  myBrandIds: string[];
  linked: string[];
  ownerOptions?: Option[];
}) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveOrganisation);
  const mine = new Set(myBrandIds);
  const isNew = mode === "new";
  const ghana = regions.filter((r) => r.is_in_ghana);
  const abroad = regions.filter((r) => !r.is_in_ghana);
  return (
    <form className="pform crm-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={organisation?.id ?? ""} />
      <fieldset disabled={mode === "view" || pending}>
        <div className="edit-grid">
          <div>
            <section className="panel">
              <h2>Organisation details</h2>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" defaultValue={organisation?.name ?? ""} maxLength={160} autoComplete="off" aria-invalid={!!fe.name} required />
                {fe.name && <span className="ferr">{fe.name}</span>}
              </div>
              <div className="row2">
                <div className="field">
                  <label htmlFor="kind">Kind</label>
                  <Select id="kind" name="kind" defaultValue={organisation?.kind ?? "other"} aria-invalid={!!fe.kind}>
                    {CRM_ORG_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </Select>
                  {fe.kind && <span className="ferr">{fe.kind}</span>}
                </div>
                <div className="field">
                  <label htmlFor="region_id">Region (optional)</label>
                  <Select id="region_id" name="region_id" defaultValue={organisation?.region_id ?? ""} aria-invalid={!!fe.region_id}>
                    <option value="">Not set</option>
                    <optgroup label="Ghana">{ghana.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>
                    {abroad.length > 0 && <optgroup label="Outside Ghana">{abroad.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>}
                  </Select>
                  {fe.region_id && <span className="ferr">{fe.region_id}</span>}
                </div>
              </div>
              <div className="row2">
                <div className="field">
                  <label htmlFor="town">Town (optional)</label>
                  <input id="town" name="town" defaultValue={organisation?.town ?? ""} maxLength={120} aria-invalid={!!fe.town} />
                  {fe.town && <span className="ferr">{fe.town}</span>}
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone (optional)</label>
                  <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={organisation?.phone ?? ""} maxLength={24} placeholder="+233 30 123 4567" aria-invalid={!!fe.phone} />
                  {fe.phone && <span className="ferr">{fe.phone}</span>}
                </div>
              </div>
              <div className="field">
                <label htmlFor="address">Address (optional)</label>
                <input id="address" name="address" defaultValue={organisation?.address ?? ""} maxLength={300} aria-invalid={!!fe.address} />
                {fe.address && <span className="ferr">{fe.address}</span>}
              </div>
              <div className="row2">
                <div className="field">
                  <label htmlFor="email">Email (optional)</label>
                  <input id="email" name="email" type="email" inputMode="email" defaultValue={organisation?.email ?? ""} maxLength={254} aria-invalid={!!fe.email} />
                  {fe.email && <span className="ferr">{fe.email}</span>}
                </div>
                <div className="field">
                  <label htmlFor="website">Website (optional)</label>
                  <input id="website" name="website" inputMode="url" defaultValue={organisation?.website ?? ""} maxLength={300} placeholder="https://" aria-invalid={!!fe.website} />
                  {fe.website && <span className="ferr">{fe.website}</span>}
                </div>
              </div>
              <div className="field">
                <label htmlFor="stockist_id">Linked stockist on Where to Buy (optional)</label>
                <Select id="stockist_id" name="stockist_id" defaultValue={organisation?.stockist_id ?? ""} aria-invalid={!!fe.stockist_id}>
                  <option value="">Not a listed stockist</option>
                  {stockists.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
                {fe.stockist_id && <span className="ferr">{fe.stockist_id}</span>}
              </div>
            </section>
          </div>
          <div>
            <section className="panel">
              <h2>Brands of interest</h2>
              {mode !== "view" && productBrands.some((b) => !mine.has(b.id)) && (
                <p className="small">You can tick or untick the brands you work on. Other brands are managed by their own teams.</p>
              )}
              <div className="brand-checks" role="group" aria-label="Brands of interest">
                {productBrands.map((b) => (
                  <label key={b.id} className={mine.has(b.id) ? "" : "locked"}>
                    <input type="checkbox" name="brand_ids" value={b.id} defaultChecked={linked.includes(b.id)} disabled={!mine.has(b.id)} />
                    {b.label}
                  </label>
                ))}
              </div>
              <p className="small">An organisation with no brand is shared with every team.</p>
            </section>
            <section className="panel">
              <h2>Staff notes</h2>
              <div className="field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea id="notes" name="notes" rows={4} maxLength={4000} defaultValue={organisation?.notes ?? ""} aria-invalid={!!fe.notes} />
                {fe.notes && <span className="ferr">{fe.notes}</span>}
              </div>
              {isNew && (
                <div className="field">
                  <label htmlFor="owner_id">Owner</label>
                  <Select id="owner_id" name="owner_id" defaultValue="me" aria-invalid={!!fe.owner_id}>
                    {(ownerOptions ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                  {fe.owner_id && <span className="ferr">{fe.owner_id}</span>}
                </div>
              )}
            </section>
          </div>
        </div>
      </fieldset>
      {mode !== "view" && (
        <div className="form-actions">
          <button className="btn" type="submit" disabled={pending}>{pending ? "Saving..." : isNew ? "Add organisation" : "Save changes"}</button>
        </div>
      )}
    </form>
  );
}

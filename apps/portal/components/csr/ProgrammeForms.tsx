"use client";

import { Select } from "@lexta/ui";
import { CSR_PROGRAMME_DESCRIPTION_MAX, CSR_PROGRAMME_NAME_MAX, type CsrProgramme } from "@lexta/db";
import { deleteProgramme, saveProgramme, setProgrammeActive } from "@/app/(app)/systems/csr/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

type Option = { id: string; name: string };

function Fields({ p, brands, fe, prefix }: { p?: CsrProgramme; brands: Option[]; fe: Record<string, string>; prefix: string }) {
  return (
    <>
      <div className="row2">
        <div className="field">
          <label htmlFor={`${prefix}_name`}>Name</label>
          <input id={`${prefix}_name`} name="name" defaultValue={p?.name ?? ""} maxLength={CSR_PROGRAMME_NAME_MAX} aria-invalid={!!fe.name} />
          {fe.name && <span className="ferr">{fe.name}</span>}
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor={`${prefix}_brand`}>Brand (optional)</label>
            <Select id={`${prefix}_brand`} name="brand_id" defaultValue={p?.brand_id ?? ""} aria-invalid={!!fe.brand_id}>
              <option value="">No brand (Lexta)</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            {fe.brand_id && <span className="ferr">{fe.brand_id}</span>}
          </div>
          <div className="field">
            <label htmlFor={`${prefix}_sort`}>Order</label>
            <input id={`${prefix}_sort`} name="sort_order" type="number" step={1} defaultValue={p?.sort_order ?? 0} aria-invalid={!!fe.sort_order} />
            {fe.sort_order && <span className="ferr">{fe.sort_order}</span>}
          </div>
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${prefix}_desc`}>Description (optional)</label>
        <textarea id={`${prefix}_desc`} name="description" rows={2} defaultValue={p?.description ?? ""} maxLength={CSR_PROGRAMME_DESCRIPTION_MAX} aria-invalid={!!fe.description} />
        {fe.description && <span className="ferr">{fe.description}</span>}
      </div>
    </>
  );
}

/** One programme: edit, switch on or off, delete when it has no activities. */
export function ProgrammeRow({ p, brands, activityCount }: { p: CsrProgramme; brands: Option[]; activityCount: number }) {
  const save = useCrmForm(saveProgramme);
  const toggle = useCrmForm(setProgrammeActive);
  const del = useCrmForm(deleteProgramme);
  return (
    <li className="csr-programme">
      <form onSubmit={save.onSubmit} noValidate className="pform">
        <input type="hidden" name="id" value={p.id} />
        <fieldset disabled={save.pending}>
          <Fields p={p} brands={brands} fe={save.fe} prefix={p.id} />
        </fieldset>
        <div className="fs-outcome-actions">
          <button className="btn small" type="submit" disabled={save.pending}>{save.pending ? "Saving..." : p.needs_review ? "Save as checked" : "Save"}</button>
          {p.needs_review && <span className="badge off">From the website, check and edit</span>}
          <span className={`badge ${p.is_active ? "on" : "off"}`}>{p.is_active ? "On" : "Off"}</span>
          <span className="small">{activityCount} {activityCount === 1 ? "activity" : "activities"}</span>
        </div>
      </form>
      <div className="fs-outcome-actions">
        <form onSubmit={toggle.onSubmit}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="active" value={p.is_active ? "0" : "1"} />
          <button className="btn small light" type="submit" disabled={toggle.pending}>{toggle.pending ? "Saving..." : p.is_active ? "Switch off" : "Switch on"}</button>
        </form>
        {activityCount === 0 && (
          <form onSubmit={(e) => { if (!window.confirm(`Delete the programme "${p.name}"?`)) { e.preventDefault(); return; } del.onSubmit(e); }}>
            <input type="hidden" name="id" value={p.id} />
            <button className="btn small light" type="submit" disabled={del.pending}>{del.pending ? "Deleting..." : "Delete"}</button>
          </form>
        )}
      </div>
      <FormAlerts state={save.state} />
      <FormAlerts state={toggle.state} />
      <FormAlerts state={del.state} />
    </li>
  );
}

export function NewProgramme({ brands, nextOrder }: { brands: Option[]; nextOrder: number }) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveProgramme);
  return (
    <form onSubmit={onSubmit} noValidate className="pform">
      <h2>Add a programme</h2>
      <fieldset disabled={pending}>
        <Fields p={{ id: "", name: "", brand_id: null, description: null, is_active: true, sort_order: nextOrder, needs_review: false }} brands={brands} fe={fe} prefix="new" />
      </fieldset>
      <button className="btn small" type="submit" disabled={pending}>{pending ? "Adding..." : "Add programme"}</button>
      <FormAlerts state={state} />
    </form>
  );
}

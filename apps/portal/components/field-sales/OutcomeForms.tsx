"use client";

import { deleteOutcome, saveOutcome, setOutcomeActive } from "@/app/(app)/systems/field-sales/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

type Outcome = { id: string; label: string; sort_order: number; is_active: boolean };

/** One outcome: rename, reorder, switch on or off, delete when unused. */
export function OutcomeRow({ o }: { o: Outcome }) {
  const save = useCrmForm(saveOutcome);
  const toggle = useCrmForm(setOutcomeActive);
  const del = useCrmForm(deleteOutcome);
  return (
    <li className="fs-outcome-row">
      <form onSubmit={save.onSubmit} noValidate className="fs-outcome-edit">
        <input type="hidden" name="id" value={o.id} />
        <div className="field">
          <label htmlFor={`label_${o.id}`}>Name</label>
          <input id={`label_${o.id}`} name="label" defaultValue={o.label} maxLength={60} aria-invalid={!!save.fe.label} />
        </div>
        <div className="field fs-order">
          <label htmlFor={`sort_${o.id}`}>Order</label>
          <input id={`sort_${o.id}`} name="sort_order" type="number" step={1} defaultValue={o.sort_order} />
        </div>
        <button className="btn small" type="submit" disabled={save.pending}>{save.pending ? "Saving..." : "Save"}</button>
      </form>
      <div className="fs-outcome-actions">
        <span className={`badge ${o.is_active ? "on" : "off"}`}>{o.is_active ? "On" : "Off"}</span>
        <form onSubmit={toggle.onSubmit}>
          <input type="hidden" name="id" value={o.id} />
          <input type="hidden" name="active" value={o.is_active ? "0" : "1"} />
          <button className="btn small light" type="submit" disabled={toggle.pending}>{toggle.pending ? "Saving..." : o.is_active ? "Switch off" : "Switch on"}</button>
        </form>
        <form onSubmit={(e) => { if (!window.confirm(`Delete the outcome "${o.label}"?`)) { e.preventDefault(); return; } del.onSubmit(e); }}>
          <input type="hidden" name="id" value={o.id} />
          <button className="btn small light" type="submit" disabled={del.pending}>{del.pending ? "Deleting..." : "Delete"}</button>
        </form>
      </div>
      <FormAlerts state={save.state} />
      <FormAlerts state={toggle.state} />
      <FormAlerts state={del.state} />
    </li>
  );
}

export function NewOutcome({ nextOrder }: { nextOrder: number }) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveOutcome);
  return (
    <form onSubmit={onSubmit} noValidate className="fs-outcome-edit">
      <div className="field">
        <label htmlFor="new_label">New outcome</label>
        <input id="new_label" name="label" maxLength={60} placeholder="For example: Promotion material placed" aria-invalid={!!fe.label} />
        {fe.label && <span className="ferr">{fe.label}</span>}
      </div>
      <div className="field fs-order">
        <label htmlFor="new_sort">Order</label>
        <input id="new_sort" name="sort_order" type="number" step={1} defaultValue={nextOrder} />
      </div>
      <button className="btn small" type="submit" disabled={pending}>{pending ? "Adding..." : "Add"}</button>
      <div className="fs-full"><FormAlerts state={state} /></div>
    </form>
  );
}

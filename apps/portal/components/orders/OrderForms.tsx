"use client";

import { Select } from "@lexta/ui";
import { useEffect, useRef, useState } from "react";
import { orderStatusLabel, type OrderStatus } from "@lexta/db";
import { addStaffNote, linkDistributor, setOrderStatus, unlinkDistributor } from "@/app/(app)/systems/orders/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm order", dispatched: "Mark dispatched", delivered: "Mark delivered", cancelled: "Cancel order",
};

/** Staff: the next steps for an order, with a note the distributor sees (a reason is needed to cancel). */
export function StaffStatusForm({ id, status, next }: { id: string; status: OrderStatus; next: OrderStatus[] }) {
  const { state, pending, onSubmit, fe } = useCrmForm(setOrderStatus);
  const [choice, setChoice] = useState<OrderStatus | "">("");
  const form = useRef<HTMLFormElement>(null);
  // After a move, start again empty (the same form stays mounted, so a quick next move is never lost).
  useEffect(() => {
    if (state.message) { setChoice(""); form.current?.reset(); }
  }, [state]);
  if (!next.length) {
    return <p className="small">This order is {orderStatusLabel(status).toLowerCase()}. There is nothing more to do.</p>;
  }
  return (
    <form className="stage-form" noValidate onSubmit={onSubmit} ref={form}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <p className="small" style={{ margin: 0 }}>Now: <b>{orderStatusLabel(status)}</b>. Next:</p>
      <div className="stage-pills" role="radiogroup" aria-label="Next status">
        {next.map((s) => (
          <label key={s} className={`stage-pill o-${s}${choice === s ? " on" : ""}`}>
            <input type="radio" name="status" value={s} checked={choice === s} onChange={() => setChoice(s)} disabled={pending} />
            {ACTION_LABEL[s] ?? orderStatusLabel(s)}
          </label>
        ))}
      </div>
      {choice && (
        <div className="field">
          <label htmlFor="status_note">{choice === "cancelled" ? "Reason for cancelling (the distributor sees it)" : "Note for the distributor (optional)"}</label>
          <textarea id="status_note" name="note" rows={2} maxLength={1000} aria-invalid={!!fe.note} disabled={pending}
            placeholder={choice === "cancelled" ? "For example: out of stock until next month" : "For example: on the Tuesday truck"} />
          {fe.note && <span className="ferr">{fe.note}</span>}
        </div>
      )}
      <button className={`btn small${choice === "cancelled" ? " danger" : ""}`} type="submit" disabled={pending || !choice}>
        {pending ? "Saving..." : choice ? ACTION_LABEL[choice] ?? "Save" : "Choose a step"}
      </button>
    </form>
  );
}

/** Distributor: submit a draft, or cancel a draft or a submitted order (before Lexta confirms it). */
export function DistributorStatusButton({ id, to, label, confirm, danger }: { id: string; to: OrderStatus; label: string; confirm?: string; danger?: boolean }) {
  const { state, pending, onSubmit } = useCrmForm(setOrderStatus);
  return (
    <form noValidate onSubmit={(e) => { if (confirm && !window.confirm(confirm)) { e.preventDefault(); return; } onSubmit(e); }}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={to} />
      <button className={`btn${danger ? " light" : ""}`} type="submit" disabled={pending}>{pending ? "Working..." : label}</button>
    </form>
  );
}

/** Staff: an internal note. The distributor never sees these. */
export function StaffNoteForm({ id }: { id: string }) {
  const { state, pending, onSubmit, fe } = useCrmForm(addStaffNote);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.message) form.current?.reset(); }, [state]);
  return (
    <form className="activity-form" noValidate onSubmit={onSubmit} ref={form}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <div className="field">
        <label htmlFor="staff_note">Add an internal note</label>
        <textarea id="staff_note" name="body" rows={2} maxLength={2000} placeholder="For example: credit limit checked with finance"
          aria-invalid={!!fe.body} disabled={pending} />
        {fe.body && <span className="ferr">{fe.body}</span>}
      </div>
      <button className="btn small" type="submit" disabled={pending}>{pending ? "Adding..." : "Add note"}</button>
    </form>
  );
}

/** Staff: link a distributor login to a CRM organisation. */
export function LinkForm({ profileId, name, organisations }: { profileId: string; name: string; organisations: { id: string; name: string }[] }) {
  const { state, pending, onSubmit, fe } = useCrmForm(linkDistributor);
  const fieldId = `org_${profileId}`;
  return (
    <form className="link-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="profile_id" value={profileId} />
      <div className="field">
        <label htmlFor={fieldId}>Organisation for {name}</label>
        <Select id={fieldId} name="organisation_id" defaultValue="" aria-invalid={!!fe.organisation_id} disabled={pending}>
          <option value="">Choose an organisation</option>
          {organisations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
        {fe.organisation_id && <span className="ferr">{fe.organisation_id}</span>}
      </div>
      <button className="btn small" type="submit" disabled={pending}>{pending ? "Linking..." : "Link"}</button>
    </form>
  );
}

export function UnlinkForm({ profileId, name }: { profileId: string; name: string }) {
  const { state, pending, onSubmit } = useCrmForm(unlinkDistributor);
  return (
    <form noValidate onSubmit={(e) => { if (!window.confirm(`Unlink ${name}? They will no longer see any orders.`)) { e.preventDefault(); return; } onSubmit(e); }}>
      <FormAlerts state={state} />
      <input type="hidden" name="profile_id" value={profileId} />
      <button className="btn small light" type="submit" disabled={pending}>{pending ? "Working..." : "Unlink"}</button>
    </form>
  );
}

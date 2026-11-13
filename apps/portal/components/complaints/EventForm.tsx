"use client";

import { Select } from "@lexta/ui";
import { useEffect, useRef } from "react";
import { addComplaintEvent } from "@/app/(app)/systems/complaints/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

/** Log a note, call or email on a complaint. Status, owner and file entries come from the database. */
export default function EventForm({ id }: { id: string }) {
  const { state, pending, onSubmit, fe } = useCrmForm(addComplaintEvent);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.message) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} className="activity-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <fieldset disabled={pending}>
        <div className="field">
          <label htmlFor={`etype-${id}`}>Type</label>
          <Select id={`etype-${id}`} name="type" defaultValue="note" aria-invalid={!!fe.type}>
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
          </Select>
          {fe.type && <span className="ferr">{fe.type}</span>}
        </div>
        <div className="field">
          <label htmlFor={`ebody-${id}`}>What happened</label>
          <textarea id={`ebody-${id}`} name="body" rows={3} maxLength={4000} aria-invalid={!!fe.body} />
          {fe.body && <span className="ferr">{fe.body}</span>}
        </div>
      </fieldset>
      <button className="btn small" type="submit" disabled={pending}>{pending ? "Adding..." : "Add to timeline"}</button>
    </form>
  );
}

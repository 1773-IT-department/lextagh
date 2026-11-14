"use client";

import { DateInput, Select } from "@lexta/ui";
import { useEffect, useRef } from "react";
import { CRM_ACTIVITY_TYPES } from "@lexta/db";
import { addActivity } from "@/app/(app)/systems/crm/actions";
import FormAlerts from "./FormAlerts";
import { useCrmForm } from "./useCrmForm";

/** Log a note, call, email, meeting or visit on a lead, contact or organisation. */
export default function ActivityForm({ kind, id }: { kind: "lead" | "contact" | "organisation"; id: string }) {
  const { state, pending, onSubmit, fe } = useCrmForm(addActivity);
  const ref = useRef<HTMLFormElement>(null);
  // Empty the form after a successful save; on an error the text stays.
  useEffect(() => {
    if (state.message) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} className="activity-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <fieldset disabled={pending}>
        <div className="row2">
          <div className="field">
            <label htmlFor={`type-${id}`}>Type</label>
            <Select id={`type-${id}`} name="type" defaultValue="note" aria-invalid={!!fe.type}>
              {CRM_ACTIVITY_TYPES.filter((t) => t.value !== "status_change").map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            {fe.type && <span className="ferr">{fe.type}</span>}
          </div>
          <div className="field">
            <label htmlFor={`occurred-${id}`}>When (leave empty for now)</label>
            <DateInput id={`occurred-${id}`} name="occurred_at" type="datetime-local" aria-invalid={!!fe.occurred_at} />
            {fe.occurred_at && <span className="ferr">{fe.occurred_at}</span>}
          </div>
        </div>
        <div className="field">
          <label htmlFor={`body-${id}`}>What happened</label>
          <textarea id={`body-${id}`} name="body" rows={3} maxLength={4000} aria-invalid={!!fe.body} />
          {fe.body && <span className="ferr">{fe.body}</span>}
        </div>
      </fieldset>
      <button className="btn small" type="submit" disabled={pending}>{pending ? "Adding..." : "Add to timeline"}</button>
    </form>
  );
}

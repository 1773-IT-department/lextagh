"use client";

import { useState } from "react";
import { complaintStatusLabel, nextComplaintStatuses, type ComplaintStatus } from "@lexta/db";
import { setComplaintStatus } from "@/app/(app)/systems/complaints/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

/**
 * Move a complaint on. Resolving needs the resolution and the root cause, closing needs the resolution, reopening
 * needs a reason. The database writes the change to the timeline.
 */
export default function StatusForm({ id, status, resolutionSummary, rootCause }: {
  id: string;
  status: ComplaintStatus;
  resolutionSummary: string | null;
  rootCause: string | null;
}) {
  const { state, pending, onSubmit, fe } = useCrmForm(setComplaintStatus);
  const options = nextComplaintStatuses(status);
  const [next, setNext] = useState<string>("");
  const resolving = next === "resolved";
  const closing = next === "closed";
  return (
    <form className="stage-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <p className="small" style={{ margin: 0 }}>Now: <b>{complaintStatusLabel(status)}</b>. Move to:</p>
      <div className="stage-pills" role="radiogroup" aria-label="New status">
        {options.map((s) => (
          <label key={s} className={`stage-pill c-${s}${next === s ? " on" : ""}`}>
            <input type="radio" name="status" value={s} checked={next === s} onChange={() => setNext(s)} disabled={pending} />
            {complaintStatusLabel(s)}
          </label>
        ))}
      </div>
      {fe.status && <span className="ferr">{fe.status}</span>}
      {(resolving || closing) && (
        <div className="field">
          <label htmlFor="resolution_summary">How it was resolved</label>
          <textarea id="resolution_summary" name="resolution_summary" rows={3} maxLength={3000} defaultValue={resolutionSummary ?? ""}
            aria-invalid={!!fe.resolution_summary} disabled={pending} />
          {fe.resolution_summary && <span className="ferr">{fe.resolution_summary}</span>}
        </div>
      )}
      {resolving && (
        <div className="field">
          <label htmlFor="root_cause">Root cause</label>
          <textarea id="root_cause" name="root_cause" rows={2} maxLength={2000} defaultValue={rootCause ?? ""}
            placeholder="For example a weak seal on one filling line" aria-invalid={!!fe.root_cause} disabled={pending} />
          {fe.root_cause && <span className="ferr">{fe.root_cause}</span>}
        </div>
      )}
      {next && (
        <div className="field">
          <label htmlFor="status_note">{next === "reopened" ? "Why reopen it" : "Note (optional)"}</label>
          <textarea id="status_note" name="note" rows={2} maxLength={1000} aria-invalid={!!fe.note} disabled={pending} />
          {fe.note && <span className="ferr">{fe.note}</span>}
        </div>
      )}
      <button className="btn small" type="submit" disabled={pending || !next}>{pending ? "Saving..." : "Change status"}</button>
    </form>
  );
}

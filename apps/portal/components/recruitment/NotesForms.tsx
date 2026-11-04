"use client";

import { addApplicationNote, cleanUnclaimedUploads, saveStaffNotes } from "@/app/(app)/systems/recruitment/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

/** One running note on the application, kept up to date by staff (not shown to the applicant). */
export function StaffNotesForm({ id, notes }: { id: string; notes: string | null }) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveStaffNotes);
  return (
    <form className="stage-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <div className="field">
        <label htmlFor="staff_notes">Staff notes</label>
        <textarea id="staff_notes" name="staff_notes" rows={4} maxLength={4000} defaultValue={notes ?? ""} aria-invalid={!!fe.staff_notes} disabled={pending} />
        {fe.staff_notes && <span className="ferr">{fe.staff_notes}</span>}
      </div>
      <button className="btn small" type="submit" disabled={pending}>{pending ? "Saving..." : "Save notes"}</button>
    </form>
  );
}

/** A dated note in the history (calls, interview feedback). */
export function HistoryNoteForm({ id }: { id: string }) {
  const { state, pending, onSubmit, fe } = useCrmForm(addApplicationNote);
  return (
    <form className="activity-form" noValidate onSubmit={(e) => { onSubmit(e); }} key={state.message ?? "form"}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <div className="field">
        <label htmlFor="history_note">Add to the history</label>
        <textarea id="history_note" name="note" rows={2} maxLength={4000} placeholder="For example: called, interview booked for Monday 10am"
          aria-invalid={!!fe.note} disabled={pending} />
        {fe.note && <span className="ferr">{fe.note}</span>}
      </div>
      <button className="btn small" type="submit" disabled={pending}>{pending ? "Adding..." : "Add note"}</button>
    </form>
  );
}

/** Removes CV uploads nobody claimed within a day. */
export function CleanupForm({ count }: { count: number }) {
  const { state, pending, onSubmit } = useCrmForm(cleanUnclaimedUploads);
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <button className="btn small light" type="submit" disabled={pending || count === 0}>{pending ? "Removing..." : "Remove unclaimed uploads"}</button>
    </form>
  );
}

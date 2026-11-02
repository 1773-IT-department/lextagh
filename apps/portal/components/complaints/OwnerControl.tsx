"use client";

import { setComplaintOwner } from "@/app/(app)/systems/complaints/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

/** "Assign to me" for customer care on an unassigned case, or a reassign list for admin and management. */
export default function OwnerControl({ id, ownerId, ownerName, canAssignToMe, canReassign, staff }: {
  id: string;
  ownerId: string | null;
  ownerName: string;
  canAssignToMe: boolean;
  canReassign: boolean;
  staff: { id: string; label: string }[];
}) {
  const { state, pending, onSubmit } = useCrmForm(setComplaintOwner);
  return (
    <div className="owner-box">
      <p className="small"><b>Owner:</b> {ownerName || "Nobody yet"}</p>
      <FormAlerts state={state} />
      {canAssignToMe && !canReassign && (
        <form onSubmit={onSubmit}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="owner" value="me" />
          <button className="btn small" type="submit" disabled={pending}>{pending ? "Assigning..." : "Assign to me"}</button>
        </form>
      )}
      {canReassign && (
        <form className="owner-form" onSubmit={onSubmit}>
          <input type="hidden" name="id" value={id} />
          <label className="sr-only" htmlFor={`owner-${id}`}>Owner</label>
          <select id={`owner-${id}`} name="owner" defaultValue={ownerId ?? "none"} disabled={pending}>
            <option value="none">Nobody</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button className="btn small light" type="submit" disabled={pending}>{pending ? "Saving..." : "Set owner"}</button>
        </form>
      )}
    </div>
  );
}

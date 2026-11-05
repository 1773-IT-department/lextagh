"use client";

import { setApplicationOwner } from "@/app/(app)/systems/recruitment/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

/** Who looks after the application: anyone in recruitment (admin, management, hr). */
export default function OwnerControl({ id, ownerId, ownerName, staff }: {
  id: string;
  ownerId: string | null;
  ownerName: string;
  staff: { id: string; label: string }[];
}) {
  const { state, pending, onSubmit } = useCrmForm(setApplicationOwner);
  return (
    <div className="owner-box">
      <p className="small"><b>Owner:</b> {ownerName || "Nobody yet"}</p>
      <FormAlerts state={state} />
      <form className="owner-form" onSubmit={onSubmit}>
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`owner-${id}`}>Owner</label>
        <select id={`owner-${id}`} name="owner" defaultValue={ownerId ?? "none"} disabled={pending}>
          <option value="none">Nobody</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button className="btn small light" type="submit" disabled={pending}>{pending ? "Saving..." : "Set owner"}</button>
      </form>
    </div>
  );
}

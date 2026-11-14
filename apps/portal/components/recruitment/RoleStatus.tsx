"use client";

import type { JobOpeningStatus } from "@lexta/db";
import { setRoleStatus } from "@/app/(app)/systems/recruitment/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

/** Open now, close, or back to draft. The Careers page updates after each change. */
export default function RoleStatus({ id, status }: { id: string; status: JobOpeningStatus }) {
  const { state, pending, onSubmit } = useCrmForm(setRoleStatus);
  const moves: { to: JobOpeningStatus; label: string; light?: boolean }[] =
    status === "open" ? [{ to: "closed", label: "Close role" }, { to: "draft", label: "Back to draft", light: true }]
      : status === "closed" ? [{ to: "open", label: "Reopen role" }, { to: "draft", label: "Back to draft", light: true }]
        : [{ to: "open", label: "Open role" }, { to: "closed", label: "Mark closed", light: true }];
  return (
    <div className="owner-box">
      <FormAlerts state={state} />
      <div className="quick-actions" style={{ marginTop: 0 }}>
        {moves.map((m) => (
          <form key={m.to} onSubmit={onSubmit}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={m.to} />
            <button className={`btn small${m.light ? " light" : ""}`} type="submit" disabled={pending}>{pending ? "Saving..." : m.label}</button>
          </form>
        ))}
      </div>
    </div>
  );
}

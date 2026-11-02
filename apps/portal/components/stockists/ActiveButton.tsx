"use client";

import { useActionState } from "react";
import { setStockistActive, type ActionResult } from "@/app/(app)/systems/stockists/actions";

const empty: ActionResult = {};

/** Deactivate or reactivate a stockist, showing an error if the change did not go through. */
export default function ActiveButton({ stockistId, isActive }: { stockistId: string; isActive: boolean }) {
  const [state, action, pending] = useActionState(setStockistActive, empty);
  return (
    <form action={action} className="publish-form">
      <input type="hidden" name="id" value={stockistId} />
      <input type="hidden" name="active" value={String(!isActive)} />
      <button className={`btn ${isActive ? "light" : ""}`} type="submit" disabled={pending}>
        {pending ? "Saving..." : isActive ? "Deactivate" : "Reactivate"}
      </button>
      {isActive && !state.error && <span className="hint">Deactivated stockists stay in the system but leave Where to Buy.</span>}
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
    </form>
  );
}

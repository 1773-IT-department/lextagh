"use client";

import { useState } from "react";
import { CRM_STAGES, type CrmStage } from "@lexta/db";
import { setLeadStage } from "@/app/(app)/systems/crm/actions";
import FormAlerts from "./FormAlerts";
import { useCrmForm } from "./useCrmForm";

/** Move a lead along the pipeline. Lost needs a reason; the change is written to the timeline by the database. */
export default function StageForm({ leadId, stage }: { leadId: string; stage: CrmStage }) {
  const { state, pending, onSubmit, fe } = useCrmForm(setLeadStage);
  const [next, setNext] = useState<string>(stage);
  return (
    <form className="stage-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={leadId} />
      <div className="stage-pills" role="radiogroup" aria-label="Stage">
        {CRM_STAGES.map((s) => (
          <label key={s.value} className={`stage-pill s-${s.value}${next === s.value ? " on" : ""}`}>
            <input type="radio" name="stage" value={s.value} checked={next === s.value} onChange={() => setNext(s.value)} disabled={pending} />
            {s.label}
          </label>
        ))}
      </div>
      {next === "lost" && (
        <div className="field">
          <label htmlFor="lost_reason">Why was it lost?</label>
          <input id="lost_reason" name="lost_reason" maxLength={500} placeholder="For example chose another supplier" aria-invalid={!!fe.lost_reason} disabled={pending} />
          {fe.lost_reason && <span className="ferr">{fe.lost_reason}</span>}
        </div>
      )}
      <button className="btn small" type="submit" disabled={pending || next === stage}>{pending ? "Saving..." : "Change stage"}</button>
    </form>
  );
}

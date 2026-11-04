"use client";

import { useState } from "react";
import { JOB_APPLICATION_STAGES, jobApplicationStageLabel, type JobApplicationStage } from "@lexta/db";
import { setApplicationStage } from "@/app/(app)/systems/recruitment/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

/** Move an application to any other stage, with an optional note. The database writes it to the history. */
export default function StageForm({ id, stage }: { id: string; stage: JobApplicationStage }) {
  const { state, pending, onSubmit, fe } = useCrmForm(setApplicationStage);
  const [next, setNext] = useState("");
  return (
    <form className="stage-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <p className="small" style={{ margin: 0 }}>Now: <b>{jobApplicationStageLabel(stage)}</b>. Move to:</p>
      <div className="stage-pills" role="radiogroup" aria-label="New stage">
        {JOB_APPLICATION_STAGES.filter((s) => s.value !== stage).map((s) => (
          <label key={s.value} className={`stage-pill r-${s.value}${next === s.value ? " on" : ""}`}>
            <input type="radio" name="stage" value={s.value} checked={next === s.value} onChange={() => setNext(s.value)} disabled={pending} />
            {s.label}
          </label>
        ))}
      </div>
      {fe.stage && <span className="ferr">{fe.stage}</span>}
      {next && (
        <div className="field">
          <label htmlFor="stage_note">Note (optional)</label>
          <textarea id="stage_note" name="note" rows={2} maxLength={4000} placeholder="For example: strong interview, references next"
            aria-invalid={!!fe.note} disabled={pending} />
          {fe.note && <span className="ferr">{fe.note}</span>}
        </div>
      )}
      <button className="btn small" type="submit" disabled={pending || !next}>{pending ? "Saving..." : "Change stage"}</button>
    </form>
  );
}

"use client";

import { CSR_NOTES_MAX, CSR_PARTNERS_MAX, CSR_PLACE_MAX, type CsrStatus } from "@lexta/db";
import { saveActivity } from "@/app/(app)/systems/csr/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

type Option = { id: string; label: string };

export type ActivityValues = {
  id?: string;
  programme_id: string;
  activity_date: string;
  status: CsrStatus;
  region_id: string;
  place: string;
  people_reached: number;
  partners: string;
  notes: string;
};

/** Log a CSR activity or change one. Works on a phone: one column, big targets, number keyboard for people reached. */
export default function ActivityForm({ values, programmes, regions }: {
  values: ActivityValues;
  programmes: Option[];
  regions: Option[];
}) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveActivity);
  const v = values;
  const err = (k: string) => (fe[k] ? <span className="ferr" id={`${k}_err`}>{fe[k]}</span> : null);
  const aria = (k: string) => ({ "aria-invalid": !!fe[k], "aria-describedby": fe[k] ? `${k}_err` : undefined });
  return (
    <form className="pform crm-form csr-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      {v.id && <input type="hidden" name="id" value={v.id} />}
      {v.id && <input type="hidden" name="original_programme_id" value={v.programme_id} />}
      <fieldset disabled={pending}>
        <div className="field">
          <label htmlFor="programme_id">Programme</label>
          <select id="programme_id" name="programme_id" defaultValue={v.programme_id} {...aria("programme_id")}>
            <option value="">Choose a programme</option>
            {programmes.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {err("programme_id")}
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="activity_date">Date</label>
            <input id="activity_date" name="activity_date" type="date" defaultValue={v.activity_date} {...aria("activity_date")} />
            {err("activity_date")}
          </div>
          <div className="field">
            <span className="label-like" id="status_label">Status</span>
            <div className="csr-status" role="radiogroup" aria-labelledby="status_label">
              <label><input type="radio" name="status" value="done" defaultChecked={v.status === "done"} /> Done</label>
              <label><input type="radio" name="status" value="planned" defaultChecked={v.status === "planned"} /> Planned</label>
            </div>
            {err("status")}
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="region_id">Region</label>
            <select id="region_id" name="region_id" defaultValue={v.region_id} {...aria("region_id")}>
              <option value="">Choose a region</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            {err("region_id")}
          </div>
          <div className="field">
            <label htmlFor="place">Town or place</label>
            <input id="place" name="place" defaultValue={v.place} maxLength={CSR_PLACE_MAX} placeholder="For example: Mawuko Girls SHS, Ho" {...aria("place")} />
            {err("place")}
          </div>
        </div>
        <div className="field">
          <label htmlFor="people_reached">People reached</label>
          <input id="people_reached" name="people_reached" type="number" inputMode="numeric" min={0} step={1}
            defaultValue={v.people_reached} {...aria("people_reached")} />
          <span className="hint">For a planned activity, the number you expect. Totals count done activities only.</span>
          {err("people_reached")}
        </div>
        <div className="field">
          <label htmlFor="partners">Partners (optional)</label>
          <input id="partners" name="partners" defaultValue={v.partners} maxLength={CSR_PARTNERS_MAX} placeholder="For example: Ghana Education Service, MWAG" {...aria("partners")} />
          {err("partners")}
        </div>
        <div className="field">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" name="notes" rows={4} defaultValue={v.notes} maxLength={CSR_NOTES_MAX} {...aria("notes")} />
          {err("notes")}
        </div>
      </fieldset>
      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Saving..." : v.id ? "Save changes" : "Save activity"}</button>
      </div>
    </form>
  );
}

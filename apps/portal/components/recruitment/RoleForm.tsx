"use client";

import { EMPLOYMENT_TYPES, JOB_OPENING_STATUSES, type JobOpening } from "@lexta/db";
import { saveRole } from "@/app/(app)/systems/recruitment/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

type Props = {
  mode: "new" | "edit";
  role?: Pick<JobOpening, "id" | "reference" | "title" | "department" | "location" | "employment_type" | "level" | "summary" | "duties"
    | "requirements" | "status" | "opens_at" | "closes_at" | "urgent" | "sort">;
  /** Departments and locations already used, offered as suggestions. */
  departments: string[];
  locations: string[];
};

/** Every field of a role. Duties and requirements are one per line, as the Careers page lists them. */
export default function RoleForm({ mode, role, departments, locations }: Props) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveRole);
  const err = (k: string) => (fe[k] ? { "aria-invalid": true as const, "aria-describedby": `role-${k}-err` } : {});
  const msg = (k: string) => fe[k] && <span id={`role-${k}-err`} className="ferr">{fe[k]}</span>;
  return (
    <form className="pform crm-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      {role && <input type="hidden" name="id" value={role.id} />}
      <fieldset disabled={pending}>
        <div className="panel">
          <h2>{mode === "new" ? "New role" : "Details"}</h2>
          <div className="row2">
            <div className="field">
              <label htmlFor="reference">Reference</label>
              <input id="reference" name="reference" defaultValue={role?.reference ?? ""} placeholder="LX-HR-001" maxLength={16} required {...err("reference")} />
              <span className="hint">Shown on the Careers page and quoted by applicants.</span>
              {msg("reference")}
            </div>
            <div className="field">
              <label htmlFor="title">Job title</label>
              <input id="title" name="title" defaultValue={role?.title ?? ""} maxLength={160} required {...err("title")} />
              {msg("title")}
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="department">Department</label>
              <input id="department" name="department" list="role-departments" defaultValue={role?.department ?? ""} maxLength={80} required {...err("department")} />
              <datalist id="role-departments">{departments.map((d) => <option key={d} value={d} />)}</datalist>
              {msg("department")}
            </div>
            <div className="field">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" list="role-locations" defaultValue={role?.location ?? ""} maxLength={80} required {...err("location")} />
              <datalist id="role-locations">{locations.map((d) => <option key={d} value={d} />)}</datalist>
              {msg("location")}
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="employment_type">Type</label>
              <select id="employment_type" name="employment_type" defaultValue={role?.employment_type ?? "full_time"} {...err("employment_type")}>
                {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {msg("employment_type")}
            </div>
            <div className="field">
              <label htmlFor="level">Level</label>
              <input id="level" name="level" defaultValue={role?.level ?? ""} placeholder="Entry level, Mid level, Senior, Graduate" maxLength={60} required {...err("level")} />
              {msg("level")}
            </div>
          </div>
          <div className="field">
            <label htmlFor="summary">The role (summary)</label>
            <textarea id="summary" name="summary" rows={3} maxLength={2000} defaultValue={role?.summary ?? ""} required {...err("summary")} />
            {msg("summary")}
          </div>
          <div className="field">
            <label htmlFor="duties">What you will do</label>
            <textarea id="duties" name="duties" rows={5} defaultValue={(role?.duties ?? []).join("\n")} {...err("duties")} />
            <span className="hint">One duty per line, up to 20.</span>
            {msg("duties")}
          </div>
          <div className="field">
            <label htmlFor="requirements">What we are looking for</label>
            <textarea id="requirements" name="requirements" rows={5} defaultValue={(role?.requirements ?? []).join("\n")} {...err("requirements")} />
            <span className="hint">One requirement per line, up to 20.</span>
            {msg("requirements")}
          </div>
        </div>
        <div className="panel">
          <h2>Publishing</h2>
          <div className="row2">
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={role?.status ?? "draft"} {...err("status")}>
                {JOB_OPENING_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <span className="hint">Open roles show on the Careers page from the opening date to the end of the closing date.</span>
            </div>
            <div className="field">
              <label htmlFor="sort">Order on the page</label>
              <input id="sort" name="sort" type="number" step={1} defaultValue={role?.sort ?? 0} {...err("sort")} />
              <span className="hint">Lower numbers first.</span>
              {msg("sort")}
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="opens_at">Opening date (shown as Posted)</label>
              <input id="opens_at" name="opens_at" type="date" defaultValue={role?.opens_at ?? ""} {...err("opens_at")} />
              <span className="hint">Left empty, opening the role sets today.</span>
              {msg("opens_at")}
            </div>
            <div className="field">
              <label htmlFor="closes_at">Closing date</label>
              <input id="closes_at" name="closes_at" type="date" defaultValue={role?.closes_at ?? ""} {...err("closes_at")} />
              <span className="hint">Applications are taken through this whole day. Empty: open until you close it.</span>
              {msg("closes_at")}
            </div>
          </div>
          <div className="field check">
            <label><input type="checkbox" name="urgent" value="yes" defaultChecked={role?.urgent ?? false} /> Show &quot;Closing soon&quot;</label>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn" type="submit">{pending ? "Saving..." : mode === "new" ? "Create role" : "Save role"}</button>
        </div>
      </fieldset>
    </form>
  );
}

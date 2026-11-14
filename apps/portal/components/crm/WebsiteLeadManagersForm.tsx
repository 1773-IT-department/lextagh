"use client";

import { Select } from "@lexta/ui";
import { saveWebsiteLeadManagers } from "@/app/(app)/systems/crm/settings/website-leads/actions";
import FormAlerts from "./FormAlerts";
import { useCrmForm } from "./useCrmForm";

type Option = { id: string; label: string };

export type BrandRow = {
  id: string;
  name: string;
  /** The brand's own manager, or "" when it uses the default. */
  current: string;
  options: Option[];
  /** Set when the saved manager no longer qualifies: why, for the warning. */
  warning?: string;
};

/** The default manager and one picker per brand. Saves everything in one step. */
export default function WebsiteLeadManagersForm({
  defaultCurrent, defaultOptions, defaultWarning, brands,
}: {
  defaultCurrent: string;
  defaultOptions: Option[];
  defaultWarning?: string;
  brands: BrandRow[];
}) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveWebsiteLeadManagers);
  return (
    <form className="pform crm-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <fieldset disabled={pending}>
        <section className="panel">
          <h2>Default manager</h2>
          <p className="small">Gets every new website lead, for every brand, unless the brand has its own manager below.</p>
          <div className="field">
            <label htmlFor="default_manager">Default manager</label>
            <Select id="default_manager" name="default_manager" defaultValue={defaultCurrent} aria-invalid={!!fe.default_manager}>
              <option value="">Nobody (website leads stay unassigned)</option>
              {defaultOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
            {defaultWarning && <span className="ferr">{defaultWarning}</span>}
            {fe.default_manager && <span className="ferr">{fe.default_manager}</span>}
          </div>
        </section>

        <section className="panel">
          <h2>Manager per brand</h2>
          <p className="small">Leads that come from a brand&apos;s website go to that brand&apos;s manager. A sales rep or marketer can only manage a brand they work on.</p>
          <div className="row2">
            {brands.map((b) => {
              const key = `brand:${b.id}`;
              return (
                <div className="field" key={b.id}>
                  <label htmlFor={key}>{b.name}</label>
                  <Select id={key} name={key} defaultValue={b.current} aria-invalid={!!fe[key]}>
                    <option value="">Use default</option>
                    {b.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                  {b.warning && <span className="ferr">{b.warning}</span>}
                  {fe[key] && <span className="ferr">{fe[key]}</span>}
                </div>
              );
            })}
          </div>
        </section>
      </fieldset>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Saving..." : "Save managers"}</button>
      </div>
    </form>
  );
}

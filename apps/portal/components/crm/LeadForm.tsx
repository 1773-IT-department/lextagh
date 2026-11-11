"use client";

import { useState } from "react";
import { CRM_SOURCES, CRM_STAGES, type CrmLead } from "@lexta/db";
import { saveLead } from "@/app/(app)/systems/crm/actions";
import FormAlerts from "./FormAlerts";
import { useCrmForm } from "./useCrmForm";

export type Option = { id: string; label: string };

/**
 * Create or edit a lead. Stage and owner of an existing lead have their own controls on the lead page.
 * mode "view": the fields show but cannot be changed (customer care on an existing lead).
 */
export default function LeadForm({
  mode,
  lead,
  contacts,
  organisations,
  brands,
  canChangeBrand,
  ownerOptions,
  defaults = {},
  hiddenContact = false,
  hiddenOrganisation = false,
  canPickStage = true,
}: {
  mode: "new" | "edit" | "view";
  lead?: CrmLead;
  contacts: Option[];
  organisations: Option[];
  brands: Option[];
  canChangeBrand: boolean;
  /** Only for a new lead: who may own it. */
  ownerOptions?: Option[];
  defaults?: { contact_id?: string; organisation_id?: string; owner?: string };
  /** The lead links a record this person cannot see or pick: keep it unless they pick another. */
  hiddenContact?: boolean;
  hiddenOrganisation?: boolean;
  /** Customer care adds leads at New only. */
  canPickStage?: boolean;
}) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveLead);
  const [stage, setStage] = useState("new");
  const isNew = mode === "new";
  const brandLocked = !isNew && !canChangeBrand;

  return (
    <form className="pform crm-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={lead?.id ?? ""} />
      {lead?.brand_id && <input type="hidden" name="current_brand_id" value={lead.brand_id} />}
      {brandLocked && <input type="hidden" name="brand_id" value={lead?.brand_id ?? ""} />}

      <fieldset disabled={mode === "view" || pending}>
        <section className="panel">
          <h2>{isNew ? "Lead details" : "Details"}</h2>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" defaultValue={lead?.title ?? ""} maxLength={160} placeholder="For example 200 cartons a month for a Kumasi wholesaler" aria-invalid={!!fe.title} required />
            {fe.title && <span className="ferr">{fe.title}</span>}
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="contact_id">Contact</label>
              <select id="contact_id" name="contact_id" defaultValue={hiddenContact ? "keep" : lead?.contact_id ?? defaults.contact_id ?? ""} aria-invalid={!!fe.contact_id}>
                {hiddenContact ? <option value="keep">Keep the current contact</option> : <option value="">No contact</option>}
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              {hiddenContact && <span className="hint">Linked to a contact you cannot see. It stays linked unless you pick another one.</span>}
              {fe.contact_id && <span className="ferr">{fe.contact_id}</span>}
            </div>
            <div className="field">
              <label htmlFor="organisation_id">Organisation</label>
              <select id="organisation_id" name="organisation_id" defaultValue={hiddenOrganisation ? "keep" : lead?.organisation_id ?? defaults.organisation_id ?? ""} aria-invalid={!!fe.organisation_id}>
                {hiddenOrganisation ? <option value="keep">Keep the current organisation</option> : <option value="">No organisation</option>}
                {organisations.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              {hiddenOrganisation && <span className="hint">Linked to an organisation you cannot see. It stays linked unless you pick another one.</span>}
              {!lead?.organisation_id && lead?.submitted_organisation_name && (
                <span className="hint">The website form named &ldquo;{lead.submitted_organisation_name}&rdquo;. Check it and link the right organisation.</span>
              )}
              {fe.organisation_id && <span className="ferr">{fe.organisation_id}</span>}
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="brand_id">Brand</label>
              <select id="brand_id" name={brandLocked ? undefined : "brand_id"} defaultValue={lead?.brand_id ?? ""} disabled={brandLocked} aria-invalid={!!fe.brand_id}>
                <option value="">No brand (shared with every team)</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
              {brandLocked && <span className="hint">Assign the lead to yourself to change its brand.</span>}
              {fe.brand_id && <span className="ferr">{fe.brand_id}</span>}
            </div>
            <div className="field">
              <label htmlFor="source">Source</label>
              <select id="source" name="source" defaultValue={lead?.source ?? ""} aria-invalid={!!fe.source} required>
                <option value="" disabled>Where did it come from?</option>
                {/* Live chat leads are made from the chat inbox (and get the website lead manager), never picked by hand. */}
                {CRM_SOURCES.filter((s) => s.value !== "website_live_chat" || lead?.source === "website_live_chat")
                  .map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {fe.source && <span className="ferr">{fe.source}</span>}
            </div>
          </div>
          <div className="field">
            <label htmlFor="estimated_monthly_volume">Estimated monthly volume (optional)</label>
            <input id="estimated_monthly_volume" name="estimated_monthly_volume" defaultValue={lead?.estimated_monthly_volume ?? ""} maxLength={200} placeholder="For example 200 cartons a month. Quantities only, no prices." aria-invalid={!!fe.estimated_monthly_volume} />
            {fe.estimated_monthly_volume && <span className="ferr">{fe.estimated_monthly_volume}</span>}
          </div>
          <div className="field">
            <label htmlFor="description">Description (optional)</label>
            <textarea id="description" name="description" rows={5} maxLength={5000} defaultValue={lead?.description ?? ""} aria-invalid={!!fe.description} />
            {fe.description && <span className="ferr">{fe.description}</span>}
          </div>
        </section>

        <section className="panel">
          <h2>Next action</h2>
          <div className="row2">
            <div className="field">
              <label htmlFor="next_action">What happens next (optional)</label>
              <input id="next_action" name="next_action" defaultValue={lead?.next_action ?? ""} maxLength={300} placeholder="For example call to agree a first order" aria-invalid={!!fe.next_action} />
              {fe.next_action && <span className="ferr">{fe.next_action}</span>}
            </div>
            <div className="field">
              <label htmlFor="next_action_date">By when (optional)</label>
              <input id="next_action_date" name="next_action_date" type="date" defaultValue={lead?.next_action_date ?? ""} aria-invalid={!!fe.next_action_date} />
              {fe.next_action_date && <span className="ferr">{fe.next_action_date}</span>}
            </div>
          </div>
        </section>

        {isNew && (
          <section className="panel">
            <h2>{canPickStage ? "Stage and owner" : "Owner"}</h2>
            <div className="row2">
              {canPickStage ? (
                <div className="field">
                  <label htmlFor="stage">Stage</label>
                  <select id="stage" name="stage" value={stage} onChange={(e) => setStage(e.target.value)} aria-invalid={!!fe.stage}>
                    {CRM_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {fe.stage && <span className="ferr">{fe.stage}</span>}
                </div>
              ) : (
                <div className="field">
                  <span className="label-like">Stage</span>
                  <p className="small">New. The sales team moves it on from here.</p>
                  <input type="hidden" name="stage" value="new" />
                </div>
              )}
              <div className="field">
                <label htmlFor="owner_id">Owner</label>
                <select id="owner_id" name="owner_id" defaultValue={defaults.owner ?? "me"} aria-invalid={!!fe.owner_id}>
                  {(ownerOptions ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                {fe.owner_id && <span className="ferr">{fe.owner_id}</span>}
              </div>
            </div>
            {stage === "lost" && (
              <div className="field">
                <label htmlFor="lost_reason">Why was it lost?</label>
                <input id="lost_reason" name="lost_reason" maxLength={500} aria-invalid={!!fe.lost_reason} />
                {fe.lost_reason && <span className="ferr">{fe.lost_reason}</span>}
              </div>
            )}
          </section>
        )}
      </fieldset>

      {mode !== "view" && (
        <div className="form-actions">
          <button className="btn" type="submit" disabled={pending}>{pending ? "Saving..." : isNew ? "Add lead" : "Save changes"}</button>
        </div>
      )}
    </form>
  );
}

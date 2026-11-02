"use client";

import { useState } from "react";
import { CRM_CHANNELS, type CrmContact } from "@lexta/db";
import { saveContact } from "@/app/(app)/systems/crm/actions";
import FormAlerts from "./FormAlerts";
import type { Option } from "./LeadForm";
import { useCrmForm } from "./useCrmForm";

export default function ContactForm({
  mode, contact, organisations, ownerOptions, defaults = {},
}: {
  mode: "new" | "edit" | "view";
  contact?: CrmContact;
  organisations: Option[];
  ownerOptions?: Option[];
  defaults?: { organisation_id?: string };
}) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveContact);
  const [consent, setConsent] = useState(contact?.consent_marketing ?? false);
  const isNew = mode === "new";
  return (
    <form className="pform crm-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={contact?.id ?? ""} />
      <fieldset disabled={mode === "view" || pending}>
        <div className="edit-grid">
          <div>
            <section className="panel">
              <h2>Contact details</h2>
              <div className="field">
                <label htmlFor="full_name">Full name</label>
                <input id="full_name" name="full_name" defaultValue={contact?.full_name ?? ""} maxLength={120} autoComplete="off" aria-invalid={!!fe.full_name} />
                {fe.full_name && <span className="ferr">{fe.full_name}</span>}
              </div>
              <div className="row2">
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={contact?.phone ?? ""} maxLength={24} placeholder="+233 20 123 4567" aria-invalid={!!fe.phone} />
                  {fe.phone && <span className="ferr">{fe.phone}</span>}
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" inputMode="email" defaultValue={contact?.email ?? ""} maxLength={254} aria-invalid={!!fe.email} />
                  {fe.email && <span className="ferr">{fe.email}</span>}
                </div>
              </div>
              <div className="row2">
                <div className="field">
                  <label htmlFor="organisation_id">Organisation (optional)</label>
                  <select id="organisation_id" name="organisation_id" defaultValue={contact?.organisation_id ?? defaults.organisation_id ?? ""} aria-invalid={!!fe.organisation_id}>
                    <option value="">No organisation</option>
                    {organisations.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  {fe.organisation_id && <span className="ferr">{fe.organisation_id}</span>}
                </div>
                <div className="field">
                  <label htmlFor="job_title">Job title (optional)</label>
                  <input id="job_title" name="job_title" defaultValue={contact?.job_title ?? ""} maxLength={120} aria-invalid={!!fe.job_title} />
                  {fe.job_title && <span className="ferr">{fe.job_title}</span>}
                </div>
              </div>
              <div className="field">
                <label htmlFor="preferred_channel">Preferred way to reach them (optional)</label>
                <select id="preferred_channel" name="preferred_channel" defaultValue={contact?.preferred_channel ?? ""} aria-invalid={!!fe.preferred_channel}>
                  <option value="">Not known</option>
                  {CRM_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {fe.preferred_channel && <span className="ferr">{fe.preferred_channel}</span>}
              </div>
            </section>
          </div>
          <div>
            <section className="panel">
              <h2>Marketing consent</h2>
              <div className="field check">
                <label><input type="checkbox" name="consent_marketing" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> Agreed to receive marketing messages</label>
              </div>
              {consent && (
                <div className="field">
                  <label htmlFor="consent_source">How did they agree?</label>
                  <input id="consent_source" name="consent_source" defaultValue={contact?.consent_source ?? ""} maxLength={160} placeholder="For example said yes on a call" aria-invalid={!!fe.consent_source} />
                  {fe.consent_source && <span className="ferr">{fe.consent_source}</span>}
                </div>
              )}
              {!consent && contact?.consent_marketing && <p className="small">Saving will record that they no longer agree.</p>}
            </section>
            <section className="panel">
              <h2>Staff notes</h2>
              <div className="field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea id="notes" name="notes" rows={4} maxLength={4000} defaultValue={contact?.notes ?? ""} aria-invalid={!!fe.notes} />
                {fe.notes && <span className="ferr">{fe.notes}</span>}
              </div>
              {isNew && (
                <div className="field">
                  <label htmlFor="owner_id">Owner</label>
                  <select id="owner_id" name="owner_id" defaultValue="me" aria-invalid={!!fe.owner_id}>
                    {(ownerOptions ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  {fe.owner_id && <span className="ferr">{fe.owner_id}</span>}
                </div>
              )}
            </section>
          </div>
        </div>
      </fieldset>
      {mode !== "view" && (
        <div className="form-actions">
          <button className="btn" type="submit" name="then" value="" disabled={pending}>{pending ? "Saving..." : isNew ? "Add contact" : "Save changes"}</button>
          {isNew && <button className="btn light" type="submit" name="then" value="lead" disabled={pending}>Add contact and create a lead</button>}
        </div>
      )}
    </form>
  );
}

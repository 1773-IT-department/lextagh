"use client";

import { saveWebsiteReplyHours } from "@/app/(app)/systems/crm/settings/website-leads/actions";
import FormAlerts from "./FormAlerts";
import { useCrmForm } from "./useCrmForm";

/** How many hours the team has to reply to a website lead (0026). Admin only; the page decides who sees it. */
export default function WebsiteReplyTimeForm({ hours }: { hours: number }) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveWebsiteReplyHours);
  return (
    <form className="pform crm-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <fieldset disabled={pending}>
        <section className="panel">
          <h2>Reply time</h2>
          <p className="small">
            Each new lead from the Contact Us and Partner With Us forms gets a reply-by time this many hours after it
            arrives. A lead still at New after that time shows as Overdue in the leads list and on the management overview.
            A new time applies to leads that arrive after you save it.
          </p>
          <div className="field reply-hours">
            <label htmlFor="reply_hours">Reply within (hours)</label>
            <input id="reply_hours" name="reply_hours" type="number" inputMode="numeric" min={1} max={720} step={1}
              defaultValue={hours} aria-invalid={!!fe.reply_hours} aria-describedby="reply_hours_hint" required />
            {fe.reply_hours
              ? <span className="ferr">{fe.reply_hours}</span>
              : <span className="hint" id="reply_hours_hint">[PLACEHOLDER: reply time to be confirmed by Lexta] 24 hours for now. Whole hours from 1 to 720 (30 days).</span>}
          </div>
        </section>
      </fieldset>
      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Saving..." : "Save reply time"}</button>
      </div>
    </form>
  );
}

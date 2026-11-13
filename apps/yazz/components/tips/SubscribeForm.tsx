"use client";

import { useActionState, useId } from "react";
import { Honeypot, invalidProps, useServerForm } from "@lexta/forms/react";
import { submitNewsletterForm } from "@/app/actions/forms";
import Icon from "@/components/Icon";
import { FieldError, FormMessage, idleState } from "@/components/forms/FormParts";
import s from "./tips.module.css";

/**
 * "Never Miss a Yazz Headline": the prototype's red newsletter band. Signs up through the same intake as the Lexta
 * newsletter (public.submit_website_enquiry, form "newsletter"), brand Yazz: a CRM contact with marketing consent.
 * Posts without JavaScript too.
 */
export default function SubscribeForm() {
  const [state, action, pending] = useActionState(submitNewsletterForm, idleState);
  const { ref, onSubmit } = useServerForm(state, action, pending);
  const id = useId();
  const v = state.values ?? {};
  return (
    <section className={s.subscribe} aria-labelledby={`${id}-title`}>
      <div className={s.subscribeText}>
        <h2 id={`${id}-title`} className={s.subscribeTitle}>Never Miss a<br /><em>Yazz Headline.</em></h2>
        <p>New tips, products and announcements from Yazz®, straight to your inbox.</p>
      </div>
      <form ref={ref} action={action} onSubmit={onSubmit} className={s.subscribeForm} noValidate>
        <Honeypot />
        <label className={s.subscribeLabel} htmlFor={`${id}-email`}>Your email address</label>
        <div className={s.subscribeRow}>
          <input
            id={`${id}-email`} name="email" type="email" autoComplete="email" required placeholder="your@email.com" defaultValue={v.email ?? ""}
            key={state.status === "success" ? "done" : "form"} className={s.subscribeInput} {...invalidProps(state, "email", `${id}-email-error`)}
          />
          <button type="submit" className="yz-btn yz-btn--navy" aria-disabled={pending || undefined}>
            {pending ? "Subscribing..." : <>Subscribe <Icon name="arrow" size={16} /></>}
          </button>
        </div>
        <FieldError id={`${id}-email-error`} message={state.fieldErrors?.email} tone="dark" />
        <label className={s.consent}>
          <input type="checkbox" name="consent" value="yes" defaultChecked={v.consent === "yes"} {...invalidProps(state, "consent", `${id}-consent-error`)} />
          <span>Yes, I agree to receive emails from Yazz® (Lexta Ghana Limited). I can unsubscribe at any time.</span>
        </label>
        <FieldError id={`${id}-consent-error`} message={state.fieldErrors?.consent} tone="dark" />
        <FormMessage state={state} tone="dark" />
      </form>
    </section>
  );
}

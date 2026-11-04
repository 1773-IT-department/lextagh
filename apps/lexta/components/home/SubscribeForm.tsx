"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitNewsletterForm } from "@/app/actions/forms";
import { FieldError, FormMessage, Honeypot, idleState, invalidProps, useServerForm } from "@/components/forms/FormParts";
import s from "./home.module.css";

/**
 * Newsletter sign-up, visually as in the prototype, with a visually hidden label. Item 19 saves it into the CRM as a
 * contact with marketing consent (submitNewsletterForm), so it adds one consent tick line under the field: consent
 * only counts when the visitor ticks it. The row keeps data-subscribe for the phone layout rules in globals.css.
 */
export default function SubscribeForm() {
  const [state, formAction, pending] = useActionState(submitNewsletterForm, idleState);
  const v = state.values ?? {};
  const { ref, onSubmit } = useServerForm(state, formAction, pending);

  return (
    <form ref={ref} action={formAction} onSubmit={onSubmit} aria-label="Newsletter sign up" style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div data-subscribe="1" style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
        <label htmlFor="home-subscribe-email" className={s.srOnly}>Email address</label>
        <input
          id="home-subscribe-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Enter your email address"
          required
          maxLength={254}
          defaultValue={v.email}
          {...invalidProps(state, "email", "home-subscribe-email-error")}
          className={s.subscribeInput}
          style={{ flex: 1, minWidth: 0, border: 0, borderRadius: "5px 0 0 5px", padding: "11px 14px", fontSize: 13, color: "#12313d" }}
        />
        <button
          type="submit"
          aria-disabled={pending}
          style={{ border: 0, background: "#0b2f3d", color: "#fff", fontSize: 13, fontWeight: 600, padding: "0 22px", borderRadius: "0 5px 5px 0", cursor: pending ? "progress" : "pointer", opacity: pending ? 0.8 : 1 }}
        >
          {pending ? "Sending..." : "Subscribe"}
        </button>
      </div>
      <FieldError id="home-subscribe-email-error" tone="brand" message={state.fieldErrors?.email} />
      <Honeypot />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11.5, lineHeight: 1.5, color: "rgba(255,255,255,.92)" }}>
        <input
          id="home-subscribe-consent"
          type="checkbox"
          name="consent"
          value="yes"
          required
          defaultChecked={v.consent === "yes"}
          {...invalidProps(state, "consent", "home-subscribe-consent-error")}
          style={{ margin: "2px 0 0", width: 14, height: 14, flex: "0 0 auto", accentColor: "#0b2f3d" }}
        />
        <span>
          <label htmlFor="home-subscribe-consent">I agree to receive Lexta news by email. Unsubscribe at any time.</label>{" "}
          <Link href="/privacy-policy" style={{ color: "#fff", textDecoration: "underline" }}>Privacy Policy</Link>
        </span>
      </div>
      <FieldError id="home-subscribe-consent-error" tone="brand" message={state.fieldErrors?.consent} />
      <FormMessage state={state} tone="brand" />
    </form>
  );
}

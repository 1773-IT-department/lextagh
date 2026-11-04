"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitNewsletterForm } from "@/app/actions/forms";
import { FieldError, FormMessage, Honeypot, idleState, invalidProps } from "@/components/forms/FormParts";
import s from "./news.module.css";

/**
 * "Get our stories by email", visually as in the prototype. Item 19 saves it into the CRM as a contact with marketing
 * consent (submitNewsletterForm), so it adds one consent tick line: consent only counts when the visitor ticks it.
 */
export default function SubscribeBox() {
  const [state, formAction, pending] = useActionState(submitNewsletterForm, idleState);
  const v = state.values ?? {};

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, padding: "32px 30px 34px", boxShadow: "0 16px 34px rgba(11,60,78,.1)" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>Get our stories by email</div>
      <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>One short note a month: outreach reports, new products and where our teams will be next.</p>
      <form action={formAction} aria-label="Get our stories by email" style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <label htmlFor="news-subscribe-email" className={s.srOnly}>Your email address</label>
          <input
            id="news-subscribe-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Your email address"
            required
            maxLength={254}
            defaultValue={v.email}
            {...invalidProps(state, "email", "news-subscribe-email-error")}
            className={s.field}
            style={{ flex: "1 1 180px", minWidth: 0, border: "1px solid rgba(18,163,196,.35)", borderRadius: 7, padding: "12px 14px", fontSize: 13, color: "#12313d", background: "#f7fcfe" }}
          />
          <button
            type="submit"
            disabled={pending}
            aria-disabled={pending}
            style={{ border: 0, background: "#12313d", color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 22px", borderRadius: 7, cursor: pending ? "progress" : "pointer", opacity: pending ? 0.75 : 1 }}
          >
            {pending ? "Sending..." : "Subscribe"}
          </button>
        </div>
        <FieldError id="news-subscribe-email-error" message={state.fieldErrors?.email} style={{ display: "block", marginTop: 6 }} />
        <Honeypot />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, fontSize: 11.5, lineHeight: 1.5, color: "#5d7883" }}>
          <input
            id="news-subscribe-consent"
            type="checkbox"
            name="consent"
            value="yes"
            required
            defaultChecked={v.consent === "yes"}
            {...invalidProps(state, "consent", "news-subscribe-consent-error")}
            style={{ margin: "2px 0 0", width: 14, height: 14, flex: "0 0 auto", accentColor: "#12a3c4" }}
          />
          <label htmlFor="news-subscribe-consent">I agree to receive Lexta news by email. Unsubscribe at any time.</label>
        </div>
        <FieldError id="news-subscribe-consent-error" message={state.fieldErrors?.consent} style={{ display: "block", marginTop: 6 }} />
        <FormMessage state={state} style={{ marginTop: 12 }} />
      </form>
      <div style={{ marginTop: 12, fontSize: 11, color: "#8fa8b2" }}>
        We never share your address. See our <Link href="/privacy-policy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy Policy</Link>.
      </div>
    </div>
  );
}

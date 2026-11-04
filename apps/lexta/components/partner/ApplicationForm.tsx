"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { FieldError, FormMessage, Honeypot, invalidProps, useServerForm } from "@/components/forms/FormParts";
import { useActiveRoute } from "./RouteContext";

/* Values copied from partner-with-us.html. */
const fieldLabel: CSSProperties = { display: "flex", flexDirection: "column", gap: 7, fontSize: 12, fontWeight: 600, color: "#12313d" };
const field: CSSProperties = {
  border: "1px solid rgba(18,163,196,.35)", borderRadius: 7, padding: "12px 14px", fontSize: 13, color: "#12313d",
  background: "#fff", minWidth: 0, fontFamily: "inherit",
};

const textFields = [
  { label: "Contact name", name: "contact_name", type: "text", placeholder: "Your name", autoComplete: "name", required: true, maxLength: 120 },
  { label: "Business name", name: "business_name", type: "text", placeholder: "Registered trading name", autoComplete: "organization", required: true, maxLength: 160 },
  { label: "Email", name: "email", type: "email", placeholder: "you@example.com", autoComplete: "email", maxLength: 254 },
  { label: "Phone", name: "phone", type: "tel", placeholder: "+233", autoComplete: "tel", maxLength: 24 },
  { label: "Trading location", name: "trading_location", type: "text", placeholder: "City, region or country", autoComplete: "off", maxLength: 120 },
  { label: "Years trading", name: "years_trading", type: "text", placeholder: "e.g. 6", autoComplete: "off", maxLength: 20 },
];

const errorId = (name: string) => `partner-${name}-error`;

/**
 * The partnership application card. Its title, note and message hint follow the route picked above, as in the prototype.
 *
 * Sending (item 19) goes through the submitPartnerForm server action into the CRM: a lead, a contact and the
 * organisation, with the picked route as the partnership type. Without JavaScript the form still posts.
 */
export default function ApplicationForm() {
  const { active, form } = useActiveRoute();
  const [state, formAction, pending] = form;
  const v = state.values ?? {};
  const { ref, onSubmit } = useServerForm(state, formAction, pending);

  return (
    <form
      id="partner-application"
      ref={ref}
      action={formAction}
      onSubmit={onSubmit}
      aria-label={`${active.title} application`}
      style={{ position: "relative", background: "#f7fcfe", border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, padding: "32px 30px 34px", boxShadow: "0 16px 34px rgba(11,60,78,.1)" }}
    >
      <div aria-live="polite" style={{ fontSize: 19, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>{active.title} application</div>
      <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{active.note}</p>
      <Honeypot />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 22 }}>
        {textFields.map((f) => (
          <div key={f.name} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <label style={fieldLabel}>
              {f.label}
              <input
                type={f.type}
                name={f.name}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                required={f.required}
                maxLength={f.maxLength}
                defaultValue={v[f.name]}
                {...invalidProps(state, f.name, errorId(f.name))}
                style={field}
              />
            </label>
            <FieldError id={errorId(f.name)} message={state.fieldErrors?.[f.name]} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
        <label style={fieldLabel}>
          Tell us more
          <textarea
            name="message"
            rows={4}
            placeholder={active.placeholder}
            maxLength={3000}
            defaultValue={v.message}
            {...invalidProps(state, "message", errorId("message"))}
            style={{ ...field, minWidth: undefined, resize: "vertical" }}
          />
        </label>
        <FieldError id={errorId("message")} message={state.fieldErrors?.message} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 20 }}>
        <button
          type="submit"
          aria-disabled={pending}
          style={{
            display: "inline-flex", alignItems: "center", gap: 12, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600,
            padding: "12px 12px 12px 20px", borderRadius: 8, border: 0, fontFamily: "inherit", lineHeight: "inherit", letterSpacing: "inherit",
            cursor: pending ? "progress" : "pointer", opacity: pending ? 0.75 : 1,
          }}
        >
          {pending ? "Sending..." : "Submit application"}
          <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>→</span>
        </button>
        <span style={{ fontSize: 11.5, color: "#5d7883" }}>We reply within two working days.</span>
      </div>
      <FormMessage state={state} style={{ marginTop: 14 }} />
      <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.7, color: "#8fa8b2" }}>
        We use your details only to reply to this message. See our <Link href="/privacy-policy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy Policy</Link>.
      </div>
    </form>
  );
}

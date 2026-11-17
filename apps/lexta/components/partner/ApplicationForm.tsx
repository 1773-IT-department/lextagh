"use client";

import { Select } from "@lexta/ui";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CSR_BRANDS, CSR_INITIATIVES } from "@/components/csr/programmes";
import { FieldError, FormMessage, Honeypot, invalidProps, PrivacyConsent, useServerForm } from "@/components/forms/FormParts";
import { useActiveRoute } from "./RouteContext";

/* Values copied from partner-with-us.html. */
const fieldLabel: CSSProperties = { display: "flex", flexDirection: "column", gap: 7, fontSize: 12, fontWeight: 600, color: "#12313d" };
const field: CSSProperties = {
  border: "1px solid rgba(18,163,196,.35)", borderRadius: 7, padding: "12px 14px", fontSize: 13, color: "#12313d",
  background: "#fff", minWidth: 0, fontFamily: "inherit",
};

/* The dropdown's face (packages/ui Select), as on Contact Us. */
const selectField: CSSProperties = { ...field, lineHeight: "21px" };

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
  const { active, form, initiative } = useActiveRoute();
  const [state, formAction, pending] = form;
  const v = state.values ?? {};
  const { ref, onSubmit } = useServerForm(state, formAction, pending);
  // CSR proposals name a brand and an initiative (Lexta: "brand and initiative required"); a "Propose a partnership"
  // link on the CSR page preselects the initiative, and its brand where the programme names one.
  const csr = active.key === "CSR";
  const linked = CSR_INITIATIVES.find((i) => i.slug === initiative);
  const csrInitiative = v.csr_initiative ?? linked?.slug ?? "";
  const csrBrand = v.csr_brand ?? linked?.brand ?? "";

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
      {csr && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <label style={fieldLabel}>
              Brand
              <Select name="csr_brand" required defaultValue={csrBrand} {...invalidProps(state, "csr_brand", errorId("csr_brand"))} style={selectField}>
                <option value="" disabled>Choose a brand</option>
                {CSR_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </Select>
            </label>
            <FieldError id={errorId("csr_brand")} message={state.fieldErrors?.csr_brand} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <label style={fieldLabel}>
              Initiative
              <Select name="csr_initiative" required defaultValue={csrInitiative} {...invalidProps(state, "csr_initiative", errorId("csr_initiative"))} style={selectField}>
                <option value="" disabled>Choose an initiative</option>
                {CSR_INITIATIVES.map((i) => <option key={i.slug} value={i.slug}>{i.title}</option>)}
              </Select>
            </label>
            <FieldError id={errorId("csr_initiative")} message={state.fieldErrors?.csr_initiative} />
          </div>
        </div>
      )}
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
      <PrivacyConsent state={state} id="partner-privacy" style={{ marginTop: 14 }} />
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
        <span style={{ fontSize: 11.5, color: "#5d7883" }}>Your application goes to marketing@lextagh.com.</span>
      </div>
      <FormMessage state={state} style={{ marginTop: 14 }} />
      <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.7, color: "#8fa8b2" }}>
        We use your details only to reply to this message. See our <Link href="/privacy-policy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy Policy</Link>.
      </div>
    </form>
  );
}

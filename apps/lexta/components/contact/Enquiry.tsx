"use client";

import { useActionState, useState, type CSSProperties, type ReactNode } from "react";
import { submitContactForm } from "@/app/actions/forms";
import { FieldError, FormMessage, Honeypot, idleState, invalidProps, choiceCardReset, useServerForm, visuallyHidden } from "@/components/forms/FormParts";
import fx from "@/components/forms/forms.module.css";
import type { FormState } from "@/lib/forms/core";
import { reasons, regions } from "./data";

/* Values copied from contact-us.html. */
const fieldLabel: CSSProperties = { display: "flex", flexDirection: "column", gap: 7, fontSize: 12, fontWeight: 600, color: "#12313d" };
const field: CSSProperties = {
  border: "1px solid rgba(18,163,196,.35)", borderRadius: 7, padding: "12px 14px", fontSize: 13, color: "#12313d",
  background: "#fff", minWidth: 0, fontFamily: "inherit",
};

/** A labelled field with its inline error underneath (outside the label, so the label stays the field's name). */
function Field({ state, name, label, style, children }: { state: FormState; name: string; label: ReactNode; style?: CSSProperties; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, ...style }}>
      <label style={fieldLabel}>
        {label}
        {children}
      </label>
      <FieldError id={`contact-${name}-error`} message={state.fieldErrors?.[name]} />
    </div>
  );
}

/**
 * "What is this about?": the six enquiry routes and the enquiry form that changes with them (title, note,
 * fourth field, message hint and the routing email), as in the prototype.
 *
 * Sending (item 19) goes through the submitContactForm server action: Consumer care becomes a complaint in the
 * complaints tracker (LX case number), every other reason a lead in the CRM. Without JavaScript the form still posts.
 */
export default function Enquiry() {
  const [state, formAction, pending] = useActionState(submitContactForm, idleState);
  const v = state.values ?? {};
  // After a post without JavaScript the page comes back with the reason that was sent.
  const [selected, setSelected] = useState(() => Math.max(0, reasons.findIndex((r) => r.key === v.reason)));
  const active = reasons[selected];
  const { ref, onSubmit } = useServerForm(state, formAction, pending);
  const inv = (name: string) => invalidProps(state, name, `contact-${name}-error`);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, alignItems: "start" }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" }}>Send a message</div>
        <h2 style={{ margin: "12px 0 0", fontSize: 32, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" }}>What is this about?</h2>
        <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883", maxWidth: 460 }}>
          Choose the reason for your enquiry and we route it straight to the responsible team, with the detail they need to respond properly the first time.
        </p>

        {/* Each card is a label around a real radio of the form below (form attribute), so the reason is sent even
            without JavaScript. The cards keep the look of the prototype's buttons. */}
        <div role="radiogroup" aria-label="Reason for your enquiry" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
          {reasons.map((r, i) => {
            const on = i === selected;
            return (
              <label
                key={r.key}
                className={fx.choice}
                style={{
                  ...choiceCardReset, width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${on ? "#12a3c4" : "rgba(18,163,196,.2)"}`,
                  background: on ? "#f0f9fc" : "#fff", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16,
                }}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.key}
                  form="contact-enquiry"
                  defaultChecked={on}
                  onChange={() => setSelected(i)}
                  style={visuallyHidden}
                />
                <span
                  aria-hidden="true"
                  style={{
                    flex: "0 0 auto", width: 34, height: 34, borderRadius: 9, background: on ? "#12a3c4" : "#f0f9fc", color: on ? "#fff" : "#0b6d88",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                  }}
                >
                  {r.tag}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#12313d" }}>{r.key}</span>
                  <span style={{ display: "block", marginTop: 4, fontSize: 12, lineHeight: 1.7, color: "#5d7883" }}>{r.desc}</span>
                </span>
                <span aria-hidden="true" style={{ flex: "0 0 auto", fontSize: 13, fontWeight: 700, color: "#12a3c4" }}>{on ? "✓" : ""}</span>
              </label>
            );
          })}
        </div>
      </div>

      <form
        id="contact-enquiry"
        ref={ref}
        action={formAction}
        onSubmit={onSubmit}
        aria-label="Send a message"
        style={{ position: "relative", background: "#f7fcfe", border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, padding: "32px 30px 34px", boxShadow: "0 16px 34px rgba(11,60,78,.1)" }}
      >
        <div aria-live="polite" style={{ fontSize: 19, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>{active.formTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{active.formNote}</p>
        <Honeypot />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 22 }}>
          <Field state={state} name="name" label="Full name">
            <input type="text" name="name" autoComplete="name" placeholder="Your name" required maxLength={120} defaultValue={v.name} {...inv("name")} style={field} />
          </Field>
          <Field state={state} name="email" label="Email">
            <input type="email" name="email" autoComplete="email" placeholder="you@example.com" maxLength={254} defaultValue={v.email} {...inv("email")} style={field} />
          </Field>
          <Field state={state} name="phone" label="Phone">
            <input type="tel" name="phone" autoComplete="tel" placeholder="+233" maxLength={24} defaultValue={v.phone} {...inv("phone")} style={field} />
          </Field>
          <Field state={state} name="detail" label={active.extraLabel}>
            <input type="text" name="detail" placeholder={active.extraPlaceholder} maxLength={300} defaultValue={v.detail} {...inv("detail")} style={field} />
          </Field>
        </div>
        <Field state={state} name="region" label="Region" style={{ marginTop: 14 }}>
          <select name="region" defaultValue={v.region ?? regions[0]} {...inv("region")} style={field}>
            {regions.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field state={state} name="message" label="Your message" style={{ marginTop: 14 }}>
          <textarea
            name="message"
            rows={5}
            placeholder={active.messagePlaceholder}
            required
            maxLength={3000}
            defaultValue={v.message}
            {...inv("message")}
            style={{ ...field, lineHeight: 1.7, resize: "vertical", minWidth: undefined }}
          />
        </Field>
        <button
          type="submit"
          aria-disabled={pending}
          style={{ marginTop: 20, width: "100%", border: 0, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600, padding: "14px 20px", borderRadius: 7, cursor: pending ? "progress" : "pointer", opacity: pending ? 0.75 : 1 }}
        >
          {pending ? "Sending..." : "Send message"}
        </button>
        <FormMessage state={state} style={{ marginTop: 14 }} />
        <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.7, color: "#8fa8b2" }}>
          Your details are used only to answer this enquiry. Enquiries go to {active.email}.
        </div>
      </form>
    </div>
  );
}

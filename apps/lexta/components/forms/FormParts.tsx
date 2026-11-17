"use client";

import type { CSSProperties } from "react";
import type { FormState } from "@/lib/forms/core";

/**
 * Shared bits of the website forms (item 19), in the Lexta site's look. Nothing here shows until a form has been
 * sent. The behaviour every site shares (the server action wiring, the honeypot, invalid field props) lives in
 * packages/forms and is re-exported here.
 */
export { Honeypot, invalidProps, useServerForm, visuallyHidden } from "@lexta/forms/react";

/** What a <button> brought by default, so the reason and route label cards render exactly like the prototype's buttons. */
export const choiceCardReset: CSSProperties = {
  position: "relative", boxSizing: "border-box", margin: 0, fontStyle: "normal", fontWeight: 400, fontSize: 13.3333, lineHeight: "normal", letterSpacing: "normal",
  wordSpacing: "normal", textTransform: "none", textIndent: 0, textShadow: "none", color: "#000",
};

export type Tone = "light" | "brand";

export const idleState: FormState = { status: "idle" };

const fieldErrorStyle: Record<Tone, CSSProperties> = {
  light: { fontSize: 11.5, fontWeight: 600, lineHeight: 1.5, color: "#b42318" },
  brand: { fontSize: 11.5, fontWeight: 600, lineHeight: 1.5, color: "#fff" },
};

/** Inline message under a field. Pair the field with aria-invalid and aria-describedby={id}. */
export function FieldError({ id, message, tone = "light", style }: { id: string; message?: string; tone?: Tone; style?: CSSProperties }) {
  if (!message) return null;
  return (
    <span id={id} style={{ ...fieldErrorStyle[tone], ...style }}>
      {message}
    </span>
  );
}

const box: CSSProperties = { borderRadius: 7, padding: "12px 14px", fontSize: 13, lineHeight: 1.6, fontWeight: 600 };
const tones: Record<Tone, { ok: CSSProperties; bad: CSSProperties }> = {
  light: {
    ok: { ...box, background: "#e8f7fb", border: "1px solid rgba(18,163,196,.35)", color: "#0b4f63" },
    bad: { ...box, background: "#fdf1f0", border: "1px solid #f3c2bd", color: "#a5281b" },
  },
  brand: {
    ok: { ...box, background: "rgba(11,47,61,.4)", color: "#fff" },
    bad: { ...box, background: "#fff", color: "#a5281b" },
  },
};

/**
 * The thank you (role="status", with the reference) or the error (role="alert"). The status region is always in the
 * page, empty and zero height until something happens, so screen readers announce the thank you when it appears.
 * Both take focus (tabIndex -1) when the answer arrives, see useServerForm.
 */
export function FormMessage({ state, tone = "light", style }: { state: FormState; tone?: Tone; style?: CSSProperties }) {
  return (
    <>
      <div role="status" aria-live="polite">
        {state.status === "success" && (
          <div data-form-message="" tabIndex={-1} style={{ ...tones[tone].ok, ...style }}>
            {state.message}
          </div>
        )}
      </div>
      {state.status === "error" && (
        <div role="alert" data-form-message="" tabIndex={-1} style={{ ...tones[tone].bad, ...style }}>
          {state.message}
        </div>
      )}
    </>
  );
}

/**
 * The privacy notice tick box, as on the Hooch and Linzzy consumer forms: required in the browser, and refused on the
 * server (lib/forms/core.ts) when it arrives unticked.
 */
export function PrivacyConsent({ state, id, style }: { state: FormState; id: string; style?: CSSProperties }) {
  const errorId = `${id}-error`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, lineHeight: 1.6, color: "#12313d" }}>
        <input
          id={id}
          type="checkbox"
          name="privacy"
          value="yes"
          required
          defaultChecked={state.values?.privacy === "yes"}
          aria-invalid={state.fieldErrors?.privacy ? true : undefined}
          aria-describedby={state.fieldErrors?.privacy ? errorId : undefined}
          style={{ margin: "3px 0 0", width: 14, height: 14, flex: "0 0 auto", accentColor: "#12a3c4" }}
        />
        <label htmlFor={id}>
          I agree to the <a href="/privacy-policy" target="_blank" rel="noopener" style={{ color: "#0b6d88", textDecoration: "underline" }}>privacy notice</a>.
        </label>
      </div>
      <FieldError id={errorId} message={state.fieldErrors?.privacy} />
    </div>
  );
}

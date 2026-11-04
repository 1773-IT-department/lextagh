import type { CSSProperties } from "react";
import type { FormState } from "@/lib/forms/core";

/** Shared bits of the website forms (item 19). Nothing here shows until a form has been sent. */

export type Tone = "light" | "brand";

export const idleState: FormState = { status: "idle" };

/** Hidden spam trap: off screen, hidden from screen readers, skipped by Tab, never autofilled. Bots fill it in. */
export function Honeypot() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: -10000, top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Leave this field empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

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

/** Props that mark a field invalid and point it at its message. */
export function invalidProps(state: FormState, name: string, id: string) {
  const error = state.fieldErrors?.[name];
  return error ? { "aria-invalid": true as const, "aria-describedby": id } : {};
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
 */
export function FormMessage({ state, tone = "light", style }: { state: FormState; tone?: Tone; style?: CSSProperties }) {
  return (
    <>
      <div role="status" aria-live="polite">
        {state.status === "success" && <div style={{ ...tones[tone].ok, ...style }}>{state.message}</div>}
      </div>
      {state.status === "error" && (
        <div role="alert" style={{ ...tones[tone].bad, ...style }}>
          {state.message}
        </div>
      )}
    </>
  );
}

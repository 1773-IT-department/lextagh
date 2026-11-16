"use client";

import type { FormState } from "@lexta/forms/core";
export { Honeypot } from "@lexta/forms/react";

/** The state of a form before it is sent. */
export const idleState: FormState = { status: "idle" };

// Small pieces the prototype's forms need once they post to the Business System: the field error under a field and the
// error message of the form (the thank you is the prototype's own panel). Prototype typography.

export function Err({ id, msg, color = "#B3105A" }: { id: string; msg?: string; color?: string }) {
  if (!msg) return null;
  return (
    <span id={id} style={{ display: "block", marginTop: 6, fontSize: 13, fontWeight: 600, letterSpacing: 0, textTransform: "none", color }}>
      {msg}
    </span>
  );
}

export function FormError({ state, dark = false }: { state: FormState; dark?: boolean }) {
  if (state.status !== "error") return null;
  return (
    <div role="alert" data-form-message="" tabIndex={-1} style={{ padding: "16px 20px", background: dark ? "#fff" : "#FFE3EE", color: dark ? "#0B3D2E" : "#7a0c3e", fontWeight: 600, fontSize: 15, lineHeight: 1.5 }}>
      {state.message}
    </div>
  );
}

/** aria props for a field: invalid and described by its error. */
export const fieldAria = (state: FormState, name: string, id: string) =>
  state.fieldErrors?.[name] ? { "aria-invalid": true as const, "aria-describedby": id } : {};

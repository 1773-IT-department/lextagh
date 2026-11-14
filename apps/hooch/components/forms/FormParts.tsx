"use client";

import type { FormState } from "@lexta/forms/core";
import s from "./forms.module.css";

/** The Hooch look of the shared form pieces (packages/forms holds the behaviour). */
export type Tone = "light" | "dark";

export const idleState: FormState = { status: "idle" };

/** Inline message under a field. Pair the field with aria-invalid and aria-describedby={id}. */
export function FieldError({ id, message, tone = "light" }: { id: string; message?: string; tone?: Tone }) {
  if (!message) return null;
  return <span id={id} className={tone === "dark" ? s.errorDark : s.error}>{message}</span>;
}

/**
 * The thank you (role="status", with the reference) or the error (role="alert"). The status region is always in the
 * page, so screen readers announce the thank you when it appears. Both take focus when the answer arrives.
 */
export function FormMessage({ state, tone = "light" }: { state: FormState; tone?: Tone }) {
  return (
    <>
      <div role="status" aria-live="polite">
        {state.status === "success" && (
          <div data-form-message="" tabIndex={-1} className={tone === "dark" ? s.okDark : s.ok}>{state.message}</div>
        )}
      </div>
      {state.status === "error" && (
        <div role="alert" data-form-message="" tabIndex={-1} className={tone === "dark" ? s.badDark : s.bad}>{state.message}</div>
      )}
    </>
  );
}

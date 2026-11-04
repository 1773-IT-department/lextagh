"use client";

import { startTransition, useEffect, useRef, type CSSProperties, type FormEvent } from "react";
import type { FormState } from "@/lib/forms/core";

/** Shared bits of the website forms (item 19). Nothing here shows until a form has been sent. */

/**
 * Wires a form to its server action.
 *
 * The form keeps action={formAction}, so it still posts without JavaScript.
 * With JavaScript, onSubmit sends the form itself. React then does not reset the form after the action, so on an
 *   error everything stays as typed and chosen (text, selects, ticks, radios); on success the typed fields are
 *   cleared here instead (radio choices such as the reason or route stay).
 * While sending, the button is only aria-disabled (a disabled button would drop keyboard focus to the page) and a
 *   second submit is ignored.
 * When the answer arrives, focus moves to the first field with an error, or else to the thank you or error message.
 */
export function useServerForm(state: FormState, formAction: (fd: FormData) => void, pending: boolean) {
  const ref = useRef<HTMLFormElement>(null);
  // The answer already handled, so focus moves once per answer (and never while the next one is on its way).
  const handled = useRef<FormState | null>(null);

  useEffect(() => {
    if (pending || handled.current === state) return;
    const firstRun = handled.current === null;
    handled.current = state;
    const form = ref.current;
    // On first load there is nothing to announce, unless the page came back from a post without JavaScript.
    if (!form || state.status === "idle") return;
    if (state.status === "success" && !firstRun) clearTypedFields(form);
    const target =
      (state.fieldErrors && form.querySelector<HTMLElement>('[aria-invalid="true"]')) ||
      form.querySelector<HTMLElement>("[data-form-message]");
    target?.focus();
  }, [state, pending]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  return { ref, onSubmit };
}

function clearTypedFields(form: HTMLFormElement) {
  for (const el of Array.from(form.elements)) {
    if (el instanceof HTMLTextAreaElement) el.value = "";
    else if (el instanceof HTMLSelectElement) {
      const preset = Array.from(el.options).findIndex((o) => o.defaultSelected);
      el.selectedIndex = preset >= 0 ? preset : 0;
    } else if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox") el.checked = false;
      else if (!["radio", "hidden", "submit", "button"].includes(el.type)) el.value = "";
    }
  }
}

/** What a <button> brought by default, so the reason and route label cards render exactly like the prototype's buttons. */
export const choiceCardReset: CSSProperties = {
  position: "relative", boxSizing: "border-box", margin: 0, fontStyle: "normal", fontWeight: 400, fontSize: 13.3333, lineHeight: "normal", letterSpacing: "normal",
  wordSpacing: "normal", textTransform: "none", textIndent: 0, textShadow: "none", color: "#000",
};

/** Visually hidden but still focusable and announced (for the radio behind each reason or route card). */
export const visuallyHidden: CSSProperties = {
  position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0,
};

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

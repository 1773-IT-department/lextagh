"use client";

import { startTransition, useEffect, useRef, type CSSProperties, type FormEvent } from "react";
import type { FormState } from "./core";

/** The form behaviour every website shares (item 19). Each site draws its own fields and messages around these. */

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

/** Visually hidden but still focusable and announced (for the radio behind each reason or route card). */
export const visuallyHidden: CSSProperties = {
  position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0,
};

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

/** Props that mark a field invalid and point it at its message. */
export function invalidProps(state: FormState, name: string, id: string) {
  const error = state.fieldErrors?.[name];
  return error ? { "aria-invalid": true as const, "aria-describedby": id } : {};
}

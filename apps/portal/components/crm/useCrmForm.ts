"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { CrmFormState } from "@/app/(app)/systems/crm/actions";

type Action = (prev: CrmFormState, form: FormData) => Promise<CrmFormState>;

/** Runs a CRM server action without React resetting the form, so on an error the person keeps what they typed. */
export function useCrmForm(action: Action) {
  const [state, run, pending] = useActionState(action, {} as CrmFormState);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Include the button that was pressed (some forms have two, like "Add contact and create a lead").
    const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => run(data));
  };
  return { state, pending, onSubmit, fe: state.fieldErrors ?? {} };
}

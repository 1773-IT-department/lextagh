"use client";

import { useActionState } from "react";
import { requestPasswordReset, setPassword, signIn, type FormState } from "@/app/actions";

const empty: FormState = {};

function Alert({ state }: { state: FormState }) {
  if (state.error) return <div className="alert error" role="alert">{state.error}</div>;
  if (state.message) return <div className="alert ok" role="status">{state.message}</div>;
  return null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, empty);
  return (
    <form action={action} noValidate>
      <Alert state={state} />
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} key={state.email} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn block" type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, empty);
  return (
    <form action={action} noValidate>
      <Alert state={state} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <button className="btn block" type="submit" disabled={pending}>{pending ? "Sending..." : "Send reset link"}</button>
    </form>
  );
}

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(setPassword, empty);
  return (
    <form action={action} noValidate>
      <Alert state={state} />
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      <div className="field">
        <label htmlFor="confirm">Type it again</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      <button className="btn block" type="submit" disabled={pending}>{pending ? "Saving..." : "Save password"}</button>
    </form>
  );
}

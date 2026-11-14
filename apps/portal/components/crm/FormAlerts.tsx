import type { CrmFormState } from "@/app/(app)/systems/crm/actions";

export default function FormAlerts({ state }: { state: CrmFormState }) {
  return (
    <>
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
      {state.message && <div className="alert ok" role="status">{state.message}</div>}
    </>
  );
}

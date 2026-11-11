"use client";

import { clearBrandWebsiteLeadManager } from "@/app/(app)/systems/crm/settings/website-leads/actions";
import FormAlerts from "./FormAlerts";
import { useCrmForm } from "./useCrmForm";

/** Sets one switched off brand back to "Use default". */
export default function ClearBrandManagerButton({ brandId }: { brandId: string }) {
  const { state, pending, onSubmit } = useCrmForm(clearBrandWebsiteLeadManager);
  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="brand_id" value={brandId} />
      <FormAlerts state={state} />
      <button className="btn small light" type="submit" disabled={pending}>{pending ? "Clearing..." : "Use default"}</button>
    </form>
  );
}

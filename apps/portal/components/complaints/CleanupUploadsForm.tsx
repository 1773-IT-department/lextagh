"use client";

import { cleanUnclaimedWebsiteUploads } from "@/app/(app)/systems/complaints/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

/** Admins: removes website complaint uploads no complaint claimed within an hour. */
export default function CleanupUploadsForm({ count }: { count: number }) {
  const { state, pending, onSubmit } = useCrmForm(cleanUnclaimedWebsiteUploads);
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <button className="btn small light" type="submit" disabled={pending || count === 0}>{pending ? "Removing..." : "Remove unclaimed website uploads"}</button>
    </form>
  );
}

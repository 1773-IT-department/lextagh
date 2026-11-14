"use client";

import { useActionState } from "react";
import { togglePublished, type ActionResult } from "@/app/(app)/systems/products/actions";

const empty: ActionResult = {};

/** Publish or unpublish a product, showing an error if the change did not go through. */
export default function PublishButton({ productId, isPublished }: { productId: string; isPublished: boolean }) {
  const [state, action, pending] = useActionState(togglePublished, empty);
  return (
    <form action={action} className="publish-form">
      <input type="hidden" name="id" value={productId} />
      <input type="hidden" name="publish" value={String(!isPublished)} />
      <button className={`btn ${isPublished ? "light" : ""}`} type="submit" disabled={pending}>
        {pending ? "Saving..." : isPublished ? "Unpublish" : "Publish"}
      </button>
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
    </form>
  );
}

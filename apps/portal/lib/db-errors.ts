/**
 * Messages raised by our own database rules (triggers and save functions) are written in plain words, for example
 * "the product is not one of this brand's products". Postgres' own messages (row level security, constraints, types)
 * are not meant for people. This returns ours, ready to show, or null.
 */
export function ownDbMessage(error: { message?: string } | null | undefined): string | null {
  const m = (error?.message ?? "").trim();
  if (!m || m.length > 200) return null;
  if (/row-level security|permission denied|violates|duplicate key|invalid input|syntax|value too long|null value|column|relation|function|does not exist|out of range|^not allowed/i.test(m)) {
    return null;
  }
  const text = m.charAt(0).toUpperCase() + m.slice(1);
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** Why a delete failed, for the ?error= flag on a record page. */
export function deleteFailure(error: { code?: string; message?: string }): "permission" | "linked" | "delete" {
  if (error.code === "42501") return "permission";
  if (error.code === "23503" || error.code === "23514") return "linked";
  return "delete";
}

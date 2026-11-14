import "server-only";
import { JOB_APPLICATION_STAGES } from "@lexta/db";
import { cleanSearch, UUID } from "./crm";

/** The applications list filters, shared by the list and the CSV export so both always show the same rows. */
export type ApplicationFilters = {
  q: string;
  /** A role id, "general" (no role) or "" (any). */
  opening: string;
  stage: string;
  /** YYYY-MM-DD, received on or after. */
  from: string;
  /** YYYY-MM-DD, received on or before. */
  to: string;
  /** "mine", "unassigned", a person id or "". */
  owner: string;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (v: string | undefined) => (v && DATE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) ? v : "");

export function parseApplicationFilters(params: Record<string, string | undefined>): ApplicationFilters {
  return {
    q: cleanSearch(params.q, 80),
    opening: params.opening === "general" || (params.opening && UUID.test(params.opening)) ? params.opening : "",
    stage: params.stage === "active" || JOB_APPLICATION_STAGES.some((s) => s.value === params.stage) ? params.stage! : "",
    from: validDate(params.from),
    to: validDate(params.to),
    owner: params.owner === "mine" || params.owner === "unassigned" || (params.owner && UUID.test(params.owner)) ? params.owner : "",
  };
}

/** Stages still in play (not hired, rejected or withdrawn). */
export const ACTIVE_STAGES = ["new", "screening", "shortlisted", "interview", "offer"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Builder = any;

/** Every filter except the stage, so stage counts can reuse it. */
export function applyApplicationFilters(query: Builder, f: ApplicationFilters, userId: string, withStage = true): Builder {
  let out = query;
  if (f.opening === "general") out = out.is("opening_id", null);
  else if (f.opening) out = out.eq("opening_id", f.opening);
  if (f.from) out = out.gte("created_at", `${f.from}T00:00:00Z`);
  if (f.to) {
    const next = new Date(`${f.to}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    out = out.lt("created_at", next.toISOString());
  }
  if (f.owner === "mine") out = out.eq("owner_id", userId);
  else if (f.owner === "unassigned") out = out.is("owner_id", null);
  else if (f.owner) out = out.eq("owner_id", f.owner);
  if (f.q) {
    out = out.or([`full_name.ilike.*${f.q}*`, `email.ilike.*${f.q}*`, `reference.ilike.*${f.q}*`, `interest.ilike.*${f.q}*`,
      `phone.ilike.*${f.q}*`].join(","));
  }
  if (withStage) {
    if (f.stage === "active") out = out.in("stage", ACTIVE_STAGES);
    else if (f.stage) out = out.eq("stage", f.stage);
  }
  return out;
}

/** The query string for these filters (empty values left out). */
export function filterQuery(f: Partial<ApplicationFilters> & { page?: string }): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && !(k === "page" && v === "1")) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

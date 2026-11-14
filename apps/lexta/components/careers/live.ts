/**
 * Careers open roles, read live from the Recruitment system ("open a role in the portal, the page shows it").
 *
 * Roles come from getOpenJobs in @lexta/db (publishable key, so Row Level Security only returns live roles: status
 * open, opened, closing date not passed). Its requests are cached under the "jobs" tag for up to an hour; the portal
 * calls /api/revalidate after every role save, which clears the tag and rebuilds /careers.
 * If the database cannot be reached, or the site has no Supabase settings, the page shows the honest "no open roles"
 * state (never the prototype's sample roles, whose dates have passed) and a warning is logged.
 */
import { getOpenJobs, type PublicJob } from "@lexta/db";

export type CareersJob = PublicJob & {
  /** "2 September 2026", or "" when the role has no opening date. */
  posted: string;
  /** "30 September 2026", or "" when it is open until filled. */
  closes: string;
};

/** A YYYY-MM-DD date the way the prototype writes it: "2 September 2026". */
export function longDate(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export const toCareersJob = (j: PublicJob): CareersJob => ({ ...j, posted: longDate(j.opensAt), closes: longDate(j.closesAt) });

export async function getCareersJobs(): Promise<CareersJob[]> {
  try {
    return (await getOpenJobs()).map(toCareersJob);
  } catch (e) {
    console.warn(`[careers] showing no open roles: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}

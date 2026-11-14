import { NextResponse, type NextRequest } from "next/server";
import { jobApplicationStageLabel } from "@lexta/db";
import { getRecruitmentAccess, staffName } from "@/lib/recruitment";
import { applyApplicationFilters, parseApplicationFilters } from "@/lib/recruitment-filters";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_ROWS = 5000;
const PAGE = 1000;

/** One CSV cell. Text a spreadsheet would run as a formula gets a leading apostrophe. */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=@\t\r]/.test(s) || /^[+-](?![0-9 ()]*$)/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** The applications list as CSV, with the same filters as the screen. Admin, management and hr only. */
export async function GET(req: NextRequest) {
  const access = await getRecruitmentAccess();
  if (!access.canView) return new NextResponse("Your role does not include recruitment.", { status: 403 });
  const f = parseApplicationFilters(Object.fromEntries(req.nextUrl.searchParams));
  const supabase = await createClient();

  type Row = Record<string, string | number | boolean | null>;
  const rows: Row[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await applyApplicationFilters(
      supabase.from("job_applications").select(
        "reference, created_at, full_name, email, phone, opening_reference_snapshot, opening_title_snapshot, interest, stage, stage_changed_at, owner_id, cv_file_name, consent_keep, message, staff_notes",
      ),
      f, access.userId,
    ).order("created_at", { ascending: false }).order("id").range(from, from + PAGE - 1);
    if (error) {
      console.error("[recruitment] export failed", error);
      return new NextResponse("The export could not be made. Please try again.", { status: 500 });
    }
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE) break;
  }

  const head = ["Reference", "Received", "Name", "Email", "Phone", "Role reference", "Role", "Area of interest", "Stage", "Stage since",
    "Owner", "CV file", "Consent to keep", "Message", "Staff notes"];
  const lines = [head.map(cell).join(",")];
  for (const r of rows) {
    lines.push([
      r.reference, r.created_at, r.full_name, r.email, r.phone, r.opening_reference_snapshot, r.opening_title_snapshot ?? "General application",
      r.interest, jobApplicationStageLabel(r.stage as string), r.stage_changed_at, staffName(access, r.owner_id as string | null), r.cv_file_name,
      r.consent_keep ? "Yes" : "No", r.message, r.staff_notes,
    ].map(cell).join(","));
  }
  const day = new Date().toISOString().slice(0, 10);
  // A byte order mark so Excel reads names with accents correctly.
  return new NextResponse("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lexta-applications-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

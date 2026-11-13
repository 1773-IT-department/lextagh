import { redirect } from "next/navigation";
import { MANAGEMENT_BASE } from "@/lib/management";

/** The old address of the management dashboard: it moved to the management overview, with its period and brand. */
export default async function OldDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const k of ["range", "from", "to", "brand"]) {
    const v = params[k];
    if (typeof v === "string" && v) q.set(k, v);
  }
  const s = q.toString();
  redirect(s ? `${MANAGEMENT_BASE}?${s}` : MANAGEMENT_BASE);
}

import Link from "next/link";
import RoleForm from "@/components/recruitment/RoleForm";
import { getRecruitmentAccess, NO_RECRUITMENT_ACCESS } from "@/lib/recruitment";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New role | Recruitment | Lexta Business System" };

export default async function NewRolePage() {
  const access = await getRecruitmentAccess();
  if (!access.canView) return (<><h1>New role</h1><p className="small">{NO_RECRUITMENT_ACCESS}</p></>);
  const supabase = await createClient();
  const { data } = await supabase.from("job_openings").select("department, location");
  const used = (data ?? []) as { department: string; location: string }[];
  return (
    <>
      <p className="crumbs"><Link href="/systems/recruitment/roles">Roles</Link></p>
      <h1>New role</h1>
      <p className="small">Save it as a draft to prepare it, or set it to Open to show it on the Careers page.</p>
      <RoleForm mode="new" departments={[...new Set(used.map((u) => u.department))].sort()} locations={[...new Set(used.map((u) => u.location))].sort()} />
    </>
  );
}

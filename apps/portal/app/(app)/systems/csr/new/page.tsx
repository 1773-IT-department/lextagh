import Link from "next/link";
import ActivityForm from "@/components/csr/ActivityForm";
import { UUID, todayIso } from "@/lib/crm";
import { getCsrAccess, NO_CSR_ACCESS } from "@/lib/csr";

export const metadata = { title: "Log a CSR activity | Lexta Business System" };

export default async function NewActivityPage({ searchParams }: { searchParams: Promise<{ programme?: string }> }) {
  const sp = await searchParams;
  const access = await getCsrAccess();
  if (!access.canView) return (<><h1>Log a CSR activity</h1><p className="small">{NO_CSR_ACCESS}</p></>);
  if (!access.canWrite) return (<><h1>Log a CSR activity</h1><p className="small">Only admin and marketing log CSR activities.</p></>);
  const programmes = access.programmes.filter((p) => access.writableProgrammeIds.has(p.id)).map((p) => ({ id: p.id, label: p.name }));
  const chosen = sp.programme && UUID.test(sp.programme) && access.writableProgrammeIds.has(sp.programme) ? sp.programme : "";
  return (
    <>
      <p className="crumbs"><Link href="/systems/csr">CSR activities</Link></p>
      <h1>Log a CSR activity</h1>
      <p className="small">Add photos on the next screen, once the activity is saved.</p>
      {programmes.length === 0 ? (
        <div className="alert info" role="status">There is no programme you can log activities for yet. Ask your Lexta administrator to add one or link you to its brand.</div>
      ) : (
        <ActivityForm
          values={{ programme_id: chosen, activity_date: todayIso(), status: "done", region_id: "", place: "", people_reached: 0, partners: "", notes: "" }}
          programmes={programmes}
          regions={access.regions.map((r) => ({ id: r.id, label: r.name }))}
        />
      )}
    </>
  );
}

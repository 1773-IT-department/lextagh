import CsrTabs from "@/components/csr/CsrTabs";
import { NewProgramme, ProgrammeRow } from "@/components/csr/ProgrammeForms";
import { getCsrAccess } from "@/lib/csr";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "CSR programmes | Lexta Business System" };

/** Admin: the programme list marketing logs activities against. */
export default async function CsrProgrammesPage() {
  const access = await getCsrAccess();
  if (!access.isAdmin) return (<><h1>CSR programmes</h1><p className="small">Only admin changes the programme list.</p></>);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("csr_programme_totals");
  if (error) console.error("[csr] programme counts failed", error);
  const counts = new Map<string, number>();
  for (const t of (data ?? []) as { programme_id: string; activities_done: number | string; activities_planned: number | string }[]) {
    counts.set(t.programme_id, Number(t.activities_done) + Number(t.activities_planned));
  }
  const brands = access.brands.map((b) => ({ id: b.id, name: b.name }));
  // A programme keeps a brand that has since been switched off: it is offered on that programme only, marked as such.
  const brandsFor = (brandId: string | null) => (!brandId || brands.some((b) => b.id === brandId) ? brands
    : [...brands, { id: brandId, name: `${access.allBrands.find((b) => b.id === brandId)?.name ?? "Brand"} (switched off)` }]);
  const next = Math.max(0, ...access.programmes.map((p) => p.sort_order)) + 10;
  const toCheck = access.programmes.filter((p) => p.needs_review).length;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>CSR programmes</h1>
          <p className="small">
            The programmes marketing logs activities against. A programme with a brand can be logged by marketing staff who work on
            that brand; one with no brand by all marketing staff. Switch a programme off to stop new activities; its activities stay.
          </p>
        </div>
      </div>
      <CsrTabs active="programmes" isAdmin />
      {toCheck > 0 && (
        <div className="alert info" role="status">
          {toCheck} {toCheck === 1 ? "programme was" : "programmes were"} copied from the CSR page of the Lexta website. Check the names, brands and
          descriptions, then press Save as checked.
        </div>
      )}
      <section className="panel">
        <ul className="csr-programmes">
          {access.programmes.map((p) => (
            <ProgrammeRow key={`${p.id}-${p.name}-${p.sort_order}-${p.is_active}-${p.needs_review}-${p.brand_id}`} p={p} brands={brandsFor(p.brand_id)}
              activityCount={error ? 1 : counts.get(p.id) ?? 0} />
          ))}
        </ul>
      </section>
      <section className="panel"><NewProgramme key={access.programmes.length} brands={brands} nextOrder={next} /></section>
    </>
  );
}

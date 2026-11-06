import FieldTabs from "@/components/field-sales/FieldTabs";
import { NewOutcome, OutcomeRow } from "@/components/field-sales/OutcomeForms";
import { getFieldAccess } from "@/lib/field-sales";

export const metadata = { title: "Visit outcomes | Lexta Business System" };

/** Admin: the outcome list reps choose from. */
export default async function OutcomesPage() {
  const access = await getFieldAccess();
  if (!access.isAdmin) return (<><h1>Visit outcomes</h1><p className="small">Only admin changes the outcome list.</p></>);
  const next = Math.max(0, ...access.outcomes.map((o) => o.sort_order)) + 10;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Visit outcomes</h1>
          <p className="small">What reps choose when they log a visit. Switch an outcome off to hide it from reps; visits that used it keep it.</p>
        </div>
      </div>
      <FieldTabs active="outcomes" seesAll isAdmin />
      <section className="panel">
        <ul className="fs-outcome-list">
          {access.outcomes.map((o) => <OutcomeRow key={`${o.id}-${o.label}-${o.sort_order}-${o.is_active}`} o={o} />)}
        </ul>
      </section>
      <section className="panel"><NewOutcome key={access.outcomes.length} nextOrder={next} /></section>
    </>
  );
}

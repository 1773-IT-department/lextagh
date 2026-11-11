import Link from "next/link";
import VisitFlow from "@/components/field-sales/VisitFlow";
import { getFieldAccess, loadStockSkus, NO_FIELD_ACCESS } from "@/lib/field-sales";

export const metadata = { title: "Start visit | Lexta Business System" };

/** Start a shop visit on the phone. */
export default async function StartVisitPage() {
  const access = await getFieldAccess();
  if (!access.canView) return (<><h1>Start visit</h1><p className="small">{NO_FIELD_ACCESS}</p></>);
  const skus = await loadStockSkus(access);
  const outcomes = access.outcomes.filter((o) => o.is_active).map((o) => ({ id: o.id, label: o.label }));
  const myBrands = access.brands.filter((b) => access.myBrandIds.has(b.id)).map((b) => ({ id: b.id, name: b.name }));
  return (
    <>
      <p className="crumbs"><Link href="/systems/field-sales">Field sales</Link></p>
      <h1>Start visit</h1>
      <VisitFlow outcomes={outcomes} regions={access.regions} myBrands={myBrands} skus={skus} canAddShop={access.canAddShop && myBrands.length > 0} />
    </>
  );
}

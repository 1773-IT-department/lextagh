import Link from "next/link";
import StockistImport from "@/components/stockists/StockistImport";
import { CSV_HEADER } from "@/lib/stockist-input";
import { getStockistAccess } from "@/lib/stockists";

export const metadata = { title: "Import stockists | Lexta Business System" };

export default async function ImportStockistsPage() {
  const access = await getStockistAccess();
  if (!access.canCreate || access.myBrands.length === 0) {
    return (
      <>
        <p className="crumbs"><Link href="/systems/stockists">Stockists</Link></p>
        <h1>Import stockists</h1>
        <p className="small">
          {!access.canView
            ? "Your role does not include this system. Ask your Lexta administrator if you need it."
            : !access.canCreate
              ? "Your role can view stockists but not add them."
              : "You do not work on any brand yet, so you cannot add stockists. Ask your Lexta administrator for brand access."}
        </p>
      </>
    );
  }
  return (
    <>
      <p className="crumbs"><Link href="/systems/stockists">Stockists</Link></p>
      <h1>Import stockists</h1>
      <p className="small">Load many shops at once from a spreadsheet saved as CSV. Every row is checked first; nothing is saved until you press Import.</p>

      <section className="panel">
        <h2>How the file should look</h2>
        <p className="small">The first line must be this header (extra columns such as opening_hours are allowed):</p>
        <pre className="code">{CSV_HEADER.join(",")}</pre>
        <ul className="small help-list">
          <li><b>outlet_type</b>: supermarket, pharmacy, open market, general trade (neighbourhood shop), distributor or other.</li>
          <li><b>region</b>: one of Ghana&apos;s 16 regions, for example Greater Accra, or Liberia (Monrovia).</li>
          <li><b>brands</b>: separate with a semicolon, for example Yazz; Hooch. You can add {access.myBrands.map((b) => b.name).join(", ")}.</li>
          <li><b>address</b>, <b>phone</b>, <b>latitude</b> and <b>longitude</b> may be empty. Put text with commas in double quotes.</li>
        </ul>
      </section>

      <StockistImport />
    </>
  );
}

import Link from "next/link";
import StockistForm from "@/components/stockists/StockistForm";
import { getStockistAccess } from "@/lib/stockists";

export const metadata = { title: "New stockist | Lexta Business System" };

export default async function NewStockistPage() {
  const access = await getStockistAccess();
  if (!access.canCreate || access.myBrands.length === 0) {
    return (
      <>
        <p className="crumbs"><Link href="/systems/stockists">Stockists</Link></p>
        <h1>New stockist</h1>
        <p className="small">
          {!access.canView
            ? "Your role does not include this system. Ask your Lexta administrator if you need it."
            : !access.canCreate
              ? "Your role can view stockists but not add them."
              : "You do not work on any brand yet, so you cannot add stockists. Ask your Lexta administrator to give you access to Yazz, Linzzy or Hooch."}
        </p>
      </>
    );
  }
  return (
    <>
      <p className="crumbs"><Link href="/systems/stockists">Stockists</Link></p>
      <h1>New stockist</h1>
      <p className="small">Add a shop that carries our brands. It shows on Where to Buy as soon as it is saved.</p>
      <StockistForm mode="full" regions={access.regions} allBrands={access.allBrands} myBrands={access.myBrands} carried={[]} />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { outletTypeLabel, type StockistPublic } from "@lexta/db";
import ConfirmButton from "@/components/products/ConfirmButton";
import ActiveButton from "@/components/stockists/ActiveButton";
import StockistForm from "@/components/stockists/StockistForm";
import { getStockistAccess } from "@/lib/stockists";
import { createClient } from "@/lib/supabase/server";
import { deleteStockist } from "../actions";

export const metadata = { title: "Edit stockist | Lexta Business System" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function EditStockistPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();

  const access = await getStockistAccess();
  if (!access.canView) {
    return (
      <>
        <h1>Stockists</h1>
        <p className="small">Your role does not include this system. Ask your Lexta administrator if you need it.</p>
      </>
    );
  }

  const supabase = await createClient();
  // Explicit columns: who created or changed a stockist is not readable from the table (see 0005_stockists.sql).
  const { data: stockist, error } = await supabase
    .from("stockists")
    .select("id, name, outlet_type, region_id, town, address, phone, latitude, longitude, opening_hours, is_active, created_at, updated_at")
    .eq("id", id)
    .maybeSingle<StockistPublic>();
  if (error) throw new Error("Could not load the stockist");
  if (!stockist) notFound();

  const [linksRes, notesRes, editRes] = await Promise.all([
    supabase.from("stockist_brands").select("brand_id").eq("stockist_id", id),
    supabase.from("stockist_notes").select("notes").eq("stockist_id", id).maybeSingle(),
    access.canCreate ? supabase.rpc("can_edit_stockist", { target_stockist: id }) : Promise.resolve({ data: false, error: null }),
  ]);
  if (linksRes.error || notesRes.error) throw new Error("Could not load the stockist");
  const carried = (linksRes.data ?? []).map((l) => l.brand_id as string);
  const canEdit = editRes.data === true;
  // A shop with no brands yet belongs to its creator and admins (they get the full form); nobody else may brand it.
  const mode = canEdit ? "full" : access.canCreate && access.myBrands.length > 0 && carried.length > 0 ? "brands" : "view";
  const region = access.regions.find((r) => r.id === stockist.region_id);

  return (
    <>
      <p className="crumbs"><Link href="/systems/stockists">Stockists</Link>{region ? ` / ${region.name}` : ""}</p>
      <div className="page-head">
        <div>
          <h1>{stockist.name}</h1>
          <p className="small">
            <span className={`badge ${stockist.is_active ? "on" : "off"}`}>{stockist.is_active ? "On Where to Buy" : "Deactivated"}</span>{" "}
            {outletTypeLabel(stockist.outlet_type)}, {stockist.town}
          </p>
        </div>
        {canEdit && (
          <div className="head-actions">
            <ActiveButton stockistId={stockist.id} isActive={stockist.is_active} />
          </div>
        )}
      </div>

      {flags.created && <div className="alert ok" role="status">Stockist added. It shows on Where to Buy while it is active.</div>}
      {flags.error === "delete" && <div className="alert error" role="alert">The stockist could not be deleted. You may not have permission, or it was already removed. Please reload and try again.</div>}
      {mode === "brands" && (
        <div className="alert info" role="note">
          This stockist also carries brands you do not work on, so you can only add or remove your own brands here. Ask an administrator to change its details.
        </div>
      )}
      {mode === "view" && (
        <div className="alert info" role="note">
          {!access.canCreate
            ? "You are viewing this stockist. Your role cannot change it."
            : carried.length === 0
              ? "This stockist does not carry any brand yet. Only the person who added it or an administrator can change it."
              : "You are viewing this stockist. It carries brands you do not work on, so you cannot change it."}
        </div>
      )}

      <StockistForm
        mode={mode}
        stockist={stockist}
        notes={(notesRes.data?.notes as string | undefined) ?? ""}
        regions={access.regions}
        allBrands={access.allBrands}
        myBrands={access.myBrands}
        carried={carried}
      />

      {canEdit && (
        <section className="panel danger-zone">
          <h2>Delete stockist</h2>
          <p className="small">Removes the stockist and its notes from the system and from Where to Buy. This cannot be undone. To hide it for now, deactivate it instead.</p>
          <form action={deleteStockist.bind(null, stockist.id)}>
            <ConfirmButton className="btn danger" message={`Delete ${stockist.name} for good? This cannot be undone.`}>Delete stockist</ConfirmButton>
          </form>
        </section>
      )}
    </>
  );
}

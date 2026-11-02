import Link from "next/link";
import { notFound } from "next/navigation";
import {
  complaintCategoryLabel, complaintChannelLabel, complaintSeverityLabel, complaintStatusLabel, crmContactName,
  isComplaintOverdue, isOpenComplaint, type Complaint, type ComplaintEvent,
} from "@lexta/db";
import ComplaintForm from "@/components/complaints/ComplaintForm";
import ComplaintTimeline from "@/components/complaints/ComplaintTimeline";
import EventForm from "@/components/complaints/EventForm";
import Files, { type FileItem } from "@/components/complaints/Files";
import OwnerControl from "@/components/complaints/OwnerControl";
import StatusForm from "@/components/complaints/StatusForm";
import ConfirmButton from "@/components/products/ConfirmButton";
import { formatDate, formatDateTime } from "@/lib/crm";
import { organisationOptions, stockistOptions } from "@/lib/crm-data";
import { productPickers } from "@/lib/complaint-data";
import { getComplaintAccess, NO_COMPLAINT_ACCESS, ownerCandidates, staffName } from "@/lib/complaints";
import { createClient } from "@/lib/supabase/server";
import { deleteComplaint } from "../actions";

export const metadata = { title: "Complaint | Lexta Business System" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const COLUMNS =
  "id, case_number, brand_id, product_id, sku_id, product_name_snapshot, sku_code_snapshot, pack_size_snapshot, stockist_name_snapshot, batch_number, stockist_id, purchase_place, purchase_date, category, severity, " +
  "channel, description, contact_id, organisation_id, status, owner_id, response_due_at, resolution_due_at, first_response_at, " +
  "resolution_summary, root_cause, resolved_at, closed_at, created_at, updated_at, created_by, updated_by";

function target(due: string, doneAt: string | null, open: boolean, now: Date) {
  if (doneAt) return { text: `${formatDateTime(due)}, met ${formatDateTime(doneAt)}`, late: new Date(doneAt) > new Date(due) };
  const late = open && new Date(due) < now;
  return { text: `${formatDateTime(due)}${late ? " (overdue)" : ""}`, late };
}

export default async function ComplaintPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();
  const access = await getComplaintAccess();
  if (!access.canView) return (<><h1>Complaint</h1><p className="small">{NO_COMPLAINT_ACCESS}</p></>);

  const supabase = await createClient();
  const { data: c, error } = await supabase.from("complaints").select(COLUMNS).eq("id", id).maybeSingle<Complaint>();
  if (error) throw new Error("Could not load the complaint");
  if (!c) notFound();

  // Closed is read only (notes, calls and emails still go in); reopen to change anything else.
  const closed = c.status === "closed";
  const canEdit = access.works && !closed;
  const [eventsRes, filesRes, contactRes, orgRes, productRes, skuRes, stockistRes, pickers, stockists, organisations] = await Promise.all([
    supabase.from("complaint_events").select("id, type, body, occurred_at, created_by").eq("complaint_id", id).order("occurred_at", { ascending: false }).limit(300),
    supabase.from("complaint_files").select("id, file_name, mime_type, size_bytes, created_at").eq("complaint_id", id).order("created_at"),
    supabase.from("crm_contacts").select("id, full_name, email, phone").eq("id", c.contact_id).maybeSingle(),
    c.organisation_id ? supabase.from("crm_organisations").select("id, name").eq("id", c.organisation_id).maybeSingle() : Promise.resolve({ data: null }),
    c.product_id ? supabase.from("products").select("id, name").eq("id", c.product_id).maybeSingle() : Promise.resolve({ data: null }),
    c.sku_id ? supabase.from("product_skus").select("id, sku_code, pack_size_label").eq("id", c.sku_id).maybeSingle() : Promise.resolve({ data: null }),
    c.stockist_id ? supabase.from("stockists").select("id, name, town").eq("id", c.stockist_id).maybeSingle() : Promise.resolve({ data: null }),
    canEdit ? productPickers(supabase) : Promise.resolve({ products: [], skus: [] }),
    canEdit ? stockistOptions(supabase, c.stockist_id) : Promise.resolve([]),
    canEdit ? organisationOptions(supabase, c.organisation_id) : Promise.resolve([]),
  ]);
  if (eventsRes.error) throw new Error("Could not load the timeline");
  if (filesRes.error) throw new Error("Could not load the files");
  const contact = contactRes.data as { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
  const org = orgRes.data as { id: string; name: string } | null;
  const product = productRes.data as { id: string; name: string } | null;
  const sku = skuRes.data as { id: string; sku_code: string; pack_size_label: string } | null;
  const stockist = stockistRes.data as { id: string; name: string; town: string } | null;

  const now = new Date();
  const open = isOpenComplaint(c.status);
  const overdue = isComplaintOverdue(c, now);
  const response = target(c.response_due_at, c.first_response_at, open, now);
  const resolution = target(c.resolution_due_at, c.resolved_at, open, now);
  const brandName = access.allBrands.find((b) => b.id === c.brand_id)?.name ?? "";
  const nameOf = (who: string | null) => (who ? (who === access.userId ? "you" : staffName(access, who)) : "the website");
  const files: FileItem[] = (filesRes.data ?? []).map((f) => ({
    id: f.id as string, file_name: f.file_name as string, mime_type: f.mime_type as string, size_bytes: f.size_bytes as number,
    added: formatDate(f.created_at as string),
  }));
  const staff = ownerCandidates(access).map((s) => ({ id: s.id, label: s.id === access.userId ? `${s.display_name} (me)` : s.display_name }));

  return (
    <>
      <p className="crumbs"><Link href="/systems/complaints">Complaints</Link></p>
      <div className="page-head">
        <div>
          <h1 className="mono">{c.case_number}</h1>
          <p className="small">
            <span className={`badge cstatus c-${c.status}`}>{complaintStatusLabel(c.status)}</span>{" "}
            <span className={`badge sev-${c.severity}`}>{complaintSeverityLabel(c.severity)}</span>{" "}
            {brandName}, {complaintCategoryLabel(c.category)}
            {overdue && <>, <span className="overdue">overdue</span></>}
          </p>
        </div>
        <OwnerControl
          id={c.id}
          ownerId={c.owner_id}
          ownerName={c.owner_id === access.userId ? "You" : staffName(access, c.owner_id)}
          canAssignToMe={!closed && access.takesUnassigned && c.owner_id === null}
          canReassign={!closed && access.reassigns}
          staff={staff}
        />
      </div>

      {flags.created && <div className="alert ok" role="status">Complaint logged as {c.case_number}. Give the customer this number.</div>}
      {flags.error === "delete" && <div className="alert error" role="alert">The complaint could not be deleted. You may not have permission, or it was already removed. Please reload and try again.</div>}
      {!access.works && (
        <div className="alert info" role="note">
          You can read this complaint and add notes. {access.reassigns ? "You can also assign it. " : ""}Customer care changes its status and closes it.
        </div>
      )}
      {access.works && closed && <div className="alert info" role="note">This complaint is closed and read only. You can still add notes, calls and emails. Reopen it to change details, the owner or files.</div>}

      <div className="crm-detail">
        <div>
          <section className="panel">
            <h2>Summary</h2>
            <dl className="facts">
              <dt>Customer</dt>
              <dd>
                {contact ? <Link href={`/systems/crm/contacts/${contact.id}`}>{crmContactName(contact)}</Link> : "Not available"}
                {contact?.phone && <span className="hint"><a href={`tel:${contact.phone.replace(/[^+0-9]/g, "")}`}>{contact.phone}</a></span>}
                {contact?.email && <span className="hint"><a href={`mailto:${contact.email}`}>{contact.email}</a></span>}
              </dd>
              {c.organisation_id && (<><dt>Organisation</dt><dd>{org ? <Link href={`/systems/crm/organisations/${org.id}`}>{org.name}</Link> : "An organisation you cannot see"}</dd></>)}
              <dt>Product</dt>
              <dd>
                {product ? product.name
                  : c.product_id ? c.product_name_snapshot ?? "A product you cannot see"
                  : c.product_name_snapshot ? `${c.product_name_snapshot} (product since removed)` : "Not given"}
                {sku ? <span className="hint">{sku.pack_size_label} ({sku.sku_code})</span>
                  : c.sku_code_snapshot && (
                    <span className="hint">
                      {c.pack_size_snapshot} ({c.sku_code_snapshot}){!c.sku_id && ", pack size since removed"}
                    </span>
                  )}
              </dd>
              {c.batch_number && (<><dt>Batch or lot</dt><dd className="mono">{c.batch_number}</dd></>)}
              <dt>Bought at</dt>
              <dd>{[
                  stockist ? `${stockist.name}, ${stockist.town}`
                    : c.stockist_name_snapshot ? `${c.stockist_name_snapshot}${c.stockist_id ? "" : " (stockist since removed)"}` : "",
                  c.purchase_place ?? "",
                ].filter(Boolean).join(". ") || "Not given"}
                {c.purchase_date && <span className="hint">On {formatDate(c.purchase_date)}</span>}
              </dd>
              <dt>Came in by</dt>
              <dd>{complaintChannelLabel(c.channel)}, {formatDateTime(c.created_at)}{c.created_by || c.channel !== "website" ? ` by ${nameOf(c.created_by)}` : ""}</dd>
              <dt>Respond by</dt>
              <dd className={response.late ? "overdue" : ""}>{response.text}</dd>
              <dt>Resolve by</dt>
              <dd className={resolution.late ? "overdue" : ""}>{resolution.text}</dd>
              {c.closed_at && (<><dt>Closed</dt><dd>{formatDateTime(c.closed_at)}</dd></>)}
              {c.resolution_summary && (<><dt>Resolution</dt><dd className="pre-line">{c.resolution_summary}</dd></>)}
              {c.root_cause && (<><dt>Root cause</dt><dd className="pre-line">{c.root_cause}</dd></>)}
            </dl>
            <p className="pre">{c.description}</p>
          </section>

          {access.works && (
            <section className="panel">
              <h2>Status</h2>
              <StatusForm id={c.id} status={c.status} resolutionSummary={c.resolution_summary} rootCause={c.root_cause} />
            </section>
          )}

          <section className="panel">
            <h2>Timeline</h2>
            <EventForm id={c.id} />
            <ComplaintTimeline items={(eventsRes.data ?? []) as ComplaintEvent[]} nameOf={nameOf} formatWhen={formatDateTime} />
          </section>
        </div>

        <div>
          <Files complaintId={c.id} files={files} canUpload={access.works && !closed} canRemove={access.isAdmin} />
          {canEdit && (
            <>
              <h2 className="section-title">Edit details</h2>
              <ComplaintForm
                mode="edit"
                complaint={c}
                brands={access.allBrands.map((b) => ({ id: b.id, label: b.name }))}
                products={pickers.products}
                skus={pickers.skus}
                stockists={stockists}
                organisations={organisations}
                hiddenProduct={!!c.product_id && !pickers.products.some((p) => p.id === c.product_id)}
                hiddenSku={!!c.sku_id && !pickers.skus.some((s) => s.id === c.sku_id)}
                hiddenOrganisation={!!c.organisation_id && !organisations.some((o) => o.id === c.organisation_id)}
              />
            </>
          )}
          {access.isAdmin && (
            <section className="panel danger-zone">
              <h2>Delete complaint</h2>
              <p className="small">Removes the complaint, its timeline and its files for good. Only for cases logged by mistake; otherwise close it.</p>
              <form action={deleteComplaint.bind(null, c.id)}>
                <ConfirmButton className="btn danger" message={`Delete ${c.case_number}, its timeline and files for good? This cannot be undone.`}>Delete complaint</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

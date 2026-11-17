// The optional complaint photo or document (0027) through a brand site's real server code: the form post path (no
// JavaScript) and the browser path (ticket, direct upload, then the form). Shared by the Yazz and Linzzy integration
// tests. Needs the shim running and NEXT_PUBLIC_SUPABASE_* pointing at it.
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(2044, 7)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(992, 1)]);

export async function checkComplaintAttachments({ core, actions, check, q, mail, fd, brand }) {
  const SECRET = `harness-chat-secret-${brand}-0123456789abcdef`;
  process.env.CHAT_INTAKE_SECRET = SECRET;
  await q("delete from private.chat_intake_secret");
  await q("insert into private.chat_intake_secret (secret) values (:'s')", { s: SECRET });
  const ip = { ip: "10.20.30.40" };
  const pf = (fields) => fd({ privacy: "yes", ...fields });
  const fileRow = (ref) => q(`select f.file_name || '|' || f.mime_type || '|' || f.size_bytes || '|' || (split_part(f.storage_path, '/', 1) = c.id::text)
    || '|' || (select count(*) from public.complaint_events e where e.complaint_id = c.id and e.type = 'attachment_added')
    from public.complaints c join public.complaint_files f on f.complaint_id = c.id where c.case_number = '${ref}'`);

  // Without JavaScript: the file comes in the form post and the server uploads it.
  {
    const form = pf({ topic: "problem", name: "Ama File", email: mail(`${brand}-file`), message: "Seal broken, photo attached." });
    form.append("attachment", new File([JPG], "seal photo.jpeg", { type: "image/jpeg" }));
    const s = await core.handleConsumer(form, {}, ip);
    check(s.status === "success" && /^LX-/.test(s.reference ?? ""), `${brand} file: a problem report with a photo returns a case number`, s);
    const row = await fileRow(s.reference);
    check(row === "seal photo.jpg|image/jpeg|2048|true|1", `${brand} file: the photo is on the case like a staff file (record, path under the case, timeline entry)`, row);
  }

  // With JavaScript: the browser gets a ticket, uploads straight to Storage, then sends the form with the path.
  {
    const t = await actions.requestComplaintUpload({ name: "receipt.png", size: PNG.length, head: PNG.subarray(0, 16).toString("base64") }, ip);
    check(t.ok && t.uploadUrl.endsWith(t.path.split("/").map(encodeURIComponent).join("/")) && t.contentType === "image/png", `${brand} file: the browser gets a ticket and an upload address`, t);
    const up = await fetch(t.uploadUrl, { method: "POST", headers: { apikey: t.apiKey, authorization: `Bearer ${t.apiKey}`, "content-type": "image/png" }, body: PNG });
    check(up.ok, `${brand} file: the browser upload with the publishable key is taken at the ticket path`, up.status);
    const again = await fetch(t.uploadUrl.replace(/[^/]+$/, "other.png"), { method: "POST", headers: { apikey: t.apiKey, "content-type": "image/png" }, body: PNG });
    check(!again.ok, `${brand} file: no other file goes into the ticket's folder`, again.status);
    const s = await core.handleConsumer(pf({ topic: "problem", name: "Kojo File", email: mail(`${brand}-file2`), message: "Receipt attached.", attachment_path: t.path, attachment_name: "My receipt.png" }), {}, ip);
    const row = await fileRow(s.reference);
    check(s.status === "success" && row === "My receipt.png|image/png|1000|true|1", `${brand} file: the form claims the uploaded file`, { s, row });
    const twice = await core.handleConsumer(pf({ topic: "problem", name: "Kojo File", email: mail(`${brand}-file3`), message: "Again.", attachment_path: t.path }), {}, ip);
    check(twice.status === "error" && twice.fieldErrors?.attachment && !twice.values?.attachment_path, `${brand} file: the same upload cannot be claimed twice`, twice);
  }

  // Wrong type, fake content, too big: refused with a message on the file field, the rest kept.
  {
    const html = pf({ topic: "problem", name: "Bad File", email: mail(`${brand}-bad`), message: "x" });
    html.append("attachment", new File(["<html></html>"], "page.html", { type: "text/html" }));
    const a = await core.handleConsumer(html, {}, ip);
    check(a.status === "error" && a.fieldErrors?.attachment === "Please choose a JPG, PNG or PDF file." && a.values?.name === "Bad File", `${brand} file: a wrong type is refused on the file field`, a);
    const fake = pf({ topic: "problem", name: "Bad File", email: mail(`${brand}-bad`), message: "x" });
    fake.append("attachment", new File(["<script>alert(1)</script>"], "photo.jpg", { type: "image/jpeg" }));
    const b = await core.handleConsumer(fake, {}, ip);
    check(b.status === "error" && /does not look like/.test(b.fieldErrors?.attachment ?? ""), `${brand} file: a file whose bytes are not a JPG is refused`, b);
    const big = await actions.requestComplaintUpload({ name: "big.pdf", size: 5 * 1024 * 1024 + 1, head: Buffer.from("%PDF-1.7").toString("base64") }, ip);
    check(!big.ok && big.message === "The file must be 5 MB or smaller.", `${brand} file: over 5 MB is refused`, big);
    const forged = await core.handleConsumer(pf({ topic: "problem", name: "Bad File", email: mail(`${brand}-bad2`), message: "x", attachment_path: `${crypto.randomUUID()}/x.jpg` }), {}, ip);
    check(forged.status === "error" && forged.fieldErrors?.attachment, `${brand} file: a made up path is refused`, forged);
    const counted = await q(`select count(*) from public.complaints c join public.crm_contacts k on k.id = c.contact_id where k.email like '${brand}-bad%'`);
    check(counted === "0", `${brand} file: refused files save no complaint`, counted);
  }

  // A question (not a problem report) ignores a file.
  {
    const form = pf({ topic: "question", name: "Q File", email: mail(`${brand}-q`), message: "Question" });
    form.append("attachment", new File([JPG], "x.jpg", { type: "image/jpeg" }));
    const s = await core.handleConsumer(form, {}, ip);
    check(s.status === "success" && /^ENQ-/.test(s.reference ?? ""), `${brand} file: a question with a file is a plain lead, the file ignored`, s);
  }

  // Without the secret: the file is refused with a clear message, and without a file the complaint still goes.
  {
    delete process.env.CHAT_INTAKE_SECRET;
    const form = pf({ topic: "problem", name: "No Secret", email: mail(`${brand}-nos`), message: "x" });
    form.append("attachment", new File([JPG], "x.jpg", { type: "image/jpeg" }));
    const s = await core.handleConsumer(form, {}, ip);
    check(s.status === "error" && s.fieldErrors?.attachment === "Adding a file is not available right now. Please send the form without it.", `${brand} file: without the secret, adding a file says it is not available`, s);
    const plain = await core.handleConsumer(pf({ topic: "problem", name: "No Secret", email: mail(`${brand}-nos2`), message: "x" }), {}, ip);
    check(plain.status === "success", `${brand} file: without the secret a complaint without a file still goes`, plain);
  }
}

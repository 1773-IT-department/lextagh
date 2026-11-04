// Careers open roles and job applications with CV upload (item 21), against the local harness database.
// Run with: bash supabase/tests/local/recruitment/run.sh
//
// Loads the real site code (apps/lexta/lib/forms/careers.ts behind the application server action, and
// apps/lexta/components/careers/live.ts behind the Careers page) and the helpers in packages/db, points them at
// rpc_shim.mjs, which runs the upload ticket and intake functions and the open roles read as anon and stands in for
// Supabase Storage (bucket size and type limits, the real storage policies through the storage.objects row), then
// checks the database. The shared intake secret is set in the database and in RECRUITMENT_INTAKE_SECRET, as on
// Vercel after the one time set up.
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { register } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const storageDir = mkdtempSync(path.join(os.tmpdir(), "lexta-cv-test-"));
process.env.SHIM_STORAGE_DIR = storageDir;
const { psql, startShim } = await import("../forms/rpc_shim.mjs");
register(new URL("../forms/ts-hook.mjs", import.meta.url));

let failures = 0;
const pass = (msg) => console.log(`  PASS: ${msg}`);
const fail = (msg, detail) => {
  failures += 1;
  console.log(`  FAIL: ${msg}`);
  if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 600)}`);
};
const check = (ok, msg, detail) => (ok ? pass(msg) : fail(msg, detail));

async function q(sql) {
  const r = await psql(sql);
  if (r.code !== 0) throw new Error(`query failed: ${r.err}`);
  return r.out;
}

const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(2000, 32), Buffer.from("\n%%EOF\n")]);
const DOCX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(3000, 1)]);
const DOC = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(1000, 2)]);
const file = (bytes, name, type = "application/pdf") => new File([bytes], name, { type });

function fd(fields) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) v.forEach((x) => f.append(k, x));
    else f.append(k, v);
  }
  return f;
}

const SECRET = "harness-intake-secret-0123456789abcdef";
const stamp = Date.now().toString(36);
// Each call comes from its own address unless a test says otherwise (the upload limits count per address).
let ips = 0;
const nextIp = () => `10.0.${Math.floor((ips += 1) / 250)}.${ips % 250}`;
const apply = (form, ip = nextIp()) => careers.handleApplication(form, { ip });
const mail = (who) => `${who}.${stamp}@example.com`;
// Each applicant gets their own phone number (the daily limit also counts by phone).
let phones = 0;
const base = (who, extra = {}) => ({ name: `Test ${who}`, email: mail(who), phone: `+233 24 555 ${String(1000 + (phones += 1))}`, interest: "Quality assurance",
  message: "I would like to join.", consent: "yes", website: "", opening: "", ...extra });
const objects = () => q("select count(*) from storage.objects where bucket_id = 'job-cvs'");
const apps = () => q("select count(*) from public.job_applications");

const server = await startShim(0);
const shimUrl = `http://127.0.0.1:${server.address().port}`;

const warnings = [];
console.warn = (...args) => warnings.push(args.join(" "));

// No settings: the site shows no roles and the form says where to write instead.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const careers = await import("../../../../apps/lexta/lib/forms/careers.ts");
const live = await import("../../../../apps/lexta/components/careers/live.ts");
const db = await import("../../../../packages/db/src/index.ts");

try {
  {
    const jobs = await live.getCareersJobs();
    check(Array.isArray(jobs) && jobs.length === 0 && warnings.some((w) => w.includes("[careers] showing no open roles")),
      "no settings: Careers shows no roles (not the old samples) and logs a warning");
    const s = await apply(fd({ ...base("noconfig"), cv: file(PDF, "cv.pdf") }));
    check(s.status === "error" && s.message === "This form is not available right now, please email support@lextagh.com",
      "no settings: the form says it is not available and gives support@lextagh.com", s);
    check(s.values?.email === mail("noconfig"), "typed values are kept on that error");
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = shimUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_local_harness";
  {
    // Supabase set, but no intake secret on the site: still not available.
    const s = await apply(fd({ ...base("nosecret"), cv: file(PDF, "cv.pdf") }));
    check(s.status === "error" && s.message?.startsWith("This form is not available"), "no RECRUITMENT_INTAKE_SECRET: the form says it is not available", s);
    // Secret on the site but not yet in the database: the database refuses tickets, the visitor gets the same answer.
    process.env.RECRUITMENT_INTAKE_SECRET = SECRET;
    const t = await apply(fd({ ...base("nodbsecret"), cv: file(PDF, "cv.pdf") }));
    check(t.status === "error" && t.message?.startsWith("This form is not available") && (await objects()) === "0",
      "secret not yet set in the database: not available, nothing uploaded", t);
    await q(`insert into private.recruitment_intake_secret (secret) values ('${SECRET}')`);
  }

  // ---------- Open roles ----------
  {
    const jobs = await db.getOpenJobs();
    check(jobs.length === 0, "with only the seeded drafts, no roles are open", jobs.map((j) => j.reference));
    await q(`update public.job_openings set status = 'open', opens_at = public.ghana_today() - 2, closes_at = public.ghana_today() + 30
               where reference = 'LX-QA-051';
             update public.job_openings set status = 'open', opens_at = public.ghana_today() - 1, closes_at = null, urgent = true
               where reference = 'LX-PRD-114';
             insert into public.job_openings (reference, title, department, location, employment_type, level, summary, status, opens_at, closes_at)
               values ('LX-TST-901', 'Closed Test Role', 'Sales', 'Accra', 'contract', 'Senior', 'Closed', 'closed', public.ghana_today() - 5, null);`);
    const open = await db.getOpenJobs();
    check(open.map((j) => j.reference).join(",") === "LX-PRD-114,LX-QA-051", "only open roles come back, in HR's order", open.map((j) => j.reference));
    const qa = open.find((j) => j.reference === "LX-QA-051");
    check(qa?.title === "Quality Assurance Officer" && qa.department === "Quality" && qa.employmentTypeLabel === "Full time"
      && qa.duties.length === 4 && qa.requirements.length === 4 && qa.closesAt !== null && !("created_by" in qa),
      "a role carries its public fields only, with the type label", qa);
    const shown = await live.getCareersJobs();
    const prd = shown.find((j) => j.reference === "LX-PRD-114");
    check(prd?.urgent === true && prd.closes === "" && /^\d{1,2} [A-Z][a-z]+ \d{4}$/.test(prd.posted),
      "the Careers page gets the posted date in words and no closing date for an open ended role", prd);
  }

  // ---------- Applications through the server code ----------
  const before = Number(await objects());
  {
    // Without JavaScript: the CV comes in the form post and the server uploads it.
    const s = await apply(fd({ ...base("ama"), opening: "LX-QA-051", interest: "", cv: file(PDF, "Ama Mensah CV (2026).pdf") }));
    check(s.status === "success" && /^LX-APP-\d{4}-\d{4,}$/.test(s.reference ?? "") && s.message?.includes(s.reference ?? "?"),
      `role application (CV in the form post) gets an LX-APP reference (${s.reference})`, s);
    const row = await q(`select opening_reference_snapshot || '|' || cv_path || '|' || cv_file_name || '|' || cv_size_bytes || '|' || cv_mime_type || '|' || consent_keep || '|' || stage
      from public.job_applications where reference = '${s.reference}'`);
    const [ref, cvPath, cvName, size, type, consent, stage] = row.split("|");
    check(ref === "LX-QA-051" && consent === "true" && stage === "new", "saved for the role, consent kept, stage new", row);
    check(/^incoming\/[0-9a-f-]{36}\/Ama-Mensah-CV-2026\.pdf$/.test(cvPath) && cvName === "Ama Mensah CV (2026).pdf"
      && Number(size) === PDF.length && type === "application/pdf", "the CV is claimed with its size and type from Storage and the original name", row);
    check(existsSync(path.join(storageDir, "job-cvs", ...cvPath.split("/"))) && readFileSync(path.join(storageDir, "job-cvs", ...cvPath.split("/"))).equals(PDF),
      "the file bytes are in the bucket");
  }
  {
    // A Word file the browser labelled application/octet-stream: stored with the Word type from its extension.
    const s = await apply(fd({ ...base("kofi"), cv: file(DOCX, "kofi.docx", "application/octet-stream") }));
    check(s.status === "success", "general application with a DOCX succeeds", s);
    const row = await q(`select coalesce(opening_id::text, 'none') || '|' || interest || '|' || cv_mime_type from public.job_applications where reference = '${s.reference}'`);
    check(row === "none|Quality assurance|application/vnd.openxmlformats-officedocument.wordprocessingml.document", "saved as a general application with the area of interest and the DOCX type", row);
  }
  {
    // Uploads need a ticket the server signed: the publishable key alone cannot write to the bucket.
    const direct = await fetch(`${shimUrl}/storage/v1/object/job-cvs/${db.jobCvUploadPath("Esi CV.pdf")}`, {
      method: "POST", headers: { apikey: "sb_publishable_local_harness", authorization: "Bearer sb_publishable_local_harness", "content-type": "application/pdf" }, body: PDF,
    });
    check(direct.status === 400 && (await direct.json()).statusCode === "403", "a browser cannot upload a CV without a ticket", direct.status);
    // A forged signature (wrong secret) and a stale one (10 minutes old) are refused and upload nothing.
    const objs = await objects();
    const forged = await db.uploadJobCv(careers.signTicketRequest("not-the-real-secret-but-long-enough-0000", "10.9.9.9", "cv.pdf"), PDF, "application/pdf");
    const stale = await db.uploadJobCv(careers.signTicketRequest(SECRET, "10.9.9.9", "cv.pdf", Date.now() - 10 * 60 * 1000), PDF, "application/pdf");
    check(!forged.ok && !stale.ok && (await objects()) === objs, "forged and stale ticket requests are refused, nothing uploaded", { forged, stale });
    // A ticket is used once: the same signed request cannot upload again, nor can its path take a second file.
    const req = careers.signTicketRequest(SECRET, "10.9.9.10", "Esi CV.doc");
    const first = await db.uploadJobCv(req, DOC, "application/msword");
    const again = await db.uploadJobCv(req, DOC, "application/msword");
    const second = first.ok ? await fetch(`${shimUrl}/storage/v1/object/job-cvs/${first.path}`, {
      method: "POST", headers: { apikey: "k", authorization: "Bearer sb_publishable_local_harness", "content-type": "application/msword" }, body: DOC,
    }) : null;
    check(first.ok && !again.ok && second?.status === 400, "a ticket allows one upload, once", { first, again, second: second?.status });
    const s = await apply(fd({ ...base("esi"), opening: "LX-PRD-114", cv_path: first.ok ? first.path : "", cv_name: "Esi CV.doc" }));
    check(s.status === "success", "an application claims that upload", s);
    const reuse = await apply(fd({ ...base("esi2"), cv_path: first.ok ? first.path : "", cv_name: "Esi CV.doc" }));
    check(reuse.status === "error" && reuse.fieldErrors?.cv && !reuse.values?.cv_path, "a CV already claimed cannot be claimed again", reuse);
  }
  {
    // A dangerous file name is cleaned for the path and for the name staff see.
    const s = await apply(fd({ ...base("names"), cv: file(PDF, '../../<script>alert("x")</script> CV;rm -rf.pdf') }));
    const row = s.reference ? await q(`select cv_path || '|' || cv_file_name from public.job_applications where reference = '${s.reference}'`) : "";
    const [p, n] = row.split("|");
    check(s.status === "success" && /^incoming\/[0-9a-f-]{36}\/[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/.test(p ?? "") && /^[A-Za-z0-9 ._()-]+\.pdf$/.test(n ?? "")
      && !(n ?? "").includes("..") && !(n ?? "").includes("/"), `dangerous file names are cleaned (${row})`, s);
  }
  {
    // Without JavaScript a role application still sends the area of interest select: it is not stored.
    const s = await apply(fd({ ...base("nojsrole"), opening: "", opening_choice: "LX-QA-051", interest: "Sales and distribution", cv: file(PDF, "r.pdf") }));
    const row = s.reference ? await q(`select opening_reference_snapshot || '|' || coalesce(interest, 'none') from public.job_applications where reference = '${s.reference}'`) : "";
    check(s.status === "success" && row === "LX-QA-051|none", "a no JavaScript role application stores no area of interest", { s, row });
  }
  {
    // Many uploads nobody claimed (bots, people who gave up) do not block anyone.
    await q(`insert into public.job_cv_upload_tickets (id, object_name, ip_hash, upload_by)
               select u, 'incoming/' || u || '/junk.pdf', md5(u::text) || md5(u::text), now() from (select gen_random_uuid() u from generate_series(1, 300)) x;
             insert into storage.objects (bucket_id, name, metadata)
               select 'job-cvs', object_name, '{"size": 1000, "mimetype": "application/pdf"}' from public.job_cv_upload_tickets where object_name like '%/junk.pdf';`);
    const s = await apply(fd({ ...base("crowded"), cv: file(PDF, "crowded.pdf") }));
    check(s.status === "success", "300 unclaimed uploads by others do not block a real applicant", s);
    await q(`delete from storage.objects where name like '%/junk.pdf'; delete from public.job_cv_upload_tickets where object_name like '%/junk.pdf';`);
  }
  {
    // Per address: 5 uploads an hour.
    const ip = "203.0.113.50";
    const results = [];
    for (let i = 0; i < 6; i += 1) results.push(await apply(fd({ ...base(`ip${i}`), cv: file(PDF, `ip${i}.pdf`) }), ip));
    check(results.slice(0, 5).every((r) => r.status === "success") && results[5].status === "error" && results[5].message === careers.MSG_UPLOAD_RATE_LIMITED
      && results[5].values?.email === mail("ip5"), "5 CV uploads an hour from one address; the 6th is turned away politely", results.map((r) => r.message));
    const other = await apply(fd({ ...base("otherip"), cv: file(PDF, "o.pdf") }), "203.0.113.51");
    check(other.status === "success", "another address is not affected", other);
  }
  {
    // IPv6: one /64 network counts as one visitor; the next /64 is someone else.
    const results = [];
    for (let i = 0; i < 6; i += 1) results.push(await apply(fd({ ...base(`v6n${i}`), cv: file(PDF, `v6n${i}.pdf`) }), `2001:db8:abcd:12:${i + 1}::${i + 7}`));
    check(results.slice(0, 5).every((r) => r.status === "success") && results[5].message === careers.MSG_UPLOAD_RATE_LIMITED,
      "IPv6 addresses in one /64 share the 5 an hour limit", results.map((r) => r.message));
    const next64 = await apply(fd({ ...base("v6other"), cv: file(PDF, "v6o.pdf") }), "2001:db8:abcd:13::1");
    check(next64.status === "success", "the next /64 is not affected", next64);
    check(careers.visitorKey("::ffff:203.0.113.9") === "v4:203.0.113.9" && careers.visitorKey("[2001:db8::1]:443") === "v6:2001:0db8:0000:0000::/64",
      "IPv4 written as IPv6 counts as IPv4; brackets and ports are ignored");
  }
  {
    // No usable address: no upload, a friendly message, never a shared "unknown" limit.
    const objs = await objects();
    const results = [];
    for (const ip of ["", "unknown", "999.1.1.1"]) results.push(await apply(fd({ ...base(`noip${results.length}`), cv: file(PDF, "n.pdf") }), ip));
    check(results.every((r) => r.status === "error" && r.message === careers.msgGeneric("support@lextagh.com") && r.values?.email)
      && (await objects()) === objs, "without a visitor address the CV is not uploaded and the visitor gets the friendly fallback", results.map((r) => r.message));
  }
  {
    // No JavaScript role list: an empty choice is a general application even if the hidden field had a role.
    const s = await apply(fd({ ...base("yaw"), opening: "LX-QA-051", opening_choice: "", cv: file(PDF, "yaw.pdf") }));
    const row = s.reference ? await q(`select coalesce(opening_id::text, 'none') from public.job_applications where reference = '${s.reference}'`) : "";
    check(s.status === "success" && row === "none", "without JavaScript the role list decides (empty: general application)", s);
  }

  // ---------- Refusals ----------
  {
    const appsBefore = await apps();
    const objsBefore = await objects();
    const trap = await apply(fd({ ...base("bot"), website: "http://spam.example", cv: file(PDF, "bot.pdf") }));
    check(trap.status === "success" && /^LX-APP-\d{4}-\d{4}$/.test(trap.reference ?? ""), "honeypot: a thank you with a real looking reference", trap);
    check((await apps()) === appsBefore && (await objects()) === objsBefore, "honeypot: nothing saved and nothing uploaded");

    const cases = [
      [{ ...base("nocv") }, "cv", "Please attach your CV"],
      [{ ...base("txt"), cv: file(Buffer.from("hello"), "cv.txt", "text/plain") }, "cv", "PDF or Word"],
      [{ ...base("fake"), cv: file(Buffer.from("<html>not a pdf</html>"), "cv.pdf") }, "cv", "does not look like"],
      [{ ...base("big"), cv: file(Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(4 * 1024 * 1024 - 4)]), "big.pdf") }, "cv", "4 MB or smaller"],
      [{ ...base("htmlpdf"), cv: file(Buffer.from("<!doctype html><script>alert(1)</script>"), "cv.pdf", "application/pdf") }, "cv", "does not look like"],
      [{ ...base("fakedocx"), cv: file(Buffer.from("MZ not a zip at all"), "cv.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document") }, "cv", "does not look like"],
      [{ ...base("noconsent"), consent: "", cv: file(PDF, "a.pdf") }, "consent", "tick the box"],
      [{ ...base("bademail"), email: "not-an-email", cv: file(PDF, "a.pdf") }, "email", "valid email"],
      [{ ...base("noname"), name: " ", cv: file(PDF, "a.pdf") }, "name", "your name"],
      [{ ...base("nointerest"), interest: "", cv: file(PDF, "a.pdf") }, "interest", "area"],
      [{ ...base("badpath"), cv_path: "elsewhere/x.pdf", cv_name: "x.pdf" }, "cv", "Please attach your CV"],
    ];
    for (const [fields, field, words] of cases) {
      const s = await apply(fd(fields));
      check(s.status === "error" && s.fieldErrors?.[field]?.includes(words) && s.message === "Please check the highlighted fields.",
        `refused with a message on ${field}: ${fields.email}`, s);
    }
    check((await apps()) === appsBefore && (await objects()) === objsBefore, "refused forms saved and uploaded nothing");

    // A role that is not open: the uploaded CV is kept for a general application instead.
    const s = await apply(fd({ ...base("closed"), opening: "LX-TST-901", interest: "", cv: file(PDF, "closed.pdf") }));
    check(s.status === "error" && s.message === careers.MSG_ROLE_CLOSED && s.fieldErrors?.opening && /^incoming\//.test(s.values?.cv_path ?? ""),
      "a closed role is refused with a clear message, keeping the uploaded CV", s);
    const retry = await apply(fd({ ...base("closed"), cv_path: s.values?.cv_path ?? "", cv_name: s.values?.cv_name ?? "" }));
    check(retry.status === "success", "switching to a general application reuses that CV", retry);
    const draft = await apply(fd({ ...base("draft"), opening: "LX-SLS-207", cv: file(PDF, "d.pdf") }));
    check(draft.status === "error" && draft.fieldErrors?.opening, "a draft role is refused", draft);
  }
  {
    // Three a day per email.
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push(await apply(fd({ ...base("busy"), cv: file(PDF, `b${i}.pdf`) })));
    check(results.slice(0, 3).every((r) => r.status === "success") && results[3].status === "error"
      && results[3].message === careers.MSG_APPLICATION_RATE_LIMITED && results[3].values?.email === mail("busy"),
      "three applications a day per email; the fourth is turned away politely and keeps what was typed", results.map((r) => r.message));
  }

  // ---------- Storage refuses what the bucket and policies do not allow ----------
  {
    const put = (name, bytes, type) => fetch(`${shimUrl}/storage/v1/object/job-cvs/${name}`, {
      method: "POST", headers: { apikey: "k", authorization: "Bearer sb_publishable_local_harness", "content-type": type }, body: bytes,
    });
    const html = await put(db.jobCvUploadPath("x.pdf"), Buffer.from("<script>"), "text/html");
    check(html.status === 400 && (await html.json()).statusCode === "415", "the bucket refuses an HTML upload", html.status);
    const big = await put(db.jobCvUploadPath("x.pdf"), Buffer.alloc(4 * 1024 * 1024 + 1), "application/pdf");
    check(big.status === 413, "the bucket refuses a file over 4 MB", big.status);
    const outside = await put(`cvs/${crypto.randomUUID()}/x.pdf`, PDF, "application/pdf");
    check(outside.status === 400 && (await outside.json()).statusCode === "403", "visitors cannot upload outside incoming/", outside.status);
    const p = await q("select cv_path from public.job_applications where cv_path is not null limit 1");
    const sign = await fetch(`${shimUrl}/storage/v1/object/sign/job-cvs/${p}`, {
      method: "POST", headers: { apikey: "k", authorization: "Bearer sb_publishable_local_harness", "content-type": "application/json" }, body: JSON.stringify({ expiresIn: 60 }),
    });
    check(sign.status === 400, "visitors cannot make a link to read a CV, not even their own", sign.status);
    const del = await fetch(`${shimUrl}/storage/v1/object/job-cvs`, {
      method: "DELETE", headers: { apikey: "k", authorization: "Bearer sb_publishable_local_harness", "content-type": "application/json" }, body: JSON.stringify({ prefixes: [p] }),
    });
    check(del.ok && (await del.json()).length === 0, "visitors cannot remove CVs");
    const rows = await q("select count(*) from public.job_applications where cv_path is not null and cv_path not like 'incoming/%'");
    check(rows === "0", "every claimed CV sits under incoming/");
  }

  // ---------- Database down ----------
  {
    const closed = net.createServer();
    await new Promise((r) => closed.listen(0, "127.0.0.1", r));
    const port = closed.address().port;
    await new Promise((r) => closed.close(r));
    process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
    warnings.length = 0;
    const jobs = await live.getCareersJobs();
    check(jobs.length === 0 && warnings.some((w) => w.includes("[careers] showing no open roles")), "database down: Careers shows the empty state and logs a warning");
    const s = await apply(fd({ ...base("down"), cv: file(PDF, "down.pdf") }));
    check(s.status === "error" && s.message === careers.msgGeneric("support@lextagh.com") && s.values?.email === mail("down"),
      "database down: the form says it could not send and keeps what was typed", s);
    process.env.NEXT_PUBLIC_SUPABASE_URL = shimUrl;
  }
} catch (e) {
  fail(`unexpected error: ${e instanceof Error ? e.stack : String(e)}`);
} finally {
  server.close();
  rmSync(storageDir, { recursive: true, force: true });
}

if (failures) {
  console.log(`${failures} recruitment check(s) failed`);
  process.exit(1);
}
console.log("All recruitment website checks passed");

// Careers open roles and job applications with CV upload (item 21), against the local harness database.
// Run with: bash supabase/tests/local/recruitment/run.sh
//
// Loads the real site code (apps/lexta/lib/forms/careers.ts behind the application server action, and
// apps/lexta/components/careers/live.ts behind the Careers page) and the helpers in packages/db, points them at
// rpc_shim.mjs, which runs the intake function and the open roles read as anon and stands in for Supabase Storage
// (bucket size and type limits, the real storage policies through the storage.objects row), then checks the database.
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

const stamp = Date.now().toString(36);
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
    const s = await careers.handleApplication(fd({ ...base("noconfig"), cv: file(PDF, "cv.pdf") }));
    check(s.status === "error" && s.message === "This form is not available right now, please email support@lextagh.com",
      "no settings: the form says it is not available and gives support@lextagh.com", s);
    check(s.values?.email === mail("noconfig"), "typed values are kept on that error");
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = shimUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_local_harness";

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
    const s = await careers.handleApplication(fd({ ...base("ama"), opening: "LX-QA-051", interest: "", cv: file(PDF, "Ama Mensah CV (2026).pdf") }));
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
    const s = await careers.handleApplication(fd({ ...base("kofi"), cv: file(DOCX, "kofi.docx", "application/octet-stream") }));
    check(s.status === "success", "general application with a DOCX succeeds", s);
    const row = await q(`select coalesce(opening_id::text, 'none') || '|' || interest || '|' || cv_mime_type from public.job_applications where reference = '${s.reference}'`);
    check(row === "none|Quality assurance|application/vnd.openxmlformats-officedocument.wordprocessingml.document", "saved as a general application with the area of interest and the DOCX type", row);
  }
  {
    // With JavaScript: the browser uploads straight to Storage, then posts cv_path and cv_name.
    const cvPath = db.jobCvUploadPath("Esi CV.doc");
    const up = await fetch(`${shimUrl}/storage/v1/object/job-cvs/${cvPath}`, {
      method: "POST", headers: { apikey: "sb_publishable_local_harness", authorization: "Bearer sb_publishable_local_harness", "content-type": "application/msword", "x-upsert": "false" }, body: DOC,
    });
    check(up.ok, "the browser can upload a CV into incoming/ with the publishable key", up.status);
    const s = await careers.handleApplication(fd({ ...base("esi"), opening: "LX-PRD-114", cv_path: cvPath, cv_name: "Esi CV.doc" }));
    check(s.status === "success", "an application with a CV uploaded by the browser succeeds", s);
    const row = await q(`select cv_path || '|' || cv_mime_type || '|' || opening_reference_snapshot from public.job_applications where reference = '${s.reference}'`);
    check(row === `${cvPath}|application/msword|LX-PRD-114`, "that upload is claimed by the application", row);
    const again = await careers.handleApplication(fd({ ...base("esi2"), cv_path: cvPath, cv_name: "Esi CV.doc" }));
    check(again.status === "error" && again.fieldErrors?.cv && !again.values?.cv_path, "a CV already claimed cannot be claimed again", again);
  }
  {
    // No JavaScript role list: an empty choice is a general application even if the hidden field had a role.
    const s = await careers.handleApplication(fd({ ...base("yaw"), opening: "LX-QA-051", opening_choice: "", cv: file(PDF, "yaw.pdf") }));
    const row = s.reference ? await q(`select coalesce(opening_id::text, 'none') from public.job_applications where reference = '${s.reference}'`) : "";
    check(s.status === "success" && row === "none", "without JavaScript the role list decides (empty: general application)", s);
  }

  // ---------- Refusals ----------
  {
    const appsBefore = await apps();
    const objsBefore = await objects();
    const trap = await careers.handleApplication(fd({ ...base("bot"), website: "http://spam.example", cv: file(PDF, "bot.pdf") }));
    check(trap.status === "success" && /^LX-APP-\d{4}-\d{4}$/.test(trap.reference ?? ""), "honeypot: a thank you with a real looking reference", trap);
    check((await apps()) === appsBefore && (await objects()) === objsBefore, "honeypot: nothing saved and nothing uploaded");

    const cases = [
      [{ ...base("nocv") }, "cv", "Please attach your CV"],
      [{ ...base("txt"), cv: file(Buffer.from("hello"), "cv.txt", "text/plain") }, "cv", "PDF or Word"],
      [{ ...base("fake"), cv: file(Buffer.from("<html>not a pdf</html>"), "cv.pdf") }, "cv", "does not look like"],
      [{ ...base("big"), cv: file(Buffer.concat([Buffer.from("%PDF"), Buffer.alloc(5 * 1024 * 1024 - 3)]), "big.pdf") }, "cv", "5 MB or smaller"],
      [{ ...base("noconsent"), consent: "", cv: file(PDF, "a.pdf") }, "consent", "tick the box"],
      [{ ...base("bademail"), email: "not-an-email", cv: file(PDF, "a.pdf") }, "email", "valid email"],
      [{ ...base("noname"), name: " ", cv: file(PDF, "a.pdf") }, "name", "your name"],
      [{ ...base("nointerest"), interest: "", cv: file(PDF, "a.pdf") }, "interest", "area"],
      [{ ...base("badpath"), cv_path: "elsewhere/x.pdf", cv_name: "x.pdf" }, "cv", "Please attach your CV"],
    ];
    for (const [fields, field, words] of cases) {
      const s = await careers.handleApplication(fd(fields));
      check(s.status === "error" && s.fieldErrors?.[field]?.includes(words) && s.message === "Please check the highlighted fields.",
        `refused with a message on ${field}: ${fields.email}`, s);
    }
    check((await apps()) === appsBefore && (await objects()) === objsBefore, "refused forms saved and uploaded nothing");

    // A role that is not open: the uploaded CV is kept for a general application instead.
    const s = await careers.handleApplication(fd({ ...base("closed"), opening: "LX-TST-901", interest: "", cv: file(PDF, "closed.pdf") }));
    check(s.status === "error" && s.message === careers.MSG_ROLE_CLOSED && s.fieldErrors?.opening && /^incoming\//.test(s.values?.cv_path ?? ""),
      "a closed role is refused with a clear message, keeping the uploaded CV", s);
    const retry = await careers.handleApplication(fd({ ...base("closed"), cv_path: s.values?.cv_path ?? "", cv_name: s.values?.cv_name ?? "" }));
    check(retry.status === "success", "switching to a general application reuses that CV", retry);
    const draft = await careers.handleApplication(fd({ ...base("draft"), opening: "LX-SLS-207", cv: file(PDF, "d.pdf") }));
    check(draft.status === "error" && draft.fieldErrors?.opening, "a draft role is refused", draft);
  }
  {
    // Three a day per email.
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push(await careers.handleApplication(fd({ ...base("busy"), cv: file(PDF, `b${i}.pdf`) })));
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
    const big = await put(db.jobCvUploadPath("x.pdf"), Buffer.alloc(5 * 1024 * 1024 + 1), "application/pdf");
    check(big.status === 413, "the bucket refuses a file over 5 MB", big.status);
    const outside = await put(`cvs/${crypto.randomUUID()}/x.pdf`, PDF, "application/pdf");
    check(outside.status === 400 && (await outside.json()).statusCode === "403", "visitors cannot upload outside incoming/", outside.status);
    const p = db.jobCvUploadPath("x.pdf");
    await put(p, PDF, "application/pdf");
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
    const s = await careers.handleApplication(fd({ ...base("down"), cv: file(PDF, "down.pdf") }));
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

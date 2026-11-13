// Website forms (item 19) against the local harness database, through the site's own server code.
// Run with: bash supabase/tests/local/forms/run.sh
//
// Loads apps/lexta/lib/forms/core.ts (the code behind the server actions), points it at rpc_shim.mjs, which runs the
// real intake functions as anon, then checks what landed in the CRM and the complaints tracker.
import { register } from "node:module";
import { psql, startShim } from "./rpc_shim.mjs";

register(new URL("./ts-hook.mjs", import.meta.url));

let failures = 0;
const pass = (msg) => console.log(`  PASS: ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  FAIL: ${msg}`);
};
const check = (ok, msg) => (ok ? pass(msg) : fail(msg));

async function q(sql) {
  const r = await psql(sql);
  if (r.code !== 0) throw new Error(`query failed: ${r.err}`);
  return r.out;
}

function fd(fields) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}

const counts = () =>
  q(`select concat_ws(',', (select count(*) from public.crm_leads), (select count(*) from public.crm_contacts),
       (select count(*) from public.crm_organisations), (select count(*) from public.complaints),
       (select count(*) from public.crm_intake_log))`);

const server = await startShim(0);
const port = server.address().port;

// No settings: the forms explain how to reach Lexta instead of failing.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const core = await import("../../../../apps/lexta/lib/forms/core.ts");

const stamp = Date.now().toString(36);
const mail = (who) => `${who}.${stamp}@example.com`;

try {
  {
    const s = await core.handleNewsletter(fd({ email: mail("noconfig"), consent: "yes", website: "" }));
    check(s.status === "error" && s.message === "This form is not available right now, please email marketing@lextagh.com", "missing settings: newsletter says email marketing@lextagh.com");
    check(s.values?.email === mail("noconfig"), "typed values are kept on that error");
    const p = await core.handlePartner(fd({ route: "Retail", contact_name: "A", business_name: "B", email: mail("noconfig") }));
    check(p.message === "This form is not available right now, please email marketing@lextagh.com", "missing settings: partner says email marketing@lextagh.com");
    const expected = { "General enquiry": "marketing", Distribution: "marketing", "Bulk orders": "marketing", "Consumer care": "support", Media: "marketing", Careers: "hr" };
    for (const [reason, box] of Object.entries(expected)) {
      const c = await core.handleContact(fd({ reason, name: "A", email: mail("noconfig"), region: "Volta", message: "Hi" }));
      check(c.message === `This form is not available right now, please email ${box}@lextagh.com`, `missing settings: contact reason ${reason} says email ${box}@lextagh.com`);
    }
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_local_harness";

  // Contact Us, General enquiry: CRM lead + contact (+ organisation from "Company or organisation").
  {
    const email = mail("ama");
    const s = await core.handleContact(fd({
      reason: "General enquiry", name: "  Ama Mensah ", email, phone: "", detail: "Mensah Traders " + stamp,
      region: "Greater Accra", message: "Do you sell in Kumasi?", website: "",
    }));
    check(s.status === "success" && /^ENQ-[0-9A-F]{10}$/.test(s.reference ?? ""), `contact form returns an ENQ reference (${s.reference})`);
    check(s.message?.includes(s.reference ?? "?") && Object.keys(s.values ?? {}).length === 0, "success message shows the reference and the form clears");
    const row = await q(`select l.source || '|' || l.stage || '|' || l.title || '|' || coalesce(l.submitted_organisation_name, '') || '|' ||
        c.full_name || '|' || c.email || '|' || replace(l.description, E'\\n', '~') || '|' || b.slug
      from public.crm_leads l join public.crm_contacts c on c.id = l.contact_id join public.brands b on b.id = l.brand_id
      where l.intake_reference = '${s.reference}'`);
    const [source, stage, title, org, name, cEmail, desc, brand] = row.split("|");
    check(source === "website_contact_form" && stage === "new", "lead saved with source website_contact_form, stage new");
    check(name === "Ama Mensah" && cEmail === email && title === "Website enquiry from Ama Mensah", "contact saved with the trimmed name and email");
    check(org === "Mensah Traders " + stamp, "company name kept on the lead as the submitted organisation");
    check(desc.includes("Reason: General enquiry") && desc.includes("Region: Greater Accra") && desc.includes("Do you sell in Kumasi?"), "reason, region and message are on the lead");
    check(brand === "lexta", "lead carries the lexta brand");
    const orgs = await q(`select count(*) from public.crm_organisations where name = 'Mensah Traders ${stamp}' and kind = 'other'`);
    check(orgs === "1", "new organisation created for the company name");
  }

  // Contact Us, Bulk orders: the extra field goes to the lead as Detail.
  {
    const s = await core.handleContact(fd({
      reason: "Bulk orders", name: "Kojo Hotel", phone: "+233 24 555 0101", detail: "500 cartons Softcare 2-ply",
      region: "Outside Ghana", message: "Monthly delivery to Monrovia.", website: "",
    }));
    check(s.status === "success", `bulk order by phone only is accepted (${s.reference})`);
    const desc = await q(`select description from public.crm_leads where intake_reference = '${s.reference}'`);
    check(desc.includes("Reason: Bulk orders") && desc.includes("Detail: 500 cartons Softcare 2-ply") && desc.includes("Region: Outside Ghana"), "bulk order detail and Outside Ghana region saved");
  }

  // Contact Us, Consumer care: a complaint with an LX case number.
  {
    const email = mail("esi");
    const s = await core.handleContact(fd({
      reason: "Consumer care", name: "Esi Owusu", email, phone: "0241234567", detail: "Yazz Ultra, batch 2026-04-18",
      region: "Ashanti", message: "The pack was torn when I opened it.", website: "",
    }));
    check(s.status === "success" && /^LX-\d{4}-\d{4,}$/.test(s.reference ?? ""), `consumer care returns an LX case number (${s.reference})`);
    check(s.message === `Thank you. Your case number is ${s.reference}; our consumer care team will contact you.`, "complaint thank you names the case number");
    const row = await q(`select k.channel || '|' || k.status || '|' || k.category || '|' || b.slug || '|' || c.email || '|' || replace(k.description, E'\\n', '~') || '|' || coalesce(k.batch_number, '')
      from public.complaints k join public.crm_contacts c on c.id = k.contact_id join public.brands b on b.id = k.brand_id
      where k.case_number = '${s.reference}'`);
    const [channel, status, category, brand, cEmail, desc, batch] = row.split("|");
    check(batch === "2026-04-18", `batch code saved in the complaint's batch number (${batch})`);
    check(channel === "website" && status === "new" && category === "other" && brand === "lexta", "complaint saved: channel website, status new, category other, brand lexta");
    check(cEmail === email, "complaint linked to the visitor's contact");
    check(desc === "Product and batch code: Yazz Ultra, batch 2026-04-18~Region: Ashanti~~The pack was torn when I opened it.", "product, batch and region are at the top of the complaint text");
    const leads = await q(`select count(*) from public.crm_leads l join public.crm_contacts c on c.id = l.contact_id where c.email = '${email}'`);
    check(leads === "0", "consumer care does not also create a CRM lead");
  }

  // Partner With Us: lead + contact + organisation, route Suppliers as partner_type supplier.
  {
    const biz = "Volta Cassava Co " + stamp;
    const s = await core.handlePartner(fd({
      route: "Suppliers", contact_name: "Yaw Boateng", business_name: biz, email: mail("yaw"), phone: "",
      trading_location: "Ho, Volta", years_trading: "6", message: "We supply starch.", website: "",
    }));
    check(s.status === "success" && /^PTN-[0-9A-F]{10}$/.test(s.reference ?? ""), `partner form returns a PTN reference (${s.reference})`);
    const row = await q(`select l.source || '|' || l.title || '|' || replace(l.description, E'\\n', '~') || '|' || o.kind || '|' || coalesce(o.town, '')
      from public.crm_leads l join public.crm_organisations o on o.id = l.organisation_id where l.intake_reference = '${s.reference}'`);
    const [source, title, desc, kind, town] = row.split("|");
    check(source === "website_partner_form" && title === `Partner enquiry: ${biz}`, "partner lead saved with source website_partner_form");
    check(desc.includes("Partnership: Raw material supplier") && desc.includes("Trading location: Ho, Volta") && desc.includes("Years trading: 6"), "route, location and years trading are on the lead");
    check(kind === "supplier" && town === "Ho, Volta", "organisation created as a supplier in Ho, Volta");
  }
  for (const [route, type] of [["Distributor", "Distributor"], ["Retail", "Retail and trade"], ["Institutional", "Institutional and bulk"], ["Private label", "Private label and export"], ["CSR", "CSR and community"]]) {
    const s = await core.handlePartner(fd({ route, contact_name: "Route Test", business_name: `${route} Co ${stamp}`, email: mail(route.replace(" ", "")), website: "" }));
    const desc = s.status === "success" ? await q(`select description from public.crm_leads where intake_reference = '${s.reference}'`) : "";
    check(desc.includes(`Partnership: ${type}`), `partner route ${route} maps to "${type}"`);
  }

  // Newsletter: a contact with marketing consent, no lead.
  {
    const email = mail("news");
    const s = await core.handleNewsletter(fd({ email: ` ${email.toUpperCase()} `, consent: "yes", website: "" }));
    check(s.status === "success" && /^NWS-[0-9A-F]{10}$/.test(s.reference ?? ""), `newsletter returns an NWS reference (${s.reference})`);
    const row = await q(`select consent_marketing || '|' || consent_source from public.crm_contacts where email = '${email}'`);
    check(row === "true|Website newsletter (Lexta Ghana)", "newsletter contact saved with consent and its source");
    const none = await core.handleNewsletter(fd({ email: mail("noconsent"), website: "" }));
    check(none.status === "error" && none.fieldErrors?.consent, "newsletter without the consent tick is refused with an inline message");
    check((await q(`select count(*) from public.crm_contacts where email = '${mail("noconsent")}'`)) === "0", "nothing saved without consent");
  }

  // Validation before the database is called.
  {
    const before = await counts();
    const s = await core.handleContact(fd({ reason: "Media", name: "No Reply", email: "", phone: "", detail: "", region: "Volta", message: "Hi", website: "" }));
    check(s.status === "error" && s.fieldErrors?.email?.includes("email address or a phone number"), "contact without email or phone gets an inline message");
    check(s.values?.name === "No Reply" && s.values?.message === "Hi", "typed values come back on error");
    const bad = await core.handleContact(fd({ reason: "Careers", name: "X", email: "not-an-email", phone: "abc", region: "Mars", message: "", website: "" }));
    check(bad.fieldErrors?.email && bad.fieldErrors?.phone && bad.fieldErrors?.region && bad.fieldErrors?.message, "bad email, phone, region and empty message each get a field message");
    const p = await core.handlePartner(fd({ route: "Retail", contact_name: "", business_name: "", email: "a@b.co", website: "" }));
    check(p.fieldErrors?.contact_name && p.fieldErrors?.business_name, "partner form needs a contact name and business name");
    check((await counts()) === before, "invalid submissions save nothing");
  }

  // Honeypot: every form path answers like a real success, in the same reference format, and saves nothing.
  {
    const before = await counts();
    const trap = "http://spam.example";
    const huge = "x".repeat(600);
    const cases = [
      ["contact", /^ENQ-[0-9A-F]{10}$/, core.handleContact(fd({ reason: "General enquiry", name: "Bot", email: mail("bot1"), region: "Volta", message: "spam", website: trap }))],
      ["consumer care", /^LX-\d{4}-\d{4}$/, core.handleContact(fd({ reason: "Consumer care", name: "Bot", email: mail("bot2"), region: "Volta", message: "spam", website: trap }))],
      ["partner", /^PTN-[0-9A-F]{10}$/, core.handlePartner(fd({ route: "CSR", contact_name: "Bot", business_name: "Bot Ltd", email: mail("bot3"), website: trap }))],
      ["newsletter", /^NWS-[0-9A-F]{10}$/, core.handleNewsletter(fd({ email: mail("bot4"), consent: "yes", website: trap }))],
      ["contact, 600 character trap", /^ENQ-[0-9A-F]{10}$/, core.handleContact(fd({ reason: "Media", name: "Bot", email: mail("bot5"), message: "spam", website: huge }))],
      ["contact, trap and invalid fields", /^ENQ-[0-9A-F]{10}$/, core.handleContact(fd({ reason: "Careers", name: "", email: "nope", message: "", website: trap }))],
      ["partner, 600 character trap", /^PTN-[0-9A-F]{10}$/, core.handlePartner(fd({ route: "Retail", contact_name: "Bot", business_name: "Bot", email: mail("bot6"), website: huge }))],
      ["newsletter, 600 character trap", /^NWS-[0-9A-F]{10}$/, core.handleNewsletter(fd({ email: mail("bot7"), website: huge }))],
    ];
    for (const [name, format, promise] of cases) {
      const r = await promise;
      check(r.status === "success" && format.test(r.reference ?? "") && r.message?.includes(r.reference), `honeypot (${name}) gets a real looking thank you: ${r.reference}`);
    }
    check((await counts()) === before, "honeypot submissions save nothing (leads, contacts, organisations, complaints, intake log)");
  }

  // Byte size: multi byte text within the character limit but over the database's 8000 byte payload limit.
  {
    const before = await counts();
    const s = await core.handleContact(fd({ reason: "General enquiry", name: "Kofi", email: mail("euro"), region: "Volta", message: "€".repeat(2900), website: "" }));
    check(s.status === "error" && s.fieldErrors?.message === "Your message is too long, please shorten it.", "2900 euro signs (8700 bytes) get the friendly 'too long' message on the message field");
    const p = await core.handlePartner(fd({ route: "Retail", contact_name: "Kofi", business_name: "Kofi Ltd", email: mail("euro2"), message: "€".repeat(2900) }));
    check(p.fieldErrors?.message === "Your message is too long, please shorten it.", "partner form gets the same 'too long' message");
    check((await counts()) === before, "nothing saved for the oversized messages");
    const ok = await core.handleContact(fd({ reason: "General enquiry", name: "Kofi", email: mail("accents"), region: "Volta", message: "é".repeat(2500), website: "" }));
    check(ok.status === "success", `2500 accented letters (5000 bytes) still go through (${JSON.stringify(ok).slice(0, 200)})`);
  }

  // Rate limit: 5 per email per hour across the forms, then the friendly message.
  {
    const email = mail("busy");
    const statuses = [];
    for (let i = 0; i < 5; i += 1) {
      const r = i % 2
        ? await core.handleNewsletter(fd({ email, consent: "yes", website: "" }))
        : await core.handleContact(fd({ reason: "General enquiry", name: "Busy", email, region: "Central", message: `Try ${i}`, website: "" }));
      statuses.push(r.status);
    }
    check(statuses.every((x) => x === "success"), "first 5 submissions from one email go through");
    const sixth = await core.handleContact(fd({ reason: "Consumer care", name: "Busy", email, region: "Central", message: "Again", website: "" }));
    check(sixth.status === "error" && sixth.message === core.MSG_RATE_LIMITED, "6th submission in the hour (a complaint) gets 'Too many messages, please try again in an hour.'");
    check(sixth.values?.message === "Again", "typed values are kept on the rate limit error");
  }

  // Database refusing a field the site let through: mapped to the right inline message, no details leaked.
  {
    const s = await core.handleContact(fd({ reason: "General enquiry", name: "Long Org", email: mail("long"), detail: "x".repeat(150), region: "Volta", message: "Hi", website: "" }));
    check(s.status === "success", "organisation name of 150 characters accepted");
    const r = await psql(`set role anon; select public.submit_website_enquiry('contact', '{"name":"A","email":"a@b.co","message":"m","region":"atlantis"}'::jsonb);`);
    check(r.code !== 0 && /22023: invalid field: region/.test(r.err), "database itself refuses an unknown region (22023)");
  }

  // Batch code taken from the "Product and batch code" field.
  for (const [text, want] of [["Yazz Ultra, batch 2026-04-18", "2026-04-18"], ["Linzzy pads Batch no. LZ2291.", "LZ2291"], ["B45-221", "B45-221"], ["Softcare tissue", undefined]]) {
    check(core.batchCodeFrom(text) === want, `batch code from "${text}" is ${want}`);
  }

  // Unreachable database: generic message, nothing leaked.
  {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:9";
    const s = await core.handleNewsletter(fd({ email: mail("down"), consent: "yes", website: "" }));
    check(s.status === "error" && s.message === "Sorry, your message could not be sent. Please try again in a few minutes, or email marketing@lextagh.com.", "unreachable database shows the generic error");
  }
} catch (error) {
  fail(`test crashed: ${error instanceof Error ? error.stack : error}`);
} finally {
  server.close();
}

if (failures) {
  console.log(`${failures} website form check(s) failed`);
  process.exit(1);
}
console.log("All website form checks passed");

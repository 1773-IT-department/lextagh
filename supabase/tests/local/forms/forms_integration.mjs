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

// Contact Us and Partner With Us need the privacy notice tick (X4): every call sends it ticked unless the test names
// "privacy" itself (an empty string leaves it unticked).
function fd(fields) {
  const f = new FormData();
  if (!("privacy" in fields)) f.append("privacy", "yes");
  for (const [k, v] of Object.entries(fields)) if (!(k === "privacy" && v === "")) f.append(k, v);
  return f;
}

// Partner With Us: Years trading is required on every route (Desmond, 17 November 2026); pfd sends it unless named.
const pfd = (fields) => fd({ years_trading: "3", ...fields });

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
    const p = await core.handlePartner(pfd({ route: "Retail", contact_name: "A", business_name: "B", email: mail("noconfig") }));
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
    const s = await core.handlePartner(pfd({
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
    const csr = route === "CSR" ? { csr_brand: "Yazz", csr_initiative: "bright-smiles-school-tour" } : {};
    const s = await core.handlePartner(pfd({ route, contact_name: "Route Test", business_name: `${route} Co ${stamp}`, email: mail(route.replace(" ", "")), website: "", ...csr }));
    const desc = s.status === "success" ? await q(`select description from public.crm_leads where intake_reference = '${s.reference}'`) : "";
    check(desc.includes(`Partnership: ${type}`), `partner route ${route} maps to "${type}"`);
  }

  // CSR proposal (L2): brand and initiative are required on the CSR route, checked against the form's own lists, and
  // reach the lead at the top of its text.
  {
    const programmes = await import("../../../../apps/lexta/components/csr/programmes.ts");
    check(programmes.CSR_INITIATIVES[0].title === "Empowered Periods, Dignity Project" && programmes.CSR_INITIATIVES.length === programmes.programmes.length + 1,
      "CSR initiatives: the Dignity Project band plus every programme card on the CSR page");
    const hooch = programmes.programmes.filter((p) => p.tag === "Hooch").map((p) => [p.title, !!p.proposed]);
    check(JSON.stringify(hooch) === JSON.stringify([["Stay in School", false], ["UtooCan, Anyone Can Be a Hero", true], ["Achievers Corner", true]]),
      "CSR page: the three Hooch community programmes, UtooCan and Achievers Corner marked proposed");
    check(programmes.proposeHref("lexta-forest-project") === "/partner-with-us?route=CSR&initiative=lexta-forest-project#apply", "CSR cards link to the CSR route with the initiative");
    const biz = "Forest Friends " + stamp;
    const s = await core.handlePartner(pfd({ route: "CSR", contact_name: "Abena Forest", business_name: biz, email: mail("abena"), csr_brand: "Hooch", csr_initiative: "lexta-forest-project", message: "We can plant trees in Ho.", website: "" }));
    const desc = s.status === "success" ? await q(`select replace(description, E'\\n', '~') from public.crm_leads where intake_reference = '${s.reference}'`) : "";
    check(s.status === "success" && desc.includes("Partnership: CSR and community") && desc.includes("Brand: Hooch~Initiative: The Lexta Forest Project~~We can plant trees in Ho."),
      `CSR proposal lands as a lead with its brand and initiative (${desc.slice(0, 160)})`);
    const before = await counts();
    const none = await core.handlePartner(pfd({ route: "CSR", contact_name: "No Pick", business_name: "No Pick Ltd", email: mail("nopick"), website: "" }));
    check(none.status === "error" && none.fieldErrors?.csr_brand && none.fieldErrors?.csr_initiative, "CSR proposal without brand and initiative is refused on the server");
    const bad = await core.handlePartner(pfd({ route: "CSR", contact_name: "Bad Pick", business_name: "Bad Pick Ltd", email: mail("badpick"), csr_brand: "Acme", csr_initiative: "not-a-programme", website: "" }));
    check(bad.fieldErrors?.csr_brand && bad.fieldErrors?.csr_initiative, "CSR proposal with a brand or initiative not on the lists is refused");
    const trade = await core.handlePartner(pfd({ route: "Retail", contact_name: "Shop", business_name: "Shop " + stamp, email: mail("shopcsr"), csr_brand: "Hooch", csr_initiative: "lexta-forest-project", website: "" }));
    const tdesc = trade.status === "success" ? await q(`select description from public.crm_leads where intake_reference = '${trade.reference}'`) : "x";
    check(trade.status === "success" && !tdesc.includes("Initiative:"), "other routes need no brand or initiative and ignore them");
    check((await counts()) !== before && none.status === "error", "only the valid submissions were saved");
  }

  // Acknowledgement emails (P1): each form hands its acknowledgement to ctx.notify after a real submission, with the
  // routing inbox of that form; nothing for a refused form or a bot. Then the real sender with a stubbed provider.
  {
    const acks = [];
    const notify = (a) => acks.push(a);
    const c = await core.handleContact(fd({ reason: "Distribution", name: "Ack Contact", email: mail("ackc"), region: "Volta", message: "Hello", website: "" }), { notify });
    const cc = await core.handleContact(fd({ reason: "Consumer care", name: "Ack Care", email: mail("ackcc"), phone: "0244555666", detail: "batch 77", message: "Torn", website: "" }), { notify });
    const p = await core.handlePartner(pfd({ route: "Retail", contact_name: "Ack Partner", business_name: "Ack Ltd " + stamp, email: mail("ackp"), website: "" }), { notify });
    const n = await core.handleNewsletter(fd({ email: mail("ackn"), consent: "yes", website: "" }), { notify });
    await core.handleContact(fd({ reason: "Media", name: "", email: mail("ackbad"), message: "x", website: "" }), { notify });
    await core.handleNewsletter(fd({ email: mail("ackbot"), consent: "yes", website: "bot" }), { notify });
    const got = acks.map((a) => `${a.kind}|${a.reference}|${a.routeTo}|${a.email ?? ""}`);
    const want = [
      `enquiry|${c.reference}|marketing@lextagh.com|${mail("ackc")}`,
      `complaint|${cc.reference}|support@lextagh.com|${mail("ackcc")}`,
      `partner|${p.reference}|marketing@lextagh.com|${mail("ackp")}`,
      `newsletter|${n.reference}|marketing@lextagh.com|${mail("ackn")}`,
    ];
    check(JSON.stringify(got) === JSON.stringify(want), "acknowledgements: one per saved submission, with its reference and routing inbox; none for refused forms or bots", got);
    check(acks[1].phone === "0244555666" && acks[1].details.some(([l, v]) => l === "Product, batch or organisation" && v === "batch 77"), "acknowledgements: the team copy carries what was sent");

    const { acknowledge } = await import("../../../../packages/forms/src/acknowledge.ts");
    const realFetch = globalThis.fetch;
    const sent = [];
    // Off by default: no provider call at all.
    globalThis.fetch = async (url, init) => { if (String(url).startsWith("https://api.resend.com")) { sent.push(JSON.parse(init.body)); return new Response("{\"id\":\"x\"}", { status: 200 }); } return realFetch(url, init); };
    delete process.env.RESEND_API_KEY; delete process.env.MAIL_FROM;
    await acknowledge(acks[0]);
    check(sent.length === 0, "acknowledgements: off without RESEND_API_KEY and MAIL_FROM, nothing sent");
    process.env.RESEND_API_KEY = "re_harness"; process.env.MAIL_FROM = "Lexta Ghana <no-reply@mail.example.com>";
    await acknowledge(acks[1]);
    check(sent.length === 2 && sent.every((m) => m.subject === `[${cc.reference}] Lexta Ghana: your report`) && sent.some((m) => m.to[0] === "support@lextagh.com" && m.reply_to === mail("ackcc")),
      "acknowledgements: on with both set, the sender and the support inbox get the case number in the subject", sent.map((m) => [m.to, m.subject]));
    // A broken provider never reaches the form: the submission still succeeds and nothing throws.
    globalThis.fetch = async (url, init) => { if (String(url).startsWith("https://api.resend.com")) throw new TypeError("network down"); return realFetch(url, init); };
    const after = [];
    const s2 = await core.handleContact(fd({ reason: "General enquiry", name: "Ack Down", email: mail("ackdown"), region: "Volta", message: "Hi", website: "" }), { notify: (a) => after.push(acknowledge(a)) });
    let threw = false;
    try { await Promise.all(after); } catch { threw = true; }
    check(s2.status === "success" && !threw, "acknowledgements: a failed send never fails the form");
    globalThis.fetch = realFetch;
    delete process.env.RESEND_API_KEY; delete process.env.MAIL_FROM;
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
    const p = await core.handlePartner(pfd({ route: "Retail", contact_name: "", business_name: "", email: "a@b.co", website: "" }));
    check(p.fieldErrors?.contact_name && p.fieldErrors?.business_name, "partner form needs a contact name and business name");
    for (const route of ["Distributor", "Retail", "CSR"]) {
      const csr = route === "CSR" ? { csr_brand: "Yazz", csr_initiative: "bright-smiles-school-tour" } : {};
      const noYears = await core.handlePartner(pfd({ route, contact_name: "No Years", business_name: "No Years Ltd", email: mail(`noyears${route}`), years_trading: "  ", website: "", ...csr }));
      check(noYears.status === "error" && noYears.fieldErrors?.years_trading === "Please enter how many years you have been trading." && Object.keys(noYears.fieldErrors).length === 1,
        `partner form (${route}): an empty Years trading is refused with its own message`, noYears.fieldErrors);
    }
    const longYears = await core.handlePartner(pfd({ route: "Retail", contact_name: "Long Years", business_name: "Long Years Ltd", email: mail("longyears"), years_trading: "1".repeat(21), website: "" }));
    check(longYears.fieldErrors?.years_trading === "Years trading can be at most 20 characters.", "partner form: Years trading keeps its 20 character limit", longYears.fieldErrors);
    const noConsent = await core.handleContact(fd({ reason: "General enquiry", name: "No Tick", email: mail("notick"), region: "Volta", message: "Hi", privacy: "", website: "" }));
    check(noConsent.status === "error" && noConsent.fieldErrors?.privacy === "Please tick the box to agree to the privacy notice." && Object.keys(noConsent.fieldErrors).length === 1,
      "contact form without the privacy tick is refused on the server with an inline message", noConsent.fieldErrors);
    const noConsentCare = await core.handleContact(fd({ reason: "Consumer care", name: "No Tick", email: mail("notick2"), region: "Volta", message: "Torn pack", privacy: "no", website: "" }));
    check(noConsentCare.fieldErrors?.privacy, "consumer care without the privacy tick is refused too (any value but yes)");
    const noConsentP = await core.handlePartner(pfd({ route: "Retail", contact_name: "No Tick", business_name: "No Tick Ltd", email: mail("notick3"), privacy: "", website: "" }));
    check(noConsentP.status === "error" && noConsentP.fieldErrors?.privacy && Object.keys(noConsentP.fieldErrors).length === 1, "partner form without the privacy tick is refused on the server");
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
      ["partner", /^PTN-[0-9A-F]{10}$/, core.handlePartner(pfd({ route: "CSR", contact_name: "Bot", business_name: "Bot Ltd", email: mail("bot3"), website: trap }))],
      ["newsletter", /^NWS-[0-9A-F]{10}$/, core.handleNewsletter(fd({ email: mail("bot4"), consent: "yes", website: trap }))],
      ["contact, 600 character trap", /^ENQ-[0-9A-F]{10}$/, core.handleContact(fd({ reason: "Media", name: "Bot", email: mail("bot5"), message: "spam", website: huge }))],
      ["contact, trap and invalid fields", /^ENQ-[0-9A-F]{10}$/, core.handleContact(fd({ reason: "Careers", name: "", email: "nope", message: "", website: trap }))],
      ["partner, 600 character trap", /^PTN-[0-9A-F]{10}$/, core.handlePartner(pfd({ route: "Retail", contact_name: "Bot", business_name: "Bot", email: mail("bot6"), website: huge }))],
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
    const p = await core.handlePartner(pfd({ route: "Retail", contact_name: "Kofi", business_name: "Kofi Ltd", email: mail("euro2"), message: "€".repeat(2900) }));
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

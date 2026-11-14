// The Linzzy site's server code against the local harness database, through rpc_shim.mjs (the real intake functions,
// read helpers and chat functions run as anon). Run with: bash supabase/tests/local/linzzy/run.sh
//
// Loads apps/linzzy/lib/forms/core.ts (behind the server actions), lib/products.ts, lib/where-to-buy.ts (behind the
// pages and /api/stockists) and lib/chat-server.ts (behind /api/chat), then checks what landed in the database.
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { psql, startShim } from "../forms/rpc_shim.mjs";

register(new URL("../forms/ts-hook.mjs", import.meta.url));

let failures = 0;
const check = (ok, msg, detail) => {
  if (ok) console.log(`  PASS: ${msg}`);
  else { failures += 1; console.log(`  FAIL: ${msg}`); if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 600)}`); }
};
async function q(sql, vars) {
  const r = await psql(sql, vars);
  if (r.code !== 0) throw new Error(`query failed: ${r.err}`);
  return r.out;
}
function fd(fields) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [].concat(v)) f.append(k, x);
  return f;
}
const stamp = Date.now().toString(36);
const mail = (who) => `${who}.${stamp}@example.com`;
const counts = () => q(`select concat_ws(',', (select count(*) from public.crm_leads), (select count(*) from public.crm_contacts), (select count(*) from public.complaints))`);

const server = await startShim(0);
const port = server.address().port;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
console.warn = () => {};

const core = await import("../../../../apps/linzzy/lib/forms/core.ts");
const products = await import("../../../../apps/linzzy/lib/products.ts");
const wtb = await import("../../../../apps/linzzy/lib/where-to-buy.ts");
const chat = await import("../../../../apps/linzzy/lib/chat-server.ts");

try {
  // Not configured: the forms say where to write instead, and the products fall back to Lexta's catalogue.
  {
    const c = await core.handleConsumer(fd({ topic: "question", name: "A", email: mail("nc"), message: "Hi", privacy: "yes" }));
    check(c.status === "error" && c.message === "This form is not available right now, please email support@linzzyproducts.com", "missing settings: consumer form says email support@linzzyproducts.com", c);
    const t = await core.handleTrade(fd({ route: "retail", contact_name: "A", business_name: "B", email: mail("nc") }));
    check(t.message === "This form is not available right now, please email info@linzzyproducts.com", "missing settings: trade form says email info@linzzyproducts.com", t);
    const p = await products.getLinzzyProducts();
    const slugs = p.products.map((x) => x.slug);
    check(!p.live && p.products.length === 6 && ["heavy-flow-sanitary-towels", "cool-mint-sanitary-towels", "extra-long-sanitary-towels", "panty-liners", "baby-diapers", "baby-wipes"].every((x) => slugs.includes(x)),
      "missing settings: products fall back to Lexta's 6 product catalogue", slugs);
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_local_harness";

  // Products: Linzzy only, Lexta's Drive catalogue wording, no prototype claims, no image from a real Lexta domain. ---
  {
    const CATALOGUE_SLUGS = ["heavy-flow-sanitary-towels", "cool-mint-sanitary-towels", "extra-long-sanitary-towels", "panty-liners", "baby-diapers", "baby-wipes"];
    const REAL_HOST = /^https?:\/\/(www\.)?(lextagh\.com|yazzproducts\.com|linzzyproducts\.com|hoochfoods\.com)\//i;
    const PROTOTYPE_CLAIMS = /fragrance[ -]free|clinical|ultra mild|formulated for sensitive skin/i;
    const linzzyBrand = "(select id from public.brands where slug = 'linzzy')";
    const clean = (list) => !PROTOTYPE_CLAIMS.test(JSON.stringify(list)) && !list.some((p) => p.images.some((i) => REAL_HOST.test(i.src)));

    // After 0016 (the harness applies every migration): the six Drive products, read live, in Product Management's order.
    {
      const { products: list, live } = await products.getLinzzyProducts();
      const linzzy = (await q(`select string_agg(p.slug, ',' order by p.sort_order, p.name) from public.products p where p.brand_id = ${linzzyBrand} and p.is_published`)).split(",");
      const other = (await q(`select string_agg(p.name, '|') from public.products p join public.brands b on b.id = p.brand_id where b.slug <> 'linzzy' and p.is_published`)).split("|");
      check(live && JSON.stringify(linzzy) === JSON.stringify(CATALOGUE_SLUGS) && JSON.stringify(list.map((p) => p.slug)) === JSON.stringify(CATALOGUE_SLUGS),
        "0016: the six Drive products are the published Linzzy products, read live in Product Management's order", { linzzy, site: list.map((p) => p.slug) });
      check(!list.some((p) => p.comingSoon), "products: no coming soon items (Lexta has announced none for Linzzy)");
      check(!list.some((p) => other.includes(p.name)), "products: no Yazz or Hooch product");
      check(list.filter((p) => p.range === "feminine-care").length === 4 && list.filter((p) => p.range === "baby-care").length === 2, "products: Feminine care and Baby care categories map onto the two ranges");
      const wipes = list.find((p) => p.slug === "baby-wipes");
      check(wipes?.name === "Linzzy Baby Wipes" && wipes.long.startsWith("Little hands, tiny feet and unexpected messes") && wipes.features.includes("80 wipes per pack")
        && wipes.says === "A gentle touch for life's little messes." && wipes.images[0]?.src === "/images/original/baby-wipes.webp"
        && JSON.stringify(wipes.skus.map((x) => x.code)) === JSON.stringify(["TBC-LINZZY-108", "TBC-LINZZY-109", "TBC-LINZZY-110"]),
        "0016: the prototype Baby wipes row now carries Lexta's Drive wording, its three variants and the site's own pack shot", wipes);
      check(clean(list), "products: no prototype claim (fragrance free, clinical, ultra mild) and no image from a real Lexta domain", list.map((p) => p.images));
      const old = await q(`select string_agg(slug || ':' || is_published, ',' order by slug) from public.products where brand_id = ${linzzyBrand} and slug in ('sanitary-napkins', 'baby-care')`);
      check(old === "baby-care:false,sanitary-napkins:false", "0016: the two prototype umbrella rows are unpublished, not deleted", old);
    }

    // The live database today (before 0016): the three prototype rows only, with their claims and hotlinked photos.
    // The site must still show Lexta's six products in Drive wording, without the umbrella rows or the photos.
    await q(`update public.products set is_published = (slug in ('sanitary-napkins', 'baby-wipes', 'baby-care')) where brand_id = ${linzzyBrand};
      update public.products set name = 'Baby wipes', short_description = 'Ultra mild, fragrance free wipes in 80 piece packs.',
        long_description = 'Ultra mild, fragrance free wipes in 80 piece packs, formulated for sensitive skin and built to hold up to the job.',
        key_features = array['Ultra mild', 'Fragrance free', 'Formulated for sensitive skin', '80 piece packs'], usage_instructions = null
        where brand_id = ${linzzyBrand} and slug = 'baby-wipes';
      update public.product_images set is_primary = false where product_id = (select id from public.products where brand_id = ${linzzyBrand} and slug = 'baby-wipes');
      insert into public.product_images (product_id, external_url, alt_text, sort_order, is_primary)
        select id, 'https://www.lextagh.com/wp-content/uploads/2026/06/linzzy-wipes-poster.jpg', 'Linzzy poster', 1, true from public.products where brand_id = ${linzzyBrand} and slug = 'baby-wipes';`);
    {
      const { products: list, live } = await products.getLinzzyProducts();
      check(live && JSON.stringify(list.map((p) => p.slug)) === JSON.stringify(CATALOGUE_SLUGS),
        "before 0016: the full six product catalogue shows, in Lexta's order, and the umbrella rows Sanitary napkins and Baby care are skipped", list.map((p) => p.slug));
      const wipes = list.find((p) => p.slug === "baby-wipes");
      check(wipes?.name === "Linzzy Baby Wipes" && wipes.long.startsWith("Little hands, tiny feet") && wipes.short.startsWith("80 wipes in a resealable pack")
        && wipes.features[0] === "Convenient resealable packaging" && wipes.usage?.startsWith("Open the resealable lid") && wipes.ingredients?.startsWith("[PLACEHOLDER"),
        "before 0016: the database Baby wipes row shows the Drive wording (name, texts, features, usage, ingredients)", wipes);
      check(wipes?.images.length === 1 && wipes.images[0].src === "/images/original/baby-wipes.webp", "before 0016: the hotlinked www.lextagh.com photo is never used; the catalogue pack shot is shown instead", wipes?.images);
      check(clean(list), "before 0016: no prototype claim and no image from a real Lexta domain anywhere", list.map((p) => [p.slug, p.images.map((i) => i.src)]));
      check(products.isBlockedImage("https://lextagh.com/a.jpg") && products.isBlockedImage("https://WWW.hoochfoods.com/a.png") && products.isBlockedImage("http://yazzproducts.com/x")
        && products.isBlockedImage("https://www.linzzyproducts.com/x") && !products.isBlockedImage("/images/original/baby-wipes.webp") && !products.isBlockedImage("https://cdn.example.com/lextagh.com.jpg"),
        "image filter: the four real domains, with or without www, are blocked; the site's own files and other hosts are not");
    }

    // A product staff create later still shows (after the catalogue), and disappears when unpublished.
    await q(`insert into public.products (brand_id, slug, name, category, short_description, is_published, sort_order) values (${linzzyBrand}, 'linzzy-test-new', 'Linzzy Test New', 'Baby care', 'Added by staff', true, 5)`);
    {
      const { products: list } = await products.getLinzzyProducts();
      check(list.at(-1)?.slug === "linzzy-test-new" && list.at(-1)?.range === "baby-care" && list.length === 7, "a product staff add shows on the site", list.map((p) => p.slug));
      await q(`update public.products set is_published = false where brand_id = ${linzzyBrand} and slug = 'linzzy-test-new'`);
      const after = await products.getLinzzyProducts();
      check(!after.products.some((p) => p.slug === "linzzy-test-new"), "products: an unpublished staff product disappears from the site");
      await q(`delete from public.products where brand_id = ${linzzyBrand} and slug = 'linzzy-test-new'`);
    }

    // Back to the state after 0016: delete the test photo and run the migration again (it is idempotent).
    await q(`delete from public.product_images where external_url like 'https://www.lextagh.com/%';
      update public.product_images set is_primary = true where external_url = '/images/original/baby-wipes.webp';
      ${readFileSync(new URL("../../../migrations/0016_linzzy_catalogue_products.sql", import.meta.url), "utf8")}`);
    const restored = await products.getLinzzyProducts();
    const sameAgain = await q(`select string_agg(slug, ',' order by sort_order) from public.products where brand_id = ${linzzyBrand} and is_published`);
    check(sameAgain === CATALOGUE_SLUGS.join(",") && restored.products.find((p) => p.slug === "baby-wipes")?.images[0]?.src === "/images/original/baby-wipes.webp",
      "0016 run a second time: back to the six products, nothing duplicated", sameAgain);
  }

  // Where to Buy: only stockists that carry Linzzy. -----------------------------------------------------------
  {
    await q(`insert into public.stockists (id, name, outlet_type, region_id, town, latitude, longitude, is_active) values
      ('00000000-0000-0000-0000-0000000f0101', 'Linzzy Test Mart', 'supermarket', (select id from public.regions where slug = 'greater-accra'), 'Osu', 5.556, -0.18, true),
      ('00000000-0000-0000-0000-0000000f0102', 'Yazz Only Shop', 'general_trade', (select id from public.regions where slug = 'greater-accra'), 'Madina', null, null, true),
      ('00000000-0000-0000-0000-0000000f0103', 'Linzzy Kumasi Pharmacy', 'pharmacy', (select id from public.regions where slug = 'ashanti'), 'Kumasi', null, null, true),
      ('00000000-0000-0000-0000-0000000f0104', 'Closed Linzzy Shop', 'pharmacy', (select id from public.regions where slug = 'ashanti'), 'Kumasi', null, null, false)`);
    await q(`insert into public.stockist_brands (stockist_id, brand_id) select s::uuid, (select id from public.brands where slug = b) from (values
      ('00000000-0000-0000-0000-0000000f0101', 'linzzy'), ('00000000-0000-0000-0000-0000000f0101', 'hooch'), ('00000000-0000-0000-0000-0000000f0102', 'yazz'),
      ('00000000-0000-0000-0000-0000000f0103', 'linzzy'), ('00000000-0000-0000-0000-0000000f0104', 'linzzy')) v(s, b)`);
    const all = await wtb.getLinzzyStockists("all");
    const names = all.map((s) => s.name);
    check(names.includes("Linzzy Test Mart") && names.includes("Linzzy Kumasi Pharmacy"), "stockists: the active Linzzy stockists are listed", names);
    check(!names.includes("Yazz Only Shop") && !names.includes("Closed Linzzy Shop"), "stockists: a shop without Linzzy, and a closed one, are not listed", names);
    const accra = await wtb.getLinzzyStockists("greater-accra");
    check(accra.some((s) => s.name === "Linzzy Test Mart" && s.position?.lat === 5.556) && accra.every((s) => s.regionSlug === "greater-accra") && !accra.some((s) => s.name === "Yazz Only Shop"),
      "stockists: one region at a time, with the map position", accra);
    const regions = await wtb.getWhereToBuyRegions();
    check(regions.live && regions.regions[0].slug === "greater-accra", "regions: read live, Greater Accra first", regions.regions.slice(0, 3));
  }

  // Consumer form, a question: a CRM lead, website contact form, brand Linzzy. --------------------------------
  {
    const email = mail("ama");
    const s = await core.handleConsumer(fd({ topic: "question", name: " Ama Mensah ", email, phone: "", region: "greater-accra", product: "baby-wipes", message: "Are the wipes fragrance free?", website: "", privacy: "yes" }), { "baby-wipes": "Baby wipes" });
    check(s.status === "success" && /^ENQ-[0-9A-F]{10}$/.test(s.reference ?? ""), `consumer question returns an ENQ reference (${s.reference})`, s);
    const row = await q(`select l.source || '|' || b.slug || '|' || l.stage || '|' || replace(l.description, E'\\n', '~') || '|' || c.full_name
      from public.crm_leads l join public.brands b on b.id = l.brand_id join public.crm_contacts c on c.id = l.contact_id where l.intake_reference = '${s.reference}'`);
    const [source, brand, stage, desc, name] = row.split("|");
    check(source === "website_contact_form" && brand === "linzzy" && stage === "new", "lead: source website_contact_form, brand linzzy, stage new", row);
    check(desc.includes("Topic: Product information; Product: Baby wipes") && desc.includes("Region: Greater Accra") && name === "Ama Mensah", "lead: the topic, product and region reach the CRM", desc);
    const p = await core.handleConsumer(fd({ topic: "partnership", name: "Media Co", email: mail("media"), message: "A school campaign", privacy: "yes" }));
    const prow = p.reference ? await q(`select b.slug || '|' || replace(l.description, E'\\n', '~') from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${p.reference}'`) : "";
    check(p.status === "success" && prow.startsWith("linzzy|") && prow.includes("Topic: Partnership, media or collaboration"), "lead: a partnership or media message is a Linzzy lead with its topic", { p, prow });
    const noPrivacy = await core.handleConsumer(fd({ topic: "question", name: "A", email: mail("np"), message: "Hi" }));
    check(noPrivacy.status === "error" && noPrivacy.fieldErrors?.privacy, "consumer form: the privacy notice must be agreed to", noPrivacy);
  }

  // Consumer form, a problem with a product: a complaint, brand Linzzy, product linked. -----------------------
  {
    const s = await core.handleConsumer(fd({
      topic: "problem", name: "Kofi Owusu", email: mail("kofi"), phone: "+233 24 123 4567", region: "ashanti", product: "heavy-flow-sanitary-towels",
      batch: "Batch: LZ-2291", purchase_place: "Kejetia market", purchase_date: "2026-10-02", message: "The adhesive did not hold.", privacy: "yes",
    }), { "heavy-flow-sanitary-towels": "Linzzy Heavy Flow Sanitary Towels" });
    check(s.status === "success" && /^LX-\d{4}-\d{4,}$/.test(s.reference ?? "") && s.message.includes("case number"), `problem report returns a case number (${s.reference})`, s);
    const row = await q(`select b.slug || '|' || c.channel || '|' || coalesce(p.slug, '') || '|' || coalesce(c.batch_number, '') || '|' || coalesce(c.purchase_place, '') || '|' || coalesce(c.purchase_date::text, '') || '|' || replace(c.description, E'\\n', '~')
      from public.complaints c join public.brands b on b.id = c.brand_id left join public.products p on p.id = c.product_id where c.case_number = '${s.reference}'`);
    const [brand, channel, product, batch, place, date, desc] = row.split("|");
    check(brand === "linzzy" && channel === "website", "complaint: brand linzzy, channel website", row);
    check(product === "heavy-flow-sanitary-towels" && batch === "LZ-2291" && place === "Kejetia market" && date === "2026-10-02", "complaint: product linked, batch, place and date saved", row);
    check(desc.startsWith("Product: Linzzy Heavy Flow Sanitary Towels~Region: Ashanti"), "complaint: product and region at the top of the text", desc);

    // A product the database does not know as published (an unpublished prototype row, or one shown from the catalogue
    // while 0016 is not applied) still lands, named in the text.
    const s2 = await core.handleConsumer(fd({ topic: "problem", name: "Esi", email: mail("esi"), product: "sanitary-napkins", message: "Torn pack.", privacy: "yes" }), { "sanitary-napkins": "Sanitary napkins" });
    const row2 = await q(`select coalesce(c.product_id::text, 'none') || '|' || replace(c.description, E'\\n', '~') from public.complaints c where c.case_number = '${s2.reference}'`);
    check(s2.status === "success" && row2.startsWith("none|Product: Sanitary napkins"), "complaint: an unknown product is named in the text instead of being refused", { s2, row2 });

    const future = await core.handleConsumer(fd({ topic: "problem", name: "Esi", email: mail("esi2"), purchase_date: "2999-01-01", message: "x", privacy: "yes" }));
    check(future.status === "error" && future.fieldErrors?.purchase_date, "complaint: a purchase date in the future is refused", future);
  }

  // Trade enquiry: a CRM lead from the partner form, organisation with the Linzzy brand. ---------------------
  {
    const biz = `Accra Wholesale ${stamp}`;
    const s = await core.handleTrade(fd({
      route: "distributor", contact_name: "Yaw Boateng", business_name: biz, email: mail("yaw"), phone: "0244000111", region: "greater-accra",
      trading_location: "Makola", years_trading: "8", volume: "50 to 200 cartons a month", ranges: ["feminine-care", "baby-care", "bogus"], message: "We cover Accra Central.",
    }), { "feminine-care": "Feminine Care", "baby-care": "Baby Care" });
    check(s.status === "success" && /^PTN-[0-9A-F]{10}$/.test(s.reference ?? ""), `trade enquiry returns a PTN reference (${s.reference})`, s);
    const row = await q(`select l.source || '|' || b.slug || '|' || coalesce(l.estimated_monthly_volume, '') || '|' || o.kind || '|' || replace(l.description, E'\\n', '~') || '|' ||
        (select string_agg(bb.slug, ',') from public.crm_organisation_brands ob join public.brands bb on bb.id = ob.brand_id where ob.organisation_id = o.id)
      from public.crm_leads l join public.brands b on b.id = l.brand_id join public.crm_organisations o on o.id = l.organisation_id where l.intake_reference = '${s.reference}'`);
    const [source, brand, volume, kind, desc, orgBrands] = row.split("|");
    check(source === "website_partner_form" && brand === "linzzy" && kind === "distributor" && orgBrands === "linzzy", "trade lead: partner form, brand linzzy, a new distributor organisation tagged Linzzy", row);
    check(volume === "50 to 200 cartons a month" && desc.includes("Linzzy ranges of interest: Feminine Care, Baby Care") && desc.includes("Region: Greater Accra"), "trade lead: volume, ranges of interest and region saved", row);
    const bad = await core.handleTrade(fd({ route: "retail", contact_name: "", business_name: "", email: "nope" }));
    check(bad.status === "error" && bad.fieldErrors?.contact_name && bad.fieldErrors?.business_name && bad.fieldErrors?.email, "trade form: name, business and a valid email are required", bad);
  }

  // Newsletter: a CRM contact with consent, from the Linzzy site. ---------------------------------------------
  {
    const email = mail("news");
    const s = await core.handleNewsletter(fd({ email, consent: "yes" }));
    const row = await q(`select consent_marketing || '|' || consent_source from public.crm_contacts where email = '${email}'`);
    check(s.status === "success" && /^NWS-/.test(s.reference ?? "") && row === "true|Website newsletter (Linzzy)", "newsletter: contact with marketing consent, source Website newsletter (Linzzy)", { s, row });
    const noConsent = await core.handleNewsletter(fd({ email: mail("news2") }));
    check(noConsent.status === "error" && noConsent.fieldErrors?.consent, "newsletter: consent must be ticked", noConsent);
  }

  // Honeypot: a thank you shaped like a real one, nothing saved. ----------------------------------------------
  {
    const before = await counts();
    const a = await core.handleConsumer(fd({ topic: "problem", name: "Bot", email: mail("bot"), message: "spam", website: "http://spam", privacy: "yes" }));
    const b = await core.handleTrade(fd({ contact_name: "Bot", business_name: "Bot Ltd", email: mail("bot"), website: "x" }));
    const c = await core.handleNewsletter(fd({ email: mail("bot"), consent: "yes", website: "x" }));
    check(a.status === "success" && /^LX-/.test(a.reference) && /^PTN-/.test(b.reference) && /^NWS-/.test(c.reference), "honeypot: bots get a thank you with a real looking reference");
    check((await counts()) === before, "honeypot: nothing reaches the CRM or the complaints tracker");
  }

  // Live chat: conversations from the Linzzy site are tagged linzzy. ------------------------------------------
  {
    const SECRET = "harness-chat-secret-linzzy-0123456789abcdef";
    process.env.CHAT_INTAKE_SECRET = SECRET;
    await q("delete from private.chat_intake_secret");
    await q("insert into private.chat_intake_secret (secret) values (:'s')", { s: SECRET });
    const r = await chat.handleChat({ action: "start", id: crypto.randomUUID(), name: "Abena", email: mail("chat"), message: "Where can I buy diapers in Tema?", page: "/products/baby-care" }, { ip: "10.9.8.7" });
    check(r.status === 200 && r.body.ok, "chat: a conversation starts from the Linzzy site", r);
    const row = await q(`select b.slug || '|' || coalesce(c.start_page, '') from public.chat_conversations c join public.brands b on b.id = c.brand_id where c.id = '${r.body.conversationId}'`);
    check(row === "linzzy|/products/baby-care", "chat: the conversation is tagged linzzy in the shared inbox, with its start page", row);
    delete process.env.CHAT_INTAKE_SECRET;
    const off = await chat.handleChat({ action: "start", name: "A", message: "Hi" }, { ip: "10.9.8.8" });
    check(off.status === 503 && off.body.message.includes("support@linzzyproducts.com"), "chat: without the secret it says so and gives the Linzzy support address", off);
  }
} catch (e) {
  failures += 1;
  console.log(`  FAIL: unexpected error ${e?.stack ?? e}`);
} finally {
  server.close();
}

if (failures) { console.log(`${failures} Linzzy integration checks failed`); process.exit(1); }
console.log("All Linzzy integration checks passed");

// The Hooch site's server code against the local harness database, through rpc_shim.mjs (the real intake functions,
// read helpers and chat functions run as anon). Run with: bash supabase/tests/local/hooch/run.sh
//
// Loads apps/hooch/lib/forms/core.ts (behind the server actions), lib/products.ts, lib/where-to-buy.ts (behind the
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
const MIGRATION = readFileSync(new URL("../../../migrations/0017_hooch_catalogue_products.sql", import.meta.url), "utf8");

const server = await startShim(0);
const port = server.address().port;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
console.warn = () => {};

const core = await import("../../../../apps/hooch/lib/forms/core.ts");
const products = await import("../../../../apps/hooch/lib/products.ts");
const wtb = await import("../../../../apps/hooch/lib/where-to-buy.ts");
const chat = await import("../../../../apps/hooch/lib/chat-server.ts");
const recipes = await import("../../../../apps/hooch/content/recipes.ts");
const catalogue = await import("../../../../apps/hooch/content/catalogue.ts");

const CATALOGUE_SLUGS = ["cornflakes", "frosted-flakes"];
const PROTOTYPE_CLAIMS = /sun ripened|low in fat|high energy|survives the milk|fortified with essential|sugar crash|scientific nourishment/i;
const HOTLINK = /^https?:\/\/([a-z0-9-]+\.)*(lextagh\.com|yazzproducts\.com|linzzyproducts\.com|hoochfoods\.com|chopboxonline\.com)\//i;
const hoochBrand = "(select id from public.brands where slug = 'hooch')";
const clean = (list) => !PROTOTYPE_CLAIMS.test(JSON.stringify(list)) && !list.some((p) => p.images.some((i) => HOTLINK.test(i.src)));

try {
  // Not configured: the forms say where to write instead, and the products fall back to Lexta's catalogue.
  {
    const c = await core.handleConsumer(fd({ topic: "question", name: "A", email: mail("nc"), message: "Hi", privacy: "yes" }));
    check(c.status === "error" && c.message === "This form is not available right now, please email support@hoochfoods.com", "missing settings: consumer form says email support@hoochfoods.com", c);
    const t = await core.handleTrade(fd({ route: "retail", contact_name: "A", business_name: "B", email: mail("nc") }));
    check(t.message === "This form is not available right now, please email info@hoochfoods.com", "missing settings: trade form says email info@hoochfoods.com", t);
    const p = await products.getHoochProducts();
    check(!p.live && JSON.stringify(p.products.map((x) => x.slug)) === JSON.stringify(CATALOGUE_SLUGS), "missing settings: products fall back to Lexta's two Drive cereals", p.products.map((x) => x.slug));
  }

  // The Drive content, as the site holds it. --------------------------------------------------------------------
  {
    const [corn, frost] = catalogue.CATALOGUE;
    check(corn.name === "Hooch® Cornflakes" && corn.skus[0].pack === "500g: 10 x 50g individual packs" && corn.portions === "10 x 50g individual packs"
      && frost.name === "Hooch® Frosted Flakes" && frost.skus[0].pack === "375g: 10 x 37.5g individual packs" && frost.portions === "10 x 37.5g individual packs",
      "catalogue: Cornflakes 500g (10 x 50g) and Frosted Flakes 375g (10 x 37.5g), as the Drive says");
    check(!catalogue.CATALOGUE.some((c) => /choco/i.test(c.slug + c.name)), "catalogue: no Choco Flakes (in no Lexta document; Desmond: Drive only)");
    check(recipes.RECIPES.length === 4 && recipes.RECIPES.every((r) => r.image.src.startsWith("/images/hooch/") && r.minutes > 0 && (!r.photoNeeded || /from Lexta/.test(r.photoNeeded))), "recipes: Lexta's four recipes, each with a food photo (marked as a placeholder where it stands in)");
    const all = JSON.stringify([catalogue.CATALOGUE, recipes.RECIPES, recipes.BEYOND]);
    check(!/[–—]| - /.test(all), "content: no em dashes or spaced hyphens");
    check(!PROTOTYPE_CLAIMS.test(all) && !/healthy|nutritious|boosts?|immun|energy/i.test(all.replace(/healthier routines/g, "")), "content: no claim beyond Lexta's wording (no health or energy claims)");
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_local_harness";

  // Products after 0017 (the harness applies every migration). --------------------------------------------------
  {
    const { products: list, live } = await products.getHoochProducts();
    const db = (await q(`select string_agg(p.slug, ',' order by p.sort_order, p.name) from public.products p where p.brand_id = ${hoochBrand} and p.is_published`)).split(",");
    check(live && JSON.stringify(db) === JSON.stringify(CATALOGUE_SLUGS) && JSON.stringify(list.map((p) => p.slug)) === JSON.stringify(CATALOGUE_SLUGS),
      "0017: the two Drive cereals are the published Hooch products, read live in Product Management's order", { db, site: list.map((p) => p.slug) });
    const frost = list.find((p) => p.slug === "frosted-flakes");
    check(frost?.name === "Hooch® Frosted Flakes" && frost.long.startsWith("Add a little sweetness") && frost.flavour === "frosted" && frost.tagline === "Sweet Crunch. Happy Mornings."
      && frost.images[0]?.src === "/images/hooch/frosted-flakes-bowl.webp" && JSON.stringify(frost.skus.map((x) => x.code)) === JSON.stringify(["TBC-HOOCH-102"]),
      "0017: the prototype Frosted Flakes row now carries Lexta's wording, the 375g pack and the shared render", frost);
    check(clean(list), "products: no prototype claim and no hotlinked photo", list.map((p) => p.images));
    const old = await q(`select string_agg(slug || ':' || is_published, ',' order by slug) from public.products where brand_id = ${hoochBrand} and slug in ('super-crunchy-corn-flakes', 'choco-flakes')`);
    check(old === "choco-flakes:false,super-crunchy-corn-flakes:false", "0017: Super Crunchy Corn Flakes and Choco Flakes are unpublished, not deleted", old);
    const other = (await q(`select string_agg(p.name, '|') from public.products p join public.brands b on b.id = p.brand_id where b.slug <> 'hooch' and p.is_published`)).split("|");
    check(!list.some((p) => other.includes(p.name)), "products: no Yazz or Linzzy product");
  }

  // The live database today (before 0017): the three prototype rows with their claims and third-party photos. -----
  await q(`update public.products set is_published = (slug in ('super-crunchy-corn-flakes', 'frosted-flakes', 'choco-flakes')) where brand_id = ${hoochBrand};
    update public.products set name = 'Frosted Flakes', short_description = 'A measured balance of sweetness and high energy grain, low in fat.',
      long_description = 'A measured balance of sweetness and high energy grain, low in fat.', key_features = array['Balance of sweetness and high energy grain', 'Low in fat']
      where brand_id = ${hoochBrand} and slug = 'frosted-flakes';
    update public.product_images set is_primary = false where product_id = (select id from public.products where brand_id = ${hoochBrand} and slug = 'frosted-flakes');
    insert into public.product_images (product_id, external_url, alt_text, sort_order, is_primary)
      select id, 'https://www.chopboxonline.com/wp-content/uploads/2022/08/frosted.png', 'Frosted', 1, true from public.products where brand_id = ${hoochBrand} and slug = 'frosted-flakes';`);
  {
    const { products: list, live } = await products.getHoochProducts();
    check(live && JSON.stringify(list.map((p) => p.slug)) === JSON.stringify(CATALOGUE_SLUGS),
      "before 0017: the two Drive cereals show, in Lexta's order; Super Crunchy Corn Flakes and Choco Flakes are skipped", list.map((p) => p.slug));
    const frost = list.find((p) => p.slug === "frosted-flakes");
    check(frost?.name === "Hooch® Frosted Flakes" && frost.short.startsWith("A sweet frosted finish") && !frost.features.includes("Low in fat"),
      "before 0017: the database Frosted Flakes row shows the Drive wording", frost);
    check(frost?.images.length === 1 && frost.images[0].src === "/images/hooch/frosted-flakes-bowl.webp", "before 0017: the hotlinked shop photo is never used", frost?.images);
    check(clean(list), "before 0017: no prototype claim and no hotlinked photo anywhere", list.map((p) => [p.slug, p.images.map((i) => i.src)]));
    check(products.isBlockedImage("https://www.chopboxonline.com/x.png") && products.isBlockedImage("https://cdn.lextagh.com/a.jpg") && products.isBlockedImage("https://hoochfoods.com./a.jpg")
      && !products.isBlockedImage("/images/hooch/cornflakes-bowl.webp") && !products.isBlockedImage("https://notlextagh.com/a.jpg"),
      "image filter: Lexta's real domains, their subdomains and the third-party shop are blocked; the site's own files and look-alikes are not");
  }

  // A product staff create later shows, and disappears when unpublished.
  await q(`insert into public.products (brand_id, slug, name, category, short_description, is_published, sort_order) values (${hoochBrand}, 'hooch-test-new', 'Hooch Test New', 'Breakfast cereal', 'Added by staff', true, 5)`);
  {
    const { products: list } = await products.getHoochProducts();
    check(list.at(-1)?.slug === "hooch-test-new" && list.at(-1)?.flavour === "classic" && list.length === 3, "a product staff add shows on the site (with the classic Cornflakes look)", list.map((p) => p.slug));
    await q(`update public.products set is_published = false where brand_id = ${hoochBrand} and slug = 'hooch-test-new'`);
    check(!(await products.getHoochProducts()).products.some((p) => p.slug === "hooch-test-new"), "an unpublished staff product disappears");
    await q(`delete from public.products where brand_id = ${hoochBrand} and slug = 'hooch-test-new'`);
  }

  // Back to after 0017: run the migration again (idempotent).
  await q(`delete from public.product_images where external_url like 'https://www.chopboxonline.com/%frosted%';
    update public.product_images set is_primary = true where external_url = '/images/hooch/frosted-flakes-bowl.webp';
    ${MIGRATION}`);
  {
    const again = await q(`select string_agg(slug, ',' order by sort_order) from public.products where brand_id = ${hoochBrand} and is_published`);
    const imgs = await q(`select count(*) from public.product_images where external_url like '/images/hooch/%'`);
    check(again === CATALOGUE_SLUGS.join(",") && imgs === "2", "0017 run a second time: back to the two cereals, nothing duplicated", { again, imgs });
  }

  // After 0017, Product Management decides.
  const staff = (await q(`select id from public.profiles order by created_at limit 1`)).trim();
  const asStaff = (sql) => q(`select set_config('request.jwt.claim.sub', '${staff}', false) \\g /dev/null
    ${sql}`);
  await asStaff(`update public.products set name = 'Hooch® Cornflakes (new pack)', short_description = 'Edited in Product Management.' where brand_id = ${hoochBrand} and slug = 'cornflakes'`);
  {
    const edited = (await products.getHoochProducts()).products.find((p) => p.slug === "cornflakes");
    check(edited?.name === "Hooch® Cornflakes (new pack)" && edited.short === "Edited in Product Management." && edited.tagline === "Super Classic Crunchy. Everyday Goodness.",
      "after 0017: a Product Management edit shows on the site (the catalogue extras such as the tagline stay)", edited);
  }
  await asStaff(`update public.products set is_published = false where brand_id = ${hoochBrand} and slug = 'cornflakes'`);
  await q(MIGRATION);
  {
    const row = await q(`select name || '|' || is_published from public.products where brand_id = ${hoochBrand} and slug = 'cornflakes'`);
    check(row === "Hooch® Cornflakes (new pack)|false", "0017 run again: a row staff saved keeps its wording and stays unpublished", row);
    const { products: list } = await products.getHoochProducts();
    check(JSON.stringify(list.map((p) => p.slug)) === JSON.stringify(["frosted-flakes"]), "after 0017: an unpublished catalogue cereal disappears (no catalogue fallback)", list.map((p) => p.slug));
    // Staff republish the prototype Choco Flakes row while Cornflakes is unpublished: Product Management decides, so it
    // shows, and the site never falls back to its prototype mode (catalogue cards) because of it.
    await asStaff(`update public.products set is_published = true where brand_id = ${hoochBrand} and slug = 'choco-flakes'`);
    const back = (await products.getHoochProducts()).products.map((p) => p.slug);
    check(back.includes("choco-flakes") && back.includes("frosted-flakes") && !back.includes("cornflakes") && back.length === 2,
      "after 0017: a prototype row staff republish shows, with Cornflakes unpublished, and the catalogue does not come back", back);
    await asStaff(`update public.products set is_published = false where brand_id = ${hoochBrand} and slug = 'choco-flakes'`);
  }
  await asStaff(`update public.products set name = 'Hooch® Cornflakes', short_description = 'The golden crunch of Hooch® Cornflakes: 500g, in 10 convenient packs of 50g.', is_published = true
    where brand_id = ${hoochBrand} and slug = 'cornflakes'`);

  // Where to Buy: only stockists that carry Hooch. ------------------------------------------------------------
  {
    await q(`insert into public.stockists (id, name, outlet_type, region_id, town, latitude, longitude, is_active) values
      ('00000000-0000-0000-0000-0000000f0201', 'Hooch Test Mart', 'supermarket', (select id from public.regions where slug = 'greater-accra'), 'Osu', 5.556, -0.18, true),
      ('00000000-0000-0000-0000-0000000f0202', 'Yazz Only Shop H', 'general_trade', (select id from public.regions where slug = 'greater-accra'), 'Madina', null, null, true),
      ('00000000-0000-0000-0000-0000000f0203', 'Closed Hooch Shop', 'general_trade', (select id from public.regions where slug = 'ashanti'), 'Kumasi', null, null, false)`);
    await q(`insert into public.stockist_brands (stockist_id, brand_id) select s::uuid, (select id from public.brands where slug = b) from (values
      ('00000000-0000-0000-0000-0000000f0201', 'hooch'), ('00000000-0000-0000-0000-0000000f0202', 'yazz'), ('00000000-0000-0000-0000-0000000f0203', 'hooch')) v(s, b)`);
    const names = (await wtb.getHoochStockists("all")).map((s) => s.name);
    check(names.includes("Hooch Test Mart") && !names.includes("Yazz Only Shop H") && !names.includes("Closed Hooch Shop"), "stockists: active Hooch stockists only", names);
  }

  // Consumer form: a question is a Hooch lead; a recipe idea is a lead with its topic; a problem is a complaint. ----
  {
    const s = await core.handleConsumer(fd({ topic: "question", name: "Ama Mensah", email: mail("ama"), region: "greater-accra", product: "cornflakes", message: "Is it good with yoghurt?", privacy: "yes" }), { cornflakes: "Hooch® Cornflakes" });
    const row = s.reference ? await q(`select l.source || '|' || b.slug || '|' || replace(l.description, E'\\n', '~') from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${s.reference}'`) : "";
    check(s.status === "success" && row.startsWith("website_contact_form|hooch|") && row.includes("Topic: Product question; Product: Hooch® Cornflakes"), "lead: a product question from the Hooch site, brand hooch", { s, row });
    const r = await core.handleConsumer(fd({ topic: "recipe", name: "Kojo", email: mail("kojo"), message: "Cornflakes with pawpaw and yoghurt!", privacy: "yes" }));
    const rrow = r.reference ? await q(`select b.slug || '|' || replace(l.description, E'\\n', '~') from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${r.reference}'`) : "";
    check(r.status === "success" && rrow.startsWith("hooch|") && rrow.includes("Topic: Share a Hooch® recipe idea"), "lead: Share Your Hooch® Recipe arrives as a Hooch lead with its topic", { r, rrow });
    const c = await core.handleConsumer(fd({ topic: "problem", name: "Kofi", phone: "+233 24 123 4567", product: "frosted-flakes", batch: "HF-2291", message: "The pack was open.", privacy: "yes" }), { "frosted-flakes": "Hooch® Frosted Flakes" });
    const crow = c.reference ? await q(`select b.slug || '|' || coalesce(p.slug, '') || '|' || coalesce(x.batch_number, '') from public.complaints x join public.brands b on b.id = x.brand_id left join public.products p on p.id = x.product_id where x.case_number = '${c.reference}'`) : "";
    check(c.status === "success" && crow === "hooch|frosted-flakes|HF-2291", "complaint: brand hooch, product linked, batch saved", { c, crow });
  }

  // Trade enquiry: a partner lead with the cereals of interest. ---------------------------------------------------
  {
    const s = await core.handleTrade(fd({ route: "distributor", contact_name: "Yaw", business_name: `Tamale Foods ${stamp}`, email: mail("yaw"), region: "northern", cereals: [], ranges: ["cornflakes", "frosted-flakes", "bogus"] }),
      { cornflakes: "Hooch® Cornflakes", "frosted-flakes": "Hooch® Frosted Flakes" });
    const row = s.reference ? await q(`select l.source || '|' || b.slug || '|' || replace(l.description, E'\\n', '~') from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${s.reference}'`) : "";
    check(s.status === "success" && row.startsWith("website_partner_form|hooch|") && row.includes("Hooch cereals of interest: Hooch® Cornflakes, Hooch® Frosted Flakes"), "trade lead: partner form, brand hooch, cereals of interest", { s, row });
  }

  // Honeypot. -----------------------------------------------------------------------------------------------------
  {
    const before = await counts();
    const a = await core.handleConsumer(fd({ topic: "problem", name: "Bot", email: mail("bot"), message: "spam", website: "http://spam", privacy: "yes" }));
    check(a.status === "success" && (await counts()) === before, "honeypot: a thank you, nothing saved");
  }

  // Live chat. ----------------------------------------------------------------------------------------------------
  {
    const SECRET = "harness-chat-secret-hooch-0123456789abcdef";
    process.env.CHAT_INTAKE_SECRET = SECRET;
    await q("delete from private.chat_intake_secret");
    await q("insert into private.chat_intake_secret (secret) values (:'s')", { s: SECRET });
    const r = await chat.handleChat({ action: "start", id: crypto.randomUUID(), name: "Abena", email: mail("chat"), message: "Where can I buy Frosted Flakes?", page: "/products/frosted-flakes" }, { ip: "10.9.8.9" });
    const row = r.body?.conversationId ? await q(`select b.slug from public.chat_conversations c join public.brands b on b.id = c.brand_id where c.id = '${r.body.conversationId}'`) : "";
    check(r.status === 200 && row === "hooch", "chat: a conversation from the Hooch site is tagged hooch", { r, row });
    delete process.env.CHAT_INTAKE_SECRET;
  }
} catch (e) {
  failures += 1;
  console.log(`  FAIL: unexpected error ${e?.stack ?? e}`);
} finally {
  server.close();
}

if (failures) { console.log(`${failures} Hooch integration checks failed`); process.exit(1); }
console.log("All Hooch integration checks passed");

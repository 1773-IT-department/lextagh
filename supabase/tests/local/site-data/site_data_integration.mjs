// Our Brands and Where to Buy read live from Product Management and Stockists (item 20), against the local harness
// database. Run with: bash supabase/tests/local/site-data/run.sh
//
// Loads the real read helpers in packages/db and the site code that uses them (apps/lexta/components/brands/live.ts,
// components/home/where-to-buy.ts and app/api/stockists/route.ts), points them at rpc_shim.mjs, which answers the
// reads as anon in the harness database, and checks what a website visitor would get.
import { register } from "node:module";
import net from "node:net";
import { isDeepStrictEqual } from "node:util";
import { psql, requestLog, startShim } from "../forms/rpc_shim.mjs";

register(new URL("../forms/ts-hook.mjs", import.meta.url));

let failures = 0;
const pass = (msg) => console.log(`  PASS: ${msg}`);
const fail = (msg, detail) => {
  failures += 1;
  console.log(`  FAIL: ${msg}`);
  if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 600)}`);
};
const check = (ok, msg, detail) => (ok ? pass(msg) : fail(msg, detail));
/** Same content, ignoring key order and keys that are undefined (what React renders identically). */
const same = (a, b) => isDeepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));

async function q(sql) {
  const r = await psql(sql);
  if (r.code !== 0) throw new Error(`query failed: ${r.err}`);
  return r.out;
}

const server = await startShim(0);
const shimUrl = `http://127.0.0.1:${server.address().port}`;
const useShim = () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = shimUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_local_test";
};
useShim();

const db = await import("../../../../packages/db/src/index.ts");
const live = await import("../../../../apps/lexta/components/brands/live.ts");
const data = await import("../../../../apps/lexta/components/brands/data.ts");
const wtb = await import("../../../../apps/lexta/components/home/where-to-buy.ts");
const route = await import("../../../../apps/lexta/app/api/stockists/route.ts");

const apiGet = async (region) => {
  const res = await route.GET(new Request(`http://site.local/api/stockists?region=${encodeURIComponent(region)}`));
  return { status: res.status, body: await res.json() };
};

// Quiet the expected fallback warnings, but count them.
const warnings = [];
const realWarn = console.warn;
console.warn = (...args) => warnings.push(args.join(" "));

try {
  // ---------- Products: helper ----------
  {
    const yazz = await db.getPublishedProducts("yazz");
    check(
      same(yazz.map((p) => p.slug), [
        "sanitary-pads-and-panty-liners", "toothpaste", "toothbrushes", "washing-powder", "baby-wipes", "baby-diapers", "tissue", "mama-yazz-kitchen-towel",
      ]),
      "getPublishedProducts(yazz): the 8 seeded products in display order",
      yazz.map((p) => p.slug),
    );
    const toothpaste = yazz.find((p) => p.slug === "toothpaste");
    check(toothpaste?.images.length === 3 && toothpaste.images[0].is_primary && toothpaste.images[0].url.startsWith("https://yazzproducts.com/"), "images come primary first with their public URL");
    check(toothpaste?.skus.length === 3 && toothpaste.skus.every((s) => s.is_active), "active SKUs come with the product");
    check(!("brand" in (toothpaste ?? {})), "the brand join is not leaked into the product");
    check((await db.getPublishedProducts("linzzy")).length === 3 && (await db.getPublishedProducts("hooch")).length === 3, "Linzzy and Hooch: 3 published products each");
    check((await db.getPublishedProducts("lexta")).length === 0, "the corporate brand has no products");
  }

  // ---------- Products: what Our Brands draws ----------
  {
    const ranges = await live.getBrandRanges();
    check(warnings.length === 0, "no fallback warning while the database answers", warnings);
    check(same(ranges.linzzy, data.linzzyProducts), "Linzzy cards from the database are identical to the approved static cards", ranges.linzzy);
    check(same(ranges.hooch, data.hoochProducts), "Hooch cards from the database are identical to the approved static cards", ranges.hooch);
    check(same(ranges.yazz.slice(0, 6), data.yazzProducts.slice(0, 6)), "Yazz cards 1 to 6 (pads to diapers, with the before/after strip) are identical", ranges.yazz.slice(0, 6));
    const tail = ranges.yazz.slice(6).map((c) => [c.name, c.media.kind]);
    check(
      same(tail, [["Tissue", "single"], ["Mama Yazz kitchen towel", "single"]]),
      "Tissue and Mama Yazz kitchen towel are two products in the database, so they show as two cards",
      tail,
    );
  }

  // ---------- Products: edits show up, drafts and inactive brands never do ----------
  {
    await q(`update public.products set name = 'Toothpaste (new name)' where slug = 'toothpaste'
               and brand_id = (select id from public.brands where slug = 'yazz');`);
    let yazz = await live.getBrandRanges().then((r) => r.yazz);
    check(yazz[1]?.name === "Toothpaste (new name)", "a renamed product shows its new name");

    await q(`update public.products set is_published = false where slug = 'toothpaste'
               and brand_id = (select id from public.brands where slug = 'yazz');`);
    yazz = await live.getBrandRanges().then((r) => r.yazz);
    check(yazz.length === 7 && !yazz.some((c) => c.slug === "toothpaste"), "an unpublished product disappears");

    await q(`insert into public.products (brand_id, slug, name, short_description, is_published, sort_order)
             values ((select id from public.brands where slug = 'linzzy'), 'draft-test', 'Draft test', 'Not ready', false, 1);`);
    check(!(await db.getPublishedProducts("linzzy")).some((p) => p.slug === "draft-test"), "a draft product is never returned");

    await q(`insert into public.products (brand_id, slug, name, short_description, is_published, sort_order)
             values ((select id from public.brands where slug = 'linzzy'), 'new-test', 'New test', 'Just added', true, 15);`);
    const linzzy = await live.getBrandRanges().then((r) => r.linzzy);
    const added = linzzy[1];
    check(
      linzzy.length === 4 && added?.slug === "new-test" && added.description === "Just added" && added.media.kind === "photo" && !added.media.src,
      "a new product without a photo appears in its sort position with the empty photo slot",
      added,
    );

    await q(`update public.brands set is_active = false where slug = 'hooch';`);
    check((await live.getBrandRanges()).hooch.length === 0, "products of a switched off brand never appear");
    check(warnings.length === 0, "none of those cases fell back to static data", warnings);

    const anonDrafts = await q(`set role anon; select count(*) from public.products where not is_published;`);
    check(anonDrafts === "0", "anon cannot read unpublished products (Row Level Security)");
    const anonHooch = await q(`set role anon; select count(*) from public.products p join public.brands b on b.id = p.brand_id where b.slug = 'hooch';`);
    check(anonHooch === "0", "anon cannot read products of an inactive brand (Row Level Security)");

    // Put the seed back.
    await q(`update public.brands set is_active = true where slug = 'hooch';
             update public.products set name = 'Toothpaste', is_published = true where slug = 'toothpaste';
             delete from public.products where slug in ('draft-test', 'new-test');`);
    check(same((await live.getBrandRanges()).linzzy, data.linzzyProducts), "back to the seed: identical again");
  }

  // ---------- Regions ----------
  {
    const regions = await db.getRegions();
    check(regions.length === 17 && regions.slice(0, 16).every((r) => r.isInGhana) && regions[16].slug === "liberia-monrovia", "getRegions: 16 Ghana regions, then Liberia (Monrovia)", regions);
    const picker = await wtb.getWhereToBuyRegions();
    check(
      same(picker.slice(0, 10), wtb.FALLBACK_REGIONS.slice(0, 10)) && picker.length === 17 && picker[16].slug === "liberia-monrovia",
      "Where to Buy picker: the prototype order first (Greater Accra selected), the other regions after, Liberia last",
      picker.map((r) => r.slug),
    );
  }

  // ---------- Stockists ----------
  {
    await q(`
      insert into public.stockists (id, name, outlet_type, region_id, town, address, phone, opening_hours, is_active) values
        ('00000000-0000-0000-0000-00000000d001', 'Site test Osu supermarket', 'supermarket', (select id from public.regions where slug = 'greater-accra'), 'Osu', 'Oxford Street', '+233 30 000 0001', 'Mon to Sat, 8am to 8pm', true),
        ('00000000-0000-0000-0000-00000000d002', 'Site test Tema pharmacy', 'pharmacy', (select id from public.regions where slug = 'greater-accra'), 'Tema', null, null, null, true),
        ('00000000-0000-0000-0000-00000000d003', 'Site test closed shop', 'other', (select id from public.regions where slug = 'greater-accra'), 'Accra', null, null, null, false),
        ('00000000-0000-0000-0000-00000000d004', 'Site test Kumasi market', 'open_market', (select id from public.regions where slug = 'ashanti'), 'Kumasi', null, null, null, true);
      insert into public.stockist_brands (stockist_id, brand_id) values
        ('00000000-0000-0000-0000-00000000d001', (select id from public.brands where slug = 'yazz')),
        ('00000000-0000-0000-0000-00000000d001', (select id from public.brands where slug = 'linzzy')),
        ('00000000-0000-0000-0000-00000000d002', (select id from public.brands where slug = 'hooch')),
        ('00000000-0000-0000-0000-00000000d003', (select id from public.brands where slug = 'yazz')),
        ('00000000-0000-0000-0000-00000000d004', (select id from public.brands where slug = 'hooch'));
      insert into public.stockist_notes (stockist_id, notes) values ('00000000-0000-0000-0000-00000000d001', 'Staff only: site data test note');`);

    const accra = await db.getStockists({ region: "greater-accra" });
    check(same(accra.map((s) => s.name), ["Site test Osu supermarket", "Site test Tema pharmacy"]), "getStockists(greater-accra): active shops only, sorted by town", accra.map((s) => s.name));
    check(same(accra[0]?.brands.map((b) => b.name), ["Linzzy", "Yazz"]) && accra[0]?.outletLabel === "Supermarket", "each shop carries its brands and outlet type");
    check((await db.getStockists({ region: "volta" })).length === 0, "a region without stockists gives an empty list");
    check((await db.getStockists({ region: "Bad Slug!" })).length === 0, "a malformed region gives an empty list, not an error");
    check((await db.getStockists({ brandSlug: "hooch" })).every((s) => s.brands.some((b) => b.slug === "hooch")), "brand filter keeps only shops with that brand");

    const ok = await apiGet("greater-accra");
    const first = ok.body.stockists?.[0];
    check(ok.status === 200 && ok.body.ok && ok.body.stockists.length === 2, "GET /api/stockists?region=greater-accra answers the 2 active shops");
    check(
      same(first, { id: "00000000-0000-0000-0000-00000000d001", name: "Site test Osu supermarket", outletLabel: "Supermarket", town: "Osu", address: "Oxford Street", phone: "+233 30 000 0001", openingHours: "Mon to Sat, 8am to 8pm", brands: ["Linzzy", "Yazz"] }),
      "the API sends only public fields (no notes, no staff ids)",
      first,
    );
    const empty = await apiGet("volta");
    check(empty.status === 200 && empty.body.ok && empty.body.stockists.length === 0, "an empty region answers an empty list (the page shows the honest empty state)");
    check((await apiGet("../etc")).status === 400 && (await apiGet("")).status === 400, "a bad region is refused with 400");
    const before = requestLog.length;
    const unknown = await apiGet("made-up-region");
    const reads = requestLog.slice(before);
    check(unknown.status === 400 && unknown.body.ok === false, "a well formed but unknown region is refused with 400", unknown);
    check(!reads.some((r) => r.includes("/rest/v1/stockists")), "an unknown region never causes a stockists read (checked against the regions list)", reads);
    check((await apiGet("Liberia-Monrovia")).status === 200, "a known region is accepted in any letter case");

    const anonNotes = await psql(`set role anon; select notes from public.stockist_notes;`);
    check(anonNotes.code !== 0, "anon cannot read stockist notes (Row Level Security and grants)");
    const anonClosed = await q(`set role anon; select count(*) from public.stockists where not is_active;`);
    check(anonClosed === "0", "anon cannot read inactive stockists (Row Level Security)");
    const anonAuthor = await psql(`set role anon; select created_by from public.stockists limit 1;`);
    check(anonAuthor.code !== 0, "anon cannot read who created a stockist (column grants)");

    await q(`update public.stockists set is_active = false where id = '00000000-0000-0000-0000-00000000d002';`);
    check((await apiGet("greater-accra")).body.stockists.length === 1, "a deactivated stockist disappears from Where to Buy");
  }

  // ---------- Database down or not configured: static fallback, no errors ----------
  {
    warnings.length = 0;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:9";
    const ranges = await live.getBrandRanges();
    check(same(ranges, live.staticRanges), "database down: Our Brands shows the approved static cards");
    check(same(await wtb.getWhereToBuyRegions(), wtb.FALLBACK_REGIONS), "database down: the region picker shows the prototype list");
    const down = await apiGet("greater-accra");
    check(down.status === 503 && down.body.ok === false && !JSON.stringify(down.body).includes("127.0.0.1"), "database down: /api/stockists answers 503 without details");
    check(warnings.length === 5, "each fallback logs one server warning", warnings);

    // Refused connection (nothing listens): one attempt, no retries, so the fallback is immediate.
    const timed = async (fn) => {
      const t0 = performance.now();
      const value = await fn();
      return { value, ms: Math.round(performance.now() - t0) };
    };
    const limit = db.WEBSITE_READ_TIMEOUT_MS;
    const closed = await new Promise((resolve) => {
      const probe = net.createServer().listen(0, "127.0.0.1", () => {
        const { port } = probe.address();
        probe.close(() => resolve(port));
      });
    });
    process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${closed}`;
    const refused = [
      await timed(() => live.getBrandRanges()),
      await timed(() => wtb.getWhereToBuyRegions()),
      await timed(() => apiGet("greater-accra")),
    ];
    console.log(`  refused connection: fallback after ${refused.map((r) => `${r.ms} ms`).join(", ")} (Our Brands, regions, API)`);
    check(same(refused[0].value, live.staticRanges) && same(refused[1].value, wtb.FALLBACK_REGIONS) && refused[2].value.status === 503, "refused connection: every helper falls back");
    check(refused.every((r) => r.ms < 1000), "refused connection: each fallback in under 1 s (no retry waits)", refused.map((r) => r.ms));

    // A server that accepts the connection and never answers: each read gives up at the time limit.
    const sockets = new Set();
    const silent = net.createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
    });
    await new Promise((resolve) => silent.listen(0, "127.0.0.1", resolve));
    process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${silent.address().port}`;
    try {
      const hung = [
        await timed(() => live.getBrandRanges()),
        await timed(() => wtb.getWhereToBuyRegions()),
        await timed(() => apiGet("greater-accra")),
        await timed(() => db.getStockists({ region: "greater-accra" }).then(() => "answered", (e) => String(e))),
      ];
      console.log(`  server never answers: fallback after ${hung.map((r) => `${r.ms} ms`).join(", ")} (Our Brands, regions, API, getStockists)`);
      check(
        same(hung[0].value, live.staticRanges) && same(hung[1].value, wtb.FALLBACK_REGIONS) && hung[2].value.status === 503 && /abort|timeout/i.test(hung[3].value),
        "server never answers: every helper gives up and falls back",
        hung.map((r) => r.value?.status ?? (typeof r.value === "string" ? r.value : "")),
      );
      check(
        hung.every((r) => r.ms >= limit - 250 && r.ms < limit + 1000),
        `server never answers: each fallback at the ${limit} ms limit (under 5 s), never an indefinite hang`,
        hung.map((r) => r.ms),
      );
    } finally {
      for (const socket of sockets) socket.destroy();
      await new Promise((resolve) => silent.close(resolve));
    }

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    check(same(await live.getBrandRanges(), live.staticRanges), "no Supabase settings: Our Brands shows the approved static cards");
    check(same(await wtb.getWhereToBuyRegions(), wtb.FALLBACK_REGIONS), "no Supabase settings: the region picker shows the prototype list");
    useShim();
  }
} catch (error) {
  fail(`test crashed: ${error instanceof Error ? error.stack : error}`);
} finally {
  console.warn = realWarn;
  server.close();
}

if (failures) {
  console.log(`${failures} site data check(s) failed`);
  process.exit(1);
}
console.log("All site data checks passed");

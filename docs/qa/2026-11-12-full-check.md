# Full check: website and all 8 systems, phone and desktop (item 28)

Date: 12 November 2026. Branch `claude/blissful-hawking-fra180` (from `nextjs` at 40e4920). Tester: Claude (QA).

## How it was run

- Everything ran against the local test harness only: a throwaway Postgres with every migration
  (`supabase/tests/local/run.sh`), the local Supabase stand in (`supabase/tests/local/browser/gateway.mjs`) and the
  production builds of `apps/lexta` and `apps/portal`. Fictional demo data only ("Demo Shop Adabraka", "Ama Demo", "QA ...").
  The live Supabase project, `main` and Lexta's real domains were not touched.
- The check is now a harness test anyone can repeat: `bash supabase/tests/local/full-check/run.sh` after building
  both apps for the harness (command in the script header). Screenshots of problems, `results.json` and server logs go to
  `FULL_CHECK_OUT`.
- Each page and screen was opened at 390x844 (phone, touch) and 1440x900 (desktop) and checked for: HTTP 200; no error
  text or error boundary; no console errors and no failed requests on the app's own hosts (outside hosts are blocked in the
  harness: images get a grey tile, the rest is aborted and not counted); no horizontal scroll
  (`scrollWidth <= innerWidth`); every `img` has an `alt` attribute; every internal link on the page answers (2xx or 3xx).
- Forms were sent end to end and looked up in the portal list they should land in. Every role signed in, and its menu,
  home tiles and refusals were checked. One create or save per system had to show its success message (no stuck "Saving...").

Result of the final run: 156 page visits (78 pages and screens x 2 widths), 75 flow checks, 199 distinct internal links,
**0 issues**.

## A. Website (apps/lexta)

| Page or screen | Phone 390x844 | Desktop 1440x900 | Notes (main heading seen) |
|---|---|---|---|
| `/` (Home) | Pass | Pass | Caring for your everyday |
| `/about-us` | Pass | Pass | We make what we sell, under our own roof |
| `/our-brands` | Pass | Pass | Three names. One standard. |
| `/people-and-culture` | Pass | Pass | Life at Lexta |
| `/corporate-social-responsibility` | Pass | Pass | Care that leaves the shelf |
| `/news` | Pass | Pass | What we have been up to |
| `/careers` | Pass | Pass | Build something people use every day |
| `/contact-us` | Pass | Pass | Talk to the right team directly |
| `/partner-with-us` | Pass | Pass | Grow with a house of everyday brands |
| `/faqs` | Pass | Pass | Frequently asked questions |
| `/privacy-policy` | Pass | Pass | Privacy Policy |
| `/terms-and-conditions` | Pass | Pass | Terms & Conditions |
| `/news/empowered-periods-reaches-19-locations-in-a-single-day` | Pass | Pass | Empowered Periods reaches 19 locations i |
| `/news/the-bright-smiles-school-tour` | Pass | Pass | The Bright Smiles School Tour |
| `/news/the-safe-bottoms-initiative` | Pass | Pass | The Safe Bottoms Initiative |
| `/news/the-lexta-forest-project` | Pass | Pass | The Lexta Forest Project |
| `/news/clean-hands-green-land` | Pass | Pass | Clean Hands, Green Land |
| `/news/yazz-partners-mx24-tv-for-the-2026-croxitout-high-school-tour` | Pass | Pass | Yazz partners MX24 TV for the 2026 CroxI |
| `/news/free-public-cervical-cancer-screening-with-sofpog-mwag-and-korle-bu-polyclinic` | Pass | Pass | Free public cervical cancer screening wi |
| `/news/cervical-cancer-awareness-at-tuesday-market-park-mamprobi` | Pass | Pass | Cervical cancer awareness at Tuesday Mar |
| `/news/ghanaian-women-doctors-encourage-screening-for-early-detection` | Pass | Pass | Ghanaian women doctors encourage screeni |
| `/news/cervical-cancer-awareness-launch-2024-tamale` | Pass | Pass | Cervical Cancer Awareness Launch 2024, T |

| Flow | Phone | Desktop | Notes |
|---|---|---|---|
| Header and footer links, including the "Staff login" link | Pass | Pass | Staff login points at the portal and opens its sign in page. Old `/about-us.html` redirects to `/about-us`. |
| Phone menu | Pass | n/a | Opens and lists every page, Contact Us and Staff login. |
| Where to Buy (Home): pick region, Find | Pass | Pass | Greater Accra lists the 3 active demo shops. `/api/stockists?region=greater-accra` answers 200. |
| Where to Buy updates after a portal save | n/a | Pass | Stockist added in the portal shows in `/api/stockists` straight after (portal calls `/api/revalidate`). |
| Contact form, General enquiry | Pass | n/a | Thank you with ENQ reference; lead in CRM with source "website contact form"; visible in CRM Leads. |
| Contact form, Consumer care (complaint) | Pass | n/a | Thank you with LX-2026-NNNN case number; complaint in Complaints list. |
| Partner With Us form | n/a | Pass | Thank you with PTN reference; lead in CRM Leads (source "website partner form"). |
| Newsletter (Home and News) | Pass (News) | Pass (Home) | Thank you with NWS reference; contacts with marketing consent in CRM Contacts. |
| Careers: general application with PDF CV | Pass | n/a | LX-APP reference; in Recruitment list. |
| Careers: "Apply for this role" with PDF CV | n/a | Pass | Role filled on the form; application linked to the opening; HR downloads the CV (200, application/pdf). |
| Live chat: visitor starts a chat, staff assigns and replies, visitor sees reply | Pass (visitor) | Pass (staff) | Panel fits the phone width; chat appears in the Live chat inbox. |

## B. Portal (apps/portal)

Signed out:

| Page or screen | Phone 390x844 | Desktop 1440x900 | Notes (main heading seen) |
|---|---|---|---|
| `/login` | Pass | Pass | Lexta Business System |
| `/forgot-password` | Pass | Pass | Reset your password |
| `/set-password` | Pass | Pass | Lexta Business System |

As admin (every system):

| Page or screen | Phone 390x844 | Desktop 1440x900 | Notes (main heading seen) |
|---|---|---|---|
| `/` | Pass | Pass | Welcome, Akosua |
| `/systems/dashboard` | Pass | Pass | Management dashboard |
| `/systems/orders` | Pass | Pass | Distributor orders |
| `/systems/orders/:id` | Pass | Pass | Demo Distributors Kumasi |
| `/systems/orders/distributors` | Pass | Pass | Distributor logins |
| `/systems/field-sales` | Pass | Pass | Field sales |
| `/systems/field-sales/history` | Pass | Pass | My visits |
| `/systems/field-sales/outcomes` | Pass | Pass | Visit outcomes |
| `/systems/field-sales/visits/:id` | Pass | Pass | Demo Pharmacy Osu |
| `/systems/crm` | Pass | Pass | CRM |
| `/systems/crm/leads` | Pass | Pass | CRM |
| `/systems/crm/leads/:id` | Pass | Pass | Monthly Yazz pads order for Demo Shop Ad |
| `/systems/crm/leads/new` | Pass | Pass | New lead |
| `/systems/crm/contacts` | Pass | Pass | CRM |
| `/systems/crm/contacts/:id` | Pass | Pass | Ama Demo |
| `/systems/crm/contacts/new` | Pass | Pass | New contact |
| `/systems/crm/organisations` | Pass | Pass | CRM |
| `/systems/crm/organisations/:id` | Pass | Pass | Demo Distributors Kumasi |
| `/systems/crm/organisations/new` | Pass | Pass | New organisation |
| `/systems/crm/settings/website-leads` | Pass | Pass | Website lead managers |
| `/systems/complaints` | Pass | Pass | Complaints |
| `/systems/complaints/:id` | Pass | Pass | LX-2026-0001 |
| `/systems/complaints/new` | Pass | Pass | Log a complaint |
| `/systems/products` | Pass | Pass | Product management |
| `/systems/products/:id` | Pass | Pass | Toothpaste |
| `/systems/products/new` | Pass | Pass | New product |
| `/systems/stockists` | Pass | Pass | Stockists |
| `/systems/stockists/:id` | Pass | Pass | Demo Shop Adabraka |
| `/systems/stockists/new` | Pass | Pass | New stockist |
| `/systems/stockists/import` | Pass | Pass | Import stockists |
| `/systems/csr` | Pass | Pass | CSR activities |
| `/systems/csr/:id` | Pass | Pass | The Lexta Teen Care Campaign |
| `/systems/csr/new` | Pass | Pass | Log a CSR activity |
| `/systems/csr/programmes` | Pass | Pass | CSR programmes |
| `/systems/recruitment` | Pass | Pass | Recruitment |
| `/systems/recruitment/applications/:id` | Pass | Pass | Akua Demo |
| `/systems/recruitment/roles` | Pass | Pass | Recruitment |
| `/systems/recruitment/roles/:id` | Pass | Pass | Production Line Supervisor |
| `/systems/recruitment/roles/new` | Pass | Pass | New role |
| `/systems/chat` | Pass | Pass | Live chat |
| `/systems/chat/:id` | Pass | Pass | Mawuli Demo |
| `/systems/users` | Pass | Pass | Users and access |

As distributor:

| Page or screen | Phone 390x844 | Desktop 1440x900 | Notes (main heading seen) |
|---|---|---|---|
| `/systems/orders` | Pass | Pass | My orders |
| `/systems/orders/new` | Pass | Pass | New order |
| `/systems/orders/catalogue` | Pass | Pass | Catalogue |
| `/systems/orders/:id` | Pass | Pass | LX-ORD-2026-0001 |

As sales rep:

| Page or screen | Phone 390x844 | Desktop 1440x900 | Notes (main heading seen) |
|---|---|---|---|
| `/` | Pass | Pass | Welcome, Yaw |
| `/systems/field-sales` | Pass | Pass | Field sales |
| `/systems/field-sales/visit` | Pass | Pass | Start visit |
| `/systems/orders` | Pass | Pass | Distributor orders |
| `/systems/crm/leads` | Pass | Pass | CRM |

As management:

| Page or screen | Phone 390x844 | Desktop 1440x900 | Notes (main heading seen) |
|---|---|---|---|
| `/` | Pass | Pass | Welcome, Kwame |
| `/systems/dashboard` | Pass | Pass | Management dashboard |

Sign in, roles and refusals (desktop):

| Check | Result | Notes |
|---|---|---|
| Wrong password | Pass | "That email and password do not match..." (phone and desktop). |
| Signed out visit to a system | Pass | Goes to `/login?next=...`. |
| Admin | Pass | Menu and tiles: every system plus Users and access. |
| Management | Pass | Menu and tiles: every system except Users and access; refused there. |
| Sales rep | Pass | Distributor ordering, Field sales, CRM, Complaints, Stockists; refused on the other 6. |
| Customer care | Pass | CRM, Complaints, Stockists, Live chat inbox; refused on the other 7. |
| Marketing | Pass | CRM, Complaints, Product management, Stockists, CSR; refused on the other 6. |
| HR | Pass | Recruitment only; refused on the other 10. |
| Distributor | Pass | Only My orders, New order and Catalogue; every other system sends them back to their orders. |

One main flow per system (success message checked, no stuck "Saving..."):

| System | Flow | Width | Result | Success message |
|---|---|---|---|---|
| Management dashboard | Management opens it with figures | Desktop | Pass | Headline numbers for the last 30 days. |
| Distributor ordering | Distributor adds a product, reviews and submits | Phone | Pass | "Order submitted" with LX-ORD reference. |
| Distributor ordering | Rep confirms that order | Desktop | Pass | Status badge "Confirmed". |
| Field sales | Rep starts a visit, location captured, picks a shop, outcome, saves | Phone | Pass | "Visit saved". |
| CRM | New contact | Desktop | Pass | "Contact added." |
| CRM | New lead | Desktop | Pass | "Lead added." |
| CRM | Edit a lead and save | Desktop | Pass | "Saved." |
| CRM | Website lead managers settings, save | Desktop | Pass | "Saved. New website leads now go to the people you chose." |
| Complaints | Log a complaint for a new caller | Desktop | Pass | "Complaint logged as LX-2026-NNNN". |
| Product management | Edit a product and save | Desktop | Pass | "Saved. The websites will show the change shortly." |
| Stockists | New stockist (with a brand) | Desktop | Pass | "Stockist added. It shows on Where to Buy..." |
| CSR | Log an activity | Desktop | Pass | "The activity is saved. Add photos below". |
| Recruitment | New role | Desktop | Pass | "Role created as LX-QAT-901". |
| Live chat inbox | Assign to me, reply | Desktop | Pass | "Assigned to you.", "Sent." |
| Users and access | Placeholder page for admin | Desktop | Pass | "Being built" tile (out of this check's scope to build). |

## Fixes made on the branch

| Commit | What |
|---|---|
| d27e0d9 | Harness gateway: PostgREST style embeds (many to one, one to many, counts, nested, `!inner`), filters on embedded columns and JSON arrays for `uuid[]` RPC arguments. Before this the Product management list, the Stockists list, CRM Organisations and Where to Buy could not be checked in a browser, and saving a stockist failed in the harness. Test code only; every existing browser check passes again with it. |
| 983962f | Staff user guide: images `60-products.png` and `70-stockists.png` showed "We could not load the products/stockists" (caused by the gateway gap above). Retaken and the Word guide rebuilt. |
| 17746e7 | New harness test `supabase/tests/local/full-check` (this check). The demo data moved from the guide's screenshot script into `supabase/tests/local/browser/demo-seed.mjs`, shared by both; it now also moves the complaint and application counters past the seeded LX-2026-000N and LX-APP-2026-000N references (otherwise the first website complaint or application in a seeded harness collided with them). Guide screenshots still build (35 images). |

No product code needed a fix: no broken link, phone overflow, console error, missing alt text or wrong label was found.

## Open issues, by severity

No high or medium product issues were found.

1. **Low, process: deployed preview not smoke checked.** The agent proxy refuses `*.vercel.app` (CONNECT 403), so the
   read only check of the nextjs website preview could not run from here. Nothing was tried to get around it.
   To do by hand: open the lexta-web preview of the `nextjs` branch on a phone and a desktop and walk the pages in table A.
2. **Low, needs Lexta content: placeholders still visible to staff** (listed below). Expected; they block nothing.
3. **Low, harness only (no action needed on the live sites):** under `next start -H 127.0.0.1` the portal's sign in
   redirects point at `localhost:3101`. Browsers follow them fine; only a plain Node fetch of the portal root from the
   test machine fails. On Vercel the redirect uses the real host.

## Placeholders still visible

Website (apps/lexta), visible text: none on any page at either width. Shown only in a state the check does not land in:
- `[PLACEHOLDER: Lexta chat office hours]`: the live chat's out of hours note (`apps/lexta/lib/chat/hours.ts`).

Website, missing photos and video (code notes only; a Lexta photo stands in, no placeholder text shows):
- photo of Lexta Square (Contact Us), team celebration photo (Home), factory floor or production line photo (Our Brands),
  one photo per area of work (People and Culture), Lexta brand video file (Home video module).

Portal (apps/portal), visible text:
- `[PLACEHOLDER: email Lexta sales when an order is submitted, once email is set up]`: Distributor orders inbox.
- `[PLACEHOLDER: pricing and invoicing come later, from Lexta's sales team or ERP]`: order page, Catalogue and New order.
- Product data from migration 0004 until Lexta supplies it: `[PLACEHOLDER: pack size from Lexta]` on 22 SKUs and
  `[PLACEHOLDER: variant 1/2/3 name from Lexta]` on 3 SKUs. They show in Product management, the distributor Catalogue
  and order screens (the demo data of the harness replaces them, so they did not appear in this run). The website does
  not show pack sizes.

## Copy check (em dashes, en dashes, spaced hyphens)

- Rendered text of every page and screen above at both widths: no em dash, no en dash, no spaced hyphen.
- Source of both apps (`app`, `components`, `content`, `lib`): no em or en dash; every spaced hyphen found is arithmetic in code, not copy.

## Test suites

| Suite | Result |
|---|---|
| `pnpm build` (both apps, with harness settings and with none) | Pass |
| SQL suite, `supabase/tests/local/run.sh` (11 files: complaints, crm, csr, distributor orders, field sales, live chat, dashboard, products, recruitment, stockists, website lead managers RLS) | Pass, 173 checks |
| `forms/run.sh` | Pass, 67 checks |
| `site-data/run.sh` | Pass, 48 checks |
| `recruitment/run.sh` | Pass, 56 checks |
| `live-chat/run.sh` (RLS and integration) | Pass, 46 checks |
| `live-chat/browser.mjs` | Pass, 34 checks (before and after the gateway fix) |
| `orders/run.sh` (RLS and browser) | Pass, 76 checks (before and after) |
| `field-sales/run.sh` | Pass, 80 checks (before and after) |
| `dashboard/run.sh` | Pass, 39 checks (before and after) |
| `csr/run.sh` | Pass, 44 checks (before and after) |
| `docs/user-guide/build/run.sh` (guide screenshots) | Pass, 35 screenshots |
| `full-check/run.sh` (new, this report) | Pass: 156 page visits, 75 flows, 199 links, 0 issues |
| Deployed nextjs website preview, read only | Not run: proxy refuses `*.vercel.app` (403) |

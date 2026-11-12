# Lexta go-live plan: website and Business System portal

**DRAFT for Desmond to review and agree, 12 November 2026.** Itinerary item 27, "Go-live plan agreed (lextagh.com and portal address)". Prepared by the build team (1773 Human Resources & Marketing Services LTD, IT department) for Lexta Ghana Limited.

This plan says what has to happen, in what order and by whom, to move the Lexta website (Vercel project lexta-web, `apps/lexta`) and the Lexta Business System (Vercel project lexta-portal, `apps/portal`) from their preview addresses to Lexta's real addresses. The build team only prepares; **Desmond alone does go-live**: every step that touches DNS, Vercel domains, production settings or the live Supabase project is his. Anything not yet known is marked `[TO CONFIRM: ...]`.

## 1. Decisions needed from Desmond

* [ ] **Website address.** Both lextagh.com and www.lextagh.com will answer; one is the main address and the other redirects to it. Recommended: **www.lextagh.com as the main address**, lextagh.com redirecting to it (Vercel's own recommendation for apex domains). Either works; the choice sets `NEXT_PUBLIC_SITE_URL`.
* [ ] **Portal address.** Options: **portal.lextagh.com** (recommended: it matches the "Staff login" link and the word "portal" used in the user guide), business.lextagh.com (matches "Lexta Business System"), staff.lextagh.com, or app.lextagh.com. Distributors also sign in here, so avoid "staff" if that matters to Lexta.
* [ ] **Launch date and time.** Recommended: a Tuesday or Wednesday morning, Ghana time, with Lexta's customer care and HR on duty that day. Not a Friday. `[TO CONFIRM: date]`
* [ ] **Who at Lexta signs off the content** (website copy, photos, product data, chat office hours) and who signs off "go" on the day. `[TO CONFIRM: names]`
* [ ] **Email sending.** Provider for the portal's sign in emails (invites and password resets) and, later, order alerts: Resend, Brevo, Amazon SES, or Lexta's own mail host's SMTP. From address, for example `no-reply@lextagh.com`, with sender name "Lexta Business System". `[TO CONFIRM: provider and from address]`
* [ ] **Supabase plan** (itinerary 21): move "Lexta Gh" to the paid Pro plan before launch; decide whether to add point in time recovery (extra monthly cost) or rely on Pro's daily backups at first.
* [ ] **Production branch** for lexta-web and lexta-portal: merge `nextjs` into `main` (recommended) or point production at `nextjs` (section 3.1).
* [ ] **The old prototype project lextagh**: keep for 30 days as a frozen reference, then pause or delete (section 3.7).

## 2. Before launch

### 2.1 Content swap and placeholders

Missing content never blocks the build, but it should be in before the public sees the site. Lexta to supply, the build team to put in, through a normal pull request to `nextjs`:

| Item | Where it shows | Owner |
|---|---|---|
| Chat office hours (`[PLACEHOLDER: Lexta chat office hours]`, assumed Monday to Friday 08:00 to 17:00) | Live chat out of hours note, `apps/lexta/lib/chat/hours.ts` | Lexta, then build team |
| Photo of Lexta Square | Contact Us | Lexta |
| Team celebration photo | Home | Lexta |
| Factory floor or production line photo | Our Brands | Lexta |
| One photo per area of work | People and Culture | Lexta |
| Lexta brand video file | Home video module | Lexta |
| Pack sizes on 22 SKUs and variant names on 3 baby wipes SKUs (seeded by migration 0004) | Product management, distributor Catalogue and orders | Lexta marketing, entered in the portal |
| Stockist list (none seeded) | Where to Buy | Lexta sales, CSV import in the portal |
| Confirm the support address `support@lextagh.com` receives mail | Chat note | Lexta |

The stand in photos show no placeholder text, so the site can launch without the new photos and video if Lexta agrees. Without stockists Where to Buy finds nothing, so **the stockist import is a launch blocker** `[TO CONFIRM: Desmond agrees]`. Two portal placeholders stay by design: order email alerts (2.4) and pricing and invoicing (out of scope today).

### 2.2 Supabase plan and backups (Desmond)

Upgrade "Lexta Gh" (ref `euqirakpychkhpwoszos`, eu-west-1) to Pro (itinerary 21): daily backups kept 7 days, no pausing. Point in time recovery is a paid add-on that needs a larger compute size; recommended to start without it and review after a month `[TO CONFIRM: current price]`. Then run the Security and Performance Advisors and clear anything new.

### 2.3 Auth settings (Desmond, in Supabase Authentication)

| Setting | Value at launch |
|---|---|
| Site URL | `https://portal.lextagh.com` (or the chosen portal address), but **only on launch day**, in section 3.5, after `portal.lextagh.com` shows Valid Configuration in Vercel. Until then keep the current preview Site URL: the invite and reset emails build their links from `{{ .SiteURL }}`, so changing it earlier sends every link to an address that does not work yet. |
| Redirect URLs | Add `https://portal.lextagh.com/**`. Keep the lexta-portal preview pattern so previews keep working `[TO CONFIRM: the exact preview entries already listed]`. |
| Allow new users to sign up | Off. Logins are invite only (migration 0001). `[TO CONFIRM: already off]` |
| Leaked password protection | On. It needs the Pro plan, so do it after 2.2. |
| Minimum password length | 10, to match the portal's own rule on Set password. |
| Email templates | Invite: link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/set-password`. Reset password: the same with `type=recovery`. This is what `apps/portal/app/auth/confirm/route.ts` expects. Optional: the reset template can link to `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery` instead. The portal asks for the reset with its own address plus `/auth/confirm?next=/set-password`, so a reset asked for on a preview stays on that preview and one asked for on the live portal stays live. This needs the preview entries kept in Redirect URLs, or Supabase falls back to the Site URL. Lexta wording and logo `[TO CONFIRM: template text agreed]`. |
| JWT Signing Keys | Check which key signs the tokens (Project Settings, JWT Keys) and consider moving to asymmetric keys (the recommended ECC key, through a standby key, then rotate). With an asymmetric key the portal checks each session token itself with `getClaims`, which saves one call to Supabase Auth on every page. Existing sessions keep working through the rotation. `[TO CONFIRM: Desmond agrees; current key type]` |
| Custom SMTP | Required. Supabase's built in sender only delivers to members of the Supabase organisation and only a few emails an hour, so staff would not get invites or resets without it. Use the provider and from address chosen in section 1. The provider will ask for SPF and DKIM records on lextagh.com (section 3.4). |
| Email rate limit | Raise from the default once custom SMTP is on, enough for inviting the whole staff list in one sitting. |

### 2.4 Secrets to generate and set

Generate each value once with `openssl rand -hex 32`. Never put them in the repo, a chat or Trello. Production and preview deployments use the **same Supabase project**, so each secret takes the same value in the Production and Preview scopes of its Vercel project.

| Variable | Vercel project | Also stored in | Without it |
|---|---|---|---|
| `RECRUITMENT_INTAKE_SECRET` | lexta-web | `private.recruitment_intake_secret` (migration 0008) | Careers form cannot send a CV |
| `CHAT_INTAKE_SECRET` | lexta-web | `private.chat_intake_secret` (migration 0009) | Live chat says it is not available |
| `FIELD_PHOTO_SECRET` | lexta-portal | `private.field_photo_secret` (migration 0011, also used by CSR in 0013) | Field visits and CSR activities save, photos are refused |
| `REVALIDATE_SECRET` (already set) | both, same value | nothing | Portal edits reach the website only on the next rebuild. Optional: rotate to a fresh value at launch, on both projects together. |

Each database value goes in once from the Supabase SQL editor, for example:

```
insert into private.chat_intake_secret (secret) values ('<value>')
on conflict (id) do update set secret = excluded.secret, updated_at = now();
```

The same pattern applies to `private.recruitment_intake_secret` and `private.field_photo_secret`. Each must be at least 32 characters. After setting the Vercel variables, redeploy the project so the new value is used.

Email for order alerts is not built: the Distributor orders inbox shows `[PLACEHOLDER: email Lexta sales when an order is submitted, once email is set up]`. At launch, sales checks the inbox in the portal. Adding the alert is a small follow up once the email provider is chosen `[TO CONFIRM: in scope, and when]`.

### 2.5 Real staff accounts and roles

The Users and access screen is not built, so accounts are created from the Supabase dashboard:

1. Lexta sends one list: full name, work email, role (admin, management, sales_rep, customer_care, marketing, hr or distributor) and, for sales reps and marketing, their brands (Yazz, Linzzy, Hooch). For distributors, also the company. `[TO CONFIRM: list received]`
2. Desmond invites each email (Authentication, Users, Invite user). A dashboard invite cannot set the role, so the new login starts with "No access yet".
3. Desmond sets the role and name in the SQL editor, for example `update public.profiles set role = 'customer_care', full_name = 'Name' where email = 'name@lextagh.com';`, and adds brand links in `public.profile_brands` for sales reps and marketing.
4. An admin links each distributor login to its company on the Distributor logins tab.
5. An admin chooses the website lead managers (CRM, Settings, Website leads), so new website leads get an owner.
6. Send the invites only after custom SMTP works and the Site URL points at the real portal address, otherwise the links lead to the preview.

Lexta should have at least two admins. Remove or switch off every test login (see 2.6).

### 2.6 Demo and test data in the live database

What the migrations put in is real starter data, not demo data: brands, regions, products and SKUs (with the placeholders in 2.1), the four field visit outcomes, the 12 Careers roles from the prototype as drafts for HR to review, date and open (0008), and the CSR programmes from the website marked `needs_review` for an admin to check (0013). Keep them; Lexta reviews them.

The QA run used a local harness only, so its demo data ("Ama Demo", "Demo Shop Adabraka") is not in the live database. Preview testing may have left records there, though. Before launch Desmond runs a read only check in the SQL editor: the row count of `auth.users`, `crm_leads`, `crm_contacts`, `complaints`, `job_applications`, `chat_conversations`, `distributor_orders`, `field_visits`, `stockists` and `csr_activities`, and a look at any rows that exist. `[TO CONFIRM: what is found]` Delete test rows only with a backup taken first, and decide whether to restart the reference counters (`complaint_case_counters`, `job_application_counters`, `distributor_order_counters`) so the first real case is 0001.

After launch, previews still write to the live database: test only with marked test data, deleted the same day.

### 2.7 Final full check on the previews

1. Merge every open pull request for launch into `nextjs`; `pnpm build` passes.
2. Rerun the harness check (`bash supabase/tests/local/full-check/run.sh`) and the SQL suites; expect 0 issues.
3. Walk the lexta-web and lexta-portal previews of `nextjs` by hand on a phone and a desktop (the QA report could not reach `*.vercel.app` from the build machine). Send each form once with test data, then delete it.
4. Confirm the function region move to dub1 (Dublin, next to the database) has landed and the previews are healthy. `[TO CONFIRM: region change merged]`
5. Lexta's content owner signs off the preview in writing.

## 3. The switch

### 3.1 Production branch

`main` is still the static prototype, which the lextagh project serves at lextagh.vercel.app. Recommended order:

1. In the **lextagh** project, stop new builds (Settings, Git: disconnect the repository, or set the Ignored Build Step to `exit 0`), so merging into `main` does not rebuild the prototype project with the monorepo.
2. Merge `nextjs` into `main` by pull request.
3. In **lexta-web** and **lexta-portal**, set the production branch to `main` `[TO CONFIRM: what it is today]`. Root directories stay `apps/lexta` and `apps/portal`.

Alternative, if Desmond prefers not to touch `main` yet: set the production branch of lexta-web and lexta-portal to `nextjs` and merge into `main` later.

### 3.2 Environment variables for production

Set in the Production scope before the production build, because `NEXT_PUBLIC_` values are fixed at build time:

| Variable | Project | Production value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | lexta-web | `https://www.lextagh.com` (the main website address) |
| `NEXT_PUBLIC_PORTAL_URL` | lexta-web and lexta-portal | `https://portal.lextagh.com` (the "Staff login" link and the password reset link) |
| `SITE_REVALIDATE_URLS` | lexta-portal | `https://www.lextagh.com/api/revalidate` (main address, so no redirect is followed) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | both | unchanged |
| The secrets of 2.4 | as in 2.4 | as in 2.4 |

Preview scope values stay on the preview addresses.

### 3.3 Production deployments and domains (Desmond, in Vercel)

1. Trigger a production deployment of lexta-web and of lexta-portal from the production branch, after the variables are set; check both are Ready.
2. lexta-web, Settings, Domains: add `www.lextagh.com` and `lextagh.com`, and set `lextagh.com` to redirect (308) to `www.lextagh.com` (or the other way round, per section 1).
3. lexta-portal, Settings, Domains: add `portal.lextagh.com`.
4. If lextagh.com is already used in another Vercel account, Vercel asks for a TXT record on `_vercel.lextagh.com` to prove ownership; add it as shown.

### 3.4 DNS records for Lexta's DNS host

`[TO CONFIRM: who hosts lextagh.com DNS today, who at Lexta can log in, and what serves the current lextagh.com site]`. Vercel now shows a value per project; **use exactly the values Vercel shows in Settings, Domains when each domain is added**. The long standing documented values are:

| Name | Type | Value | For |
|---|---|---|---|
| `@` (lextagh.com) | A | `76.76.21.21`, or the IP Vercel shows | website |
| `www` | CNAME | `cname.vercel-dns.com`, or the target Vercel shows | website |
| `portal` | CNAME | `cname.vercel-dns.com`, or the target Vercel shows | portal |
| as given by the email provider | TXT and CNAME | SPF and DKIM records | portal emails from `no-reply@lextagh.com` |

Take care:

* **Do not touch MX records** or other mail records: Lexta's email (for example `support@lextagh.com`) must keep working. Remove only the old A, AAAA or CNAME records for `@` and `www` that point at the current website.
* No CNAME at the apex, and no AAAA records left pointing at the old host.
* If there is a CAA record, it must allow `letsencrypt.org`, or Vercel cannot issue the certificate.
* Lower the TTL of the `@` and `www` records to 300 seconds at least 24 hours before the switch, and write down the old values (they are the DNS rollback, section 5).
* After the change, wait until Vercel shows each domain as Valid Configuration with a certificate before announcing.

### 3.5 Supabase Auth URLs

On the day, and not before: once `portal.lextagh.com` shows Valid Configuration with a certificate in Vercel, change the Site URL from the preview address to `https://portal.lextagh.com` and confirm the redirect URL from 2.3 is in. Then test a password reset end to end before inviting staff. Until this step the Site URL stays on the preview, so invite and reset links keep working.

### 3.6 Redirects from old addresses

* The prototype's `.html` addresses (`/index.html`, `/about-us.html` and the other ten pages) already redirect permanently to the clean addresses in `apps/lexta/next.config.ts`. The prototype's clean addresses (`/about-us` and so on) are the same in the new site.
* The **current** lextagh.com website will have its own addresses that search engines and old links use. Desmond lists them (from the current site's sitemap or Google Search Console) `[TO CONFIRM: list of current lextagh.com URLs]`, and the build team adds a 301 for each to the nearest new page in `next.config.ts` by pull request, before launch. Anything not listed shows the site's not found page.

### 3.7 The old prototype project lextagh

lextagh.vercel.app is the approved design reference. Keep it, with builds stopped (3.1), for 30 days after launch so the team can compare. Then pause the project in Vercel, and delete it once Lexta confirms nothing links to it. `[TO CONFIRM: Desmond agrees]`

## 4. Launch day checklist and smoke tests

Run on a phone (mobile data, not office Wi Fi) and a desktop. Use clearly marked test details and delete the records afterwards.

| # | Check | Pass when |
|---|---|---|
| 1 | Open `https://lextagh.com`, `https://www.lextagh.com`, `http://lextagh.com` | All end on the main address over HTTPS, padlock valid |
| 2 | Walk all 12 pages and two news articles, phone and desktop | No error, no horizontal scroll, images load |
| 3 | Open `/about-us.html` and two listed old lextagh.com URLs | 301 or 308 to the right new page |
| 4 | View the page source of Home | Canonical and Open Graph links use the main address, not `vercel.app` |
| 5 | Where to Buy: pick a region with shops, Find | Real shops listed |
| 6 | Portal: edit a stockist or product, then reload the website | Change shows within a minute (revalidate works) |
| 7 | Contact form, General enquiry | ENQ reference; lead in CRM Leads with an owner |
| 8 | Contact form, Consumer care | LX-2026 case number; in Complaints |
| 9 | Partner With Us form | PTN reference; lead in CRM Leads |
| 10 | Newsletter signup | NWS reference; contact in CRM Contacts with consent |
| 11 | Careers application with a small PDF CV | LX-APP reference; HR opens the CV in Recruitment |
| 12 | Live chat: start as a visitor, reply as customer care | Reply reaches the visitor; out of hours note shows real hours |
| 13 | "Staff login" in the footer | Opens `portal.lextagh.com/login` |
| 14 | Staff sign in for each role (admin, management, sales rep, customer care, marketing, HR, distributor) | Each sees only its systems |
| 15 | Forgot password from the portal | Email arrives from the chosen address within 2 minutes; link opens Set password on the portal address and the new password works |
| 16 | Field sales visit with a photo, CSR activity with a photo | Photo saves (FIELD_PHOTO_SECRET works) |
| 17 | Distributor places an order; a rep confirms it | LX-ORD reference; status Confirmed |
| 18 | Vercel runtime logs for both projects, first hour | No repeated errors |

## 5. Rollback plan

* **A bad release, domains fine:** in Vercel, Deployments, pick the last good production deployment of the project and use Instant Rollback (or Promote). Takes effect in seconds; no DNS change. Then fix on a branch and redeploy.
* **The website has to come off lextagh.com:** put back the old `@` and `www` records written down in 3.4. With the TTL at 300 seconds most visitors move back within minutes; some networks take hours. The portal (`portal.lextagh.com`) can stay up, as it is a new address.
* **Sign in emails failing:** staff who already have passwords keep working. Pause new invites, fix SMTP or the templates, test a reset, then resume.
* **Database:** no schema change happens on launch day. If data is damaged, restore the Pro daily backup (it loses everything after it).
* Desmond decides any rollback. The build team stays on call on launch day `[TO CONFIRM: who and hours]`.

## 6. First week after launch

* **Monitoring, daily:** Vercel runtime logs for both projects; Supabase Advisors, Auth logs and usage; the email provider's delivery report. The build team posts a short daily note on Trello.
* **Who answers:** live chat by customer care during office hours; website leads by the website lead managers chosen in 2.5; complaints by customer care; CVs by HR; distributor orders by sales, who check the inbox at least twice a day until email alerts exist. `[TO CONFIRM: names per area]`
* **Handover:** send the Staff User Guide (`docs/user-guide`) with the real portal address added, and run a short walkthrough per team. Collect questions on Trello.
* **Search:** check Google picks up the new pages (the portal is set to not be indexed). End the week with a review with Desmond.

## 7. Timeline

T is launch day. Dates follow once Desmond sets T.

| When | Task | Owner |
|---|---|---|
| Now | Agree this plan and the decisions in section 1 | Desmond |
| T-14 | Send content, photos, chat hours, stockist list, staff list, old URL list | Lexta |
| T-14 | Supabase Pro, advisors, leaked password protection; check JWT Signing Keys (2.3) | Desmond |
| T-10 | Choose email provider; set custom SMTP and templates; add SPF and DKIM. Leave the Site URL on the preview: it changes on launch day (3.5) | Desmond (Lexta for DNS access) |
| T-10 | Put in content and old URL redirects; region move to dub1 merged | Build team |
| T-7 | Generate and set the three secrets (Vercel and database) | Desmond |
| T-7 | Check live database for test data and clean up | Desmond, build team prepares the queries |
| T-5 | Final full check on previews; fixes | Build team |
| T-3 | Content sign off on the previews | Lexta |
| T-2 | Lower DNS TTLs; write down current records; stop lextagh project builds | Desmond, Lexta's DNS host |
| T-1 | Merge `nextjs` into `main`; set production variables; production deployments Ready | Desmond, build team prepares the pull request |
| T | Add domains, change DNS, Auth URLs, smoke tests, go or roll back | Desmond, build team on call |
| T to T+1 | Invite staff; set roles, brands, lead managers, distributor links | Desmond, Lexta admins |
| T+1 to T+7 | Daily monitoring, training sessions, user guide handover | Build team, Lexta teams |
| T+7 | Review week one | Desmond, build team |
| T+30 | Pause, then delete, the lextagh prototype project | Desmond |

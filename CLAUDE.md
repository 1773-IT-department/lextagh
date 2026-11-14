# Lexta platform: rules for every build session

Client: Lexta Ghana Limited. Builder: 1773 Human Resources & Marketing Services LTD (IT department, Desmond Attigah).
Contract: proposal 1773/LEX/2026-09 (Revised), Standard option, GH¢25,000. Scope lives in the Lexta brain skill; when in doubt, it is out of scope until Desmond says otherwise.

## Repo layout (pnpm + Turborepo)
- `apps/lexta`: Lexta corporate site (Next.js). Approved design: https://lextagh.vercel.app/
- `apps/portal`: Lexta Business System, the 8 systems behind one login (Next.js).
- `apps/yazz`, `apps/linzzy`, `apps/hooch`: brand sites (not created yet; Lexta site ships first).
- `packages/db`: Supabase client and shared data helpers. Add `packages/ui`, `packages/chat` when needed.
- `supabase/migrations`: every schema change, as numbered SQL files, also applied to the project.

## Backend
Supabase project "Lexta Gh" (ref `euqirakpychkhpwoszos`, org "Lexta GH", eu-west-1). Env vars in `.env.example`.
Row Level Security on every table, no exceptions. Never commit secret or service-role keys.

## Converting the Lexta site
The prototype HTML sits in `apps/lexta/public` and is served through rewrites in `next.config.ts`.
Convert one page at a time to `app/<slug>/page.tsx`, keeping the design pixel-identical. When a page is converted:
delete its `.html` file, remove it from `legacyPages`, check it on phone and desktop widths.

## Hard rules
- Never use em dashes or spaced hyphens as punctuation in any copy.
- Out of scope, do not build: AI chatbot, staff-editable news/banner CMS, online shop/cart/checkout, per-brand CRM,
  ERP connection, product finder quizzes, parenting tools, games/library, CSR pages on brand sites, more than 6 pages per brand site.
- Missing content never blocks: use a clearly marked placeholder (`[PLACEHOLDER: what is needed]`) and log it on Trello.
- Never deploy to or touch Lexta's real domains (lextagh.com, yazzproducts.com, linzzyproducts.com, hoochfoods.com). Previews only. Desmond alone does go-live.
- Work on branches and open pull requests; `main` is the live prototype until Desmond approves the switch.
- Run `pnpm build` before pushing. Do not push a broken build.

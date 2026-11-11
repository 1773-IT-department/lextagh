-- 0014_management_dashboard: the management dashboard (scoreboard item 26), one page for admin and management with the
-- headline numbers of the systems already built: CRM (0006, 0012), complaints (0007), recruitment (0008), live chat
-- (0009), distributor orders (0010), field sales (0011), CSR (0013), products (0003) and stockists (0005).
--
-- Only new objects: one function, public.management_dashboard(p_from, p_to, p_brand), returning one jsonb document of
-- counts so the page needs one round trip. No existing table, function, trigger or policy is changed.
--
-- Security invoker: it reads every table as the signed in person, so Row Level Security still decides what is counted.
-- Admin and management already read every row the dashboard counts (CRM: crm_reads_all; complaints: complaint_can_see;
-- recruitment, live chat and CSR: their staff roles; orders: order_staff_sees with sees_all_brands, submitted orders
-- only, which is what staff see; field sales: sees_all_brands; products: can_view_brand_products; stockists:
-- can_view_stockists; names of reps: profiles), so nothing is undercounted. Anyone else is refused at the top with
-- 42501 even where Row Level Security would let them count something, and anon cannot execute it at all.
-- It returns counts, sums and averages only; the one name it returns is a field sales rep's name (top 5 by visits),
-- which admin and management already read in profiles and on the field sales screens. No contact details, no rows.
--
-- Dates: p_from and p_to are calendar dates in Ghana (Africa/Accra, UTC all year), both included. Default: the last 30
-- days to today. The range may not run backwards or be longer than about ten years.
-- Brand: optional. Where a record carries a brand it must match (CRM leads, complaints, chats, products, CSR
-- programmes); orders and field visits count when the brand is one of theirs (brand_ids); order packs count only the
-- lines of that brand; stockists and new shops count when they carry the brand. Unbranded CRM leads and corporate CSR
-- programmes are left out while a brand is chosen. Recruitment has no brand and is always counted in full.
-- "Now" numbers (open leads, open complaints, chats waiting, roles open, orders to confirm, shops to confirm) ignore
-- the date range; "in period" numbers use it.

create function public.management_dashboard(p_from date default null, p_to date default null, p_brand uuid default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_today date := public.ghana_today();
  v_from date := coalesce(p_from, public.ghana_today() - 29);
  v_to date := coalesce(p_to, public.ghana_today());
  v_start timestamptz;
  v_end timestamptz;
  v_now timestamptz := now();
  v_website_sources text[] := array['website_contact_form', 'website_partner_form', 'website_newsletter', 'website_live_chat'];
  v_open_complaint text[] := array['new', 'acknowledged', 'investigating', 'awaiting_customer', 'reopened'];
  v_crm jsonb;
  v_complaints jsonb;
  v_recruitment jsonb;
  v_chat jsonb;
  v_orders jsonb;
  v_field jsonb;
  v_csr jsonb;
  v_catalogue jsonb;
begin
  if not coalesce(public.current_app_role() in ('admin', 'management'), false) then
    raise exception 'only admin and management can open the management dashboard' using errcode = '42501';
  end if;
  if v_from > v_to then
    raise exception 'the start date is after the end date' using errcode = '22023';
  end if;
  if v_to - v_from > 3660 then
    raise exception 'the date range is too long' using errcode = '22023';
  end if;
  if p_brand is not null and not exists (select 1 from public.brands b where b.id = p_brand) then
    raise exception 'unknown brand' using errcode = '22023';
  end if;

  v_start := v_from::timestamp at time zone 'Africa/Accra';
  v_end := (v_to + 1)::timestamp at time zone 'Africa/Accra';

  -- CRM ------------------------------------------------------------------------------------------------------------
  with leads as (
    select l.source, l.stage, l.owner_id, l.created_at, l.closed_at
    from public.crm_leads l
    where p_brand is null or l.brand_id = p_brand
  ), in_period as (
    select * from leads where created_at >= v_start and created_at < v_end
  )
  select jsonb_build_object(
    'new_leads', (select count(*) from in_period),
    'by_source', coalesce((select jsonb_object_agg(source, n) from (select source, count(*) n from in_period group by source) s), '{}'::jsonb),
    'by_stage', coalesce((select jsonb_object_agg(stage, n) from (select stage, count(*) n from in_period group by stage) s), '{}'::jsonb),
    'open_now', (select count(*) from leads where stage not in ('won', 'lost')),
    'won', (select count(*) from leads where stage = 'won' and closed_at >= v_start and closed_at < v_end),
    'lost', (select count(*) from leads where stage = 'lost' and closed_at >= v_start and closed_at < v_end),
    'unassigned_website', (select count(*) from leads
      where owner_id is null and source = any (v_website_sources) and stage not in ('won', 'lost'))
  ) into v_crm;

  -- Complaints -----------------------------------------------------------------------------------------------------
  with c as (
    select x.status, x.severity, x.created_at, x.closed_at, x.resolved_at, x.first_response_at, x.response_due_at,
      x.resolution_due_at
    from public.complaints x where p_brand is null or x.brand_id = p_brand
  ), open_now as (
    select * from c where status = any (v_open_complaint)
  ), closed_in as (
    select * from c where closed_at >= v_start and closed_at < v_end
  )
  select jsonb_build_object(
    'opened', (select count(*) from c where created_at >= v_start and created_at < v_end),
    'closed', (select count(*) from closed_in),
    'resolved', (select count(*) from c where resolved_at >= v_start and resolved_at < v_end),
    'avg_days_to_close', (select round((avg(extract(epoch from closed_at - created_at)) / 86400)::numeric, 1) from closed_in),
    'open_now', (select count(*) from open_now),
    'open_by_severity', coalesce((select jsonb_object_agg(severity, n) from (select severity, count(*) n from open_now group by severity) s), '{}'::jsonb),
    'open_by_status', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from open_now group by status) s), '{}'::jsonb),
    'overdue_now', (select count(*) from open_now
      where resolution_due_at < v_now or (first_response_at is null and response_due_at < v_now))
  ) into v_complaints;

  -- Recruitment (no brand) -------------------------------------------------------------------------------------------
  with apps as (
    select stage from public.job_applications a where a.created_at >= v_start and a.created_at < v_end
  )
  select jsonb_build_object(
    'open_roles', (select count(*) from public.job_openings o
      where o.status = 'open' and (o.closes_at is null or o.closes_at >= v_today)),
    'applications', (select count(*) from apps),
    'by_stage', coalesce((select jsonb_object_agg(stage, n) from (select stage, count(*) n from apps group by stage) s), '{}'::jsonb),
    'in_progress_now', (select count(*) from public.job_applications a where a.stage not in ('hired', 'rejected', 'withdrawn'))
  ) into v_recruitment;

  -- Live chat --------------------------------------------------------------------------------------------------------
  with chats as (
    -- Named columns only: staff cannot read every column (token_hash).
    select x.status, x.created_at, x.last_staff_message_at from public.chat_conversations x
    where p_brand is null or x.brand_id = p_brand
  )
  select jsonb_build_object(
    'conversations', (select count(*) from chats where created_at >= v_start and created_at < v_end),
    'awaiting_reply_now', (select count(*) from chats where status = 'open'),
    'never_answered_now', (select count(*) from chats where status = 'open' and last_staff_message_at is null),
    'leads_from_chat', (select count(*) from public.crm_leads l
      where l.source = 'website_live_chat' and l.created_at >= v_start and l.created_at < v_end
        and (p_brand is null or l.brand_id = p_brand))
  ) into v_chat;

  -- Distributor orders (no prices in the schema: lines and packs) ---------------------------------------------------
  with o as (
    select x.id, x.status from public.distributor_orders x
    where x.submitted_at is not null and x.submitted_at >= v_start and x.submitted_at < v_end
      and (p_brand is null or p_brand = any (x.brand_ids))
  ), lines as (
    select ln.quantity from public.distributor_order_lines ln
    join o on o.id = ln.order_id
    where o.status <> 'cancelled' and (p_brand is null or ln.brand_id = p_brand)
  )
  select jsonb_build_object(
    'orders', (select count(*) from o),
    'by_status', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from o group by status) s), '{}'::jsonb),
    'lines', (select count(*) from lines),
    'packs', (select coalesce(sum(quantity), 0) from lines),
    'to_confirm_now', (select count(*) from public.distributor_orders x
      where x.status = 'submitted' and (p_brand is null or p_brand = any (x.brand_ids)))
  ) into v_orders;

  -- Field sales ------------------------------------------------------------------------------------------------------
  with v as (
    select x.rep_id, x.outcome_id, x.new_shop from public.field_visits x
    where x.visited_at >= v_start and x.visited_at < v_end and (p_brand is null or p_brand = any (x.brand_ids))
  )
  select jsonb_build_object(
    'visits', (select count(*) from v),
    'reps', (select count(distinct rep_id) from v),
    'new_shops_in_period', (select count(*) from v where new_shop),
    'top_reps', coalesce((
      select jsonb_agg(jsonb_build_object('name', r.name, 'visits', r.n) order by r.n desc, r.name)
      from (
        select coalesce(nullif(btrim(p.full_name), ''), p.email, 'Former staff') as name, count(*) n
        from v left join public.profiles p on p.id = v.rep_id
        group by v.rep_id, p.full_name, p.email
        order by count(*) desc, 1
        limit 5
      ) r), '[]'::jsonb),
    'outcomes', coalesce((
      select jsonb_agg(jsonb_build_object('label', fo.label, 'visits', n) order by fo.sort_order, fo.label)
      from (select outcome_id, count(*) n from v group by outcome_id) s
      join public.field_visit_outcomes fo on fo.id = s.outcome_id), '[]'::jsonb),
    'shops_to_confirm_now', (select count(*) from public.field_new_shops ns
      where ns.confirmed_at is null
        and (p_brand is null or exists (select 1 from public.stockist_brands sb where sb.stockist_id = ns.stockist_id and sb.brand_id = p_brand)))
  ) into v_field;

  -- CSR (totals count activities marked done, as the CSR tracker does) ------------------------------------------------
  with a as (
    select x.programme_id, x.people_reached from public.csr_activities x
    join public.csr_programmes pr on pr.id = x.programme_id
    where x.status = 'done' and x.activity_date between v_from and v_to and (p_brand is null or pr.brand_id = p_brand)
  )
  select jsonb_build_object(
    'activities_done', (select count(*) from a),
    'people_reached', (select coalesce(sum(people_reached), 0) from a),
    'by_programme', coalesce((
      select jsonb_agg(jsonb_build_object('name', pr.name, 'activities', s.n, 'people', s.people) order by s.people desc, s.n desc, pr.name)
      from (select programme_id, count(*) n, sum(people_reached) people from a group by programme_id) s
      join public.csr_programmes pr on pr.id = s.programme_id), '[]'::jsonb),
    'planned_ahead', (select count(*) from public.csr_activities x
      join public.csr_programmes pr on pr.id = x.programme_id
      where x.status = 'planned' and x.activity_date >= v_today and (p_brand is null or pr.brand_id = p_brand))
  ) into v_csr;

  -- Products and stockists -------------------------------------------------------------------------------------------
  select jsonb_build_object(
    'published_products', (select count(*) from public.products p where p.is_published and (p_brand is null or p.brand_id = p_brand)),
    'products', (select count(*) from public.products p where p_brand is null or p.brand_id = p_brand),
    'active_stockists', (select count(*) from public.stockists s where s.is_active
      and (p_brand is null or exists (select 1 from public.stockist_brands sb where sb.stockist_id = s.id and sb.brand_id = p_brand)))
  ) into v_catalogue;

  return jsonb_build_object(
    'from', v_from,
    'to', v_to,
    'brand_id', p_brand,
    'crm', v_crm,
    'complaints', v_complaints,
    'recruitment', v_recruitment,
    'chat', v_chat,
    'orders', v_orders,
    'field_sales', v_field,
    'csr', v_csr,
    'catalogue', v_catalogue
  );
end;
$$;

revoke all on function public.management_dashboard(date, date, uuid) from public, anon;
grant execute on function public.management_dashboard(date, date, uuid) to authenticated;

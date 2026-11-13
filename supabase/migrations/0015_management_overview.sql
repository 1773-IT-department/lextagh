-- 0015_management_overview: the management overview, the super admin view that grows out of the management dashboard
-- (0014). Two read only functions for admin and management:
--
--   public.management_timeseries(p_from, p_to, p_brand)
--     Orders submitted, new leads, complaints received and shop visits per day, week or month of the range, for the
--     small charts on the overview.
--   public.management_activity(p_from, p_to, p_brand, p_system, p_person, p_before_at, p_before_key, p_limit)
--     Everything captured across the systems, newest first, one page at a time (keyset paging), for the activity feed.
--
-- Only new objects (two functions and five indexes): no table, trigger, policy or existing function is changed, and the
-- functions write nothing.
-- Five date indexes for the feed (see below); field_visits.visited_at, job_applications.created_at and
-- distributor_orders.submitted_at already have one.
--
-- Security, the same as 0014: security invoker, so Row Level Security still decides what each read returns (admin and
-- management read every row these functions touch: CRM, complaints and their timeline, recruitment and its history,
-- live chat (named columns only, never the token hash), submitted orders and their history, field visits and new
-- shops, CSR, products, stockists (who created or changed one through public.stockist_authors, as the stockist screens
-- do) and staff names in profiles). Anyone else is refused at the top with 42501, even
-- where Row Level Security would let them read something, an inactive manager included (current_app_role() is null
-- for an inactive profile). anon cannot execute them at all. search_path is empty and every name is qualified.
--
-- Dates and brands follow 0014: p_from and p_to are Ghana calendar dates (Africa/Accra, UTC all year), both included,
-- default the last 30 days, never backwards, at most about ten years. Where a record carries a brand it must match;
-- orders and field visits match when the brand is one of theirs (brand_ids); stockists when they carry it. Records
-- with no brand (recruitment, corporate CSR programmes, unbranded CRM leads) are left out while a brand is chosen.
--
-- What the feed returns: when, which system, what happened (a kind), the record's id (the portal turns it into a link
-- to the record in its own system), a short title, a detail (a source, a status, an outcome), the brands and who did it
-- (a staff name). Titles are references (cases, orders, applications, chats), shop, product and programme names, and
-- the titles of leads staff typed. Leads from the website forms and live chat get a fixed title instead ("Website
-- enquiry", "Partner enquiry", "Newsletter sign up", "Live chat lead", with the intake reference when there is one),
-- because the database writes the visitor's name into those titles. No contact details: no emails or phone numbers of
-- customers, no visitor or applicant names, message text or notes.
--
-- Indexes: the feed reads each history table by date across all records, which the existing indexes (per record)
-- do not serve, so it adds one date index on each of crm_activities, complaint_events, distributor_order_events,
-- job_application_events and chat_conversations. They are small and only grow with the history itself.

-- Charts -----------------------------------------------------------------------------------------------------------
create function public.management_timeseries(p_from date default null, p_to date default null, p_brand uuid default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_from date := coalesce(p_from, public.ghana_today() - 29);
  v_to date := coalesce(p_to, public.ghana_today());
  v_start timestamptz;
  v_end timestamptz;
  v_unit text;
  v_points jsonb;
begin
  if not coalesce(public.current_app_role() in ('admin', 'management'), false) then
    raise exception 'only admin and management can open the management overview' using errcode = '42501';
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
  -- Up to 62 days: one point a day. Up to about a year: a week (Monday to Sunday). Longer: a month.
  v_unit := case when v_to - v_from < 62 then 'day' when v_to - v_from < 371 then 'week' else 'month' end;

  with buckets as (
    -- Each point covers its day, week or month, cut to the range (the first and last week or month can be partial).
    select greatest(g::date, v_from) as b_from,
           least((g + ('1 ' || v_unit)::interval)::date - 1, v_to) as b_to,
           g::date as b_key
    from generate_series(date_trunc(v_unit, v_from::timestamp), v_to::timestamp, ('1 ' || v_unit)::interval) g
  ), orders as (
    select date_trunc(v_unit, x.submitted_at at time zone 'Africa/Accra')::date as k, count(*) n
    from public.distributor_orders x
    where x.submitted_at >= v_start and x.submitted_at < v_end and (p_brand is null or p_brand = any (x.brand_ids))
    group by 1
  ), leads as (
    select date_trunc(v_unit, x.created_at at time zone 'Africa/Accra')::date as k, count(*) n
    from public.crm_leads x
    where x.created_at >= v_start and x.created_at < v_end and (p_brand is null or x.brand_id = p_brand)
    group by 1
  ), complaints as (
    select date_trunc(v_unit, x.created_at at time zone 'Africa/Accra')::date as k, count(*) n
    from public.complaints x
    where x.created_at >= v_start and x.created_at < v_end and (p_brand is null or x.brand_id = p_brand)
    group by 1
  ), visits as (
    select date_trunc(v_unit, x.visited_at at time zone 'Africa/Accra')::date as k, count(*) n
    from public.field_visits x
    where x.visited_at >= v_start and x.visited_at < v_end and (p_brand is null or p_brand = any (x.brand_ids))
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'from', b.b_from, 'to', b.b_to,
      'orders', coalesce(o.n, 0), 'leads', coalesce(l.n, 0), 'complaints', coalesce(c.n, 0), 'visits', coalesce(v.n, 0)
    ) order by b.b_key), '[]'::jsonb)
  into v_points
  from buckets b
  left join orders o on o.k = b.b_key
  left join leads l on l.k = b.b_key
  left join complaints c on c.k = b.b_key
  left join visits v on v.k = b.b_key;

  return jsonb_build_object('from', v_from, 'to', v_to, 'brand_id', p_brand, 'unit', v_unit, 'points', v_points);
end;
$$;

revoke all on function public.management_timeseries(date, date, uuid) from public, anon;
grant execute on function public.management_timeseries(date, date, uuid) to authenticated;

-- Activity feed ----------------------------------------------------------------------------------------------------
-- Systems: orders, field_sales, crm, complaints, recruitment, chat, catalogue, csr. Kinds, and where they come from
-- (history tables first; a record's own date only where no history exists):
--   crm          lead_created (crm_leads.created_at), lead_stage (crm_activities status_change of a lead)
--   complaints   complaint_opened (complaints.created_at), complaint_status (complaint_events status_change)
--   recruitment  application_received (job_applications.created_at), application_stage (job_application_events)
--   chat         chat_started (chat_conversations.created_at), chat_closed (closed_at, closed_by)
--   orders       order_submitted, order_status (distributor_order_events; drafts are never shown)
--   field_sales  visit (field_visits.visited_at), new_shop (field_new_shops.created_at), shop_confirmed (confirmed_at)
--   csr          csr_logged (csr_activities.created_at)
--   catalogue    product_created, product_updated, stockist_created, stockist_updated. Products and stockists keep
--                no history, so only their latest change shows (updated_at, when it is more than a minute after
--                created_at). Shops added on a field visit show once, as new_shop, and their confirmation once, as
--                shop_confirmed (not also as stockist_updated).
-- Paging: newest first by (at, key), where key is "<kind>:<id of the source row>" and unique. Pass the last row's at and key as
-- p_before_at and p_before_key for the next page. has_more says whether there is one.
create function public.management_activity(
  p_from date default null,
  p_to date default null,
  p_brand uuid default null,
  p_system text default null,
  p_person uuid default null,
  p_before_at timestamptz default null,
  p_before_key text default null,
  p_limit integer default 30
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_from date := coalesce(p_from, public.ghana_today() - 29);
  v_to date := coalesce(p_to, public.ghana_today());
  v_start timestamptz;
  v_end timestamptz;
  v_limit integer := coalesce(p_limit, 30);
  v_items jsonb;
  v_count integer;
begin
  if not coalesce(public.current_app_role() in ('admin', 'management'), false) then
    raise exception 'only admin and management can open the management overview' using errcode = '42501';
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
  if p_system is not null and p_system not in ('orders', 'field_sales', 'crm', 'complaints', 'recruitment', 'chat', 'catalogue', 'csr') then
    raise exception 'unknown system' using errcode = '22023';
  end if;
  if (p_before_at is null) <> (p_before_key is null) then
    raise exception 'give both p_before_at and p_before_key, or neither' using errcode = '22023';
  end if;
  if v_limit < 1 or v_limit > 100 then
    raise exception 'the page size must be between 1 and 100' using errcode = '22023';
  end if;

  v_start := v_from::timestamp at time zone 'Africa/Accra';
  v_end := (v_to + 1)::timestamp at time zone 'Africa/Accra';

  with authors as (
    -- Who created or changed the stockists in the range, in one call (staff only, column grants of 0005).
    select sa.stockist_id, sa.created_by, sa.updated_by
    from public.stockist_authors(array(
      select s.id from public.stockists s
      where (p_system is null or p_system = 'catalogue')
        and ((s.created_at >= v_start and s.created_at < v_end) or (s.updated_at >= v_start and s.updated_at < v_end)))) sa
  ), ev as (
    -- CRM ------------------------------------------------------------------------------------------------------------
    select 'crm' as sys, 'lead_created' as kind, l.id as eid, l.id as record_id, l.created_at as at,
           case l.source when 'website_contact_form' then 'Website enquiry' when 'website_partner_form' then 'Partner enquiry'
             when 'website_newsletter' then 'Newsletter sign up' when 'website_live_chat' then 'Live chat lead' else l.title end
           || case when l.source like 'website\_%' and l.intake_reference is not null then ' ' || l.intake_reference else '' end as title,
           l.source as detail,
           case when l.brand_id is null then '{}'::uuid[] else array[l.brand_id] end as brands, l.created_by as actor
    from public.crm_leads l
    where (p_system is null or p_system = 'crm') and l.created_at >= v_start and l.created_at < v_end and (p_before_at is null or l.created_at <= p_before_at)
      and (p_brand is null or l.brand_id = p_brand)
    union all
    select 'crm', 'lead_stage', a.id, l.id, a.occurred_at,
           case l.source when 'website_contact_form' then 'Website enquiry' when 'website_partner_form' then 'Partner enquiry'
             when 'website_newsletter' then 'Newsletter sign up' when 'website_live_chat' then 'Live chat lead' else l.title end
           || case when l.source like 'website\_%' and l.intake_reference is not null then ' ' || l.intake_reference else '' end,
           split_part(a.body, '. Reason:', 1),
           case when l.brand_id is null then '{}'::uuid[] else array[l.brand_id] end, a.created_by
    from public.crm_activities a
    join public.crm_leads l on l.id = a.lead_id
    where (p_system is null or p_system = 'crm') and a.type = 'status_change'
      and a.occurred_at >= v_start and a.occurred_at < v_end and (p_before_at is null or a.occurred_at <= p_before_at) and (p_brand is null or l.brand_id = p_brand)
    -- Complaints -------------------------------------------------------------------------------------------------------
    union all
    select 'complaints', 'complaint_opened', c.id, c.id, c.created_at, c.case_number, c.category || '|' || c.severity,
           array[c.brand_id], c.created_by
    from public.complaints c
    where (p_system is null or p_system = 'complaints') and c.created_at >= v_start and c.created_at < v_end and (p_before_at is null or c.created_at <= p_before_at)
      and (p_brand is null or c.brand_id = p_brand)
    union all
    -- The first line only ("Status changed from X to Y"): later lines hold the resolution and notes.
    select 'complaints', 'complaint_status', e.id, c.id, e.occurred_at, c.case_number, split_part(e.body, E'\n', 1),
           array[c.brand_id], e.created_by
    from public.complaint_events e
    join public.complaints c on c.id = e.complaint_id
    where (p_system is null or p_system = 'complaints') and e.type = 'status_change' and e.body like 'Status changed %'
      and e.occurred_at >= v_start and e.occurred_at < v_end and (p_before_at is null or e.occurred_at <= p_before_at) and (p_brand is null or c.brand_id = p_brand)
    -- Recruitment (no brand) -------------------------------------------------------------------------------------------
    union all
    select 'recruitment', 'application_received', a.id, a.id, a.created_at, a.reference,
           coalesce(a.opening_title_snapshot, a.interest, 'General application'), '{}'::uuid[], null::uuid
    from public.job_applications a
    where (p_system is null or p_system = 'recruitment') and p_brand is null and a.created_at >= v_start and a.created_at < v_end and (p_before_at is null or a.created_at <= p_before_at)
    union all
    select 'recruitment', 'application_stage', e.id, a.id, e.created_at, a.reference, coalesce(e.from_stage, '') || '|' || coalesce(e.to_stage, ''),
           '{}'::uuid[], e.created_by
    from public.job_application_events e
    join public.job_applications a on a.id = e.application_id
    where (p_system is null or p_system = 'recruitment') and p_brand is null and e.type = 'stage_change'
      and e.created_at >= v_start and e.created_at < v_end and (p_before_at is null or e.created_at <= p_before_at)
    -- Live chat (named columns only: staff cannot read token_hash) -----------------------------------------------------
    union all
    select 'chat', 'chat_started', x.id, x.id, x.created_at, x.reference, coalesce(x.start_page, ''), array[x.brand_id], null::uuid
    from public.chat_conversations x
    where (p_system is null or p_system = 'chat') and x.created_at >= v_start and x.created_at < v_end and (p_before_at is null or x.created_at <= p_before_at)
      and (p_brand is null or x.brand_id = p_brand)
    union all
    select 'chat', 'chat_closed', x.id, x.id, x.closed_at, x.reference, '', array[x.brand_id], x.closed_by
    from public.chat_conversations x
    where (p_system is null or p_system = 'chat') and x.closed_at >= v_start and x.closed_at < v_end and (p_before_at is null or x.closed_at <= p_before_at)
      and (p_brand is null or x.brand_id = p_brand)
    -- Distributor orders (staff only ever see submitted orders; drafts never show) -------------------------------------
    union all
    select 'orders', case when e.to_status = 'submitted' then 'order_submitted' else 'order_status' end, e.id, o.id, e.created_at,
           o.reference, coalesce(org.name, '') || '|' || coalesce(e.from_status, '') || '|' || coalesce(e.to_status, '')
             || '|' || case when e.by_distributor then 'distributor' else '' end,
           o.brand_ids, e.created_by
    from public.distributor_order_events e
    join public.distributor_orders o on o.id = e.order_id
    left join public.crm_organisations org on org.id = o.organisation_id
    where (p_system is null or p_system = 'orders') and e.to_status is distinct from 'draft'
      and (e.type = 'status_change' or e.to_status = 'submitted')
      and e.created_at >= v_start and e.created_at < v_end and (p_before_at is null or e.created_at <= p_before_at) and (p_brand is null or p_brand = any (o.brand_ids))
    -- Field sales ------------------------------------------------------------------------------------------------------
    union all
    select 'field_sales', 'visit', v.id, v.id, v.visited_at, v.shop_name, coalesce(fo.label, ''), v.brand_ids, v.rep_id
    from public.field_visits v
    left join public.field_visit_outcomes fo on fo.id = v.outcome_id
    where (p_system is null or p_system = 'field_sales') and v.visited_at >= v_start and v.visited_at < v_end and (p_before_at is null or v.visited_at <= p_before_at)
      and (p_brand is null or p_brand = any (v.brand_ids))
    union all
    select 'field_sales', 'new_shop', s.id, s.id, ns.created_at, s.name, s.town,
           coalesce((select array_agg(sb.brand_id order by sb.brand_id) from public.stockist_brands sb where sb.stockist_id = s.id), '{}'::uuid[]),
           ns.created_by
    from public.field_new_shops ns
    join public.stockists s on s.id = ns.stockist_id
    where (p_system is null or p_system = 'field_sales') and ns.created_at >= v_start and ns.created_at < v_end and (p_before_at is null or ns.created_at <= p_before_at)
      and (p_brand is null or exists (select 1 from public.stockist_brands sb where sb.stockist_id = s.id and sb.brand_id = p_brand))
    union all
    select 'field_sales', 'shop_confirmed', s.id, s.id, ns.confirmed_at, s.name, s.town,
           coalesce((select array_agg(sb.brand_id order by sb.brand_id) from public.stockist_brands sb where sb.stockist_id = s.id), '{}'::uuid[]),
           ns.confirmed_by
    from public.field_new_shops ns
    join public.stockists s on s.id = ns.stockist_id
    where (p_system is null or p_system = 'field_sales') and ns.confirmed_at >= v_start and ns.confirmed_at < v_end and (p_before_at is null or ns.confirmed_at <= p_before_at)
      and (p_brand is null or exists (select 1 from public.stockist_brands sb where sb.stockist_id = s.id and sb.brand_id = p_brand))
    -- CSR ----------------------------------------------------------------------------------------------------------------
    union all
    select 'csr', 'csr_logged', a.id, a.id, a.created_at, pr.name, a.status || '|' || a.place || '|' || a.activity_date::text,
           case when pr.brand_id is null then '{}'::uuid[] else array[pr.brand_id] end, a.created_by
    from public.csr_activities a
    join public.csr_programmes pr on pr.id = a.programme_id
    where (p_system is null or p_system = 'csr') and a.created_at >= v_start and a.created_at < v_end and (p_before_at is null or a.created_at <= p_before_at)
      and (p_brand is null or pr.brand_id = p_brand)
    -- Products and stockists ---------------------------------------------------------------------------------------------
    union all
    select 'catalogue', 'product_created', p.id, p.id, p.created_at, p.name, case when p.is_published then 'published' else 'draft' end,
           array[p.brand_id], null::uuid
    from public.products p
    where (p_system is null or p_system = 'catalogue') and p.created_at >= v_start and p.created_at < v_end and (p_before_at is null or p.created_at <= p_before_at)
      and (p_brand is null or p.brand_id = p_brand)
    union all
    select 'catalogue', 'product_updated', p.id, p.id, p.updated_at, p.name, case when p.is_published then 'published' else 'draft' end,
           array[p.brand_id], p.updated_by
    from public.products p
    where (p_system is null or p_system = 'catalogue') and p.updated_at >= v_start and p.updated_at < v_end and (p_before_at is null or p.updated_at <= p_before_at)
      and p.updated_at > p.created_at + interval '1 minute' and (p_brand is null or p.brand_id = p_brand)
    union all
    select 'catalogue', 'stockist_created', s.id, s.id, s.created_at, s.name, s.town,
           coalesce((select array_agg(sb.brand_id order by sb.brand_id) from public.stockist_brands sb where sb.stockist_id = s.id), '{}'::uuid[]),
           sa.created_by
    from public.stockists s
    left join authors sa on sa.stockist_id = s.id
    where (p_system is null or p_system = 'catalogue') and s.created_at >= v_start and s.created_at < v_end and (p_before_at is null or s.created_at <= p_before_at)
      and not exists (select 1 from public.field_new_shops ns where ns.stockist_id = s.id)
      and (p_brand is null or exists (select 1 from public.stockist_brands sb where sb.stockist_id = s.id and sb.brand_id = p_brand))
    union all
    select 'catalogue', 'stockist_updated', s.id, s.id, s.updated_at, s.name, s.town,
           coalesce((select array_agg(sb.brand_id order by sb.brand_id) from public.stockist_brands sb where sb.stockist_id = s.id), '{}'::uuid[]),
           sa.updated_by
    from public.stockists s
    left join authors sa on sa.stockist_id = s.id
    where (p_system is null or p_system = 'catalogue') and s.updated_at >= v_start and s.updated_at < v_end and (p_before_at is null or s.updated_at <= p_before_at)
      and s.updated_at > s.created_at + interval '1 minute'
      -- Confirming a new shop switches it on: that shows once, as shop_confirmed.
      and not exists (select 1 from public.field_new_shops ns where ns.stockist_id = s.id and ns.confirmed_at is not null
                        and abs(extract(epoch from s.updated_at - ns.confirmed_at)) <= 60)
      and (p_brand is null or exists (select 1 from public.stockist_brands sb where sb.stockist_id = s.id and sb.brand_id = p_brand))
  ), keyed as (
    select ev.*, ev.kind || ':' || ev.eid::text as key
    from ev
    where (p_person is null or ev.actor = p_person)
  ), page as (
    select k.* from keyed k
    where p_before_at is null or (k.at, k.key) < (p_before_at, p_before_key)
    order by k.at desc, k.key desc
    limit v_limit + 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'key', pg.key, 'at', pg.at, 'system', pg.sys, 'kind', pg.kind, 'record_id', pg.record_id, 'title', pg.title,
      'detail', pg.detail, 'brand_ids', to_jsonb(pg.brands), 'actor_id', pg.actor,
      'actor_name', case when pg.actor is null then null
                         else coalesce(nullif(btrim(pr.full_name), ''), pr.email, 'Former staff') end
    ) order by pg.at desc, pg.key desc), '[]'::jsonb),
    count(*)
  into v_items, v_count
  from page pg
  left join public.profiles pr on pr.id = pg.actor;

  if v_count > v_limit then
    v_items := v_items - v_limit;
  end if;
  return jsonb_build_object('items', v_items, 'has_more', v_count > v_limit);
end;
$$;

revoke all on function public.management_activity(date, date, uuid, text, uuid, timestamptz, text, integer) from public, anon;
grant execute on function public.management_activity(date, date, uuid, text, uuid, timestamptz, text, integer) to authenticated;

-- Date indexes for the feed (the existing ones lead with the record id). "if not exists": none of these names exist.
create index if not exists crm_activities_occurred_idx on public.crm_activities (occurred_at desc);
create index if not exists complaint_events_occurred_idx on public.complaint_events (occurred_at desc);
create index if not exists distributor_order_events_created_idx on public.distributor_order_events (created_at desc);
create index if not exists job_application_events_created_idx on public.job_application_events (created_at desc);
create index if not exists chat_conversations_created_idx on public.chat_conversations (created_at desc);

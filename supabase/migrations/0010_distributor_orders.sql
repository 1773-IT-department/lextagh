-- 0010_distributor_orders: the distributor ordering portal (scoreboard item 23).
-- A distributor login (role distributor) is linked to one CRM organisation. The distributor orders SKUs of the brands
-- that organisation carries (crm_organisation_brands), in the pack units Product Management already has
-- (product_skus.pack_size_label). Lexta staff work the orders in one inbox. Nothing is seeded.
--
-- No prices anywhere: product_skus has no price fields, so orders are quantities only. Pricing and invoicing come later
-- or from Lexta's ERP; the ERP connection is out of scope ([PLACEHOLDER: pricing and invoicing]).
-- No email: [PLACEHOLDER: notify sales by email when an order is submitted] waits until email is set up.
--
-- Tables
--   distributor_accounts             which organisation a distributor login orders for (one organisation per login,
--                                    several logins per organisation)
--   distributor_orders               the order: LX-ORD-<year>-0001 reference (from the database, counting from 1 again
--                                    each year), organisation, status, delivery region and address, the distributor's
--                                    notes, the brands on the order (set by the database when it is submitted) and the
--                                    time of each step
--   distributor_order_lines          SKU and quantity (whole packs). Product name, SKU code, pack size and brand are
--                                    copied when the line is added, so the order still reads correctly if the product
--                                    changes or is deleted later
--   distributor_order_events         history: created, and every status change with who, when, from, to and the note.
--                                    Written by the database only
--   distributor_order_staff_notes    internal staff notes. The distributor never sees them
--   distributor_order_counters       one row per year for the references. Nobody reads it over the API
--
-- Statuses and who may move an order (nothing else is possible, not even for admin):
--   draft      -> submitted   the distributor (needs at least one line and a delivery region or address)
--   draft      -> cancelled   the distributor (drops a draft they no longer want)
--   submitted  -> cancelled   the distributor (only before staff confirm), or staff with a reason
--   submitted  -> confirmed   staff
--   confirmed  -> dispatched  staff
--   confirmed  -> cancelled   staff, with a reason
--   dispatched -> delivered   staff
-- "Staff" here means admin, management and sales_rep. Admin and management see every brand; a sales rep sees and works
-- an order when at least one brand on it is one of theirs (profile_brands). Staff never see drafts.
--
-- Who can do what:
--   distributor (linked, active)    read their organisation's account, orders, lines and history; create orders (always
--                                   for their own organisation, as drafts); edit a draft's delivery details, notes and
--                                   lines; submit; cancel a draft or a submitted order. Nothing in any other system.
--   admin, management, sales_rep    read submitted orders of their brands with lines and history; confirm, dispatch,
--                                   deliver and cancel (with a reason); read and add internal notes; link and unlink
--                                   distributor logins (a sales rep only to organisations they can see in the CRM)
--   admin                           also the only role that deletes orders (with their lines, history and notes) and
--                                   internal notes
--   customer_care, hr, marketing,   nothing at all
--   no role, website visitors
--
-- This migration only creates new objects. It drops and alters nothing that already exists.

-- Helpers -----------------------------------------------------------------------------------------------
-- The people who work orders: admin, management and sales reps.
create function public.order_staff_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'sales_rep'), false);
$$;

-- May this staff member see an order with these brands? Admin and management: every brand. Sales reps: one of theirs.
create function public.order_staff_sees(target_brands uuid[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management'), false)
    or (
      coalesce(public.current_app_role() = 'sales_rep', false)
      and exists (
        select 1 from public.profile_brands pb
        where pb.profile_id = (select auth.uid()) and pb.brand_id = any (coalesce(target_brands, '{}'))
      )
    );
$$;

revoke all on function public.order_staff_role() from public, anon;
revoke all on function public.order_staff_sees(uuid[]) from public, anon;
grant execute on function public.order_staff_role() to authenticated;
grant execute on function public.order_staff_sees(uuid[]) to authenticated;

-- Distributor accounts ------------------------------------------------------------------------------------
create table public.distributor_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  organisation_id uuid not null references public.crm_organisations (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index distributor_accounts_organisation_idx on public.distributor_accounts (organisation_id);
create index distributor_accounts_created_by_idx on public.distributor_accounts (created_by);

create trigger distributor_accounts_set_updated_at before update on public.distributor_accounts
  for each row execute function public.set_updated_at();

-- The organisation the signed in person orders for: only an active distributor login that is linked.
create function public.distributor_org()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select da.organisation_id
  from public.distributor_accounts da
  join public.profiles p on p.id = da.profile_id
  where da.profile_id = (select auth.uid()) and p.is_active and p.role = 'distributor';
$$;

revoke all on function public.distributor_org() from public, anon;
grant execute on function public.distributor_org() to authenticated;

-- Only distributor logins are linked; the author comes from the session. Security definer to read the profile.
create function public.check_distributor_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = new.profile_id and p.role = 'distributor') then
    raise exception 'only a distributor login can be linked to an organisation' using errcode = '23514';
  end if;
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

revoke all on function public.check_distributor_account() from public, anon, authenticated;

create trigger distributor_accounts_check before insert or update on public.distributor_accounts
  for each row execute function public.check_distributor_account();

-- May this staff member link or unlink a login for this organisation? Admin and management: any. Sales reps: an
-- organisation they can see in the CRM.
create function public.order_staff_may_link(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.order_staff_role()
     and (public.sees_all_brands() or public.crm_can_see_org(target_org));
$$;

revoke all on function public.order_staff_may_link(uuid) from public, anon;
grant execute on function public.order_staff_may_link(uuid) to authenticated;

-- Order references ------------------------------------------------------------------------------------------
-- Same scheme as complaint case numbers: the year's row is locked until the transaction ends, so two orders made at
-- the same moment always get different references.
create table public.distributor_order_counters (
  year integer primary key check (year between 2000 and 9999),
  last_number integer not null check (last_number >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger distributor_order_counters_set_updated_at before update on public.distributor_order_counters
  for each row execute function public.set_updated_at();

create function public.next_distributor_order_reference(ref_year integer)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  insert into public.distributor_order_counters as c (year, last_number)
  values (ref_year, 1)
  on conflict (year) do update set last_number = c.last_number + 1
  returning c.last_number into n;
  return 'LX-ORD-' || ref_year::text || '-' || case when n < 10000 then lpad(n::text, 4, '0') else n::text end;
end;
$$;

revoke all on function public.next_distributor_order_reference(integer) from public, anon, authenticated;

-- Orders ---------------------------------------------------------------------------------------------------
create table public.distributor_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^LX-ORD-[0-9]{4}-[0-9]{4,}$'),
  -- An organisation with orders cannot be deleted from the CRM.
  organisation_id uuid not null references public.crm_organisations (id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'confirmed', 'dispatched', 'delivered', 'cancelled')),
  -- The brands on the order's lines, set by the database when the order is submitted (staff see orders by brand).
  brand_ids uuid[] not null default '{}',
  delivery_region_id uuid references public.regions (id) on delete set null,
  delivery_address text check (delivery_address is null or length(btrim(delivery_address)) between 1 and 300),
  distributor_notes text check (distributor_notes is null or length(distributor_notes) <= 2000),
  status_changed_at timestamptz not null default now(),
  submitted_at timestamptz,
  confirmed_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null
);

create index distributor_orders_organisation_idx on public.distributor_orders (organisation_id, created_at desc);
create index distributor_orders_status_idx on public.distributor_orders (status, submitted_at desc);
create index distributor_orders_submitted_idx on public.distributor_orders (submitted_at desc) where submitted_at is not null;
create index distributor_orders_brands_idx on public.distributor_orders using gin (brand_ids);
create index distributor_orders_region_idx on public.distributor_orders (delivery_region_id);
create index distributor_orders_created_by_idx on public.distributor_orders (created_by);
create index distributor_orders_updated_by_idx on public.distributor_orders (updated_by);

-- Lines --------------------------------------------------------------------------------------------------
create table public.distributor_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.distributor_orders (id) on delete cascade,
  -- Empty only when the SKU was deleted later; the copies below keep what was ordered.
  sku_id uuid references public.product_skus (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  brand_id uuid not null references public.brands (id) on delete restrict,
  product_name_snapshot text not null,
  sku_code_snapshot text not null,
  variant_snapshot text,
  pack_size_snapshot text not null,
  -- Whole packs of pack_size_snapshot.
  quantity integer not null check (quantity between 1 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, sku_id)
);

create index distributor_order_lines_sku_idx on public.distributor_order_lines (sku_id);
create index distributor_order_lines_product_idx on public.distributor_order_lines (product_id);
create index distributor_order_lines_brand_idx on public.distributor_order_lines (brand_id);

-- History ----------------------------------------------------------------------------------------------------
create table public.distributor_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.distributor_orders (id) on delete cascade,
  type text not null check (type in ('created', 'status_change')),
  from_status text,
  to_status text,
  note text check (note is null or length(note) <= 1000),
  -- True when the distributor made the change, so their screen can say "You" and staff screens "Distributor".
  by_distributor boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  -- The moment of the change itself, so a draft made and submitted in one call still lists in order.
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default now()
);

create index distributor_order_events_order_idx on public.distributor_order_events (order_id, created_at desc);
create index distributor_order_events_created_by_idx on public.distributor_order_events (created_by);

-- Internal staff notes ---------------------------------------------------------------------------------------
create table public.distributor_order_staff_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.distributor_orders (id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index distributor_order_staff_notes_order_idx on public.distributor_order_staff_notes (order_id, created_at desc);
create index distributor_order_staff_notes_created_by_idx on public.distributor_order_staff_notes (created_by);

create trigger distributor_orders_set_updated_at before update on public.distributor_orders
  for each row execute function public.set_updated_at();
create trigger distributor_order_lines_set_updated_at before update on public.distributor_order_lines
  for each row execute function public.set_updated_at();
create trigger distributor_order_events_set_updated_at before update on public.distributor_order_events
  for each row execute function public.set_updated_at();
create trigger distributor_order_staff_notes_set_updated_at before update on public.distributor_order_staff_notes
  for each row execute function public.set_updated_at();

-- Order helpers -------------------------------------------------------------------------------------------------
-- May the signed in distributor change this order's lines? Their own organisation's draft only.
create function public.distributor_can_edit_order(target_order uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.distributor_orders o
    where o.id = target_order and o.status = 'draft' and o.organisation_id = public.distributor_org()
  );
$$;

-- Is this SKU orderable by this organisation? Active SKU of a published product of an active brand the organisation
-- carries.
create function public.distributor_sku_orderable(target_sku uuid, target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.product_skus s
    join public.products p on p.id = s.product_id
    join public.brands b on b.id = p.brand_id
    where s.id = target_sku and s.is_active and p.is_published and b.is_active
      and exists (select 1 from public.crm_organisation_brands ob where ob.organisation_id = target_org and ob.brand_id = p.brand_id)
  );
$$;

-- Why this draft cannot be submitted, in words, or null when it can. Answers only for the order's own distributor
-- (and database work without a signed in person).
create function public.distributor_order_problem(target_order uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  o record;
begin
  select * into o from public.distributor_orders where id = target_order;
  if o.id is null then
    return 'order not found';
  end if;
  if (select auth.uid()) is not null and o.organisation_id is distinct from public.distributor_org() then
    return 'order not found';
  end if;
  if not exists (select 1 from public.distributor_order_lines l where l.order_id = o.id) then
    return 'add at least one product before submitting';
  end if;
  if o.delivery_region_id is null and o.delivery_address is null then
    return 'choose a delivery region or enter a delivery address';
  end if;
  if exists (
    select 1 from public.distributor_order_lines l
    where l.order_id = o.id and (l.sku_id is null or not public.distributor_sku_orderable(l.sku_id, o.organisation_id))
  ) then
    return 'a product on this order is no longer available; remove it and submit again';
  end if;
  return null;
end;
$$;

create function public.distributor_order_brand_ids(target_order uuid)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  -- Answers only for the order's own distributor (and database work without a signed in person).
  select coalesce(array_agg(distinct l.brand_id order by l.brand_id), '{}')
  from public.distributor_order_lines l
  join public.distributor_orders o on o.id = l.order_id
  where l.order_id = target_order
    and ((select auth.uid()) is null or o.organisation_id = public.distributor_org());
$$;

-- The organisation's name, for the distributor of that organisation and for staff who may see it (in the CRM, or
-- through an order of theirs).
create function public.distributor_org_name(target_org uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select o.name from public.crm_organisations o
  where o.id = target_org
    and (
      o.id = public.distributor_org()
      or (
        public.order_staff_role()
        and (
          public.sees_all_brands()
          or public.crm_can_see_org(o.id)
          or exists (
            select 1 from public.distributor_orders d
            where d.organisation_id = o.id and d.submitted_at is not null and public.order_staff_sees(d.brand_ids)
          )
        )
      )
    );
$$;

revoke all on function public.distributor_can_edit_order(uuid) from public, anon;
revoke all on function public.distributor_sku_orderable(uuid, uuid) from public, anon, authenticated;
revoke all on function public.distributor_order_problem(uuid) from public, anon;
revoke all on function public.distributor_order_brand_ids(uuid) from public, anon;
revoke all on function public.distributor_org_name(uuid) from public, anon;
grant execute on function public.distributor_can_edit_order(uuid) to authenticated;
grant execute on function public.distributor_order_problem(uuid) to authenticated;
grant execute on function public.distributor_order_brand_ids(uuid) to authenticated;
grant execute on function public.distributor_org_name(uuid) to authenticated;

-- Order triggers --------------------------------------------------------------------------------------------------
-- Triggers on a table fire in name order: distributor_orders_a_number, distributor_orders_b_check, then updated_at.
-- Security definer so it can take a reference; people cannot call next_distributor_order_reference() themselves.
create function public.set_distributor_order_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    -- Ghana time is UTC all year, so the order's year is the UTC year.
    new.reference := public.next_distributor_order_reference(extract(year from new.created_at at time zone 'UTC')::integer);
  else
    new.reference := old.reference;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

revoke all on function public.set_distributor_order_reference() from public, anon, authenticated;

create trigger distributor_orders_a_number before insert or update on public.distributor_orders
  for each row execute function public.set_distributor_order_reference();

-- Every rule for every write. The status flow applies to everyone; who may make each move applies to signed in API
-- calls (role "authenticated"). Security invoker on purpose: current_user is then the caller's role.
create function public.check_distributor_order()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  is_person boolean := current_user = 'authenticated';
  is_distributor boolean;
  is_staff boolean;
  note text := nullif(btrim(coalesce(current_setting('lexta.order_note', true), '')), '');
  problem text;
begin
  if tg_op = 'INSERT' then
    if is_person then
      new.organisation_id := public.distributor_org();
      if new.organisation_id is null then
        raise exception 'only a distributor login linked to an organisation can place orders' using errcode = '42501';
      end if;
    end if;
    new.status := 'draft';
    new.brand_ids := '{}';
    new.status_changed_at := now();
    new.submitted_at := null;
    new.confirmed_at := null;
    new.dispatched_at := null;
    new.delivered_at := null;
    new.cancelled_at := null;
    new.created_by := me;
    new.updated_by := me;
    return new;
  end if;

  -- Fixed once made, for everyone.
  new.organisation_id := old.organisation_id;
  new.created_by := old.created_by;
  new.brand_ids := old.brand_ids;
  new.status_changed_at := old.status_changed_at;
  new.submitted_at := old.submitted_at;
  new.confirmed_at := old.confirmed_at;
  new.dispatched_at := old.dispatched_at;
  new.delivered_at := old.delivered_at;
  new.cancelled_at := old.cancelled_at;
  new.updated_by := coalesce(me, old.updated_by);

  is_distributor := public.distributor_org() is not distinct from old.organisation_id and public.distributor_org() is not null;
  is_staff := public.order_staff_role() and old.submitted_at is not null and public.order_staff_sees(old.brand_ids);

  if new.delivery_region_id is distinct from old.delivery_region_id
     or new.delivery_address is distinct from old.delivery_address
     or new.distributor_notes is distinct from old.distributor_notes then
    if old.status <> 'draft' then
      raise exception 'only a draft order can be changed' using errcode = '23514';
    end if;
    if is_person and not is_distributor then
      raise exception 'only the distributor changes the delivery details of a draft' using errcode = '42501';
    end if;
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft' and new.status in ('submitted', 'cancelled'))
      or (old.status = 'submitted' and new.status in ('confirmed', 'cancelled'))
      or (old.status = 'confirmed' and new.status in ('dispatched', 'cancelled'))
      or (old.status = 'dispatched' and new.status = 'delivered')
    ) then
      raise exception 'an order cannot move from % to %', old.status, new.status using errcode = '23514';
    end if;

    if is_person then
      if old.status = 'draft' then
        if not is_distributor then
          raise exception 'only the distributor submits or drops a draft' using errcode = '42501';
        end if;
      elsif old.status = 'submitted' and new.status = 'cancelled' then
        if not (is_distributor or is_staff) then
          raise exception 'not allowed to cancel this order' using errcode = '42501';
        end if;
        if not is_distributor and note is null then
          raise exception 'give the reason for cancelling' using errcode = '23514';
        end if;
      else
        if not is_staff then
          raise exception 'only Lexta staff move an order from % to %', old.status, new.status using errcode = '42501';
        end if;
        if new.status = 'cancelled' and note is null then
          raise exception 'give the reason for cancelling' using errcode = '23514';
        end if;
      end if;
    end if;

    if new.status = 'submitted' then
      problem := public.distributor_order_problem(old.id);
      if problem is not null then
        raise exception '%', problem using errcode = '23514';
      end if;
      new.brand_ids := public.distributor_order_brand_ids(old.id);
      new.submitted_at := now();
    elsif new.status = 'confirmed' then
      new.confirmed_at := now();
    elsif new.status = 'dispatched' then
      new.dispatched_at := now();
    elsif new.status = 'delivered' then
      new.delivered_at := now();
    elsif new.status = 'cancelled' then
      new.cancelled_at := now();
    end if;
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.check_distributor_order() from public, anon, authenticated;

create trigger distributor_orders_b_check before insert or update on public.distributor_orders
  for each row execute function public.check_distributor_order();

-- Writes the history: created, and every status change with the note given to set_distributor_order_status.
create function public.log_distributor_order_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  by_dist boolean := me is not null and public.distributor_org() is not distinct from new.organisation_id;
  note text := nullif(btrim(coalesce(current_setting('lexta.order_note', true), '')), '');
begin
  if tg_op = 'INSERT' then
    insert into public.distributor_order_events (order_id, type, to_status, by_distributor, created_by)
    values (new.id, 'created', new.status, by_dist, me);
    return null;
  end if;
  insert into public.distributor_order_events (order_id, type, from_status, to_status, note, by_distributor, created_by)
  values (new.id, 'status_change', old.status, new.status, left(note, 1000), by_dist, me);
  -- The note belongs to this one change.
  perform set_config('lexta.order_note', '', true);
  return null;
end;
$$;

revoke all on function public.log_distributor_order_change() from public, anon, authenticated;

create trigger distributor_orders_log_insert after insert on public.distributor_orders
  for each row execute function public.log_distributor_order_change();
create trigger distributor_orders_log_status after update of status on public.distributor_orders
  for each row when (old.status is distinct from new.status)
  execute function public.log_distributor_order_change();

-- Lines: only on a draft, only orderable SKUs, copies from the product data. Security definer to read the
-- organisation's brands and the product, whatever the caller may read.
create function public.check_distributor_order_line()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  o record;
  s record;
begin
  if tg_op = 'UPDATE' then
    new.order_id := old.order_id;
    new.product_id := case when new.product_id is null then null else old.product_id end;
    new.brand_id := old.brand_id;
    new.product_name_snapshot := old.product_name_snapshot;
    new.sku_code_snapshot := old.sku_code_snapshot;
    new.variant_snapshot := old.variant_snapshot;
    new.pack_size_snapshot := old.pack_size_snapshot;
    -- The only other change is the SKU or product link going empty because that record was deleted.
    if new.sku_id is not null and new.sku_id is distinct from old.sku_id then
      raise exception 'a line keeps its product; remove it and add the other one' using errcode = '23514';
    end if;
    if new.quantity is distinct from old.quantity
       and not exists (select 1 from public.distributor_orders d where d.id = old.order_id and d.status = 'draft') then
      raise exception 'lines can only change while the order is a draft' using errcode = '23514';
    end if;
    return new;
  end if;

  -- Someone else's order: refused before anything about it is checked (Row Level Security would refuse it too).
  if (select auth.uid()) is not null and not public.distributor_can_edit_order(new.order_id) then
    raise exception 'not allowed to change this order' using errcode = '42501';
  end if;
  select d.status, d.organisation_id into o from public.distributor_orders d where d.id = new.order_id;
  if o.status is distinct from 'draft' then
    raise exception 'lines can only change while the order is a draft' using errcode = '23514';
  end if;
  if new.sku_id is null or not public.distributor_sku_orderable(new.sku_id, o.organisation_id) then
    raise exception 'this product is not available to order' using errcode = '23514';
  end if;
  select p.id as product_id, p.brand_id, p.name, sk.sku_code, sk.variant_name, sk.pack_size_label into s
  from public.product_skus sk join public.products p on p.id = sk.product_id
  where sk.id = new.sku_id;
  new.product_id := s.product_id;
  new.brand_id := s.brand_id;
  new.product_name_snapshot := s.name;
  new.sku_code_snapshot := s.sku_code;
  new.variant_snapshot := s.variant_name;
  new.pack_size_snapshot := s.pack_size_label;
  return new;
end;
$$;

revoke all on function public.check_distributor_order_line() from public, anon, authenticated;

create trigger distributor_order_lines_check before insert or update on public.distributor_order_lines
  for each row execute function public.check_distributor_order_line();

-- Lines are removed only from a draft (or with the whole order).
create function public.check_distributor_order_line_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.distributor_orders d where d.id = old.order_id and d.status <> 'draft') then
    raise exception 'lines can only change while the order is a draft' using errcode = '23514';
  end if;
  return old;
end;
$$;

revoke all on function public.check_distributor_order_line_delete() from public, anon, authenticated;

create trigger distributor_order_lines_check_delete before delete on public.distributor_order_lines
  for each row execute function public.check_distributor_order_line_delete();

-- Internal notes: the author comes from the session.
create function public.set_distributor_order_note_author()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

revoke all on function public.set_distributor_order_note_author() from public, anon, authenticated;

create trigger distributor_order_staff_notes_set_author before insert or update on public.distributor_order_staff_notes
  for each row execute function public.set_distributor_order_note_author();

-- Table privileges -------------------------------------------------------------------------------------------------
-- Website visitors get nothing. Signed in people only write the columns a person types; references, status times,
-- brands, authors and the line copies are set by the database.
revoke all on public.distributor_accounts, public.distributor_order_counters, public.distributor_orders,
  public.distributor_order_lines, public.distributor_order_events, public.distributor_order_staff_notes
  from anon, authenticated;

grant select, delete on public.distributor_accounts to authenticated;
grant insert (profile_id, organisation_id) on public.distributor_accounts to authenticated;

grant select, delete on public.distributor_orders to authenticated;
grant insert (delivery_region_id, delivery_address, distributor_notes) on public.distributor_orders to authenticated;
grant update (status, delivery_region_id, delivery_address, distributor_notes) on public.distributor_orders to authenticated;

grant select, delete on public.distributor_order_lines to authenticated;
grant insert (order_id, sku_id, quantity), update (quantity) on public.distributor_order_lines to authenticated;

grant select on public.distributor_order_events to authenticated;

grant select, delete on public.distributor_order_staff_notes to authenticated;
grant insert (order_id, body) on public.distributor_order_staff_notes to authenticated;

-- Row Level Security ------------------------------------------------------------------------------------------------
alter table public.distributor_accounts enable row level security;
alter table public.distributor_order_counters enable row level security;
alter table public.distributor_orders enable row level security;
alter table public.distributor_order_lines enable row level security;
alter table public.distributor_order_events enable row level security;
alter table public.distributor_order_staff_notes enable row level security;
-- distributor_order_counters: no policies; only the reference function (security definer) touches it.

-- Accounts
create policy "distributors read their own link, order staff read all"
  on public.distributor_accounts for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.order_staff_role()));

create policy "order staff link distributor logins"
  on public.distributor_accounts for insert to authenticated
  with check (public.order_staff_may_link(organisation_id));

create policy "order staff unlink distributor logins"
  on public.distributor_accounts for delete to authenticated
  using (public.order_staff_may_link(organisation_id));
-- No update policy: a link is removed and made again, never moved.

-- Orders
create policy "distributors read their orders, staff read their brands"
  on public.distributor_orders for select to authenticated
  using (
    organisation_id = (select public.distributor_org())
    or (submitted_at is not null and public.order_staff_sees(brand_ids))
  );

create policy "distributors create orders for their organisation"
  on public.distributor_orders for insert to authenticated
  with check (organisation_id = (select public.distributor_org()));

create policy "distributors change drafts and submitted orders"
  on public.distributor_orders for update to authenticated
  using (organisation_id = (select public.distributor_org()) and status in ('draft', 'submitted'))
  with check (organisation_id = (select public.distributor_org()));

create policy "order staff move orders of their brands"
  on public.distributor_orders for update to authenticated
  using (
    (select public.order_staff_role()) and submitted_at is not null
    and status in ('submitted', 'confirmed', 'dispatched') and public.order_staff_sees(brand_ids)
  )
  with check ((select public.order_staff_role()) and public.order_staff_sees(brand_ids));

create policy "admins delete orders"
  on public.distributor_orders for delete to authenticated
  using ((select public.is_admin()) and submitted_at is not null);

-- Lines: the order's own policies decide who reads them (the subquery runs under Row Level Security).
create policy "read lines of orders you see"
  on public.distributor_order_lines for select to authenticated
  using (exists (select 1 from public.distributor_orders o where o.id = order_id));

create policy "distributors add lines to their drafts"
  on public.distributor_order_lines for insert to authenticated
  with check (public.distributor_can_edit_order(order_id));

create policy "distributors change lines of their drafts"
  on public.distributor_order_lines for update to authenticated
  using (public.distributor_can_edit_order(order_id))
  with check (public.distributor_can_edit_order(order_id));

create policy "distributors remove lines from their drafts"
  on public.distributor_order_lines for delete to authenticated
  using (public.distributor_can_edit_order(order_id));

-- History: written by the database only.
create policy "read history of orders you see"
  on public.distributor_order_events for select to authenticated
  using (exists (select 1 from public.distributor_orders o where o.id = order_id));
-- No insert, update or delete policy: the history is a record of what happened (it goes with its order).

-- Internal notes: staff only, never the distributor.
create policy "order staff read internal notes of orders they see"
  on public.distributor_order_staff_notes for select to authenticated
  using ((select public.order_staff_role()) and exists (select 1 from public.distributor_orders o where o.id = order_id));

create policy "order staff add internal notes to orders they see"
  on public.distributor_order_staff_notes for insert to authenticated
  with check (
    (select public.order_staff_role())
    and exists (select 1 from public.distributor_orders o where o.id = order_id and o.submitted_at is not null)
  );

create policy "admins delete internal notes"
  on public.distributor_order_staff_notes for delete to authenticated
  using ((select public.is_admin()));
-- No update policy: a note is a record; add another one to correct it.

-- Portal functions ---------------------------------------------------------------------------------------------------
-- The signed in distributor's account: organisation and the brands it carries, or null when the login is not linked.
create function public.my_distributor_account()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'organisation_id', o.id,
    'organisation_name', o.name,
    'region_id', o.region_id,
    'brands', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'slug', b.slug, 'name', b.name) order by b.name)
      from public.crm_organisation_brands ob join public.brands b on b.id = ob.brand_id
      where ob.organisation_id = o.id and b.is_active
    ), '[]'::jsonb)
  )
  from public.crm_organisations o
  where o.id = public.distributor_org();
$$;

revoke all on function public.my_distributor_account() from public, anon;
grant execute on function public.my_distributor_account() to authenticated;

-- Distributor logins for the linking page (order staff only; everyone else gets nothing). The organisation's name is
-- only given when the caller may see it.
create function public.distributor_logins()
returns table (profile_id uuid, display_name text, email text, is_active boolean, organisation_id uuid,
               organisation_name text, may_unlink boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(nullif(btrim(p.full_name), ''), p.email), p.email, p.is_active, da.organisation_id,
         case when da.organisation_id is not null then public.distributor_org_name(da.organisation_id) end,
         da.organisation_id is not null and public.order_staff_may_link(da.organisation_id)
  from public.profiles p
  left join public.distributor_accounts da on da.profile_id = p.id
  where public.order_staff_role() and p.role = 'distributor'
  order by 2;
$$;

revoke all on function public.distributor_logins() from public, anon;
grant execute on function public.distributor_logins() to authenticated;

-- Names for the history and notes, for order staff only (distributors see "You" and "Lexta").
create function public.distributor_order_people()
returns table (id uuid, display_name text, role public.app_role)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(nullif(btrim(p.full_name), ''), p.email), p.role
  from public.profiles p
  where public.order_staff_role() and p.role in ('admin', 'management', 'sales_rep', 'distributor')
  order by 2;
$$;

revoke all on function public.distributor_order_people() from public, anon;
grant execute on function public.distributor_order_people() to authenticated;

-- Saves a distributor's order in one go: the details and the full set of lines, and submits it when asked. Security
-- invoker: Row Level Security and the triggers decide every write; anything refused undoes the whole save.
-- details: delivery_region_id, delivery_address, distributor_notes, lines ([{sku_id, quantity}], at most 200).
create function public.save_distributor_order(target_id uuid, details jsonb, submit boolean default false)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid := target_id;
  v_lines jsonb := coalesce(details -> 'lines', '[]'::jsonb);
  v_region uuid;
  v_address text;
  v_notes text;
  changed integer;
begin
  if details is null or jsonb_typeof(details) <> 'object' then
    raise exception 'order details are missing' using errcode = '22023';
  end if;
  if jsonb_typeof(v_lines) <> 'array' or jsonb_array_length(v_lines) > 200 then
    raise exception 'an order has at most 200 lines' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_lines) e
    where jsonb_typeof(e) <> 'object' or jsonb_typeof(e -> 'quantity') <> 'number'
       or (e ->> 'quantity')::numeric <> trunc((e ->> 'quantity')::numeric)
       or (e ->> 'quantity')::numeric not between 0 and 100000
  ) then
    raise exception 'each line needs a product and a whole number of packs' using errcode = '22023';
  end if;
  v_region := nullif(details ->> 'delivery_region_id', '')::uuid;
  v_address := nullif(btrim(coalesce(details ->> 'delivery_address', '')), '');
  v_notes := nullif(btrim(coalesce(details ->> 'distributor_notes', '')), '');

  if saved_id is null then
    insert into public.distributor_orders (delivery_region_id, delivery_address, distributor_notes)
    values (v_region, v_address, v_notes)
    returning id into saved_id;
  else
    update public.distributor_orders
       set delivery_region_id = v_region, delivery_address = v_address, distributor_notes = v_notes
     where id = saved_id and status = 'draft';
    get diagnostics changed = row_count;
    if changed = 0 then
      raise exception 'not allowed to change this order' using errcode = '42501';
    end if;
  end if;

  -- Replace the lines: drop the ones no longer there, then add or update the rest (one line per SKU, zero drops it).
  delete from public.distributor_order_lines l
   where l.order_id = saved_id
     and (l.sku_id is null or not exists (
       select 1 from jsonb_array_elements(v_lines) e
       where nullif(e ->> 'sku_id', '')::uuid = l.sku_id and (e ->> 'quantity')::integer > 0
     ));
  insert into public.distributor_order_lines (order_id, sku_id, quantity)
  select saved_id, x.sku_id, x.quantity
  from (
    select nullif(e ->> 'sku_id', '')::uuid as sku_id, max((e ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(v_lines) e
    group by 1
  ) x
  where x.quantity > 0
  on conflict (order_id, sku_id) do update set quantity = excluded.quantity
    where public.distributor_order_lines.quantity is distinct from excluded.quantity;

  if submit then
    update public.distributor_orders set status = 'submitted' where id = saved_id and status = 'draft';
    get diagnostics changed = row_count;
    if changed = 0 then
      raise exception 'not allowed to submit this order' using errcode = '42501';
    end if;
  end if;
  return saved_id;
end;
$$;

-- Moves an order to a status. note: optional, except staff cancelling (it becomes the reason in the history, which the
-- distributor sees).
create function public.set_distributor_order_status(target_id uuid, new_status text, note text default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  perform set_config('lexta.order_note', left(coalesce(btrim(note), ''), 1000), true);
  update public.distributor_orders o set status = new_status
   where o.id = target_id and o.status is distinct from new_status;
  get diagnostics changed = row_count;
  perform set_config('lexta.order_note', '', true);
  if changed = 0 then
    raise exception 'not allowed to change the status of this order' using errcode = '42501';
  end if;
end;
$$;

-- Staff inbox (order staff only): submitted orders the caller may see, with the filters of the inbox. p_status: a status, 'open'
-- (submitted, confirmed or dispatched) or null. Dates are the day submitted (Ghana, which is UTC). Security invoker.
create function public.distributor_order_inbox(
  p_status text default null, p_brand uuid default null, p_org uuid default null, p_from date default null,
  p_to date default null, p_q text default null, p_limit integer default 50, p_offset integer default 0)
returns table (id uuid, reference text, organisation_id uuid, organisation_name text, status text, brand_ids uuid[],
               delivery_region_id uuid, delivery_address text, submitted_at timestamptz, status_changed_at timestamptz,
               line_count integer, pack_count bigint, total_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with f as (
    select o.*, public.distributor_org_name(o.organisation_id) as org_name
    from public.distributor_orders o
    where o.submitted_at is not null
      and public.order_staff_role()
      and (p_status is null
           or (p_status = 'open' and o.status in ('submitted', 'confirmed', 'dispatched'))
           or o.status = p_status)
      and (p_brand is null or p_brand = any (o.brand_ids))
      and (p_org is null or o.organisation_id = p_org)
      and (p_from is null or o.submitted_at >= (p_from::timestamp at time zone 'UTC'))
      and (p_to is null or o.submitted_at < ((p_to + 1)::timestamp at time zone 'UTC'))
  ), g as (
    select * from f
    where nullif(btrim(coalesce(p_q, '')), '') is null
       or f.reference ilike '%' || btrim(p_q) || '%'
       or f.org_name ilike '%' || btrim(p_q) || '%'
  )
  select g.id, g.reference, g.organisation_id, g.org_name, g.status, g.brand_ids, g.delivery_region_id, g.delivery_address,
         g.submitted_at, g.status_changed_at,
         (select count(*)::integer from public.distributor_order_lines l where l.order_id = g.id),
         (select coalesce(sum(l.quantity), 0)::bigint from public.distributor_order_lines l where l.order_id = g.id),
         count(*) over ()
  from g
  order by g.submitted_at desc, g.id
  limit least(greatest(coalesce(p_limit, 50), 1), 5000) offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Orders per status for the inbox counts, with the same filters (except the status).
create function public.distributor_order_counts(
  p_brand uuid default null, p_org uuid default null, p_from date default null, p_to date default null, p_q text default null)
returns table (status text, n bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.status, count(*) from public.distributor_order_inbox(null, p_brand, p_org, p_from, p_to, p_q, 5000, 0) i
  group by i.status;
$$;

-- Organisations with orders the caller sees, for the inbox filter.
create function public.distributor_order_organisations()
returns table (id uuid, name text)
language sql
stable
security invoker
set search_path = ''
as $$
  select x.organisation_id, public.distributor_org_name(x.organisation_id)
  from (select distinct o.organisation_id from public.distributor_orders o
        where o.submitted_at is not null and public.order_staff_role()) x
  order by 2;
$$;

-- CSV export: one row per order line, same filters as the inbox. Internal notes are not included.
create function public.distributor_order_export(
  p_status text default null, p_brand uuid default null, p_org uuid default null, p_from date default null,
  p_to date default null, p_q text default null)
returns table (reference text, submitted_at timestamptz, status text, status_changed_at timestamptz, organisation_name text,
               delivery_region text, delivery_address text, distributor_notes text, brand_name text, product_name text,
               sku_code text, variant text, pack_size text, quantity integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.reference, i.submitted_at, i.status, i.status_changed_at, i.organisation_name, r.name, i.delivery_address,
         o.distributor_notes, b.name, l.product_name_snapshot, l.sku_code_snapshot, l.variant_snapshot,
         l.pack_size_snapshot, l.quantity
  from public.distributor_order_inbox(p_status, p_brand, p_org, p_from, p_to, p_q, 5000, 0) i
  join public.distributor_orders o on o.id = i.id
  join public.distributor_order_lines l on l.order_id = i.id
  left join public.brands b on b.id = l.brand_id
  left join public.regions r on r.id = i.delivery_region_id
  order by i.submitted_at desc, i.reference, b.name, l.product_name_snapshot, l.sku_code_snapshot;
$$;

revoke all on function public.save_distributor_order(uuid, jsonb, boolean) from public, anon;
revoke all on function public.set_distributor_order_status(uuid, text, text) from public, anon;
revoke all on function public.distributor_order_inbox(text, uuid, uuid, date, date, text, integer, integer) from public, anon;
revoke all on function public.distributor_order_counts(uuid, uuid, date, date, text) from public, anon;
revoke all on function public.distributor_order_organisations() from public, anon;
revoke all on function public.distributor_order_export(text, uuid, uuid, date, date, text) from public, anon;
grant execute on function public.save_distributor_order(uuid, jsonb, boolean) to authenticated;
grant execute on function public.set_distributor_order_status(uuid, text, text) to authenticated;
grant execute on function public.distributor_order_inbox(text, uuid, uuid, date, date, text, integer, integer) to authenticated;
grant execute on function public.distributor_order_counts(uuid, uuid, date, date, text) to authenticated;
grant execute on function public.distributor_order_organisations() to authenticated;
grant execute on function public.distributor_order_export(text, uuid, uuid, date, date, text) to authenticated;

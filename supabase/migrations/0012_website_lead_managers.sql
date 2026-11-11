-- 0012_website_lead_managers: who manages the leads that arrive from the websites.
-- Owner decision: Lexta's admin chooses, in the portal, who manages website leads. One default manager for every
-- brand, plus an optional manager per brand that overrides the default. A new lead from the website with no owner
-- (one made by the website forms, source website_contact_form, website_partner_form or website_newsletter, or one
-- made from a live chat, source website_live_chat) gets the brand's manager, else the default manager, else stays
-- unowned (the behaviour before this migration). A lead a person creates in the portal with a website form source
-- stays as they made it.
--
-- New objects: two tables, their functions and triggers, and one new BEFORE INSERT trigger on crm_leads.
-- One change to an existing object, under "Change to an existing object" below: public.set_crm_authors (0006) is
-- replaced so that deleting a person who created or last changed a CRM lead, contact or organisation (any website
-- lead manager will have) never fails. Nothing else existing is changed.
--
-- Who can do what:
--   admin                  read and change the managers; read the change history
--   management             read the managers and the change history (no changes)
--   everyone else, anon    nothing
--
-- Who can be a manager: an active person who can work CRM leads, i.e. admin, management, sales_rep or marketing
-- (customer care too, only once public.crm_care_may_edit() is switched on, because today customer care cannot
-- work a lead). For a brand specific manager, a sales rep or marketer must also work on that brand
-- (profile_brands), so the leads they get are leads of a brand they see anyway. The default manager applies to every
-- brand; whoever owns a lead always sees it (crm_can_see_lead), so no brand link is needed there.
-- When a lead arrives and the chosen person no longer qualifies (deactivated, role changed, brand removed), the
-- next choice down the chain is used: brand manager, then default manager, then nobody.
--
-- Every change (set, change, clear, a manager's account or a brand being deleted) writes a row in the history, with the
-- names as they were at that moment, so the history stays readable after people or brands are deleted.
--
-- Trigger order on crm_leads: Postgres runs triggers of the same timing in name order. The new trigger,
-- crm_leads_website_owner, sorts after crm_leads_check, crm_leads_set_authors and crm_leads_set_stage_fields, so
-- crm_leads_check (0006) still sees the owner the caller sent. That matters for public.chat_create_lead (0009),
-- which runs as the signed in customer care person: had the manager been filled in first, crm_leads_check would
-- refuse it ("only admin and management can assign records to other people"). The new trigger makes its own owner
-- check instead (same rule as crm_is_staff, plus the brand rule above). Website intake (submit_website_enquiry,
-- 0006) runs as the database owner with no session, and is unaffected otherwise. Leads that arrive with an owner
-- keep it; leads from other sources, and leads people create in the portal with a website form source, are never
-- touched; existing leads are not back filled.
-- No CRM activity and no notification is written: owner changes are not logged on the timeline anywhere in the CRM
-- today, and email is out of scope until it is set up.

-- Change to an existing object (the only one) ----------------------------------------------------------------------
-- set_crm_authors (0006) put the old created_by back on every update, and the old updated_by when there is no
-- session, so deleting a person who created or last changed a CRM organisation, contact or lead failed: the on delete
-- set null was undone and the foreign key refused it. It now keeps an old author only while that person still exists,
-- and never writes back a signed in person who is being deleted (order_author_kept, 0010; 0011 made the same change to
-- set_crm_activity_author). Nothing else about it changes: website intake still keeps the last staff editor.
create or replace function public.set_crm_authors()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = (select auth.uid());
  else
    new.created_by = public.order_author_kept(old.created_by);
  end if;
  -- Website intake runs without a session: it keeps the last staff editor rather than blanking it.
  new.updated_by = coalesce(
    public.order_author_kept((select auth.uid())),
    case when tg_op = 'UPDATE' then public.order_author_kept(old.updated_by) end
  );
  return new;
end;
$$;

revoke all on function public.set_crm_authors() from public, anon, authenticated;

-- Who may manage website leads (for one brand, or for every brand when target_brand is null). --------------------
create function public.crm_website_lead_manager_ok(target_profile uuid, target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = target_profile
      and p.is_active
      and (
        p.role in ('admin', 'management')
        or (p.role = 'customer_care' and public.crm_care_may_edit())
        or (
          p.role in ('sales_rep', 'marketing')
          and (
            target_brand is null
            or exists (select 1 from public.profile_brands pb where pb.profile_id = p.id and pb.brand_id = target_brand)
          )
        )
      )
  );
$$;

-- Internal: only the security definer functions below call it.
revoke all on function public.crm_website_lead_manager_ok(uuid, uuid) from public, anon, authenticated;

-- A display name for a person, for the history.
create function public.crm_profile_label(target_profile uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(btrim(p.full_name), ''), p.email) from public.profiles p where p.id = target_profile;
$$;

revoke all on function public.crm_profile_label(uuid) from public, anon, authenticated;

-- Settings ------------------------------------------------------------------------------------------------------
-- One row per brand that has its own manager, and at most one row with no brand: the default for every brand.
-- manager_id is cleared (not the row) when that person is deleted; an empty manager counts as "not set".
create table public.crm_website_lead_managers (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands (id) on delete cascade,
  manager_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint crm_website_lead_managers_brand_key unique nulls not distinct (brand_id)
);

create index crm_website_lead_managers_manager_idx on public.crm_website_lead_managers (manager_id);
create index crm_website_lead_managers_updated_by_idx on public.crm_website_lead_managers (updated_by);

create trigger crm_website_lead_managers_set_updated_at before update on public.crm_website_lead_managers
  for each row execute function public.set_updated_at();

-- History -------------------------------------------------------------------------------------------------------
create table public.crm_website_lead_manager_changes (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('default', 'brand')),
  -- Deliberately not a foreign key: the history keeps the brand's id (and name) after the brand is deleted, so the
  -- name can still be looked up and older rows still group by brand.
  brand_id uuid,
  brand_name text,
  old_manager_id uuid references public.profiles (id) on delete set null,
  old_manager_name text,
  new_manager_id uuid references public.profiles (id) on delete set null,
  new_manager_name text,
  -- 'changed' by a person; 'manager_deleted' when the manager's account was deleted; 'brand_deleted' when the brand
  -- was deleted (its setting goes with it).
  reason text not null default 'changed' check (reason in ('changed', 'manager_deleted', 'brand_deleted')),
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scope = 'brand' or brand_id is null)
);

create index crm_website_lead_manager_changes_created_idx on public.crm_website_lead_manager_changes (created_at desc);
create index crm_website_lead_manager_changes_brand_idx on public.crm_website_lead_manager_changes (brand_id);
create index crm_website_lead_manager_changes_old_idx on public.crm_website_lead_manager_changes (old_manager_id);
create index crm_website_lead_manager_changes_new_idx on public.crm_website_lead_manager_changes (new_manager_id);
create index crm_website_lead_manager_changes_by_idx on public.crm_website_lead_manager_changes (changed_by);

create trigger crm_website_lead_manager_changes_set_updated_at before update on public.crm_website_lead_manager_changes
  for each row execute function public.set_updated_at();

-- Settings checks: the manager must qualify when chosen; the brand never moves; updated_by from the session.
-- Security definer to read profiles and profile_brands. When a person is deleted, their links are cleared (on delete
-- set null) and this trigger must not put them back, or deleting the person fails (order_author_kept, 0010).
create function public.check_crm_website_lead_manager()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.brand_id is distinct from old.brand_id then
    raise exception 'the brand of a website lead manager setting cannot change' using errcode = '42501';
  end if;
  if (tg_op = 'INSERT' or new.manager_id is distinct from old.manager_id)
     and new.manager_id is not null
     and not public.crm_website_lead_manager_ok(new.manager_id, new.brand_id) then
    raise exception 'the website lead manager must be an active person who can work CRM leads of that brand'
      using errcode = '23514';
  end if;
  new.updated_by := coalesce(
    public.order_author_kept((select auth.uid())),
    case when tg_op = 'UPDATE' then public.order_author_kept(old.updated_by) end
  );
  return new;
end;
$$;

revoke all on function public.check_crm_website_lead_manager() from public, anon, authenticated;

create trigger crm_website_lead_managers_check before insert or update on public.crm_website_lead_managers
  for each row execute function public.check_crm_website_lead_manager();

-- Every change writes a history row. Security definer: people have no write access to the history.
create function public.log_crm_website_lead_manager()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_brand uuid;
  v_old uuid;
  v_new uuid;
  v_old_name text;
  v_brand_name text;
  v_me uuid := public.order_author_kept((select auth.uid()));
  v_reason text := 'changed';
begin
  if tg_op = 'INSERT' then
    v_brand := new.brand_id;
    v_new := new.manager_id;
  elsif tg_op = 'UPDATE' then
    v_brand := new.brand_id;
    v_old := old.manager_id;
    v_new := new.manager_id;
  else
    v_brand := old.brand_id;
    v_old := old.manager_id;
  end if;
  if v_old is not distinct from v_new then
    return null;
  end if;

  -- The brand's name: from the brand, or, when the brand is being deleted (this row goes with it), from the history.
  if v_brand is not null then
    select b.name into v_brand_name from public.brands b where b.id = v_brand;
    if v_brand_name is null then
      if tg_op = 'DELETE' then
        v_reason := 'brand_deleted';
      end if;
      select h.brand_name into v_brand_name
        from public.crm_website_lead_manager_changes h
       where h.brand_id = v_brand and h.brand_name is not null
       order by h.created_at desc, h.id desc limit 1;
      v_brand_name := coalesce(v_brand_name, 'A deleted brand');
    end if;
  end if;

  -- The old manager's name: from their profile, or, when their account is being deleted, from the last history row.
  v_old_name := public.crm_profile_label(v_old);
  if v_old is not null and v_old_name is null then
    if tg_op = 'UPDATE' and v_new is null then
      v_reason := 'manager_deleted';
    end if;
    select h.new_manager_name into v_old_name
      from public.crm_website_lead_manager_changes h
     where h.scope = case when v_brand is null then 'default' else 'brand' end
       and h.brand_id is not distinct from v_brand
     order by h.created_at desc, h.id desc limit 1;
    v_old_name := coalesce(v_old_name, 'A former team member');
  end if;

  insert into public.crm_website_lead_manager_changes (scope, brand_id, brand_name, old_manager_id, old_manager_name,
                                                       new_manager_id, new_manager_name, reason, changed_by, changed_by_name, created_at)
  values (
    case when v_brand is null then 'default' else 'brand' end,
    v_brand,
    v_brand_name,
    public.order_author_kept(v_old),
    v_old_name,
    public.order_author_kept(v_new),
    public.crm_profile_label(v_new),
    v_reason,
    v_me,
    public.crm_profile_label(v_me),
    -- The moment of the change itself, so several changes in one save keep their order.
    clock_timestamp()
  );
  return null;
end;
$$;

revoke all on function public.log_crm_website_lead_manager() from public, anon, authenticated;

create trigger crm_website_lead_managers_log after insert or update or delete on public.crm_website_lead_managers
  for each row execute function public.log_crm_website_lead_manager();

-- The manager a new website lead of this brand gets: the brand's own, else the default, each only while that person
-- still qualifies; null when there is none. Security definer: the lead may be created by someone who cannot read the
-- settings (website intake, customer care making a lead from a chat).
create function public.crm_website_lead_manager_for(target_brand uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  -- Only answers inside website intake (no signed in person) and for CRM staff (a lead made from a live chat).
  select case when (select auth.uid()) is null or public.crm_role() then coalesce(
    (select m.manager_id from public.crm_website_lead_managers m
      where target_brand is not null and m.brand_id = target_brand
        and m.manager_id is not null and public.crm_website_lead_manager_ok(m.manager_id, target_brand)),
    (select m.manager_id from public.crm_website_lead_managers m
      where m.brand_id is null
        and m.manager_id is not null and public.crm_website_lead_manager_ok(m.manager_id, null))
  ) end;
$$;

-- The live chat path (chat_create_lead) runs as the signed in person, so they need to run it.
revoke all on function public.crm_website_lead_manager_for(uuid) from public, anon;
grant execute on function public.crm_website_lead_manager_for(uuid) to authenticated;

-- Only genuine website intake is assigned:
--   website forms     the lead is made by public.submit_website_enquiry, which runs as the database owner, so the
--                     role here is not "authenticated". A person who picks a website form source in the portal and
--                     leaves the owner as Nobody keeps an unowned lead (the owner rules of check_crm_record stand).
--   live chat         the lead is made by a person from a chat (public.chat_create_lead, runs as that person), so it
--                     goes by the source 'website_live_chat'.
-- Security invoker on purpose: current_user is then the caller's role (same as check_crm_record, 0006).
create function public.set_crm_website_lead_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.owner_id is null
     and (
       new.source = 'website_live_chat'
       or (new.source in ('website_contact_form', 'website_partner_form', 'website_newsletter') and current_user <> 'authenticated')
     ) then
    new.owner_id := public.crm_website_lead_manager_for(new.brand_id);
  end if;
  return new;
end;
$$;

revoke all on function public.set_crm_website_lead_owner() from public, anon, authenticated;

-- Named to sort after crm_leads_check (see the top of this file).
create trigger crm_leads_website_owner before insert on public.crm_leads
  for each row execute function public.set_crm_website_lead_owner();

-- Saving from the portal --------------------------------------------------------------------------------------
-- Sets the default manager and the managers of the brands given, in one step. brand_managers is an object
-- {"<brand id>": "<profile id>" | null}; null means "use the default". Brands left out are not touched. Only rows
-- that change are written, so the history only shows real changes. Runs as the person: the policies decide.
-- Errors: 42501 not an admin, 22023 bad input, 23514 a person who cannot manage website leads (of that brand).
create function public.save_crm_website_lead_managers(default_manager uuid, brand_managers jsonb)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  k text;
  v text;
  v_brand uuid;
  v_manager uuid;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'only admins can choose website lead managers' using errcode = '42501';
  end if;
  if brand_managers is not null and jsonb_typeof(brand_managers) <> 'object' then
    raise exception 'invalid field: brand_managers' using errcode = '22023';
  end if;

  perform public.crm_website_lead_manager_put(null, default_manager);

  for k, v in select e.key, e.value #>> '{}' from jsonb_each(coalesce(brand_managers, '{}'::jsonb)) e loop
    if k !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or (v is not null and v !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then
      raise exception 'invalid field: brand_managers' using errcode = '22023';
    end if;
    v_brand := k::uuid;
    v_manager := v::uuid;
    if not exists (select 1 from public.brands b where b.id = v_brand) then
      raise exception 'invalid field: brand' using errcode = '22023';
    end if;
    perform public.crm_website_lead_manager_put(v_brand, v_manager);
  end loop;
end;
$$;

-- One setting: set, change or clear (clear deletes the row). Runs as the person.
create function public.crm_website_lead_manager_put(target_brand uuid, target_manager uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'only admins can choose website lead managers' using errcode = '42501';
  end if;
  if target_manager is null then
    delete from public.crm_website_lead_managers m where m.brand_id is not distinct from target_brand;
  else
    -- Already the one chosen: nothing to write. Checked first because an insert attempt runs the check trigger even
    -- when it ends in the update below, which would refuse an unchanged manager who no longer qualifies.
    if exists (select 1 from public.crm_website_lead_managers m
               where m.brand_id is not distinct from target_brand and m.manager_id = target_manager) then
      return;
    end if;
    -- Two admins saving the first setting at once: the second one updates instead of hitting the unique key.
    -- Nothing is written (and nothing logged) when the manager is already the one chosen.
    insert into public.crm_website_lead_managers as m (brand_id, manager_id) values (target_brand, target_manager)
    on conflict on constraint crm_website_lead_managers_brand_key
    do update set manager_id = excluded.manager_id where m.manager_id is distinct from excluded.manager_id;
  end if;
end;
$$;

revoke all on function public.save_crm_website_lead_managers(uuid, jsonb) from public, anon;
revoke all on function public.crm_website_lead_manager_put(uuid, uuid) from public, anon;
grant execute on function public.save_crm_website_lead_managers(uuid, jsonb) to authenticated;
grant execute on function public.crm_website_lead_manager_put(uuid, uuid) to authenticated;

-- Table privileges ------------------------------------------------------------------------------------------------
-- Website visitors get nothing. Admins write only brand and manager; ids, times and authors come from the database.
-- Nobody writes the history directly.
revoke all on public.crm_website_lead_managers, public.crm_website_lead_manager_changes from anon, authenticated;
grant select on public.crm_website_lead_managers, public.crm_website_lead_manager_changes to authenticated;
grant insert (brand_id, manager_id), update (manager_id), delete on public.crm_website_lead_managers to authenticated;

-- Row Level Security ----------------------------------------------------------------------------------------------
alter table public.crm_website_lead_managers enable row level security;
alter table public.crm_website_lead_manager_changes enable row level security;

create policy "admin and management read website lead managers"
  on public.crm_website_lead_managers for select to authenticated
  using ((select public.crm_manages()));

create policy "admins add website lead managers"
  on public.crm_website_lead_managers for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins change website lead managers"
  on public.crm_website_lead_managers for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admins clear website lead managers"
  on public.crm_website_lead_managers for delete to authenticated
  using ((select public.is_admin()));

create policy "admin and management read website lead manager history"
  on public.crm_website_lead_manager_changes for select to authenticated
  using ((select public.crm_manages()));
-- No insert, update or delete policy on the history: only the trigger above writes it.

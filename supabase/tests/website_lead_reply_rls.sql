-- Website lead reply-by time (0026): the settings row and who reads or changes it, response_due_at at intake, and
-- that nobody signed in can set or move it.
-- Run with: bash supabase/tests/local/run.sh website_lead_reply
-- Everything happens inside one transaction that is rolled back at the end.

begin;

create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-00000000b601'
    when 'mgmt' then '00000000-0000-0000-0000-00000000b602'
    when 'rep' then '00000000-0000-0000-0000-00000000b603'
    when 'mkt' then '00000000-0000-0000-0000-00000000b604'
    when 'care' then '00000000-0000-0000-0000-00000000b605'
  end::uuid;
$$;

create function pg_temp.login(label text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', case when label = 'anon' then '' else pg_temp.u(label)::text end, true),
         set_config('role', case when label = 'anon' then 'anon' else 'authenticated' end, true);
$$;

create function pg_temp.owner() returns void language sql as $$
  select set_config('request.jwt.claim.sub', '', true), set_config('role', 'postgres', true);
$$;

create function pg_temp.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL: %', what; end if;
  raise notice 'PASS: %', what;
end;
$$;

-- A website enquiry as a visitor; returns the lead's reply-by time minus its created time.
create function pg_temp.enquiry(form text, email text) returns interval language plpgsql as $$
declare r text; d interval;
begin
  perform pg_temp.login('anon');
  if form = 'partner' then
    r := public.submit_website_enquiry('partner', jsonb_build_object('name', 'Partner ' || email, 'organisation_name', 'Org ' || email, 'email', email, 'brand', 'yazz'));
  else
    r := public.submit_website_enquiry('contact', jsonb_build_object('name', 'Visitor ' || email, 'email', email, 'message', 'Hello from the website', 'brand', 'yazz'));
  end if;
  perform pg_temp.owner();
  select l.response_due_at - l.created_at into d from public.crm_leads l where l.intake_reference = r;
  if not found then raise exception 'FAIL: no lead for %', r; end if;
  return d;
end;
$$;

insert into auth.users (id, email, raw_app_meta_data) values
  (pg_temp.u('admin'), 'admin.reply@test.local', '{"role":"admin"}'),
  (pg_temp.u('mgmt'),  'mgmt.reply@test.local',  '{"role":"management"}'),
  (pg_temp.u('rep'),   'rep.reply@test.local',   '{"role":"sales_rep"}'),
  (pg_temp.u('mkt'),   'mkt.reply@test.local',   '{"role":"marketing"}'),
  (pg_temp.u('care'),  'care.reply@test.local',  '{"role":"customer_care"}');

-- The settings row --------------------------------------------------------------------------------------
select pg_temp.ok((select count(*) from public.crm_website_lead_settings) = 1
                  and (select reply_hours from public.crm_website_lead_settings) = 24,
  'one settings row, reply time 24 hours by default');
select pg_temp.ok((select relrowsecurity from pg_class where oid = 'public.crm_website_lead_settings'::regclass),
  'website lead settings have Row Level Security');

-- Intake ------------------------------------------------------------------------------------------------
select pg_temp.ok(pg_temp.enquiry('contact', 'r1@visitor.test') = interval '24 hours', 'a Contact Us lead is due 24 hours after it arrives');
select pg_temp.ok(pg_temp.enquiry('partner', 'r2@visitor.test') = interval '24 hours', 'a Partner With Us lead is due 24 hours after it arrives');

-- Who reads and changes the reply time --------------------------------------------------------------------
do $$
declare n int;
begin
  perform pg_temp.login('anon');
  begin
    perform 1 from public.crm_website_lead_settings;
    raise exception 'FAIL: visitors can read website lead settings';
  exception when insufficient_privilege then null;
  end;
  perform pg_temp.owner();

  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select reply_hours from public.crm_website_lead_settings) = 24, 'management reads the reply time');
  update public.crm_website_lead_settings set reply_hours = 2;
  get diagnostics n = row_count;
  perform pg_temp.ok(n = 0, 'management cannot change the reply time');

  foreach n in array array[3, 4, 5] loop
    perform pg_temp.login(case n when 3 then 'rep' when 4 then 'mkt' else 'care' end);
    perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_settings), 'sales, marketing and customer care do not see the settings');
  end loop;

  perform pg_temp.login('admin');
  update public.crm_website_lead_settings set reply_hours = 48;
  get diagnostics n = row_count;
  perform pg_temp.ok(n = 1, 'admin changes the reply time');
  perform pg_temp.ok((select updated_by from public.crm_website_lead_settings) = pg_temp.u('admin'), 'the change records who made it');
  begin
    update public.crm_website_lead_settings set reply_hours = 0;
    raise exception 'FAIL: a reply time of 0 hours was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.crm_website_lead_settings set reply_hours = 721;
    raise exception 'FAIL: a reply time above 720 hours was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.crm_website_lead_settings (id, reply_hours) values (true, 5);
    raise exception 'FAIL: admin inserted a second settings row';
  exception when insufficient_privilege or unique_violation then null;
  end;
  begin
    delete from public.crm_website_lead_settings;
    raise exception 'FAIL: admin deleted the settings row';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.crm_website_lead_settings set updated_by = pg_temp.u('mgmt');
    raise exception 'FAIL: admin wrote updated_by directly';
  exception when insufficient_privilege then null;
  end;
  perform pg_temp.owner();
  raise notice 'PASS: only admin changes the reply time, within 1 to 720 hours';
end $$;

select pg_temp.ok(pg_temp.enquiry('contact', 'r3@visitor.test') = interval '48 hours', 'new leads use the changed reply time');

-- Nobody signed in sets or moves the reply-by time -----------------------------------------------------------
do $$
declare v_lead uuid; v_due timestamptz; v_contact uuid; v_new uuid;
begin
  select id, response_due_at into v_lead, v_due from public.crm_leads
   where source = 'website_contact_form' and response_due_at is not null order by created_at desc limit 1;
  perform pg_temp.login('admin');
  begin
    update public.crm_leads set response_due_at = now() + interval '30 days' where id = v_lead;
    raise exception 'FAIL: admin moved a reply-by time';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.crm_leads (title, contact_id, source, response_due_at)
    values ('Typed by hand', (select id from public.crm_contacts limit 1), 'website_contact_form', now());
    raise exception 'FAIL: admin wrote a reply-by time on a new lead';
  exception when insufficient_privilege then null;
  end;
  perform pg_temp.owner();
  perform pg_temp.ok((select response_due_at from public.crm_leads where id = v_lead) = v_due, 'admin cannot set or move a reply-by time');

  perform pg_temp.login('admin');
  insert into public.crm_contacts (full_name, email) values ('Hand Made', 'hand.made@test.local') returning id into v_contact;
  insert into public.crm_leads (title, contact_id, source)
  values ('Typed by hand', v_contact, 'website_contact_form') returning id into v_new;
  perform pg_temp.owner();
  perform pg_temp.ok((select response_due_at from public.crm_leads where id = v_new) is null,
    'a lead typed in the portal gets no reply-by time, even with a website source');

  -- Moving the lead on (the reply) leaves the time in place; the portal only calls a New lead overdue.
  perform pg_temp.login('admin');
  update public.crm_leads set stage = 'contacted' where id = v_lead;
  perform pg_temp.owner();
  perform pg_temp.ok((select response_due_at from public.crm_leads where id = v_lead) = v_due and
                     (select stage from public.crm_leads where id = v_lead) = 'contacted',
    'changing the stage keeps the reply-by time');
end $$;

-- Overdue: what the portal counts ------------------------------------------------------------------------
do $$
declare v_lead uuid;
begin
  select id into v_lead from public.crm_leads where source = 'website_partner_form' and response_due_at is not null limit 1;
  update public.crm_leads set response_due_at = now() - interval '1 hour' where id = v_lead;
  perform pg_temp.login('mgmt');
  perform pg_temp.ok(exists (select 1 from public.crm_leads where id = v_lead and stage = 'new' and response_due_at < now()),
    'management sees an overdue website lead');
  perform pg_temp.owner();
end $$;

rollback;

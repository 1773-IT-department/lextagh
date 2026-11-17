-- 0026_website_lead_reply_deadline: a reply-by time on website leads (Drive requests P3, approved by Desmond 17 November 2026).
--
-- Why: Lexta's routing table says "General contact (Lexta): Shared CRM + marketing@lextagh.com interim routing; assign
-- owner and response SLA" (lexta/website-copy.md:39). 0012 assigns the owner; this adds the response time.
--
-- What it adds:
--   public.crm_website_lead_settings   one row: reply_hours, how many hours the team has to reply to a website lead.
--                                      Default 24, to be confirmed by Lexta. Admin changes it next to the website lead
--                                      managers (0012 keeps those in per brand rows, so the setting gets its own table).
--   public.crm_leads.response_due_at   when the reply is due. Set at intake for leads the Contact Us and Partner With Us
--                                      forms create (the same "genuine intake" test as 0012: the row is written by
--                                      submit_website_enquiry, not by a signed in person): created_at + reply_hours.
--                                      A separate column, not next_action_date: that one is the team's own plan (a date,
--                                      edited on the lead form) and a reply deadline needs the hour.
--   A lead is overdue while it is still at stage New after response_due_at (the portal shows "Overdue"). Moving it on
--   (Contacted, or any later stage) is the reply. Leads made by hand, from live chat (the visitor is answered in the
--   chat) or before this migration get no reply-by time. Changing reply_hours only affects leads that arrive afterwards.
--   Nobody signed in can set or change response_due_at (no column privilege, and the trigger keeps it); the database
--   alone writes it.
--
-- Row Level Security on the new table: admin and management read it; only admin changes reply_hours; nobody inserts or
-- deletes (the one row is created here). crm_leads policies are unchanged. Not applied by this branch: the lead applies it.

-- Settings ------------------------------------------------------------------------------------------------------
create table if not exists public.crm_website_lead_settings (
  -- Always true: the table holds exactly one row.
  id boolean primary key default true check (id),
  reply_hours integer not null default 24 check (reply_hours between 1 and 720),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create index if not exists crm_website_lead_settings_updated_by_idx on public.crm_website_lead_settings (updated_by);

insert into public.crm_website_lead_settings (id, reply_hours) values (true, 24) on conflict (id) do nothing;

drop trigger if exists crm_website_lead_settings_set_updated_at on public.crm_website_lead_settings;
create trigger crm_website_lead_settings_set_updated_at before update on public.crm_website_lead_settings
  for each row execute function public.set_updated_at();

-- updated_by from the session, never from the browser. Kept when the person is deleted (on delete set null), as in 0012.
create or replace function public.set_crm_website_lead_settings_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_by := coalesce(
    public.order_author_kept((select auth.uid())),
    case when tg_op = 'UPDATE' and new.updated_by is not null then public.order_author_kept(old.updated_by) end
  );
  return new;
end;
$$;

revoke all on function public.set_crm_website_lead_settings_author() from public, anon, authenticated;

drop trigger if exists crm_website_lead_settings_author on public.crm_website_lead_settings;
create trigger crm_website_lead_settings_author before insert or update on public.crm_website_lead_settings
  for each row execute function public.set_crm_website_lead_settings_author();

revoke all on public.crm_website_lead_settings from anon, authenticated;
grant select on public.crm_website_lead_settings to authenticated;
grant update (reply_hours) on public.crm_website_lead_settings to authenticated;

alter table public.crm_website_lead_settings enable row level security;

drop policy if exists "admin and management read website lead settings" on public.crm_website_lead_settings;
create policy "admin and management read website lead settings"
  on public.crm_website_lead_settings for select to authenticated
  using ((select public.crm_manages()));

drop policy if exists "admins change website lead settings" on public.crm_website_lead_settings;
create policy "admins change website lead settings"
  on public.crm_website_lead_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- The reply time in hours, for the intake trigger. Security definer: intake must read it whoever runs it.
create or replace function public.crm_website_reply_hours()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select s.reply_hours from public.crm_website_lead_settings s where s.id), 24);
$$;

revoke all on function public.crm_website_reply_hours() from public, anon, authenticated;

-- Reply-by time on leads ------------------------------------------------------------------------------------------
alter table public.crm_leads add column if not exists response_due_at timestamptz;

create index if not exists crm_leads_response_due_idx on public.crm_leads (response_due_at) where stage = 'new';

-- Insert: genuine website intake gets created_at + reply_hours; a signed in person never sets it.
-- Update: a signed in person never changes it.
-- Security invoker on purpose: current_user is then the caller's role (same test as set_crm_website_lead_owner, 0012).
create or replace function public.set_crm_lead_response_due()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if current_user = 'authenticated' then
      new.response_due_at := old.response_due_at;
    end if;
    return new;
  end if;
  if current_user = 'authenticated' then
    new.response_due_at := null;
  elsif new.response_due_at is null and new.source in ('website_contact_form', 'website_partner_form') then
    new.response_due_at := coalesce(new.created_at, now()) + make_interval(hours => public.crm_website_reply_hours());
  end if;
  return new;
end;
$$;

revoke all on function public.set_crm_lead_response_due() from public, anon, authenticated;

-- Named to sort before crm_leads_website_owner, which 0012 keeps as the last before insert trigger.
drop trigger if exists crm_leads_reply_by on public.crm_leads;
create trigger crm_leads_reply_by before insert or update of response_due_at on public.crm_leads
  for each row execute function public.set_crm_lead_response_due();

comment on column public.crm_leads.response_due_at is
  'When a reply to a website lead is due (0026). Overdue while the lead is still at stage new after this time.';

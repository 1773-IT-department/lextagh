-- 0027_complaint_website_attachments: an optional photo or document on the website complaint forms (Drive requests X3,
-- approved by Desmond 17 November 2026).
--
-- Why: Lexta's routing table asks the Yazz complaint form to "collect SKU, batch, store, optional image and consent"
-- (lexta/website-copy.md:40), and the Linzzy contact page lists "Optional Product Photograph or Supporting Document"
-- (linzzy/website-copy.md:478). Website visitors have no login and the websites never hold a service role key, so
-- the file goes through a one time upload ticket, the pattern the Careers CV upload uses (0008).
--
-- How it works:
--   1. The website server checks the file (JPG, PNG or PDF by its first bytes, at most 5 MB) and signs a ticket
--      request with the CHAT_INTAKE_SECRET every website already has (private.chat_intake_secret, 0009). The signed
--      text starts with "complaint-file:" and names the exact type and size:
--        complaint-file:<new uuid>.<unix seconds>.<visitor IP hash>.<mime type>.<size in bytes>
--      Live chat signs "chat.<...>" and its tokens are HMACs of "chat-token.<...>", so no chat signature or token can
--      ever pass as an upload ticket, and the reverse. The IP hash is an HMAC of "complaint-ip:<visitor>".
--   2. public.begin_complaint_file_upload checks the signature (5 minutes), the one time nonce and the per visitor
--      limits, and answers with the path: <nonce>/<clean file name>.<jpg|png|pdf> in the private complaint-files
--      bucket. The nonce becomes the complaint's id, so the path already has the shape staff files have
--      (<complaint id>/<file name>, 0007) and the portal shows it with no change.
--   3. The visitor's browser (or, without JavaScript, the website server) uploads there with the publishable key.
--      Storage only takes a website upload at the path of an open ticket (15 minutes), and only with the ticket's
--      exact size and type when Storage reports them; the bucket keeps its own 10 MB and type limits.
--   4. public.submit_complaint (redefined below, unchanged otherwise) takes attachment_path and attachment_name,
--      checks the ticket is unclaimed and at most an hour old and that the stored file has the ticket's size and type
--      (5 MB at most; JPG, PNG or PDF), creates the complaint with the ticket's uuid as its id, records the file in
--      complaint_files ("File added" on the timeline) and claims the ticket. A refused file names the field
--      "attachment".
--   Unclaimed uploads expire: Storage refuses them after 15 minutes, submit_complaint after an hour, nobody can read
--   them (no complaint has that id), tickets are removed after 7 days, and admins remove the files with the portal's
--   "Remove unclaimed website uploads" button (public.unclaimed_website_complaint_files lists them).
--
-- Row Level Security: on for the new table, with no policies (only the security definer functions touch tickets).
-- Storage gets one new insert policy for website visitors on complaint-files. Every existing policy is unchanged.
-- Set up: none if live chat is already set up (private.chat_intake_secret and CHAT_INTAKE_SECRET on the sites).
-- Not applied by this branch: the lead applies it.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Tickets --------------------------------------------------------------------------------------------------------
create table if not exists public.complaint_upload_tickets (
  -- The nonce of the signed request. It becomes the complaint's id when the file is claimed.
  id uuid primary key,
  object_name text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Storage takes the upload until then (15 minutes).
  upload_by timestamptz not null,
  -- Set when a complaint claims the file.
  claimed_at timestamptz
);

create index if not exists complaint_upload_tickets_ip_idx on public.complaint_upload_tickets (ip_hash, created_at);
create index if not exists complaint_upload_tickets_created_idx on public.complaint_upload_tickets (created_at);

drop trigger if exists complaint_upload_tickets_set_updated_at on public.complaint_upload_tickets;
create trigger complaint_upload_tickets_set_updated_at before update on public.complaint_upload_tickets
  for each row execute function public.set_updated_at();

alter table public.complaint_upload_tickets enable row level security;
revoke all on public.complaint_upload_tickets from public, anon, authenticated;
-- No policies: only the security definer functions below touch tickets.

-- Ticket request ---------------------------------------------------------------------------------------------------
-- Limits: 5 tickets an hour and 10 a day per IP hash; above 1000 a day site wide the intake stops (a circuit breaker,
-- logged as a warning), which only a flood can reach.
-- Errors: 55000 not set up (no chat secret), 22023 bad signature, time, type, size or name, PT429 too many uploads.
create or replace function public.begin_complaint_file_upload(nonce uuid, issued_at bigint, ip_hash text, mime_type text,
  size_bytes integer, signature text, file_name text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_ext text;
  v_stem text;
  v_path text;
  recent integer;
begin
  select s.secret into v_secret from private.chat_intake_secret s where s.id;
  if v_secret is null then
    raise exception 'complaint uploads are not set up' using errcode = '55000';
  end if;
  if nonce is null or issued_at is null or ip_hash is null or ip_hash !~ '^[0-9a-f]{64}$' or mime_type is null
     or size_bytes is null or signature is null or signature !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  -- Compared as HMACs of both values, so the time the comparison takes says nothing about the expected signature.
  if extensions.hmac(encode(extensions.hmac('complaint-file:' || nonce::text || '.' || issued_at::text || '.' || ip_hash
       || '.' || mime_type || '.' || size_bytes::text, v_secret, 'sha256'), 'hex'), v_secret, 'sha256')
     <> extensions.hmac(signature, v_secret, 'sha256') then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  if issued_at < extract(epoch from now())::bigint - 300 or issued_at > extract(epoch from now())::bigint + 60 then
    raise exception 'invalid field: issued_at' using errcode = '22023';
  end if;

  v_ext := case mime_type when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'application/pdf' then 'pdf' end;
  if v_ext is null then
    raise exception 'invalid field: attachment_type' using errcode = '22023';
  end if;
  if size_bytes < 1 or size_bytes > 5242880 then
    raise exception 'invalid field: attachment_size' using errcode = '22023';
  end if;
  v_stem := regexp_replace(left(coalesce(file_name, ''), 300), '\.[A-Za-z0-9]{1,5}$', '');
  v_stem := regexp_replace(v_stem, '[^A-Za-z0-9._-]+', '-', 'g');
  v_stem := regexp_replace(v_stem, '^[^A-Za-z0-9]+', '');
  v_stem := regexp_replace(left(v_stem, 80), '[._-]+$', '');
  v_path := nonce::text || '/' || coalesce(nullif(v_stem, ''), 'attachment') || '.' || v_ext;
  if public.complaint_id_from_path(v_path) is distinct from nonce then
    raise exception 'invalid field: attachment_name' using errcode = '22023';
  end if;

  -- One at a time, so the counts below and the nonce check cannot race.
  perform pg_advisory_xact_lock(67, 0);
  delete from public.complaint_upload_tickets t where t.created_at < now() - interval '7 days';
  if exists (select 1 from public.complaint_upload_tickets t where t.id = nonce)
     or exists (select 1 from public.complaints c where c.id = nonce) then
    raise exception 'invalid field: nonce' using errcode = '22023';
  end if;
  select count(*) into recent from public.complaint_upload_tickets t
   where t.ip_hash = begin_complaint_file_upload.ip_hash and t.created_at > now() - interval '1 hour';
  if recent >= 5 then
    raise exception 'too many uploads, please try again later' using errcode = 'PT429';
  end if;
  select count(*) into recent from public.complaint_upload_tickets t
   where t.ip_hash = begin_complaint_file_upload.ip_hash and t.created_at > now() - interval '1 day';
  if recent >= 10 then
    raise exception 'too many uploads, please try again tomorrow' using errcode = 'PT429';
  end if;
  select count(*) into recent from public.complaint_upload_tickets t where t.created_at > now() - interval '1 day';
  if recent >= 1000 then
    raise warning 'LEXTA COMPLAINT UPLOAD CIRCUIT BREAKER: website complaint uploads stopped, % tickets in the last day (limit 1000)', recent;
    raise exception 'too many uploads, please try again later' using errcode = 'PT429';
  end if;

  insert into public.complaint_upload_tickets (id, object_name, mime_type, size_bytes, ip_hash, upload_by)
  values (nonce, v_path, mime_type, size_bytes, begin_complaint_file_upload.ip_hash, now() + interval '15 minutes');
  return v_path;
end;
$$;

revoke all on function public.begin_complaint_file_upload(uuid, bigint, text, text, integer, text, text) from public, authenticated;
grant execute on function public.begin_complaint_file_upload(uuid, bigint, text, text, integer, text, text) to anon;

-- Storage's check for a website upload: an open ticket for exactly this path, and, when Storage reports them, the
-- ticket's exact size and type. Website visitors need to run it (Storage applies the policy as them); it only answers
-- for a path, and ticketed paths contain a random uuid the server got from the database, so it reveals nothing useful.
create or replace function public.complaint_upload_ticket_allows(object_name text, object_metadata jsonb)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.complaint_upload_tickets t
    where t.object_name = complaint_upload_ticket_allows.object_name and t.claimed_at is null and t.upload_by > now()
      and (object_metadata ->> 'size' is null or (object_metadata ->> 'size') = t.size_bytes::text)
      and (object_metadata ->> 'mimetype' is null or lower(object_metadata ->> 'mimetype') = t.mime_type)
  );
$$;

revoke all on function public.complaint_upload_ticket_allows(text, jsonb) from public, authenticated;
grant execute on function public.complaint_upload_ticket_allows(text, jsonb) to anon;

drop policy if exists "website visitors upload ticketed complaint files" on storage.objects;
create policy "website visitors upload ticketed complaint files"
  on storage.objects for insert to anon
  with check (bucket_id = 'complaint-files' and (select public.complaint_upload_ticket_allows(name, metadata)));
-- No select, update or delete for visitors: they never read, overwrite or remove a file.

-- Cleanup list: website uploads no complaint claimed, older than older_than (default 1 hour, the claim window), oldest
-- first. Admins (the only role that removes complaint files) and the service role only. Remove the files through the
-- Storage API; deleting rows from storage.objects directly would leave the bytes behind.
create or replace function public.unclaimed_website_complaint_files(older_than interval default interval '1 hour')
returns table (name text, created_at timestamptz, size_bytes bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (coalesce(public.is_admin(), false) or coalesce((select auth.role()) = 'service_role', false)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select o.name, o.created_at, nullif(o.metadata ->> 'size', '')::bigint
    from storage.objects o
    join public.complaint_upload_tickets t on t.object_name = o.name
    where o.bucket_id = 'complaint-files'
      and t.claimed_at is null
      and o.created_at <= now() - greatest(coalesce(older_than, interval '1 hour'), interval '0')
      and not exists (select 1 from public.complaint_files f where f.storage_path = o.name)
    order by o.created_at
    limit 1000;
end;
$$;

revoke all on function public.unclaimed_website_complaint_files(interval) from public, anon;
grant execute on function public.unclaimed_website_complaint_files(interval) to authenticated, service_role;

-- Admins see (and so can remove, with 0007's "admins delete complaint files") website uploads no complaint claimed.
-- Nobody else sees them: no complaint has their id. False for everyone but admins, so it tells nobody anything.
create or replace function public.complaint_upload_unclaimed(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.is_admin(), false) and exists (
    select 1 from public.complaint_upload_tickets t
    where t.object_name = complaint_upload_unclaimed.object_name and t.claimed_at is null
  );
$$;

revoke all on function public.complaint_upload_unclaimed(text) from public, anon;
grant execute on function public.complaint_upload_unclaimed(text) to authenticated;

drop policy if exists "admins see unclaimed website complaint uploads" on storage.objects;
create policy "admins see unclaimed website complaint uploads"
  on storage.objects for select to authenticated
  using (bucket_id = 'complaint-files' and (select public.complaint_upload_unclaimed(name)));

-- Website intake, now with the optional file ------------------------------------------------------------------------
-- As 0007, plus two payload fields:
--   attachment_path   the path begin_complaint_file_upload gave the website server, uploaded to complaint-files
--   attachment_name   the file name as the visitor had it (cleaned; the stored file's extension is kept)
-- The file must be claimed with its complaint: an unclaimed ticket at most an hour old, and the stored object must
-- have the ticket's size (5 MB at most) and type (JPG, PNG or PDF). Otherwise 22023 "invalid field: attachment".
create or replace function public.submit_complaint(payload jsonb)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  allowed text[] := array['honeypot', 'brand', 'name', 'email', 'phone', 'category', 'message', 'product', 'sku',
                          'batch_number', 'purchase_place', 'purchase_date', 'attachment_path', 'attachment_name'];
  k text;
  v_name text;
  v_email text;
  v_phone text;
  v_category text;
  v_message text;
  v_brand_slug text;
  v_brand uuid;
  v_product_slug text;
  v_product uuid;
  v_sku_code text;
  v_sku uuid;
  v_batch text;
  v_place text;
  v_date_text text;
  v_date date;
  v_email_key text;
  v_phone_key text;
  v_contact uuid;
  v_case text;
  recent integer;
  v_att_path text;
  v_att_name text;
  v_att_ext text;
  v_ticket public.complaint_upload_tickets%rowtype;
  v_obj_size bigint;
  v_obj_type text;
  v_obj_created timestamptz;
  v_complaint_id uuid;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'invalid field: payload' using errcode = '22023';
  end if;
  if octet_length(payload::text) > 8000 then
    raise exception 'payload too large' using errcode = '22023';
  end if;
  for k in select jsonb_object_keys(payload) loop
    if k <> all (allowed) then
      raise exception 'invalid field: %', left(k, 40) using errcode = '22023';
    end if;
  end loop;

  -- A bot filled the hidden field: answer like a success, save nothing.
  if public.crm_intake_text(payload, 'honeypot', 500) is not null then
    return 'LX-' || extract(year from now() at time zone 'UTC')::integer::text || '-'
           || lpad((floor(random() * 9000) + 1000)::integer::text, 4, '0');
  end if;

  v_name := public.crm_intake_text(payload, 'name', 120);
  v_email := lower(public.crm_intake_text(payload, 'email', 254));
  v_phone := public.crm_intake_text(payload, 'phone', 24);
  v_category := public.crm_intake_text(payload, 'category', 40);
  v_message := public.crm_intake_text(payload, 'message', 3000);
  v_brand_slug := lower(public.crm_intake_text(payload, 'brand', 60));
  v_product_slug := lower(public.crm_intake_text(payload, 'product', 120));
  v_sku_code := public.crm_intake_text(payload, 'sku', 64);
  v_batch := public.crm_intake_text(payload, 'batch_number', 60);
  v_place := public.crm_intake_text(payload, 'purchase_place', 200);
  v_date_text := public.crm_intake_text(payload, 'purchase_date', 10);
  v_att_path := public.crm_intake_text(payload, 'attachment_path', 200);
  v_att_name := public.crm_intake_text(payload, 'attachment_name', 300);

  if v_name is null then
    raise exception 'invalid field: name' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid field: email' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9][0-9 ()-]{5,22}$' then
    raise exception 'invalid field: phone' using errcode = '22023';
  end if;
  if v_email is null and v_phone is null then
    raise exception 'invalid field: email' using errcode = '22023';
  end if;
  if v_category is null or v_category not in ('product_quality', 'packaging', 'foreign_object', 'health_safety',
      'availability', 'pricing_in_shop', 'staff_service', 'delivery', 'other') then
    raise exception 'invalid field: category' using errcode = '22023';
  end if;
  if v_message is null then
    raise exception 'invalid field: message' using errcode = '22023';
  end if;

  if v_brand_slug is not null then
    select b.id into v_brand from public.brands b where b.slug = v_brand_slug and b.is_active;
    if v_brand is null then
      raise exception 'invalid field: brand' using errcode = '22023';
    end if;
  else
    select b.id into v_brand from public.brands b where b.is_corporate and b.is_active order by b.created_at, b.id limit 1;
    if v_brand is null then
      raise exception 'invalid field: brand' using errcode = '22023';
    end if;
  end if;
  if v_product_slug is not null then
    select p.id into v_product from public.products p
     where p.brand_id = v_brand and p.slug = v_product_slug and p.is_published;
    if v_product is null then
      raise exception 'invalid field: product' using errcode = '22023';
    end if;
  end if;
  if v_sku_code is not null then
    if v_product is null then
      raise exception 'invalid field: sku' using errcode = '22023';
    end if;
    select s.id into v_sku from public.product_skus s where s.product_id = v_product and s.sku_code = v_sku_code and s.is_active;
    if v_sku is null then
      raise exception 'invalid field: sku' using errcode = '22023';
    end if;
  end if;
  if v_date_text is not null then
    if v_date_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'invalid field: purchase_date' using errcode = '22023';
    end if;
    begin
      v_date := v_date_text::date;
    exception when others then
      raise exception 'invalid field: purchase_date' using errcode = '22023';
    end;
    if v_date > (now() at time zone 'UTC')::date or v_date < date '2000-01-01' then
      raise exception 'invalid field: purchase_date' using errcode = '22023';
    end if;
  end if;

  -- The optional file: a ticketed upload of this request's shape (checked fully below, once the guard has passed).
  if v_att_path is not null and public.complaint_id_from_path(v_att_path) is null then
    raise exception 'invalid field: attachment' using errcode = '22023';
  end if;

  -- Abuse guard, shared with the other website forms: at most 5 submissions per email or phone number in an hour.
  -- Same locks as submit_website_enquiry (email space 61 before phone space 62), so parallel requests are counted.
  v_email_key := v_email;
  v_phone_key := public.crm_phone_key(v_phone);
  if v_email_key is not null then
    perform pg_advisory_xact_lock(61, hashtext(v_email_key));
  end if;
  if v_phone_key is not null then
    perform pg_advisory_xact_lock(62, hashtext(v_phone_key));
  end if;
  select count(*) into recent from public.crm_intake_log il
   where il.created_at > now() - interval '1 hour'
     and ((v_email_key is not null and il.email_key = v_email_key) or (v_phone_key is not null and il.phone_key = v_phone_key));
  if recent >= 5 then
    raise exception 'too many submissions, please try again later' using errcode = 'PT429';
  end if;

  -- Contact: by email first, then by phone (when that contact has no other email). Only blanks are filled.
  if v_email_key is not null then
    select c.id into v_contact from public.crm_contacts c
     where lower(c.email) = v_email_key
     order by c.created_at, c.id limit 1;
  end if;
  if v_contact is null and v_phone_key is not null then
    select c.id into v_contact from public.crm_contacts c
     where c.phone_key = v_phone_key and (c.email is null or v_email_key is null or lower(c.email) = v_email_key)
     order by c.created_at, c.id limit 1;
  end if;
  if v_contact is null then
    insert into public.crm_contacts (full_name, phone, email) values (v_name, v_phone, v_email)
    returning id into v_contact;
  else
    update public.crm_contacts c set
      full_name = coalesce(c.full_name, v_name),
      phone = coalesce(c.phone, v_phone),
      email = coalesce(c.email, v_email)
    where c.id = v_contact
      and ((c.full_name is null and v_name is not null) or (c.phone is null and v_phone is not null)
           or (c.email is null and v_email is not null));
  end if;

  -- The file: its ticket stays locked until the complaint is saved, so two complaints cannot claim the same file.
  if v_att_path is not null then
    select t.* into v_ticket from public.complaint_upload_tickets t
     where t.object_name = v_att_path and t.claimed_at is null and t.created_at > now() - interval '1 hour'
     for update;
    if v_ticket.id is null then
      raise exception 'invalid field: attachment' using errcode = '22023';
    end if;
    select nullif(o.metadata ->> 'size', '')::bigint, lower(o.metadata ->> 'mimetype'), o.created_at
      into v_obj_size, v_obj_type, v_obj_created
      from storage.objects o where o.bucket_id = 'complaint-files' and o.name = v_att_path;
    if v_obj_created is null or v_obj_size is null or v_obj_size <> v_ticket.size_bytes or v_obj_size > 5242880
       or v_obj_type is null or v_obj_type <> v_ticket.mime_type
       or v_obj_type not in ('image/jpeg', 'image/png', 'application/pdf')
       or exists (select 1 from public.complaints c where c.id = v_ticket.id)
       or exists (select 1 from public.complaint_files f where f.storage_path = v_att_path) then
      raise exception 'invalid field: attachment' using errcode = '22023';
    end if;
    -- The name staff see and download under: a safe character set only, the extension of the stored file.
    v_att_ext := lower(substring(v_att_path from '\.([A-Za-z]+)$'));
    v_att_name := regexp_replace(coalesce(v_att_name, split_part(v_att_path, '/', 2)), '\.[A-Za-z0-9]{1,5}$', '');
    v_att_name := regexp_replace(v_att_name, '[^A-Za-z0-9 ._()-]', '_', 'g');
    v_att_name := btrim(regexp_replace(regexp_replace(v_att_name, '_{2,}', '_', 'g'), '\s{2,}', ' ', 'g'), ' ._-');
    v_att_name := btrim(left(v_att_name, 100), ' ._-');
    v_att_name := coalesce(nullif(v_att_name, ''), 'attachment') || '.' || v_att_ext;
    v_complaint_id := v_ticket.id;
  end if;

  insert into public.complaints (id, brand_id, product_id, sku_id, batch_number, purchase_place, purchase_date, category,
                                 severity, channel, description, contact_id)
  values (coalesce(v_complaint_id, gen_random_uuid()), v_brand, v_product, v_sku, v_batch, v_place, v_date, v_category,
          'normal', 'website', v_message, v_contact)
  returning id, case_number into v_complaint_id, v_case;

  if v_att_path is not null then
    insert into public.complaint_files (complaint_id, storage_path, file_name, mime_type, size_bytes)
    values (v_complaint_id, v_att_path, v_att_name, v_obj_type, v_obj_size::integer);
    update public.complaint_upload_tickets set claimed_at = now() where id = v_ticket.id;
  end if;

  insert into public.crm_intake_log (form, email_key, phone_key, reference)
  values ('complaint', v_email_key, v_phone_key, v_case);

  return v_case;
end;
$$;

revoke all on function public.submit_complaint(jsonb) from public, authenticated;
grant execute on function public.submit_complaint(jsonb) to anon;

-- 0007's header said "No files through the website for now"; the function's grants stay as they were.
comment on function public.submit_complaint(jsonb) is
  'Website complaint intake (0007), with the optional ticketed photo or document (0027). Returns the case number only.';

-- 0003_products: central product management (scoreboard item 4).
-- One source of truth for products, SKUs and pack sizes, images and approved product information.
-- The four websites read published products; staff edit them in the portal.
--
-- Who can do what:
--   website visitors (anon)            read published products of active brands, their active SKUs and images
--   any signed in person               the same as website visitors (distributors and sales reps order from it later)
--   admin, management, marketing       read every product of the brands they have access to, published or not
--   admin, marketing                   create, edit, publish and delete products of the brands they have access to
--   management                         read only

-- Helper functions ------------------------------------------------------------
-- Security definer so policies can use them without recursing into RLS; search_path '' like 0001.

create or replace function public.can_view_brand_products(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'marketing'), false)
     and public.has_brand_access(target_brand);
$$;

create or replace function public.can_edit_brand_products(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'marketing'), false)
     and public.has_brand_access(target_brand);
$$;

revoke all on function public.can_view_brand_products(uuid) from public, anon;
revoke all on function public.can_edit_brand_products(uuid) from public, anon;
grant execute on function public.can_view_brand_products(uuid) to authenticated;
grant execute on function public.can_edit_brand_products(uuid) to authenticated;

-- Products --------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),
  category text check (category is null or length(btrim(category)) between 1 and 80),
  short_description text check (short_description is null or length(short_description) <= 400),
  long_description text check (long_description is null or length(long_description) <= 5000),
  -- Approved information: only what Lexta has signed off, shown as is on the websites.
  key_features text[] not null default '{}',
  usage_instructions text check (usage_instructions is null or length(usage_instructions) <= 3000),
  ingredients text check (ingredients is null or length(ingredients) <= 3000),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  unique (brand_id, slug)
);

create index products_brand_published_idx on public.products (brand_id, is_published, sort_order);
create index products_updated_by_idx on public.products (updated_by);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- updated_by always comes from the session, never from the browser.
create or replace function public.set_product_updated_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_by = (select auth.uid());
  return new;
end;
$$;

revoke all on function public.set_product_updated_by() from public, anon, authenticated;

create trigger products_set_updated_by
  before insert or update on public.products
  for each row execute function public.set_product_updated_by();

-- SKUs and pack sizes ---------------------------------------------------------
create table public.product_skus (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku_code text not null unique check (sku_code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'),
  variant_name text check (variant_name is null or length(btrim(variant_name)) between 1 and 120),
  pack_size_label text not null check (length(btrim(pack_size_label)) between 1 and 120),
  unit_quantity numeric(12, 3) check (unit_quantity is null or unit_quantity > 0),
  unit text check (unit is null or length(btrim(unit)) between 1 and 30),
  barcode text check (barcode is null or barcode ~ '^[0-9]{6,14}$'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_skus_product_idx on public.product_skus (product_id, sort_order);

create trigger product_skus_set_updated_at
  before update on public.product_skus
  for each row execute function public.set_updated_at();

-- Images --------------------------------------------------------------------
-- Either a file in the product-images bucket (path <brand_slug>/<product_id>/<file>) or an https link.
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text check (storage_path is null or storage_path ~ '^[a-z0-9-]+/[0-9a-f-]{36}/[^/]+$'),
  external_url text check (external_url is null or external_url ~ '^https://'),
  alt_text text not null check (length(btrim(alt_text)) between 1 and 300),
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(storage_path, external_url) = 1)
);

create index product_images_product_idx on public.product_images (product_id, sort_order);
create unique index product_images_one_primary_idx on public.product_images (product_id) where is_primary;

create trigger product_images_set_updated_at
  before update on public.product_images
  for each row execute function public.set_updated_at();

-- Row Level Security ----------------------------------------------------------
alter table public.products enable row level security;
alter table public.product_skus enable row level security;
alter table public.product_images enable row level security;

-- Products: read
create policy "visitors read published products of active brands"
  on public.products for select to anon
  using (
    is_published
    and exists (select 1 from public.brands b where b.id = brand_id and b.is_active)
  );

create policy "signed in read published products, staff read their brands"
  on public.products for select to authenticated
  using (
    (
      is_published
      and exists (select 1 from public.brands b where b.id = brand_id and b.is_active)
    )
    or (select public.can_view_brand_products(brand_id))
  );

-- Products: write (admin and marketing, own brands)
create policy "admin and marketing insert products"
  on public.products for insert to authenticated
  with check ((select public.can_edit_brand_products(brand_id)));

create policy "admin and marketing update products"
  on public.products for update to authenticated
  using ((select public.can_edit_brand_products(brand_id)))
  with check ((select public.can_edit_brand_products(brand_id)));

create policy "admin and marketing delete products"
  on public.products for delete to authenticated
  using ((select public.can_edit_brand_products(brand_id)));

-- SKUs: the parent product's own policies decide visibility (the subquery runs under RLS).
create policy "visitors read active skus of visible products"
  on public.product_skus for select to anon
  using (is_active and exists (select 1 from public.products p where p.id = product_id));

create policy "signed in read active skus, staff read all skus of their brands"
  on public.product_skus for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (product_skus.is_active or (select public.can_view_brand_products(p.brand_id)))
    )
  );

create policy "admin and marketing insert skus"
  on public.product_skus for insert to authenticated
  with check (
    exists (select 1 from public.products p where p.id = product_id and (select public.can_edit_brand_products(p.brand_id)))
  );

create policy "admin and marketing update skus"
  on public.product_skus for update to authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and (select public.can_edit_brand_products(p.brand_id)))
  )
  with check (
    exists (select 1 from public.products p where p.id = product_id and (select public.can_edit_brand_products(p.brand_id)))
  );

create policy "admin and marketing delete skus"
  on public.product_skus for delete to authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and (select public.can_edit_brand_products(p.brand_id)))
  );

-- Images
create policy "visitors read images of visible products"
  on public.product_images for select to anon
  using (exists (select 1 from public.products p where p.id = product_id));

create policy "signed in read images of visible products"
  on public.product_images for select to authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

create policy "admin and marketing insert images"
  on public.product_images for insert to authenticated
  with check (
    exists (select 1 from public.products p where p.id = product_id and (select public.can_edit_brand_products(p.brand_id)))
  );

create policy "admin and marketing update images"
  on public.product_images for update to authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and (select public.can_edit_brand_products(p.brand_id)))
  )
  with check (
    exists (select 1 from public.products p where p.id = product_id and (select public.can_edit_brand_products(p.brand_id)))
  );

create policy "admin and marketing delete images"
  on public.product_images for delete to authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and (select public.can_edit_brand_products(p.brand_id)))
  );

-- Storage: product-images bucket ----------------------------------------------
-- Public bucket: files are served to everyone through their public URL without any select policy.
-- There is deliberately no anon select policy on storage.objects, so visitors cannot list the bucket
-- (which would reveal files of unpublished products). Staff who may edit a product can list, upload,
-- replace and delete its files. Path convention: <brand_slug>/<product_id>/<file name>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create or replace function public.can_manage_product_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select public.can_edit_brand_products(b.id)
    from public.products p
    join public.brands b on b.id = p.brand_id
    where object_name ~ '^[a-z0-9-]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
      and b.slug = split_part(object_name, '/', 1)
      and p.id = case
        when object_name ~ '^[a-z0-9-]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
          then split_part(object_name, '/', 2)::uuid
      end
  ), false);
$$;

revoke all on function public.can_manage_product_object(text) from public, anon;
grant execute on function public.can_manage_product_object(text) to authenticated;

create policy "product editors list product images"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select public.can_manage_product_object(name)));

create policy "product editors upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.can_manage_product_object(name)));

create policy "product editors replace product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.can_manage_product_object(name)))
  with check (bucket_id = 'product-images' and (select public.can_manage_product_object(name)));

create policy "product editors delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.can_manage_product_object(name)));

-- =========================================================
-- BMS Treats — Supabase schema
-- Run this in the Supabase SQL editor (or via CLI migration)
-- =========================================================

-- ---------- Profiles (extends auth.users) ----------
create type user_role as enum ('customer', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- ---------- Residences ----------
create table residences (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- the "Res name" — this is what deliveries/notifications are grouped by
  area text,                          -- town/township, for admin's own reference
  is_deliverable boolean not null default true,
  created_at timestamptz not null default now()
);

create table residence_buildings (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references residences(id) on delete cascade,
  name text not null,                 -- e.g. "Block C", "Riverview House"
  created_at timestamptz not null default now()
);

-- ---------- Products ----------
create type product_type as enum ('tray', 'cup');
create type image_source as enum ('ai_generated', 'manual_upload');

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- e.g. "Dessert Cup"
  type product_type not null,
  flavour text not null,              -- e.g. "Red Velvet"
  price numeric(10,2) not null,
  stock_qty integer not null default 0,
  image_url text,
  image_source image_source not null default 'ai_generated',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Orders ----------
create type order_status as enum ('pending', 'out_for_delivery', 'delivered', 'cancelled');
create type payment_method as enum ('cod', 'card'); -- card kept for schema future-proofing; UI blocks it for v1

create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  residence_id uuid not null references residences(id),
  building_id uuid not null references residence_buildings(id),
  room_number text not null,
  status order_status not null default 'pending',
  payment_method payment_method not null default 'cod',
  total_amount numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null
);

-- ---------- Notifications ("on my way") ----------
create type notify_scope as enum ('single', 'residence_bulk');

create table delivery_notifications (
  id uuid primary key default gen_random_uuid(),
  scope notify_scope not null,
  residence_id uuid references residences(id),   -- set when scope = residence_bulk
  order_id uuid references orders(id),           -- set when scope = single
  message text not null default 'Your BMS Treats order is on the way!',
  sent_at timestamptz not null default now()
);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table profiles enable row level security;
alter table residences enable row level security;
alter table residence_buildings enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table delivery_notifications enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles: users see/edit their own row; admins see all
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());
create policy "profiles_insert_self" on profiles
  for insert with check (id = auth.uid());

-- Residences & buildings: publicly readable (needed for guest browsing/address picker),
-- writable by admin only
create policy "residences_read_all" on residences for select using (true);
create policy "residences_admin_write" on residences for all using (is_admin()) with check (is_admin());

create policy "buildings_read_all" on residence_buildings for select using (true);
create policy "buildings_admin_write" on residence_buildings for all using (is_admin()) with check (is_admin());

-- Products: publicly readable (guest browsing), writable by admin only
create policy "products_read_all" on products for select using (true);
create policy "products_admin_write" on products for all using (is_admin()) with check (is_admin());

-- Orders: buyers see their own orders, admin sees all; only admin can update status
create policy "orders_select_own_or_admin" on orders
  for select using (buyer_id = auth.uid() or is_admin());
create policy "orders_insert_own" on orders
  for insert with check (buyer_id = auth.uid());
create policy "orders_update_admin_only" on orders
  for update using (is_admin());

-- Order items: visible if you can see the parent order
create policy "order_items_select" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_id and (o.buyer_id = auth.uid() or is_admin()))
  );
create policy "order_items_insert_own" on order_items
  for insert with check (
    exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid())
  );

-- Notifications: buyers see notifications tied to their own orders/residence; admin sends them
create policy "notifications_select" on delivery_notifications
  for select using (
    is_admin()
    or (order_id is not null and exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid()))
    or (residence_id is not null and exists (
      select 1 from orders o where o.residence_id = residence_id and o.buyer_id = auth.uid()
    ))
  );
create policy "notifications_admin_insert" on delivery_notifications
  for insert with check (is_admin());

-- =========================================================
-- Grants — required in addition to RLS policies above.
-- Enabling RLS does not by itself give anon/authenticated
-- permission to touch a table; without these grants every
-- query fails with "permission denied for table X" even
-- when the RLS policy would have allowed it.
-- =========================================================
grant usage on schema public to anon, authenticated;

grant select on residences, residence_buildings, products to anon, authenticated;
grant insert, update, delete on residences, residence_buildings, products to authenticated;

grant select, insert, update on profiles to authenticated;
grant select, insert, update on orders to authenticated;
grant select, insert on order_items to authenticated;
grant select, insert on delivery_notifications to authenticated;

-- =========================================================
-- Auto-create a profile row whenever a new auth.users row appears.
-- Runs with elevated privileges (SECURITY DEFINER), so it works even
-- before email confirmation / before a session exists — unlike a
-- client-side insert right after signUp(), which RLS would block.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    'customer'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One-time backfill: create a profile for any auth.users row that predates
-- the trigger above (e.g. accounts created while testing, before this was added).
insert into public.profiles (id, full_name, phone, role)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', ''), u.raw_user_meta_data->>'phone', 'customer'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- =========================================================
-- Site settings (hero video/image) — single row, admin-editable
-- =========================================================
create table site_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  hero_video_url text,
  hero_image_url text,
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;
create policy "site_settings_read_all" on site_settings for select using (true);
create policy "site_settings_admin_write" on site_settings for all using (is_admin()) with check (is_admin());

grant select on site_settings to anon, authenticated;
grant insert, update on site_settings to authenticated;

-- =========================================================
-- Storage: product photos (admin-uploaded, no AI generation)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

create policy "product_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());

create policy "product_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- AI image generation has been removed — every product photo is now a
-- manual admin upload, so default new rows to that instead of 'ai_generated'.
alter table products alter column image_source set default 'manual_upload';

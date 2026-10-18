-- Sensasi Ketan Susu: Supabase schema
-- Run this in Supabase SQL Editor. Review RLS policies before production.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  category text not null default 'Menu',
  image_url text not null default '',
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  phone text not null default '',
  area text not null default '',
  fee integer null check (fee is null or fee >= 0),
  eta text not null default 'Konfirmasi admin',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  address text not null,
  area text not null default '',
  landmark text not null default '',
  note text not null default '',
  delivery_service_id uuid null references public.delivery_services(id) on delete set null,
  delivery_service_name text not null,
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer null check (delivery_fee is null or delivery_fee >= 0),
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','processing','ready','shipping','completed','cancelled')),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  note text not null default '',
  changed_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id text primary key default 'main',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.products (name, description, price, category, image_url, available)
select 'Ketan Susu Keju Original', 'Ketan pulen, susu creamy, dan taburan keju gurih.', 10000, 'Favorit',
'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=85', true
where not exists (select 1 from public.products where name = 'Ketan Susu Keju Original');

insert into public.products (name, description, price, category, image_url, available)
select 'Ketan Susu Cokelat', 'Perpaduan ketan hangat, susu, dan cokelat manis.', 12000, 'Cokelat',
'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85', true
where not exists (select 1 from public.products where name = 'Ketan Susu Cokelat');

insert into public.delivery_services (name, description, area, fee, eta, active)
select 'Kurir Lokal', 'Pengantaran sekitar area Jatibarang.', 'Jatibarang dan sekitar', null, 'Konfirmasi admin', true
where not exists (select 1 from public.delivery_services where name = 'Kurir Lokal');

insert into public.delivery_services (name, description, area, fee, eta, active)
select 'Jasa Antar Mitra', 'Pilih mitra antar lokal sesuai kebutuhan.', 'Area sesuai kesepakatan', null, 'Konfirmasi admin', true
where not exists (select 1 from public.delivery_services where name = 'Jasa Antar Mitra');

insert into public.site_settings (id, settings)
values ('main', '{"brand":"SENSASI KETAN SUSU","tagline":"Manisnya sederhana, rasanya bikin rindu.","location":"Jatibarang","whatsapp":"08985751300","openHours":"Setiap hari • Konfirmasi jam operasional","announcement":"Ketan hangat, topping melimpah, dibuat dengan hati."}'::jsonb)
on conflict (id) do nothing;

alter table public.products enable row level security;
alter table public.delivery_services enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.site_settings enable row level security;

-- Public read policies for catalog only.
drop policy if exists "Public can read available products" on public.products;
create policy "Public can read available products" on public.products for select using (true);

drop policy if exists "Public can read active delivery services" on public.delivery_services;
create policy "Public can read active delivery services" on public.delivery_services for select using (active = true);

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select using (id = 'main');

-- IMPORTANT:
-- Do not add unrestricted public write policies for products, delivery_services,
-- orders, order_status_history, or site_settings.
-- For production, create server-side API routes using Supabase service role key
-- stored only in server environment variables, or use authenticated admin sessions
-- with role-based RLS policies. Public order creation should go through a server
-- endpoint that validates product prices, availability, courier fees, totals,
-- rate limits requests, and writes order records securely.

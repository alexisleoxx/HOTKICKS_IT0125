-- HOTKICKS database schema. Run in Supabase: SQL Editor -> New query -> Run.
-- Safe to run again: it only adds what is missing.
-- Then run `npm run seed` (first time only) and `npm run make-admin -- you@email.com`.

create table if not exists products (
  id          text primary key,
  name        text not null,
  model       text not null,
  category    text not null,
  price       numeric(10,2) not null,
  rating      numeric(2,1) default 0,
  sold        integer default 0,
  is_new      boolean default false,
  limited     boolean default false,
  stock       integer,
  accent      text,
  bg          text,
  tagline     text,
  description text,
  colors      jsonb not null default '[]',
  sizes       jsonb not null default '[]',
  sort_order  integer default 0,
  created_at  timestamptz default now()
);
alter table products add column if not exists active boolean not null default true;
update products set stock = 60 where stock is null;

create table if not exists orders (
  id         text primary key,
  customer   jsonb not null,
  lines      jsonb not null,
  subtotal   numeric(10,2) not null,
  shipping   numeric(10,2) not null,
  tax        numeric(10,2) not null,
  total      numeric(10,2) not null,
  created_at timestamptz default now()
);
alter table orders add column if not exists user_id    uuid references auth.users(id) on delete set null;
alter table orders add column if not exists email      text;
alter table orders add column if not exists status     text not null default 'pending';
alter table orders add column if not exists updated_at timestamptz default now();
create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists orders_status_idx  on orders(status);

create table if not exists subscribers (
  email      text primary key,
  created_at timestamptz default now()
);

-- One row per signed-up user. role = 'customer' or 'admin'
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text,
  phone      text,
  address    jsonb default '{}',
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default now()
);
alter table profiles add column if not exists gender     text;
alter table profiles add column if not exists newsletter boolean not null default false;

-- Stock helpers used by the server (atomic, so two buyers can't take the last pair)
create or replace function decrement_stock(pid text, amount int)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update products set stock = stock - amount
   where id = pid and (stock is null or stock >= amount);
  return found;
end $$;

create or replace function adjust_stock(pid text, delta int)
returns integer language plpgsql security definer set search_path = public as $$
declare new_stock integer;
begin
  update products set stock = greatest(0, coalesce(stock, 0) + delta)
   where id = pid returning stock into new_stock;
  return new_stock;
end $$;

-- Only the server (service_role) may call the stock functions
revoke execute on function decrement_stock(text, int) from public, anon, authenticated;
revoke execute on function adjust_stock(text, int)    from public, anon, authenticated;

-- Row Level Security: the server uses the service_role key (bypasses RLS).
-- Anonymous clients may only read products.
alter table products    enable row level security;
alter table orders      enable row level security;
alter table subscribers enable row level security;
alter table profiles    enable row level security;

drop policy if exists "Public read products" on products;
create policy "Public read products" on products for select using (true);

notify pgrst, 'reload schema';

-- ============================================================
-- CampusBazaar — Initial Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── USERS ────────────────────────────────────────────────────
create table if not exists public.users (
  id                  uuid primary key references auth.users on delete cascade,
  email               text not null unique,
  name                text not null default '',
  college             text not null default '',
  roll_number         text,
  avatar_url          text,
  verification_status text not null default 'unverified'
                        check (verification_status in ('unverified','email_verified','pending_id','id_verified')),
  is_banned           boolean not null default false,
  is_shadow_banned    boolean not null default false,
  report_count        int     not null default 0,
  rating              numeric(3,2) default 0.0,
  sales_count         int     not null default 0,
  upi_handle          text,
  created_at          timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own row" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own row" on public.users
  for update using (auth.uid() = id);

-- ── LISTINGS ──────────────────────────────────────────────────
create table if not exists public.listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.users on delete cascade,
  title       text not null,
  description text not null default '',
  price       numeric(10,2) not null,
  category    text not null,
  condition   text not null default 'good'
                check (condition in ('new','like_new','good','fair','poor')),
  status      text not null default 'active'
                check (status in ('active','sold','reserved','hidden','pending_review')),
  images      text[] not null default '{}',
  college     text not null,
  views       int not null default 0,
  is_flagged  boolean not null default false,
  flag_reason text,
  reserved_for uuid references public.users,
  created_at  timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Anyone can read active listings" on public.listings
  for select using (status = 'active');

create policy "Sellers manage own listings" on public.listings
  for all using (auth.uid() = seller_id);

-- ── MESSAGES ──────────────────────────────────────────────────
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null,
  sender_id        uuid not null references public.users on delete cascade,
  receiver_id      uuid not null references public.users on delete cascade,
  listing_id       uuid references public.listings on delete set null,
  content          text not null,
  is_read          boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Participants can read messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Sender can insert" on public.messages
  for insert with check (auth.uid() = sender_id);

-- ── TRANSACTIONS ──────────────────────────────────────────────
create table if not exists public.transactions (
  id               uuid primary key default gen_random_uuid(),
  listing_id       uuid not null references public.listings on delete cascade,
  buyer_id         uuid not null references public.users on delete cascade,
  seller_id        uuid not null references public.users on delete cascade,
  status           text not null default 'initiated'
                     check (status in ('initiated','accepted','reserved','meetup_set','completed','cancelled','disputed')),
  amount           numeric(10,2) not null,
  meetup_location  text,
  meetup_time      timestamptz,
  buyer_confirmed  boolean not null default false,
  seller_confirmed boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Buyer or seller can read" on public.transactions
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyer or seller can update" on public.transactions
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ── REPORTS ───────────────────────────────────────────────────
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.users on delete cascade,
  target_id    uuid not null,
  target_type  text not null check (target_type in ('listing','user','message')),
  reason       text not null,
  description  text,
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can file reports" on public.reports
  for insert with check (auth.uid() = reporter_id);

-- ── WISHLIST ──────────────────────────────────────────────────
create table if not exists public.wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users on delete cascade,
  keyword    text not null,
  category   text,
  max_price  numeric(10,2),
  created_at timestamptz not null default now()
);

alter table public.wishlist enable row level security;

create policy "Owner manages wishlist" on public.wishlist
  for all using (auth.uid() = user_id);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users on delete cascade, -- null = broadcast
  title      text not null,
  body       text not null,
  type       text not null default 'system',
  audience   text default 'all', -- for admin broadcasts
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users read own notifications" on public.notifications
  for select using (user_id = auth.uid() or user_id is null);

-- ============================================================================
-- Sacramental Requests
-- Config-driven so new sacraments (Confirmation, Marriage, First Communion…)
-- are added by inserting a `sacrament_request_types` row — no schema changes.
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- ── Config: one row per requestable sacrament ───────────────────────────────
create table if not exists public.sacrament_request_types (
  type            text primary key,               -- e.g. 'baptismal_card'
  title           text not null,                  -- e.g. 'Baptismal Card'
  description     text,
  icon            text,                            -- Ionicons name for the mobile UI
  is_free         boolean not null default true,
  amount          numeric not null default 0,      -- fee when not free
  currency        text not null default '₦',
  payment_instructions text,
  account_name    text,
  account_number  text,
  bank_name       text,
  payment_notes   text,
  -- required_fields: [{ "key","label","type": text|longtext|date|phone|email|select,
  --                     "required": bool, "helperText"?, "placeholder"?, "options"?: [] }]
  required_fields jsonb not null default '[]'::jsonb,
  allow_attachment boolean not null default true,
  active          boolean not null default true,
  sort_order      integer not null default 100,
  updated_at      timestamptz not null default now()
);

-- Payment-config columns (idempotent add for databases created before these were introduced).
alter table public.sacrament_request_types add column if not exists currency text not null default '₦';
alter table public.sacrament_request_types add column if not exists payment_instructions text;
alter table public.sacrament_request_types add column if not exists account_name text;
alter table public.sacrament_request_types add column if not exists account_number text;
alter table public.sacrament_request_types add column if not exists bank_name text;
alter table public.sacrament_request_types add column if not exists payment_notes text;

-- ── Submissions ─────────────────────────────────────────────────────────────
create table if not exists public.sacrament_requests (
  id                uuid primary key default gen_random_uuid(),
  type              text not null references public.sacrament_request_types(type),
  client_request_id text unique,                   -- idempotency + offline sync + status polling
  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected', 'needs_info')),
  full_name         text not null,
  contact_phone     text,
  payload           jsonb not null default '{}'::jsonb,  -- the filled required fields
  attachment_url    text,
  is_free           boolean not null default true,
  amount_due        numeric not null default 0,
  admin_note        text,                           -- reason on reject / what's needed on needs_info
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists sacrament_requests_status_idx on public.sacrament_requests (status);
create index if not exists sacrament_requests_created_idx on public.sacrament_requests (created_at desc);
create index if not exists sacrament_requests_client_req_idx on public.sacrament_requests (client_request_id);

-- ── updated_at trigger ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sacrament_requests_set_updated_at on public.sacrament_requests;
create trigger sacrament_requests_set_updated_at
  before update on public.sacrament_requests
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.sacrament_request_types enable row level security;
alter table public.sacrament_requests enable row level security;

do $$ begin
  -- Anyone (mobile app, anon) can read the active config to build the form.
  if not exists (select 1 from pg_policies where schemaname='public'
      and tablename='sacrament_request_types' and policyname='Public read sacrament config') then
    create policy "Public read sacrament config" on public.sacrament_request_types
      for select to anon using (true);
  end if;

  -- Authenticated admins manage the config.
  if not exists (select 1 from pg_policies where schemaname='public'
      and tablename='sacrament_request_types' and policyname='Admins manage sacrament config') then
    create policy "Admins manage sacrament config" on public.sacrament_request_types
      for all to authenticated using (true) with check (true);
  end if;

  -- Parishioners submit without an account (mirrors bookings/donations/feedback).
  if not exists (select 1 from pg_policies where schemaname='public'
      and tablename='sacrament_requests' and policyname='Public submit sacrament requests') then
    create policy "Public submit sacrament requests" on public.sacrament_requests
      for insert to anon with check (true);
  end if;

  -- Anon can read back status (used for status polling by client_request_id — same as bookings).
  if not exists (select 1 from pg_policies where schemaname='public'
      and tablename='sacrament_requests' and policyname='Public read sacrament status') then
    create policy "Public read sacrament status" on public.sacrament_requests
      for select to anon using (true);
  end if;

  -- Admins review/update/delete.
  if not exists (select 1 from pg_policies where schemaname='public'
      and tablename='sacrament_requests' and policyname='Admins manage sacrament requests') then
    create policy "Admins manage sacrament requests" on public.sacrament_requests
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ── Seed the Baptismal Card (the initial sacrament) ─────────────────────────
insert into public.sacrament_request_types (type, title, description, icon, is_free, amount, allow_attachment, sort_order, required_fields)
values (
  'baptismal_card',
  'Baptismal Card',
  'Request an official record of your baptism at the parish.',
  'water-outline',
  true,
  0,
  true,
  10,
  '[
    {"key":"baptism_date","label":"Date of Baptism","type":"date","required":true,"datePreset":"past","minDate":"1900-01-01","helperText":"The date you were baptised."},
    {"key":"place_of_baptism","label":"Place / Church of Baptism","type":"text","required":true},
    {"key":"father_name","label":"Father''s Full Name","type":"text","required":true},
    {"key":"mother_name","label":"Mother''s Maiden Name","type":"text","required":true},
    {"key":"godparents","label":"Godparent(s)","type":"text","required":false},
    {"key":"notes","label":"Additional Notes","type":"longtext","required":false}
  ]'::jsonb
)
on conflict (type) do nothing;

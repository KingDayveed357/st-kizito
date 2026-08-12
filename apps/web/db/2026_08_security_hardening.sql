-- ============================================================================
-- St. Kizito Parish — Security & data-integrity hardening
-- Run in: Supabase Dashboard → SQL Editor.  Idempotent: safe to re-run.
--
-- This migration closes the four trust-boundary holes found in the pre-launch audit:
--
--   1. "Admin" meant nothing more than `auth.role() = 'authenticated'`, so ANY Supabase Auth
--      user was a full admin on every table.        → real `admin_users` roster + `is_admin()`
--   2. `bookings`/`donations` accepted `INSERT WITH CHECK (TRUE)` with no constraint on `amount`,
--      and the ₦500/day rule lived only in the mobile client. A direct anon API call could insert
--      an amount of 0, a negative amount, or self-approve a booking.   → CHECK + triggers
--   3. `sacrament_requests` allowed anon `SELECT ... USING (true)`, exposing every parishioner's
--      name, phone and `payload` JSONB to anyone holding the (public) anon key.  → RPC-only reads
--   4. Anon could INSERT into `payment-receipts` but not UPDATE, so every idempotent retry
--      (`upsert: true`) failed silently.                                → scoped UPDATE policy
--
-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  READ THIS FIRST — THIS FILE LOCKS EVERYONE OUT UNTIL YOU SEED AN OWNER  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- `admin_users` is created EMPTY. From the moment this file runs, `is_admin()` returns false for
-- every account, and the portal answers a correct password with
-- "This account is not authorized for the administrative portal."
--
-- Run this immediately afterwards, with your own address:
--
--     insert into public.admin_users (user_id, email, role)
--     select id, email, 'owner' from auth.users where email = 'you@example.org'
--     on conflict (user_id) do update set role = 'owner';
--
-- Not sure which accounts exist?   select email from auth.users order by created_at;
-- Confirm it worked?               select email, role from public.admin_users;
--
-- ── OTHER REQUIRED MANUAL STEPS ─────────────────────────────────────────────
--   a) Supabase → Authentication → Providers → Email: **disable "Enable sign ups"**.
--      Without this, anyone can self-register. Admins must be created via Invite User.
--   b) `notify pgrst, 'reload schema';` at the end refreshes the PostgREST cache.
--
-- NOTE ON `payment_receipt_url`: this column stores a storage object PATH, not a URL. It is
-- deliberately NOT renamed here — booking rows are inserted by installed mobile APKs that cannot
-- be updated in lockstep with the database, so a rename would break every client in the field
-- until they upgrade. A COMMENT documents the real meaning instead.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- 1. ADMIN IDENTITY
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'admin' check (role in ('owner', 'admin', 'viewer')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- `is_admin()` is SECURITY DEFINER so it can read `admin_users` from inside a policy on
-- `admin_users` itself without recursing through RLS. STABLE lets the planner cache it per
-- statement instead of re-querying per row.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

-- Write access implies the ability to grant yourself more access, so only `owner` may edit the
-- roster. Everyone on the roster may read it (the portal shows who has access).
create or replace function public.is_admin_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid() and a.role = 'owner'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin_owner() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_admin_owner() to authenticated;

drop policy if exists "Admins read roster" on public.admin_users;
drop policy if exists "Owners manage roster" on public.admin_users;

create policy "Admins read roster" on public.admin_users
  for select to authenticated using (public.is_admin());
create policy "Owners manage roster" on public.admin_users
  for all to authenticated using (public.is_admin_owner()) with check (public.is_admin_owner());


-- ── Roster management RPCs ──────────────────────────────────────────────────
-- The portal runs on the anon key under the admin's own session and therefore cannot read
-- `auth.users`. These SECURITY DEFINER helpers let an owner grant/revoke access by email address
-- without exposing the auth schema to the browser. Both re-check `is_admin_owner()` internally —
-- SECURITY DEFINER bypasses RLS, so the authorization check must live in the function body.

create or replace function public.admin_grant(target_email text, target_role text default 'admin')
returns public.admin_users
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  result    public.admin_users;
begin
  if not public.is_admin_owner() then
    raise exception 'Only an owner may grant administrator access.' using errcode = '42501';
  end if;
  if target_role not in ('owner', 'admin', 'viewer') then
    raise exception 'Unknown role: %', target_role using errcode = '22023';
  end if;

  select id into target_id from auth.users where lower(email) = lower(trim(target_email));
  if target_id is null then
    raise exception 'No account exists for %. Invite them under Authentication → Users first.',
      target_email using errcode = 'P0002';
  end if;

  insert into public.admin_users (user_id, email, role)
  values (target_id, lower(trim(target_email)), target_role)
  on conflict (user_id) do update set role = excluded.role, email = excluded.email
  returning * into result;

  return result;
end;
$$;

create or replace function public.admin_revoke(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_owner() then
    raise exception 'Only an owner may revoke administrator access.' using errcode = '42501';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'You cannot remove your own administrator access.' using errcode = '42501';
  end if;
  -- Removing the last owner would lock the parish out of its own portal permanently.
  if (select role from public.admin_users where user_id = target_user_id) = 'owner'
     and (select count(*) from public.admin_users where role = 'owner') <= 1 then
    raise exception 'At least one owner must remain.' using errcode = '42501';
  end if;

  delete from public.admin_users where user_id = target_user_id;
end;
$$;

revoke all on function public.admin_grant(text, text) from public;
revoke all on function public.admin_revoke(uuid) from public;
grant execute on function public.admin_grant(text, text) to authenticated;
grant execute on function public.admin_revoke(uuid) to authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 2. PARISH SETTINGS  (server-owned business rules)
-- ════════════════════════════════════════════════════════════════════════════
-- The ₦500/day Mass-offering minimum used to exist ONLY in
-- apps/mobile/src/utils/bookingRules.ts. Putting it here means the rule can be changed by the
-- parish without shipping a new APK, and — critically — that the database can enforce it.

create table if not exists public.parish_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);

alter table public.parish_settings enable row level security;

insert into public.parish_settings (key, value, description) values
  ('mass_booking_min_per_day', '500'::jsonb,
   'Minimum Mass offering in naira, per day booked. Parishioners may offer more.'),
  ('mass_booking_max_days', '31'::jsonb,
   'Maximum number of consecutive days a single Mass booking may span.'),
  ('payment_amount_ceiling', '5000000'::jsonb,
   'Absolute upper bound on any single booking or donation, in naira. Abuse guard, not policy.')
on conflict (key) do nothing;

drop policy if exists "Public read parish settings" on public.parish_settings;
drop policy if exists "Admins manage parish settings" on public.parish_settings;

-- Public read: the mobile app fetches the minimum so its client-side hint matches the server rule.
create policy "Public read parish settings" on public.parish_settings
  for select using (true);
create policy "Admins manage parish settings" on public.parish_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.setting_numeric(setting_key text, fallback numeric)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (value #>> '{}')::numeric from public.parish_settings where key = setting_key),
    fallback
  );
$$;

revoke all on function public.setting_numeric(text, numeric) from public;
grant execute on function public.setting_numeric(text, numeric) to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. REPLACE EVERY `auth.role() = 'authenticated'` ADMIN POLICY
-- ════════════════════════════════════════════════════════════════════════════
-- Each block drops the old permissive policy and recreates it against `is_admin()`.
-- Public-read policies are left untouched — parishioners are anonymous by design.

-- announcements
drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- events
drop policy if exists "Admins manage events" on public.events;
create policy "Admins manage events" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- mass_times
drop policy if exists "Admins manage mass times" on public.mass_times;
create policy "Admins manage mass times" on public.mass_times
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- parish_payment_details
drop policy if exists "Admins manage payment details" on public.parish_payment_details;
create policy "Admins manage payment details" on public.parish_payment_details
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- parish_contacts  (schema.sql splits these into per-verb policies)
drop policy if exists "Admins manage parish contacts" on public.parish_contacts;
drop policy if exists "Admins manage contacts" on public.parish_contacts;
drop policy if exists "Admins insert contacts" on public.parish_contacts;
drop policy if exists "Admins update contacts" on public.parish_contacts;
drop policy if exists "Admins delete contacts" on public.parish_contacts;
create policy "Admins insert contacts" on public.parish_contacts
  for insert to authenticated with check (public.is_admin());
create policy "Admins update contacts" on public.parish_contacts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete contacts" on public.parish_contacts
  for delete to authenticated using (public.is_admin());

-- bookings
drop policy if exists "Admins manage bookings" on public.bookings;
create policy "Admins manage bookings" on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- donations
drop policy if exists "Admins manage donations" on public.donations;
create policy "Admins manage donations" on public.donations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- sacrament config + requests
drop policy if exists "Admins manage sacrament config" on public.sacrament_request_types;
create policy "Admins manage sacrament config" on public.sacrament_request_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage sacrament requests" on public.sacrament_requests;
create policy "Admins manage sacrament requests" on public.sacrament_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- feedback_submissions — previously had NO update/delete policy at all, so admins could not
-- resolve feedback from the portal. Grant the full admin verb set.
drop policy if exists "Allow authenticated read for admin dashboard" on public.feedback_submissions;
drop policy if exists "Admins manage feedback" on public.feedback_submissions;
create policy "Admins manage feedback" on public.feedback_submissions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- ════════════════════════════════════════════════════════════════════════════
-- 4. MONEY: SERVER-SIDE VALIDATION
-- ════════════════════════════════════════════════════════════════════════════

comment on column public.bookings.payment_receipt_url is
  'Storage object PATH inside the private `payment-receipts` bucket (e.g. bookings/bk_123.jpg) — '
  'NOT a URL. Admins mint a short-lived signed URL to view it. Name kept for wire compatibility '
  'with installed mobile clients.';
comment on column public.donations.payment_receipt_url is
  'Storage object PATH inside the private `payment-receipts` bucket (e.g. donations/dn_123.jpg).';

-- Absolute bounds as declarative constraints (fast, always enforced, visible in the schema).
--
-- Added NOT VALID: the constraint applies to every new and updated row immediately, but Postgres
-- skips the scan of pre-existing rows. A legacy row written before these rules existed must not
-- abort the whole migration. `validate_legacy_constraints()` at the end reports any such rows.
do $$ begin
  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'bookings_amount_bounds_chk' and table_name = 'bookings') then
    alter table public.bookings
      add constraint bookings_amount_bounds_chk
      check (amount is null or (amount > 0 and amount <= 5000000)) not valid;
  end if;

  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'donations_amount_bounds_chk' and table_name = 'donations') then
    alter table public.donations
      add constraint donations_amount_bounds_chk
      check (amount > 0 and amount <= 5000000) not valid;
  end if;
end $$;

-- The per-day minimum depends on the row's own date range, so it needs a trigger rather than a
-- CHECK against a settings lookup (CHECKs must be immutable).
create or replace function public.validate_booking_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  min_per_day numeric := public.setting_numeric('mass_booking_min_per_day', 500);
  max_days    numeric := public.setting_numeric('mass_booking_max_days', 31);
  ceiling     numeric := public.setting_numeric('payment_amount_ceiling', 5000000);
  days        integer;
  required    numeric;
begin
  days := (new.end_date - new.start_date) + 1;

  if days < 1 then
    raise exception 'end_date must be on or after start_date' using errcode = '23514';
  end if;
  if days > max_days then
    raise exception 'A booking may span at most % day(s); received %.', max_days, days
      using errcode = '23514';
  end if;

  required := min_per_day * days;

  -- A client that omits the amount gets the computed minimum rather than a NULL row.
  if new.amount is null then
    new.amount := required;
  end if;

  if new.amount < required then
    raise exception
      'Mass offering must be at least % naira for % day(s) (% per day); received %.',
      required, days, min_per_day, new.amount
      using errcode = '23514';
  end if;
  if new.amount > ceiling then
    raise exception 'Amount exceeds the permitted ceiling of % naira.', ceiling
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_validate_amount on public.bookings;
create trigger bookings_validate_amount
  before insert or update of amount, start_date, end_date on public.bookings
  for each row execute function public.validate_booking_amount();


-- Anonymous submitters must never be able to set their own status. Only a real admin may move a
-- row off `pending`. (RLS already blocks anon UPDATE; this defends the INSERT path and any future
-- policy mistake.)
create or replace function public.force_pending_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.status := 'pending';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status and not public.is_admin() then
      raise exception 'Only an administrator may change the status of this record.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_force_pending on public.bookings;
create trigger bookings_force_pending
  before insert or update on public.bookings
  for each row execute function public.force_pending_status();

drop trigger if exists donations_force_pending on public.donations;
create trigger donations_force_pending
  before insert or update on public.donations
  for each row execute function public.force_pending_status();

drop trigger if exists sacrament_requests_force_pending on public.sacrament_requests;
create trigger sacrament_requests_force_pending
  before insert or update on public.sacrament_requests
  for each row execute function public.force_pending_status();


-- Sacrament fees are parish policy, held in `sacrament_request_types`. The client used to send
-- `amount_due`/`is_free` itself, so a crafted request could claim a paid sacrament was free.
create or replace function public.apply_sacrament_pricing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg record;
begin
  select amount, is_free, active into cfg
  from public.sacrament_request_types
  where type = new.type;

  if not found then
    raise exception 'Unknown sacrament request type: %', new.type using errcode = '23503';
  end if;
  if tg_op = 'INSERT' and cfg.active is not true then
    raise exception 'This request type is not currently accepting submissions.'
      using errcode = '42501';
  end if;

  new.amount_due := cfg.amount;
  new.is_free    := cfg.is_free;
  return new;
end;
$$;

drop trigger if exists sacrament_requests_apply_pricing on public.sacrament_requests;
create trigger sacrament_requests_apply_pricing
  before insert or update of type, amount_due, is_free on public.sacrament_requests
  for each row execute function public.apply_sacrament_pricing();


-- ════════════════════════════════════════════════════════════════════════════
-- 5. CLOSE THE SACRAMENT-REQUEST READ LEAK
-- ════════════════════════════════════════════════════════════════════════════
-- Was: `for select to anon using (true)` — every parishioner's full_name, contact_phone and
-- payload JSONB readable by anyone with the anon key (which ships inside the APK).
-- Now: anon reads status through a SECURITY DEFINER RPC keyed on the unguessable
-- client_request_id, mirroring the existing `public_fetch_request_statuses` pattern.

drop policy if exists "Public read sacrament status" on public.sacrament_requests;

create or replace function public.public_fetch_sacrament_statuses(request_ids text[])
returns table (
  client_request_id text,
  status            text,
  admin_note        text,
  updated_at        timestamptz
)
language sql
security definer
set search_path = public
as $$
  select s.client_request_id, s.status, s.admin_note, s.updated_at
  from public.sacrament_requests s
  where s.client_request_id = any(request_ids)
    -- Defensive cap: a caller cannot sweep the table by passing thousands of ids.
    and array_length(request_ids, 1) <= 100;
$$;

revoke all on function public.public_fetch_sacrament_statuses(text[]) from public;
grant execute on function public.public_fetch_sacrament_statuses(text[]) to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 6. INPUT BOUNDS ON ANON-WRITABLE COLUMNS
-- ════════════════════════════════════════════════════════════════════════════
-- Anonymous INSERT is a product requirement (parishioners have no accounts), so the table itself
-- has to bound what can be stored. Without these, a script can write megabyte-sized rows.

do $$ begin
  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'bookings_text_bounds_chk' and table_name = 'bookings') then
    alter table public.bookings add constraint bookings_text_bounds_chk check (
      char_length(name)                            between 1 and 120
      and char_length(intention)                   between 1 and 2000
      and (payment_name is null       or char_length(payment_name) <= 120)
      and (payment_reference is null  or char_length(payment_reference) <= 120)
      and (preferred_mass_time is null or char_length(preferred_mass_time) <= 120)
      and (client_request_id is null  or char_length(client_request_id) <= 64)
      and (payment_receipt_url is null or char_length(payment_receipt_url) <= 512)
    ) not valid;
  end if;

  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'donations_text_bounds_chk' and table_name = 'donations') then
    alter table public.donations add constraint donations_text_bounds_chk check (
      (donor_name is null        or char_length(donor_name) <= 120)
      and (purpose is null       or char_length(purpose) <= 200)
      and (message is null       or char_length(message) <= 2000)
      and (payment_name is null  or char_length(payment_name) <= 120)
      and (payment_reference is null or char_length(payment_reference) <= 120)
      and (client_request_id is null or char_length(client_request_id) <= 64)
      and (payment_receipt_url is null or char_length(payment_receipt_url) <= 512)
    ) not valid;
  end if;

  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'sacrament_requests_bounds_chk' and table_name = 'sacrament_requests') then
    alter table public.sacrament_requests add constraint sacrament_requests_bounds_chk check (
      char_length(full_name) between 1 and 120
      and (contact_phone is null or char_length(contact_phone) <= 40)
      and (attachment_url is null or char_length(attachment_url) <= 512)
      and (client_request_id is null or char_length(client_request_id) <= 64)
      -- 16 KB is generous for a form payload. `octet_length(payload::text)` is used rather than
      -- pg_column_size(), which is STABLE and therefore rejected inside a CHECK constraint.
      and octet_length(payload::text) <= 16384
    ) not valid;
  end if;

  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'feedback_text_bounds_chk' and table_name = 'feedback_submissions') then
    alter table public.feedback_submissions add constraint feedback_text_bounds_chk check (
      char_length(message) between 1 and 4000
      and (name is null  or char_length(name) <= 120)
      and (email is null or char_length(email) <= 200)
    ) not valid;
  end if;
end $$;


-- Try to validate the NOT VALID constraints against existing rows. A failure here means legacy
-- data violates a new rule; it is reported as a NOTICE rather than aborting, so the security
-- fixes above still land. Clean the offending rows, then re-run this block.
do $$
declare
  c record;
begin
  for c in
    select conrelid::regclass as tbl, conname
    from pg_constraint
    where not convalidated
      and contype = 'c'
      and conname in ('bookings_amount_bounds_chk', 'donations_amount_bounds_chk',
                      'bookings_text_bounds_chk', 'donations_text_bounds_chk',
                      'sacrament_requests_bounds_chk', 'feedback_text_bounds_chk')
  loop
    begin
      execute format('alter table %s validate constraint %I', c.tbl, c.conname);
      raise notice 'Validated % on %', c.conname, c.tbl;
    exception when others then
      raise notice 'LEGACY DATA violates % on % — new rows are still enforced. Fix and re-run. (%)',
        c.conname, c.tbl, sqlerrm;
    end;
  end loop;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 6b. DATE BOUNDS ON THE BAPTISMAL CARD FORM
-- ════════════════════════════════════════════════════════════════════════════
-- `required_fields` entries for `type: 'date'` now accept `datePreset` ('past' | 'future' | 'any'),
-- `minDate` and `maxDate`. Without them the Baptismal Card's date of baptism was unbounded — a
-- future date was accepted — and the Android picker opened on the current month, which reads as
-- "it will only let me pick today" when the answer is decades ago.
--
-- The original seed uses ON CONFLICT DO NOTHING, so an existing deployment keeps the old config
-- until it is rewritten here.

update public.sacrament_request_types
set required_fields = (
  select jsonb_agg(
    case
      when field->>'key' = 'baptism_date'
        then field || jsonb_build_object(
          'datePreset', 'past',
          'minDate', '1900-01-01',
          'helperText', 'The date you were baptised.'
        )
      else field
    end
  )
  from jsonb_array_elements(required_fields) as field
)
where type = 'baptismal_card'
  and required_fields @> '[{"key":"baptism_date"}]'::jsonb;


-- ════════════════════════════════════════════════════════════════════════════
-- 7. STORAGE: MAKE IDEMPOTENT RECEIPT RETRIES ACTUALLY WORK
-- ════════════════════════════════════════════════════════════════════════════
-- The mobile client uploads with `upsert: true` so that retrying a submission overwrites its own
-- object instead of orphaning one. Supabase implements upsert-over-an-existing-object as an
-- UPDATE on storage.objects — and anon only had INSERT, so every retry failed silently and the
-- booking row kept a path to a stale or zero-byte object.
--
-- The path is `<kind>/<client_request_id>.<ext>`; `client_request_id` is an unguessable
-- idempotency key, so being able to overwrite a path you can name is equivalent to being able to
-- overwrite your own submission. Anon still cannot SELECT/list the bucket.

do $$ begin
  if exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname in ('Anon upload payment receipts', 'Anon overwrite own payment receipt')
  ) then
    drop policy if exists "Anon upload payment receipts" on storage.objects;
    drop policy if exists "Anon overwrite own payment receipt" on storage.objects;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Submitter upload payment receipts'
  ) then
    create policy "Submitter upload payment receipts" on storage.objects
      for insert to anon, authenticated
      with check (
        bucket_id = 'payment-receipts'
        and split_part(name, '/', 1) in ('bookings', 'donations')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Submitter overwrite payment receipts'
  ) then
    create policy "Submitter overwrite payment receipts" on storage.objects
      for update to anon, authenticated
      using (
        bucket_id = 'payment-receipts'
        and split_part(name, '/', 1) in ('bookings', 'donations')
      )
      with check (
        bucket_id = 'payment-receipts'
        and split_part(name, '/', 1) in ('bookings', 'donations')
      );
  end if;
end $$;

-- Admin read/manage policies were `to authenticated` with no role check — any signed-in user
-- could read every parishioner's receipt. Re-scope them to real admins.
drop policy if exists "Admins read payment receipts" on storage.objects;
drop policy if exists "Admins manage payment receipts" on storage.objects;
create policy "Admins read payment receipts" on storage.objects
  for select to authenticated using (bucket_id = 'payment-receipts' and public.is_admin());
create policy "Admins manage payment receipts" on storage.objects
  for all to authenticated
  using (bucket_id = 'payment-receipts' and public.is_admin())
  with check (bucket_id = 'payment-receipts' and public.is_admin());


-- ════════════════════════════════════════════════════════════════════════════
-- SEED — RUN THIS, or the portal locks everyone out
-- ════════════════════════════════════════════════════════════════════════════
-- Replace the address with the parish administrator's account (create it first via
-- Authentication → Users → Invite User).
--
--   insert into public.admin_users (user_id, email, role)
--   select id, email, 'owner' from auth.users where email = 'admin@example.org'
--   on conflict (user_id) do update set role = 'owner';
--
-- Verify afterwards:
--   select a.email, a.role from public.admin_users a;
--   select public.is_admin();          -- run while signed in as that user → true

-- Fail loudly rather than silently locking the parish out of its own portal.
do $$
declare
  roster_count integer;
  candidates   text;
begin
  select count(*) into roster_count from public.admin_users;
  if roster_count = 0 then
    select string_agg(email, ', ' order by created_at) into candidates
    from (select email, created_at from auth.users order by created_at limit 10) u;

    raise warning E'\n'
      '=====================================================================\n'
      'NO ADMINISTRATORS ARE ON THE ROSTER. The portal will reject EVERY\n'
      'sign-in with "This account is not authorized" until you seed one.\n'
      '\n'
      'Existing accounts you can promote: %\n'
      '\n'
      'Run:\n'
      '  insert into public.admin_users (user_id, email, role)\n'
      '  select id, email, ''owner'' from auth.users where email = ''YOUR@EMAIL''\n'
      '  on conflict (user_id) do update set role = ''owner'';\n'
      '=====================================================================',
      coalesce(candidates, '(none — invite one under Authentication → Users first)');
  else
    raise notice 'Administrator roster: % account(s).', roster_count;
  end if;
end $$;

notify pgrst, 'reload schema';


-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION (expected results in comments)
-- ════════════════════════════════════════════════════════════════════════════
-- No policy should mention auth.role() any more:
--   select tablename, policyname, qual from pg_policies
--   where schemaname = 'public' and qual like '%auth.role()%';        -- → 0 rows
--
-- Anon cannot underpay (run with the anon key):
--   insert into bookings (name, intention, start_date, end_date, amount)
--   values ('T','T', current_date, current_date + 2, 100);            -- → raises 23514
--
-- Anon cannot self-approve:
--   insert into bookings (..., status) values (..., 'approved');      -- → stored as 'pending'
--
-- Anon cannot read sacrament requests:
--   select * from sacrament_requests;                                 -- → 0 rows
--   select * from public_fetch_sacrament_statuses(array['known_id']); -- → status only

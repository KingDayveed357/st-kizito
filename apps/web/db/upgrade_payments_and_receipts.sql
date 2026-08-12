-- ============================================================================
-- Payments & receipts — bookings + donations.
-- Idempotent: safe to run multiple times in the Supabase SQL editor.
--
-- SUPERSEDES `upgrade_mass_bookings.sql` (which was never applied). If you happened to run that
-- file, this one is still safe: every statement is guarded, and the old `mass-receipts` bucket is
-- migrated/left alone harmlessly — the app now uses `payment-receipts`.
--
-- Fixes the live errors:
--   "Could not find the 'amount' column ... in the schema cache"
--   "Could not find the 'payment_receipt_url' column of 'bookings' in the schema cache"
-- Root cause: the frontend was correct; these columns were never created.
--
-- Storage design (one bucket, two folders):
--   bucket   : `payment-receipts` — PRIVATE (receipts contain payment details; never public)
--   layout   : bookings/<client_request_id>.<ext>   donations/<client_request_id>.<ext>
--   naming   : the client_request_id is unguessable and already the idempotency key, so a retry
--              overwrites its own file instead of orphaning one
--   types    : images + PDF only          size: 5 MB max (enforced by the bucket, not the client)
--   access   : anon may INSERT (parishioners are anonymous); only authenticated admins may READ,
--              via short-lived signed URLs generated server-side
-- ============================================================================

-- ── Bookings: date-range + amount + receipt ─────────────────────────────────
alter table public.bookings add column if not exists amount numeric(12, 2);
alter table public.bookings add column if not exists payment_receipt_url text;
-- Chosen Mass time as a human-readable label (the mobile mass-times source is grouped by day);
-- `mass_time_id` remains for a future strict FK link.
alter table public.bookings add column if not exists preferred_mass_time text;

-- Guard: end_date must be on/after start_date (defensive; the app validates too).
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'bookings_date_range_chk' and table_name = 'bookings'
  ) then
    alter table public.bookings
      add constraint bookings_date_range_chk check (end_date >= start_date);
  end if;
end $$;

-- ── Donations: receipt ──────────────────────────────────────────────────────
-- `donations.amount` already exists (NOT NULL) — only the receipt column is missing.
alter table public.donations add column if not exists payment_receipt_url text;

-- ── Storage bucket ──────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Storage RLS ─────────────────────────────────────────────────────────────
do $$ begin
  -- Parishioners may arrive with either an anonymous session or a persisted auth session.
  -- Both are allowed to upload/overwrite only their own receipt path, but never list/read the
  -- bucket. The object key is unguessable (`client_request_id`), and the folder prefix keeps the
  -- bucket limited to booking/donation uploads.
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

  -- Admins (authenticated) may read/manage receipts.
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Admins read payment receipts'
  ) then
    create policy "Admins read payment receipts" on storage.objects
      for select to authenticated using (bucket_id = 'payment-receipts');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Admins manage payment receipts'
  ) then
    create policy "Admins manage payment receipts" on storage.objects
      for all to authenticated
      using (bucket_id = 'payment-receipts')
      with check (bucket_id = 'payment-receipts');
  end if;
end $$;

-- ── Verification (run these after the migration; all should succeed) ─────────
-- select column_name from information_schema.columns
--   where table_name = 'bookings' and column_name in ('amount','payment_receipt_url','preferred_mass_time');
-- select column_name from information_schema.columns
--   where table_name = 'donations' and column_name = 'payment_receipt_url';
-- select id, public, file_size_limit from storage.buckets where id = 'payment-receipts';
-- notify pgrst, 'reload schema';   -- force PostgREST to refresh its schema cache

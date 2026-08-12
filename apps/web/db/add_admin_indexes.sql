-- ============================================================================
-- Admin / dashboard query indexes.
-- Idempotent: safe to run multiple times in the Supabase SQL editor.
--
-- Targets the real read patterns:
--   • Dashboard metrics: events by start_date, bookings/donations by status.
--   • Dashboard activity + admin lists: ORDER BY created_at DESC per table.
--   • Public reads: published announcements.
-- These tables are tiny today, but the ordering/filtering indexes keep the admin
-- snappy as parish data grows and remove sequential scans on every dashboard load.
-- ============================================================================

-- Bookings — status filter (pending/approved counts) + newest-first lists.
create index if not exists bookings_status_idx      on public.bookings (status);
create index if not exists bookings_created_at_idx   on public.bookings (created_at desc);

-- Donations — status filter + newest-first lists.
create index if not exists donations_status_idx      on public.donations (status);
create index if not exists donations_created_at_idx   on public.donations (created_at desc);

-- Events — "upcoming" filter (start_date >= now) + newest-first activity.
create index if not exists events_start_date_idx      on public.events (start_date);
create index if not exists events_created_at_idx       on public.events (created_at desc);

-- Announcements — newest-first activity + published-only public reads.
create index if not exists announcements_created_at_idx on public.announcements (created_at desc);
create index if not exists announcements_published_idx  on public.announcements (published);

-- ============================================================================
-- Parish Gallery — albums, images, storage.
-- Run AFTER apps/web/db/2026_08_security_hardening.sql (it depends on `public.is_admin()`).
-- Idempotent: safe to re-run.
--
-- Before this, the Gallery tab was entirely fictional: `useGallery.ts` returned four hardcoded
-- Unsplash photographs after a fake 300ms delay, `gallery.api.ts` and `gallery.types.ts` were
-- one-line `// STUB` files, and there was no table, no bucket and no admin page. A public-facing
-- screen showing stock photography of somebody else's church is worse than showing nothing.
--
-- STORAGE DESIGN — this bucket is PUBLIC, unlike `payment-receipts`.
-- Parish photographs are published material: they are meant to be seen, they are shown in a grid
-- of many images at once, and they contain no payment or contact details. Minting a signed URL per
-- thumbnail would add a round-trip per image and break `expo-image`'s disk cache on every
-- expiry — a real cost for parishioners on slow connections, bought for no security gain. Receipts
-- stay private precisely because that trade runs the other way.
-- ============================================================================


-- ── Albums ──────────────────────────────────────────────────────────────────
create table if not exists public.gallery_albums (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  -- The celebration the photographs are of, which is not the same as when they were uploaded.
  -- Ordering by this is what makes the gallery read as a parish history.
  event_date  date,
  published   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint gallery_albums_text_bounds_chk check (
    char_length(title) between 1 and 120
    and (description is null or char_length(description) <= 2000)
  )
);


-- ── Images ──────────────────────────────────────────────────────────────────
create table if not exists public.gallery_images (
  id           uuid primary key default gen_random_uuid(),
  album_id     uuid references public.gallery_albums(id) on delete cascade,
  -- Object path inside the `gallery` bucket, e.g. `albums/<album_id>/<uuid>.jpg`.
  -- The path, not a URL: the public base URL is derived by the client, so moving projects or
  -- putting a CDN in front does not require rewriting every row.
  storage_path text not null unique,
  caption      text,
  -- Intrinsic dimensions, captured at upload. The mobile grid uses the aspect ratio to reserve
  -- space before the image loads, so a gallery does not reflow as photographs arrive.
  width        integer,
  height       integer,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),

  constraint gallery_images_bounds_chk check (
    char_length(storage_path) between 1 and 512
    and (caption is null or char_length(caption) <= 500)
    and (width is null or width between 1 and 20000)
    and (height is null or height between 1 and 20000)
  )
);

create index if not exists gallery_images_album_idx on public.gallery_images(album_id, sort_order);
create index if not exists gallery_albums_published_idx
  on public.gallery_albums(published, event_date desc nulls last);

-- Reuse the trigger function created with the sacrament tables.
drop trigger if exists gallery_albums_set_updated_at on public.gallery_albums;
create trigger gallery_albums_set_updated_at
  before update on public.gallery_albums
  for each row execute function public.set_updated_at();


-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.gallery_albums enable row level security;
alter table public.gallery_images enable row level security;

drop policy if exists "Public read published albums" on public.gallery_albums;
drop policy if exists "Admins manage albums" on public.gallery_albums;
drop policy if exists "Public read published images" on public.gallery_images;
drop policy if exists "Admins manage images" on public.gallery_images;

create policy "Public read published albums" on public.gallery_albums
  for select using (published = true);
create policy "Admins manage albums" on public.gallery_albums
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- An image is visible only through a published album. Without the subquery, unpublishing an album
-- would hide its cover while leaving every photograph in it readable.
create policy "Public read published images" on public.gallery_images
  for select using (
    exists (
      select 1 from public.gallery_albums a
      where a.id = gallery_images.album_id and a.published = true
    )
  );
create policy "Admins manage images" on public.gallery_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- ── Storage bucket ──────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  10485760, -- 10 MB; parish photographs come straight off a phone camera
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  -- Read is public (see the design note at the top). Every write verb is admin-only: anon must
  -- never be able to put an image into a bucket the whole parish can see.
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public read gallery'
  ) then
    create policy "Public read gallery" on storage.objects
      for select using (bucket_id = 'gallery');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Admins manage gallery objects'
  ) then
    create policy "Admins manage gallery objects" on storage.objects
      for all to authenticated
      using (bucket_id = 'gallery' and public.is_admin())
      with check (bucket_id = 'gallery' and public.is_admin());
  end if;
end $$;

notify pgrst, 'reload schema';

-- ── Verification ────────────────────────────────────────────────────────────
-- With the ANON key:
--   select * from gallery_albums;   -- → published albums only
--   insert into gallery_albums (title) values ('x');  -- → violates RLS
-- With an ADMIN session:
--   insert into gallery_albums (title, published) values ('Harvest 2026', true);

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  message text not null,
  category text not null check (category in ('bug', 'feature request', 'general feedback')),
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.feedback_submissions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feedback_submissions'
      and policyname = 'Allow public feedback inserts'
  ) then
    create policy "Allow public feedback inserts"
      on public.feedback_submissions
      for insert
      to anon
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feedback_submissions'
      and policyname = 'Allow authenticated read for admin dashboard'
  ) then
    create policy "Allow authenticated read for admin dashboard"
      on public.feedback_submissions
      for select
      to authenticated
      using (true);
  end if;
end $$;

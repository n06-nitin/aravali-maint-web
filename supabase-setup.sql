-- ============================================================
-- Aravali Maintenance Portal — Supabase setup
-- Paste this whole file into: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. The problems table -------------------------------------------------
create table if not exists public.problems (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  entry_no      text not null,
  phone         text not null,
  category      text not null,          -- washing_machine | washrooms | rooms | general | others
  priority      text not null default 'normal',   -- normal | urgent
  location      text,
  description   text not null,
  photo_urls    text[] not null default '{}',
  status        text not null default 'new',       -- new | registered | resolved
  resolved_at   timestamptz
);

-- 2. Row Level Security -------------------------------------------------
alter table public.problems enable row level security;

-- Anyone (even not logged in) can READ problems
create policy "public can read problems"
  on public.problems for select
  using (true);

-- Anyone can ADD a problem
create policy "public can add problems"
  on public.problems for insert
  with check (true);

-- Only logged-in staff (secretary, warden, caretaker) can MODIFY
create policy "staff can update problems"
  on public.problems for update
  using (auth.uid() is not null);

-- 3. Storage bucket for photos -----------------------------------------
-- Create a PUBLIC bucket named 'problem-photos':
--   Dashboard -> Storage -> New bucket -> name: problem-photos -> Public bucket: ON
-- Then run the two policies below so anonymous users can upload photos.

create policy "public can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'problem-photos');

create policy "public can read photos"
  on storage.objects for select
  using (bucket_id = 'problem-photos');

-- ============================================================
-- 4. Create the 3 staff accounts (do this in the dashboard, not here):
--    Dashboard -> Authentication -> Users -> Add user
--    Add one user each for the maintenance secretary, warden, caretaker
--    (set "Auto Confirm User" so they can log in immediately).
-- ============================================================

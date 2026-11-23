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
drop policy if exists "public can read problems" on public.problems;
create policy "public can read problems"
  on public.problems for select
  using (true);

-- Anyone can ADD a problem
drop policy if exists "public can add problems" on public.problems;
create policy "public can add problems"
  on public.problems for insert
  with check (true);

-- Only logged-in staff (secretary, warden, caretaker) can MODIFY
drop policy if exists "staff can update problems" on public.problems;
create policy "staff can update problems"
  on public.problems for update
  using (auth.uid() is not null);

-- 3. Storage bucket for photos -----------------------------------------
-- Create a PUBLIC bucket named 'problem-photos':
--   Dashboard -> Storage -> New bucket -> name: problem-photos -> Public bucket: ON
-- Then run the two policies below so anonymous users can upload photos.

drop policy if exists "public can upload photos" on storage.objects;
create policy "public can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'problem-photos');

drop policy if exists "public can read photos" on storage.objects;
create policy "public can read photos"
  on storage.objects for select
  using (bucket_id = 'problem-photos');

-- ============================================================
-- 4. Create staff accounts (do this in the dashboard, not here):
--    Dashboard -> Authentication -> Users -> Add user
--    Add an email & password for maintenance secretary, warden, caretakers
--    (Enable "Auto Confirm User" so they can log in immediately).
-- ============================================================

-- 5. Hostel Polls --------------------------------------------------------
create table if not exists public.polls (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  title            text not null,
  description      text,
  status           text not null default 'active', -- 'active' | 'ended'
  options          jsonb not null default '[]'::jsonb, -- array of { id, text, image_url }
  require_entry_no boolean not null default false,
  ended_at         timestamptz
);

-- In case table already existed, add column if missing:
alter table public.polls add column if not exists require_entry_no boolean not null default false;

alter table public.polls enable row level security;

-- Anyone can read polls
drop policy if exists "public can read polls" on public.polls;
create policy "public can read polls"
  on public.polls for select
  using (true);

-- Only logged-in staff can add, update (start/end), or delete polls
drop policy if exists "staff can insert polls" on public.polls;
create policy "staff can insert polls"
  on public.polls for insert
  with check (auth.uid() is not null);

drop policy if exists "staff can update polls" on public.polls;
create policy "staff can update polls"
  on public.polls for update
  using (auth.uid() is not null);

drop policy if exists "staff can delete polls" on public.polls;
create policy "staff can delete polls"
  on public.polls for delete
  using (auth.uid() is not null);

-- 6. Poll Votes ----------------------------------------------------------
create table if not exists public.poll_votes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  poll_id     uuid not null references public.polls(id) on delete cascade,
  option_id   text not null,
  entry_no    text not null,
  constraint unique_poll_entry_no unique (poll_id, entry_no)
);

alter table public.poll_votes enable row level security;

-- Anyone can read votes to display live/final tally
drop policy if exists "public can read poll_votes" on public.poll_votes;
create policy "public can read poll_votes"
  on public.poll_votes for select
  using (true);

-- Anyone can cast a vote (entry_no enforces 1 vote per person)
drop policy if exists "public can cast vote" on public.poll_votes;
create policy "public can cast vote"
  on public.poll_votes for insert
  with check (true);


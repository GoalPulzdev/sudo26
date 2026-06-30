-- Sudoku 2026 — initial schema + RLS
-- Roadmap Fase 4 (docx 7.1 / 7.2 / 7.3).
--
-- Apply with the Supabase CLI:  supabase db push
-- or paste into the SQL editor of a Supabase project.
--
-- Principles:
--   * a user reads/updates only their own profile
--   * anyone reads the public leaderboard
--   * a user inserts completed_games only for themselves
--   * a user never writes leaderboard rows directly
--   * achievements are granted server-side (service role), not by clients

-- ─── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  color       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── daily_puzzles ─────────────────────────────────────────────────────────────
create table if not exists public.daily_puzzles (
  id          text primary key,            -- e.g. 'daily-2026-06-30'
  date        date not null unique,
  variant     text not null default 'classic',
  difficulty  text not null,
  clues       text not null,
  solution    text not null,
  seed        text not null,
  created_at  timestamptz not null default now()
);

-- ─── completed_games ───────────────────────────────────────────────────────────
create table if not exists public.completed_games (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  puzzle_id           text not null,
  variant             text not null,
  difficulty          text not null,
  elapsed_seconds     int  not null check (elapsed_seconds > 0),
  mistakes            int  not null default 0 check (mistakes >= 0),
  hints_used          int  not null default 0 check (hints_used >= 0),
  completed_at        timestamptz not null default now(),
  client_started_at   timestamptz,
  client_completed_at timestamptz,
  validation_status   text not null default 'pending'
                        check (validation_status in ('pending','accepted','suspicious','rejected'))
);
create index if not exists completed_games_user_idx on public.completed_games (user_id);
create index if not exists completed_games_puzzle_idx on public.completed_games (puzzle_id);

-- ─── leaderboard_entries ───────────────────────────────────────────────────────
-- Written server-side (service role) from accepted completed_games. Clients read only.
create table if not exists public.leaderboard_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  username        text not null,
  avatar_url      text,
  puzzle_id       text not null,
  variant         text not null,
  difficulty      text not null,
  elapsed_seconds int  not null,
  mistakes        int  not null default 0,
  completed_at    timestamptz not null default now(),
  unique (user_id, puzzle_id)
);
create index if not exists leaderboard_puzzle_idx on public.leaderboard_entries (puzzle_id, elapsed_seconds);

-- ─── achievements ──────────────────────────────────────────────────────────────
create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  name        text not null,
  description text not null
);

create table if not exists public.user_achievements (
  user_id        uuid not null references auth.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ─── multiplayer ───────────────────────────────────────────────────────────────
create table if not exists public.multiplayer_rooms (
  id         text primary key,             -- shareable room code
  puzzle_id  text not null,
  status     text not null default 'waiting'
               check (status in ('waiting','playing','finished')),
  created_at timestamptz not null default now()
);

create table if not exists public.multiplayer_players (
  room_id   text not null references public.multiplayer_rooms (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  username  text not null,
  progress  int  not null default 0,
  finished  boolean not null default false,
  elapsed   int,
  primary key (room_id, user_id)
);

create table if not exists public.multiplayer_events (
  id         bigint generated always as identity primary key,
  room_id    text not null references public.multiplayer_rooms (id) on delete cascade,
  player_id  uuid not null,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mp_events_room_idx on public.multiplayer_events (room_id, id);

-- ─── Row Level Security ─────────────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.daily_puzzles       enable row level security;
alter table public.completed_games     enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.achievements        enable row level security;
alter table public.user_achievements   enable row level security;
alter table public.multiplayer_rooms   enable row level security;
alter table public.multiplayer_players enable row level security;
alter table public.multiplayer_events  enable row level security;

-- profiles: read any, write only your own
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- daily_puzzles: world-readable; writes via service role only (no client policy)
create policy daily_read on public.daily_puzzles for select using (true);

-- completed_games: a user reads and inserts only their own rows; no client update/delete
create policy completed_read   on public.completed_games for select using (auth.uid() = user_id);
create policy completed_insert on public.completed_games for insert with check (auth.uid() = user_id);

-- leaderboard_entries: world-readable; writes via service role only (no client policy)
create policy leaderboard_read on public.leaderboard_entries for select using (true);

-- achievements: world-readable catalogue; grants via service role only
create policy achievements_read on public.achievements for select using (true);
create policy user_achievements_read on public.user_achievements for select using (auth.uid() = user_id);

-- multiplayer: readable by anyone (room codes are the gate); writes refined later
create policy mp_rooms_read   on public.multiplayer_rooms   for select using (true);
create policy mp_players_read on public.multiplayer_players for select using (true);
create policy mp_events_read  on public.multiplayer_events  for select using (true);

-- NOTE: leaderboard_entries and achievement grants are intentionally writable
-- only by the service role (server-side), so clients cannot inject results.

# Supabase schema

Status: **SQL written, not yet provisioned.** The schema and RLS below are
implemented as a runnable migration at
[`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql).
Row shapes are typed in `packages/core/src/db.ts`. Submission validation
(anti-cheat) is implemented and tested in `packages/core/src/antiCheat.ts`.

Remaining: provision a Supabase project, set env (see `.env.example`), apply the
migration (`supabase db push`), and wire the leaderboard writer (service role).
The leaderboard API already reads live data when env is configured
(`apps/web/src/lib/leaderboardSource.ts`), mock otherwise.

## Tables (minimum)

```
profiles
daily_puzzles
completed_games
leaderboard_entries
achievements
user_achievements
multiplayer_rooms
multiplayer_players
multiplayer_events
```

### profiles
```
id          uuid primary key references auth.users(id)
username    text unique
color       text
created_at  timestamptz default now()
updated_at  timestamptz default now()
```

### completed_games
```
id                  uuid primary key default gen_random_uuid()
user_id             uuid references auth.users(id)
puzzle_id           text not null
variant             text not null
difficulty          text not null
elapsed_seconds     int  not null
mistakes            int  not null
hints_used          int  not null
completed_at        timestamptz default now()
client_started_at   timestamptz
client_completed_at timestamptz
validation_status   text default 'pending'
```

### leaderboard_entries
Either a materialized view or a table updated server-side. Never written
directly by the client.

## Row Level Security

Every table has RLS. Principles:

- A user can read and update **their own** profile.
- Anyone can read the public leaderboard.
- A user can insert a `completed_game` **for themselves**.
- A user **cannot** write leaderboard rows directly.
- Achievements are computed server-side or via a controlled function.

## Anti-cheat (light, v1)

Better than nothing, not extreme:

- reject completed games under an impossible time
- store puzzle seed / id
- check the puzzle exists
- check variant / difficulty match the puzzle
- check elapsed is positive
- rate-limit submissions
- **mark** suspicious results rather than deleting them

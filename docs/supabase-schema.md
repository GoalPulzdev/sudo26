# Supabase schema (target)

Status: **not yet implemented.** Leaderboard and rooms APIs are mock/in-memory
today. This documents the target backend for roadmap Fase 4.

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

# Sudoku 2026

Next-generation Sudoku for all platforms. Built with **Turborepo**, **Next.js 15**,
**Expo**, and a shared TypeScript game engine.

> **Status: Alpha → hardening toward production.**
> This README separates what is *implemented*, what is *mock/prototype*, and what
> is *planned*, so nobody mistakes a stub for a finished feature. See
> [`docs/product-roadmap.md`](docs/product-roadmap.md).

---

## Architecture

```
sudo26/
├── apps/
│   ├── web/      ← Next.js 15 (web + PWA)
│   └── mobile/   ← Expo / React Native (iOS + Android)
└── packages/
    └── core/     ← Shared game engine (TypeScript, no framework deps)
```

Full detail in [`docs/architecture.md`](docs/architecture.md).

### `packages/core` — the engine
Pure TypeScript, no framework dependencies.

| File | Contents |
|------|----------|
| `generator.ts` | Classic generate/solve, seeded RNG, deterministic daily |
| `board.ts` | Board model, clone, serialize |
| `gameState.ts` | Pure reducer (select, input, notes, undo, timer, win) |
| `hints.ts` | Hint pipeline (singles, pairs, pointing pair, reveal fallback) |
| `mini.ts` | 6×6 generator with uniqueness check |
| `killer.ts` | Killer cage generation/validation |
| `samurai.ts` | 5×9×9 generator (prototype) |
| `streaks.ts` | Daily streak math |

### `apps/web` — Next.js 15
App Router. Pages under `src/app/play/*`. Game state in Zustand + localStorage.

### `apps/mobile` — Expo
Expo Router. Shares `@sudoku-2026/core` with web.

---

## Feature status

**Legend:** ✅ implemented · 🟡 mock / prototype · 🔜 planned

| Feature | Status | Note |
|---------|:------:|------|
| Classic 9×9 Sudoku (all difficulties) | ✅ | seeded, unique-solution generator + tests |
| Deterministic daily puzzle | ✅ | same board per date |
| Pure game reducer (input/notes/undo/win) | ✅ | unit-tested |
| Streaks | ✅ | core math tested; storage app-side |
| Mini 6×6 Sudoku | ✅ | generator with uniqueness; UI not yet on shared shell |
| Hints — singles, pairs, pointing pair | ✅ | with explanations |
| Hints — X-Wing | 🟡 | declared in types/docstring, **not implemented** |
| Hint fallback | 🟡 | reveals the solution; typed `ai_suggestion` but is **not** AI |
| Technique-based difficulty rating | 🔜 | today difficulty = clue count only |
| Killer Sudoku cages | 🟡 | generates; full cage validation pending |
| Samurai Sudoku | 🟡 | 5 **independent** grids; overlaps do not match yet |
| Leaderboard | 🟡 | UI + API on **mock/in-memory** data |
| Multiplayer rooms | 🟡 | routing + server shell, not real-time |
| PWA offline | ✅ | manifest + service worker |
| Animated UI (Framer Motion) | ✅ | |
| Dark mode | ✅ | |
| iOS/Android via Expo | ✅ | app shell runs |
| Server-side results / real leaderboard | 🔜 | needs Supabase (see `docs/supabase-schema.md`) |
| Real-time multiplayer | 🔜 | Supabase Realtime / PartyKit |

---

## Getting started

### Prerequisites
- Node.js ≥ 20
- pnpm 10.33.0 (`npm i -g pnpm@10.33.0`, or `corepack` if writable)

### Install
```bash
pnpm install
```

### Run web (dev)
```bash
pnpm --filter @sudoku-2026/web dev   # → http://localhost:3000
```

### Run mobile (Expo)
```bash
pnpm --filter @sudoku-2026/mobile dev   # scan the QR with Expo Go
```

### Quality gate (what CI runs)
```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

---

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs type-check, lint,
test, and build on every PR and on push to `main`. No merge to `main` without
green CI. See [`docs/release-checklist.md`](docs/release-checklist.md).

---

## Docs

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/product-roadmap.md`](docs/product-roadmap.md)
- [`docs/game-engine-contract.md`](docs/game-engine-contract.md)
- [`docs/testing-strategy.md`](docs/testing-strategy.md)
- [`docs/supabase-schema.md`](docs/supabase-schema.md)
- [`docs/release-checklist.md`](docs/release-checklist.md)

---

## Technology

Turborepo · Next.js 15 (App Router) · Expo 54 · Zustand · Framer Motion ·
Tailwind CSS v4 · TypeScript · tsup · Vitest

---

## Multiplayer (toward real-time)

The current rooms API is an in-memory shell. Real-time needs:
1. shared room state (Supabase Realtime, PartyKit, or Redis + Socket.io)
2. event protocol — see `packages/core/src/types.ts` → `MultiplayerEvent`
3. server-validated results

Per the roadmap, multiplayer comes **after** core, daily, profiles, and a real
leaderboard are solid.

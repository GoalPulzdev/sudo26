# Sudoku 2026

Next-generation Sudoku for alle plattformer. Bygget med **Turborepo**, **Next.js 15**, **Expo** og delt TypeScript spillogikk.

---

## Arkitektur

```
sudoku-2026/
├── apps/
│   ├── web/          ← Next.js 15 (web + PWA)
│   └── mobile/       ← Expo / React Native (iOS + Android)
└── packages/
    └── core/         ← Delt spillmotor (TypeScript, null deps)
```

### `packages/core` – Spillmotoren
Ren TypeScript, ingen rammeverk-avhengigheter. Inneholder:

| Fil | Innhold |
|-----|---------|
| `generator.ts` | Sudoku-generator (backtracking + seeded RNG) |
| `hints.ts` | AI hint-motor: 5 strategier (Naked Single → X-Wing → AI fallback) |
| `gameState.ts` | Ren reducer for spilltilstand |
| `killer.ts` | Killer Sudoku: cage-generering og validering |
| `samurai.ts` | Samurai Sudoku: 5 overlappende 9×9 brett |
| `streaks.ts` | Streak-beregning for daglige utfordringer |

### `apps/web` – Next.js 15
Alle sider er App Router-baserte og støtter SSG/SSR:

| Rute | Beskrivelse |
|------|-------------|
| `/` | Hjemmeside med alle spillmoduser |
| `/play/classic/[difficulty]` | Klassisk Sudoku (enkel/middels/vanskelig/ekstrem) |
| `/play/daily` | Daglig utfordring med streak-tracking |
| `/play/killer` | Killer Sudoku |
| `/play/samurai` | Samurai Sudoku (5 brett) |
| `/multiplayer` | Opprett / bli med i multiplayer-rom |
| `/leaderboard` | Global rangliste |
| `/api/leaderboard` | REST API – leaderboard entries |
| `/api/rooms` | REST API – opprett/hent multiplayer-rom |

### `apps/mobile` – Expo
React Native app med Expo Router. Deler core-pakken med web.

---

## Kom i gang

### Forutsetninger
- Node.js ≥ 20
- pnpm ≥ 10 (`npm i -g pnpm`)

### Installer avhengigheter
```bash
pnpm install
```

### Kjør web (development)
```bash
pnpm --filter @sudoku-2026/web dev
# → http://localhost:3000
```

### Kjør mobil (Expo)
```bash
pnpm --filter @sudoku-2026/mobile dev
# Skann QR-koden med Expo Go
```

### Bygg alt
```bash
pnpm build
```

---

## Features i 2026-utgaven

| Feature | Status |
|---------|--------|
| Klassisk 9×9 Sudoku (alle vanskelighetsgrader) | ✅ |
| Daglige utfordringer med streak | ✅ |
| AI-hints (5 strategier + fallback) | ✅ |
| Pencil notes | ✅ |
| Killer Sudoku cages | ✅ |
| Samurai Sudoku (5 overlappende brett) | ✅ |
| Multiplayer rom-system | ✅ (server-shell) |
| Leaderboard | ✅ (mock-data) |
| PWA offline-støtte | ✅ |
| Animert UI (Framer Motion) | ✅ |
| Dark mode | ✅ |
| iOS/Android via Expo | ✅ |
| Real-time WebSocket multiplayer | 🔜 (krever Redis + Socket.io) |
| Ekte database-rangliste | 🔜 (krever Supabase/Postgres) |

---

## Multiplayer (full implementasjon)

For full sanntids-multiplayer trengs:
1. **Redis** – for delt romtilstand
2. **Socket.io** eller **Partykit** – WebSocket events
3. Oppdater `/api/rooms` til å bruke Redis og emitte events

Se `packages/core/src/types.ts` → `MultiplayerEvent` for event-protokollen.

---

## Teknologi

- **Turborepo** – monorepo med parallell bygging
- **Next.js 15** – App Router, SSR/SSG, API Routes
- **Expo 52** – iOS/Android/Web via React Native
- **Zustand** – spilltilstand med localStorage-persistering
- **Framer Motion** – animasjoner
- **Tailwind CSS v4** – styling
- **TypeScript** – end-to-end typesikkerhet
- **tsup** – ultra-rask bundling av core-pakken

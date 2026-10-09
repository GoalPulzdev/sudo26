# Sudoku 26 — Obsidian V2

Status: **Implementation in progress**, isolated on `feat/obsidian-arena-v2`. This document distinguishes shipped code from future work; it is not a release declaration.

## Design decision

Obsidian is the selected identity. Dark midnight navy `#090d16`, deep-slate panels, restrained champagne gold `#c4a166`, warm-ivory typography `#f2eee5` and a high-contrast warm-paper playable Sudoku board. Luxury comes from hierarchy, generous whitespace, calm motion and tactile precision—not gradients everywhere or hard-to-read game cells.

The home arena visually invites the user to play. All metrics and today's result are read from the real local stores, not invented stats. The featured decorative board is deliberately non-interactive and is **not** a claim to show today's actual puzzle.

## Implemented on this branch

- **Obsidian Arena:** new wide desktop / responsive mobile homepage, serif editorial hierarchy, premium daily call to action, real completion state, countdown, weekly strip, live streak/solved/best streak, four existing variants and classic difficulty shortcuts.
- **Obsidian GameShell:** shared Classic/Daily/Killer/Duel play chrome in dark canvas with branded navigation, progress HUD, warm-paper classic board, tactile keys and accessible keyboard focus; coach integration preserved.
- **Killer board:** cage outlines rather than random violet, cyan and pink colors, with readable sums and preserved cage validation.
- **Classic win overlay:** neutral backdrop and an understated luxury victory symbol instead of oversized emoji; results, analysis, sharing and actions preserved.
- **Theme isolation:** `apps/web/src/app/obsidian.css` is imported after the existing global stylesheet. Existing legacy surfaces and React Native consumers retain their colors. `packages/design/src/tokens.ts` now exports an Obsidian palette without breaking the original token contract.
- **Accessibility:** motion-reduction CSS, visible keyboard focus, named board cells and number keys, progressbar value and high-contrast foregrounds.

## Current scope

The actual shared core engine, puzzle generator, coach logic, replay/ghost duel engine, daily streaks, Supabase/auth, mobile app and multiplayer behavior remain **unchanged**. Mini/Samurai standalone game surfaces and account/statistics/leaderboard pages retain their earlier Nordic visual direction until a dedicated follow-up audit—do not suggest they are converted already.

## Design QA gate

1. Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm type-check`, `pnpm lint` and `pnpm test` in a GitHub checkout / CI.
2. Compare at **375×812 mobile**, **768×1024 tablet**, **1440×900 desktop**, and **1920×1080 wide**.
3. At each size test home, classic/daily/killer, completed daily, coach hint, paused state, classic victory, replay and ghost duel. No horizontal scroll, cutoffs, hidden controls or illegible notes.
4. Navigate keyboard-only: all links and buttons have discernible focus; test numeric keyboard entry and note mode. Confirm reduced-motion setting works.
5. Confirm a daily result displays real timing/streak, archived days and solved-state CTA; stats must never fall back to fake values.
6. Check Killer cage borders and sum labels when a cell is selected, completed or invalid.
7. Confirm all overlays remain readable on the dark shell and that drag/touch targets feel reliable on mobile.
8. Request a visual review before merging. Do not mark visually approved until screenshots from a real browser have been inspected.

## Follow-up phases

- **Obsidian V2.1**: Bring standalone Mini and Samurai screens into the same design system, including responsive Samurai zoom/focus.
- **Obsidian V2.2**: Premium stats/profile/leaderboard and their empty/loading/error states, plus cohesive Duel/Replay intro screens and complete victory treatments.
- **Obsidian V2.3**: Formal visual regression captures, automated contrast/performance checks, cross-device QA, and production rollout after approval.

## Architecture guardrails

- Never redesign by changing Sudoku rules or solver internals.
- Do not fake social proof, matches, scores, paid capabilities or backend connectivity.
- Avoid breaking stored puzzles / user sessions.
- Visual enhancements must not block interaction, override semantic game errors, or require expensive animations to play.
- Dark shell and light board must be easy to tell apart. Gold is an accent, not a replacement for accessible text.

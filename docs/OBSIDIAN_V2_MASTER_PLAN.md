# Sudoku 26 — Obsidian V2

Status: **UI polish implemented on `feat/obsidian-arena-v2`**, awaiting visual acceptance. PR #2 is a draft, not a release. Vercel preview and CI checks must match the latest commit before review.

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
- **V2.1 polish:** reusable `ObsidianHallHeader`, unified stats/records/profile styling and navigation with real existing data; accessible profile modal and palette selection.
- **Mini:** warm-paper 6×6 gameplay with pause/resume, guarded keyboard input, disabled controls while paused/finished, accessible selected-cell states, new calm completion UI.
- **Samurai:** themed center game with separate outer-grid previews; explicitly indicates that only the center is playable. The playable center now renders live reducer state (not a frozen startup copy), the progress count reflects center editable cells, and paused games hide the board. Number pad and hints are disabled for outer previews rather than silently modifying the wrong board.

## Current scope

The actual shared core engine, puzzle generator, coach logic, replay/ghost duel engine, daily streaks, Supabase/auth, mobile app and multiplayer behavior remain **unchanged**. Mini, Samurai and account/statistics/leaderboard **now share Obsidian visual tokens and navigation**, but comprehensive end-to-end visual QA is still missing. The **four outer Samurai boards remain previews, not a completed five-board playable Samurai game**; that requires a separate game-state/integration milestone, not cosmetic CSS. Duel/Replay introductions, all variant-specific victory overlays, and the React Native application are not fully migrated.

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

- **Obsidian V2.1**: Existing Mini and Samurai surfaces now themed, with Mini pause and Samurai's incomplete outer boards made explicit. Remaining: genuinely playable full-five-grid Samurai with overlap synchronization, completion logic, tracking and responsive focus/zoom (new feature scope).
- **Obsidian V2.2**: Stats/profile/leaderboard base design implemented. Remaining: audited empty/loading/error states, finished responsive variations, Duel/Replay intro screens and all variant-specific victory treatments.
- **Obsidian V2.3**: Formal real-browser visual regression captures, automated contrast/performance checks, cross-device QA, and production rollout after approval.

## Architecture guardrails

- Never redesign by changing Sudoku rules or solver internals.
- Do not fake social proof, matches, scores, paid capabilities or backend connectivity.
- Avoid breaking stored puzzles / user sessions.
- Visual enhancements must not block interaction, override semantic game errors, or require expensive animations to play.
- Dark shell and light board must be easy to tell apart. Gold is an accent, not a replacement for accessible text.


## Quality evidence (scope-specific)

A previous Obsidian commit passed full GitHub CI (build, type-check, lint, tests). The latest polish commit must pass CI independently. Vercel `READY` verifies a deployment build, **not** the appearance of every route or functional browser interaction. The rendering environment currently does not have network access to GitHub/Vercel for autonomous screenshot capture; therefore 375/768/1440 screenshots, color-contrast measurements and keyboard E2E are explicitly unverified. Do not merge this draft purely on the basis of compilation.

The user-facing Samurai copy intentionally distinguishes preview-only exterior boards until the actual multi-grid game workflow exists. Avoid claiming 'full Samurai' gameplay in marketing or release notes.


## Obsidian V3 — Reference-image parity pass (2026-10-09)

The four AI-generated reference images are **creative visual targets**, not snapshots of functioning code. Do not include their invented players, leaderboard numbers, claims, historical activity records, rating, total puzzles played, or unsupported media links.

Code delivered in V3 (on the existing draft PR):
- Home re-authored as a cinematic wide-page editorial composition with CSS/SVG-designed chess-like art desk, tilted decorative 9×9 board, gold display typography and five bespoke visual game-mode cards. The decorative grid is intentionally not a daily-game board. Real store values drive streak, solved games, best streak and daily result.
- Original SVG dusk mountain scene at \`apps/web/public/obsidian/mountain-dusk.svg\`. Layered optimized Unsplash atmospheric landscape URLs provide optional photographic lighting, with the local art underneath as visual fallback. All game numbers/cards remain DOM and state-driven, never part of raster art.
- Mini desktop redesigned around a center play surface and separate status/difficulty sidebar; retains the existing 6×6 controller, notes, keyboard, win and pause functions. Tablet/mobile collapse to a vertical single-column flow.
- Profile desktop now uses identity hero, live user name, four truthful stat cards, two-column records and earned achievements; profile editing remains unchanged.
- Stats includes an accurately labeled win-rate ring calculated from recorded stats, won-count overview and full existing data table; the visualization does not represent a scientific cognitive score.
- Metadata name, description and browser theme updated to Sudoku26 dark identity.

**Parity caveats:** There is still **no verified browser screenshot** from Vercel at 375/768/1440px due to browser/network access restriction. This pass brings structure and visual language closer to the reference, but no numeric image-fidelity claim is warranted. The CSS-only decorative hero scene is not the identical photographic still-life of the mock. Externally sourced landscape assets must be visually checked in the preview for loading and contrast. The genuine Samurai game remains only center-playable; avoid the original mock's unsupported five-grid complete-game promise.

### Required V3 visual acceptance
- Capture and compare **real** production-compiled screenshots of homepage, Mini, profile and stats against their respective approved mock reference on desktop + mobile.
- Check hero composition, type hierarchy, row spacing, image loading/fallback, hover styles, first-fold density, stats panel readability.
- Check Mini at 375x812 and 1440x900: board fully visible, status/controls correctly placed, notes usable, pause covers game, tap targets adequate.
- Check profile/achievements never show mock names, scores or badges the player has not earned.
- Confirm no horizontal overflow, no duplicate navigation, no misleading badges.
- Leave draft PR unmerged until tests, previews and visual acceptance pass.

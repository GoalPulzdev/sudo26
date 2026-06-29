# Sudoku-prosjektet: Statusrapport og videre plan

## 1. Kort oppsummering

Prosjektet har utviklet seg fra ideen om et enkelt Sudoku-spill til en tydelig plattform-satsing med delt spillmotor, webapp og mobilapp. Det viktigste å merke seg nå er at dere allerede bygger mer enn en MVP: fundamentet for flere spillmoduser, daglige utfordringer, statistikk, achievements og profilopplevelse er på plass.

Den største forskjellen fra den opprinnelige planen er at prosjektet ikke lenger er et klassisk `index.html/style.css/script.js`-oppsett. Kodebasen er nå et monorepo med:

- `apps/mobile`: Expo / React Native-app
- `apps/web`: Next.js-webapp med PWA-retning
- `packages/core`: delt Sudoku-motor i TypeScript

Det betyr at prosjektet teknisk sett er mer ambisiøst enn først skissert, men også at videre arbeid bør prioriteres hardere slik at opplevelsen blir stabil før flere sosiale lag legges på.

---

## 2. Hva som er bygget til nå

### Nåværende funksjonalitet

- Klassisk Sudoku er spillbar i mobilappen.
- Daglig Sudoku er implementert med deterministisk daglig brett.
- Flere varianter finnes i strukturen: `classic`, `daily`, `killer`, `mini`, `samurai`.
- Sudoku-brett, tallvelger, notatmodus, hint, undo, pause og seier-modal er implementert i UI-laget.
- Spillmotoren genererer brett, løser brett og håndterer validering via delt core-pakke.
- Lokal statistikk, streaks og achievements er delvis implementert.
- Profil-, statistikk- og rekordskjermer finnes i mobilappen.
- Webappen har sider for spilling, leaderboard og multiplayer-shell.
- Leaderboard API finnes, men bruker mock-data.

### Viktige filer i prosjektet

- `README.md`
  - Beskrivelse: overordnet prosjektbeskrivelse, arkitektur og funksjonsoversikt.
- `packages/core/src/generator.ts`
  - Beskrivelse: generering av Sudoku-brett, løsning av brett og daglig puzzle-seeding.
- `packages/core/src/gameState.ts`
  - Beskrivelse: ren spill-reducer for valg av celle, input, notater, hint, undo, timer og win-state.
- `packages/core/src/types.ts`
  - Beskrivelse: delte typer for brett, spilltilstand, leaderboard, streaks og multiplayer.
- `apps/mobile/app/index.tsx`
  - Beskrivelse: mobil-hjemskjerm med valg av spillmoduser og streak-banner.
- `apps/mobile/app/play/classic.tsx`
  - Beskrivelse: spillskjerm for klassisk Sudoku med vanskelighetsvalg, timer, hint og win-modal.
- `apps/mobile/app/play/daily.tsx`
  - Beskrivelse: daglig utfordring med lokalt streak-oppsett.
- `apps/mobile/components/SudokuBoard.tsx`
  - Beskrivelse: visuelt Sudoku-brett med markering av valgt celle, hint og notater.
- `apps/mobile/components/NumberPad.tsx`
  - Beskrivelse: tallvelger med erase, note mode, hint og undo.
- `apps/mobile/store/gameStore.ts`
  - Beskrivelse: lokal tilstand for aktivt spill, statistikk og achievements i mobilappen.
- `apps/mobile/app/stats.tsx`
  - Beskrivelse: statistikkvisning per vanskelighetsgrad og streak.
- `apps/mobile/app/leaderboard.tsx`
  - Beskrivelse: lokale personlige rekorder i mobilappen.
- `apps/mobile/app/profile.tsx`
  - Beskrivelse: profilskjerm med achievements og enkel profilredigering.
- `apps/web/src/app/leaderboard/page.tsx`
  - Beskrivelse: webvisning av rekorder og progresjon.
- `apps/web/src/app/api/leaderboard/route.ts`
  - Beskrivelse: API-rute for leaderboard, foreløpig basert på seeded mock-data.
- `apps/mobile/lib/challenges.ts`
  - Beskrivelse: placeholder for venn/challenge-system, ikke implementert ennå.

---

## 3. Teknisk status

### Det som allerede fungerer godt

- Delt spillmotor mellom web og mobil er et sterkt arkitekturvalg.
- Sudoku-brettet har tydelig visuell tilstand: valgt celle, peers, like tall, hint og feilmarkering.
- Timer, hint, undo og note mode er på plass.
- Daglige puzzles er deterministiske, som er viktig for framtidig global konkurranse.
- Prosjektet har allerede struktur for flere moduser og utvidelser.

### Det som er delvis ferdig

- Leaderboard finnes som UI og API, men er ikke koblet til ekte backend.
- Profilsystem finnes, men er primært lokalt/UI-drevet.
- Multiplayer finnes som struktur og ruting, men ikke som ekte sanntidsspill.
- Challenge-system er kun placeholder.

### Det som mangler eller bør ryddes opp i

- Prosjektet bygger ikke helt rent uten små feilrettinger og stabilisering.
- Sosiale funksjoner er foreløpig mest presentasjon, ikke komplett produktlogikk.
- Noen achievements virker feil koblet til vanskelighetsgrader/varianter og bør gjennomgås.
- Statistikken teller i praksis seire godt, men hele livssyklusen rundt tap/abandon/forlatte spill er ikke tydelig modellert.
- Daglig streak lagres både i generell spillstatistikk og egen daily-lagring, noe som kan skape duplisert logikk over tid.

### Verifisering per 30. april 2026

- `pnpm type-check` ble kjørt.
- `@sudoku-2026/core` og `@sudoku-2026/mobile` kom gjennom typecheck.
- `@sudoku-2026/web` feilet først fordi `history` manglet i initial `GameState`.
- Denne konkrete feilen er nå rettet i `apps/web/src/store/gameStore.ts`.

---

## 4. Realistisk status mot MVP

Den opprinnelige MVP-listen er i praksis allerede dekket eller nesten dekket:

1. Ferdig Sudoku-brett: ja
2. Valg av tall: ja
3. Sjekk om tall er riktig eller feil: ja
4. Nytt spill-knapp/flyt: ja, via ny puzzle-start
5. Enkel timer: ja
6. Enkel seier-skjerm: ja

Det betyr at prosjektet bør behandles som en "post-MVP som trenger stabilisering", ikke som et rent startprosjekt.

---

## 5. Hva som bør bygges først videre

### Fase 1: Stabilisere grunnproduktet

Målet i neste fase bør være å gjøre én kjerneopplevelse helt skarp, helst mobil først:

1. Gjøre `classic` og `daily` helt robuste.
2. Rydde typefeil og sikre grønn build for hele monorepoet.
3. Samle streak- og statistikklogikk ett sted.
4. Gå gjennom achievements og variantmapping for feil.
5. Legge inn bedre tomtilstander, feiltilstander og resume-flyt.

### Fase 2: Gjøre daglig modus delbar

Dette er den viktigste broen mellom Sudoku og viralitet:

1. Lag en resultatoppsummering for daily.
2. Generer delbar tekst/blokkmønster etter fullført brett.
3. Lag global daily leaderboard med ekte lagring.
4. Vis plassering, prosentil eller rank-tittel.
5. Lag streak-følelse som er tydelig og motiverende.

### Fase 3: Sosial konkurranse

Når daily er sterk, kan dere bygge:

1. Venneutfordringer
2. Profil med offentlig rekordkort
3. Sesongbaserte leaderboards
4. Asynkrone dueller på samme brett

---

## 6. Hvordan gjøre spillet mer nyskapende

### Beste kortsiktige retning

Den mest lovende retningen er ikke å finne opp nye Sudoku-regler først, men å gjøre den daglige opplevelsen ekstremt delbar og identitetsbyggende.

Det vil si:

- Alle får samme daily-brett.
- Resultatet oppsummeres med tid, feil, hints brukt og rank.
- Spilleren får en liten "signatur" eller persona-basert tittel.
- Resultatet kan deles som tekst eller bilde.

Eksempler på titler:

- Skarp Hjerne
- Iskald Logiker
- Feilfri Mester
- Streak-vokter
- Tempelstrateg

### Stilretning

Dere har allerede en varm nordisk/gullfarget visuell retning i mobilappen. Det er bra, og jeg ville anbefale å forsterke den i stedet for å hoppe mellom mange estetiske spor.

Sterk anbefaling:

- Gå for en tydelig "Nordic premium puzzle"-identitet.
- Kombiner ro, presisjon, gulltoner, stein/papir-følelse og moderne klarhet.
- La achievements, profiler og daily-resultater føles som samlerobjekter.

Det gir mer særpreg enn et generisk cyberpunk-tema, og det passer godt med Sudoku som spilltype.

---

## 7. Anbefalt videre plan

### Neste konkrete sprint

1. Få hele repoet grønt på typecheck og build.
2. Definer daily som hovedmodus for vekst og deling.
3. Implementer ekte lagring for leaderboard via Supabase/Postgres.
4. Lag delbar resultatskjerm for daily.
5. Deretter bygg challenges og enkel sosial konkurranse.

### Prioritetsrekkefølge

Hvis målet er både kvalitet og viralitet, ville jeg prioritert slik:

1. `classic` og `daily` må være silkemyke
2. ekte leaderboard
3. delbar daily-oppsummering
4. offentlig profil / rekordkort
5. challenges
6. sanntids-multiplayer

Sanntids-multiplayer er spennende, men bør komme senere. Daily + deling + leaderboard gir langt mer verdi raskere.

---

## 8. Konklusjon

Prosjektet står sterkere enn en tidlig Sudoku-MVP. Det finnes allerede en seriøs teknisk base og flere produktspor som peker mot noe mer unikt enn et vanlig tallspill.

Det viktigste nå er ikke å legge til flest mulig nye moduser, men å velge én kjerneopplevelse som kan bli virkelig minneverdig. Den rollen bør `daily` få. Hvis dere gjør daily-opplevelsen elegant, sosial, delbar og konkurransepreget, har dere et klart fundament for å bygge et Sudoku-spill folk faktisk snakker om.

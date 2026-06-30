# Release checklist

## Every PR

PR description uses this template:

```
## Hva er endret?
## Hvorfor?
## Hvilke filer er påvirket?
## Hvordan er dette testet?
## Risiko
## Hva bør gjøres neste?
```

No PR merges without:

- [ ] green build
- [ ] green type-check
- [ ] green lint
- [ ] relevant tests
- [ ] short manual QA
- [ ] no new false feature claims in README/docs

## Before Beta

- [ ] CI green on `main`
- [ ] core tests in place (generator + reducer at minimum)
- [ ] README reflects reality (Implemented / Mock / Planned)
- [ ] Supabase schema documented
- [ ] daily puzzle stable and deterministic
- [ ] leaderboard real **or** clearly marked mock
- [ ] no false feature claims
- [ ] web works on mobile
- [ ] PWA install works (Android Chrome + iOS Safari)
- [ ] basic analytics
- [ ] error boundary
- [ ] 404 / 500 pages
- [ ] privacy policy
- [ ] terms
- [ ] contact / support

## "Real product" gate

- [ ] classic correct and tested
- [ ] daily stable
- [ ] profiles exist
- [ ] results stored server-side
- [ ] leaderboard real
- [ ] streaks correct
- [ ] premium mobile UI
- [ ] PWA works
- [ ] README doesn't lie
- [ ] CI protects `main`
- [ ] Samurai / Killer real or clearly Beta
- [ ] data survives real users

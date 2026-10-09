"use client";

import Link from "next/link";
import type React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useDailyStore } from "@/store/dailyStore";
import { useGameStore } from "@/store/gameStore";
import { useHydrated } from "@/lib/useHydrated";
import { formatClock } from "@/lib/dailyFormat";
import { RANK_TITLES, dailyDifficulty, levelName, todayString } from "@sudoku-2026/core";
import NextDailyCountdown from "@/components/daily/NextDailyCountdown";
import WeekStrip from "@/components/daily/WeekStrip";

/** Decorative art only. Not today's daily puzzle and never advertised as playable. */
const ART_BOARD = [
  "700190000", "006000080", "000400002",
  "030060900", "400800000", "000000080",
  "009000250", "001000007", "200090000",
];

const MODES = [
  { name: "Daglig", code: "01", desc: "En ny utfordring. Hver dag.", href: "/play/daily", kind: "daily", eyebrow: "THE DAILY RITUAL" },
  { name: "Klassisk", code: "02", desc: "Den tidløse klassikeren.", href: "/play/classic/medium", kind: "classic", eyebrow: "THE ORIGINAL" },
  { name: "Killer", code: "03", desc: "Logikk møter summer.", href: "/play/killer", kind: "killer", eyebrow: "THE NEXT LEVEL" },
  { name: "Mini", code: "04", desc: "Kort pause. Skarpere fokus.", href: "/play/mini", kind: "mini", eyebrow: "THE QUICK FIX" },
  { name: "Samurai", code: "05", desc: "Fem brett å utforske.", href: "/play/samurai", kind: "samurai", eyebrow: "THE EXPEDITION" },
] as const;

const rise = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.64, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    {diagonal ? <path d="M5 19 19 5M8 5h11v11" /> : <path d="M4 12h16m-7-7 7 7-7 7" />}
  </svg>;
}

function Brand() {
  return <span className="obsidian-v3-brand"><span className="obsidian-v3-brand-emblem" aria-hidden="true">◈</span><span>SUDOKU<span>26</span></span></span>;
}

function DecorativeBoard() {
  return <div className="obsidian-v3-art-board" aria-hidden="true">
    <div className="obsidian-v3-art-board-top"><span>SUDOKU Nº 026</span><span>EST. 2026</span></div>
    <div className="obsidian-v3-art-board-grid">
      {ART_BOARD.flatMap((row, r) => row.split("").map((value, c) =>
        <span key={r + "-" + c} className={(c === 2 || c === 5 ? "v3-vcol " : "") + (r === 2 || r === 5 ? "v3-vrow " : "")}>
          {value === "0" ? "" : value}
        </span>
      ))}
    </div>
    <div className="obsidian-v3-art-board-foot"><span>THE ART OF FOCUS</span><span>◈</span></div>
  </div>;
}

function ModeMotif({ kind }: { kind: string }) {
  return <span className={"obsidian-v3-mode-motif motif-" + kind} aria-hidden="true">
    {kind === "killer" ? <span className="obsidian-v3-killer-mark"><b>15</b><i /><i /><b>11</b><i /><i /><i /><i /><i /></span> :
      kind === "samurai" ? <span className="obsidian-v3-samurai-mark"><i /><i /><i /><i /><i /></span> :
        kind === "mini" ? <span className="obsidian-v3-mini-mark"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span> :
          kind === "classic" ? <span className="obsidian-v3-classic-mark"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span> :
            <span className="obsidian-v3-daily-sun">☼</span>
    }
  </span>;
}

export default function HomePage(): React.JSX.Element {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const stats = useGameStore((s) => s.stats);
  const profile = useAuthStore((s) => s.profile);
  const dailyResults = useDailyStore((s) => s.results);
  const today = todayString();
  const completed = hydrated ? dailyResults[today] : undefined;
  const streak = hydrated ? stats.currentStreak : 0;
  const solved = hydrated ? Object.values(stats.byDifficulty).reduce((sum, d) => sum + d.won, 0) : 0;
  const bestStreak = hydrated ? stats.bestStreak : 0;
  const todayLabel = new Date().toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" });

  return <main className="obsidian-arena obsidian-v3">
    <div className="obsidian-v3-vignette" aria-hidden="true" />
    <div className="obsidian-v3-shell">
      <header className="obsidian-v3-nav">
        <Link href="/" aria-label="Sudoku 26 — Hjem"><Brand /></Link>
        <nav className="obsidian-v3-nav-links" aria-label="Hovedmeny">
          <Link className="is-current" href="/" aria-current="page">Hjem</Link>
          <a href="#spillmodi">Spill</a>
          <Link href="/play/daily">Daglig</Link>
          <Link href="/stats">Statistikk</Link>
          <Link href="/leaderboard">Rekorder</Link>
        </nav>
        <Link href="/profile" className="obsidian-v3-account"><span className="obsidian-v3-account-name">{profile?.username || "Min profil"}</span><span className="obsidian-v3-account-icon" aria-hidden="true">{profile?.username?.charAt(0).toUpperCase() || "◈"}</span></Link>
      </header>

      <motion.div className="obsidian-v3-page" initial={reduceMotion ? false : "hidden"} animate="visible" transition={{ staggerChildren: reduceMotion ? 0 : 0.08 }}>
        <motion.section variants={rise} className="obsidian-v3-hero" aria-labelledby="v3-title">
          <div className="obsidian-v3-hero-shine" aria-hidden="true" />
          <div className="obsidian-v3-hero-copy">
            <span className="obsidian-v3-eyebrow">PUZZLES FOR A CLEARER MIND</span>
            <h1 id="v3-title">Mestre<br />kunsten å <em>tenke.</em></h1>
            <p>Fra dagens utfordring til den store logikktesten. Et gjennomført Sudoku-univers, skapt for ro, konsentrasjon og mestring.</p>
            <div className="obsidian-v3-hero-cta">
              <Link href="/play/daily" className="obsidian-v3-gold-button">{completed ? "Se dagens resultat" : "Spill dagens brett"} <Arrow /></Link>
              <a href="#spillmodi" className="obsidian-v3-outline-button">Utforsk spillmodi <Arrow diagonal /></a>
            </div>
            <div className="obsidian-v3-benefits" aria-label="Spillopplevelsen">
              <span><b aria-hidden="true">✧</b> Skjerp fokuset</span>
              <span><b aria-hidden="true">◇</b> Bygg gode vaner</span>
              <span><b aria-hidden="true">▥</b> Følg fremgangen</span>
            </div>
          </div>
          <div className="obsidian-v3-hero-scene" aria-hidden="true">
            <div className="obsidian-v3-scene-glow" />
            <div className="obsidian-v3-scene-books"><span>SUDOKU26</span><span>LOGIC · FOCUS · CLARITY</span></div>
            <div className="obsidian-v3-scene-vessel"><span /></div>
            <div className="obsidian-v3-scene-pencil" />
            <DecorativeBoard />
            <span className="obsidian-v3-scene-quote">ONE PUZZLE<br />AT A TIME <i /></span>
          </div>
        </motion.section>

        <motion.section variants={rise} className="obsidian-v3-mode-section" id="spillmodi" aria-label="Spillmodus">
          <div className="obsidian-v3-mode-grid">
            {MODES.map((mode) => <Link href={mode.href} key={mode.kind} className={"obsidian-v3-mode obsidian-v3-mode-" + mode.kind}>
              <span className="obsidian-v3-mode-number">{mode.code} / 05 <Arrow diagonal /></span>
              <ModeMotif kind={mode.kind} />
              <span className="obsidian-v3-mode-name">{mode.name}</span>
              <span className="obsidian-v3-mode-desc">{mode.desc}</span>
              <span className="obsidian-v3-mode-label">{mode.eyebrow}</span>
            </Link>)}
          </div>
          <div className="obsidian-v3-classic-shortcuts">
            <span>ELLER VELG DITT NIVÅ</span>
            <Link href="/play/classic/easy">Enkel <Arrow /></Link>
            <Link href="/play/classic/medium">Middels <Arrow /></Link>
            <Link href="/play/classic/hard">Vanskelig <Arrow /></Link>
            <Link href="/play/classic/extreme">Ekstrem <Arrow /></Link>
          </div>
        </motion.section>

        <motion.section variants={rise} className="obsidian-v3-personal-strip" aria-label="Din fremgang">
          <div className="obsidian-v3-strip-title"><span>YOUR JOURNEY</span><strong>Hvert brett<br /><em>teller.</em></strong></div>
          <div><span>LØSTE BRETT</span><strong>{solved.toLocaleString("no-NO")}</strong><small>Fullførte spill</small></div>
          <div><span>DAGER PÅ RAD</span><strong>{streak}</strong><small>Din nåværende rekke</small></div>
          <div><span>PERSONLIG REKORD</span><strong>{bestStreak}</strong><small>Beste dagsrekke</small></div>
        </motion.section>

        <motion.section variants={rise} className="obsidian-v3-lower" aria-label="Din daglige Sudoku">
          <article className="obsidian-v3-daily-panel">
            <span className="obsidian-v3-eyebrow">THE DAILY RITUAL <span aria-hidden="true">—</span> {todayLabel}</span>
            <h2>{completed ? "Dagens mesterstykke." : "Dagens utfordring."}</h2>
            <p>{completed ? "Du har fullført dagens brett. Kom tilbake for en ny utfordring i morgen." : "Ett brett, hver dag. Samme utfordring for alle, en helt personlig seier."}</p>
            <p className="obsidian-v3-daily-detail">{completed ? "Fullført på " + formatClock(completed.result.elapsed) + " · " + (RANK_TITLES[completed.result.titleId]?.name || "Fullført") : "Nivå: " + levelName(dailyDifficulty(today))}</p>
            <div className="obsidian-v3-daily-actions">
              <Link className="obsidian-v3-gold-button" href="/play/daily">{completed ? "Se resultatet" : "Spill dagens Sudoku"} <Arrow /></Link>
              {completed && <NextDailyCountdown onDark className="obsidian-v3-countdown" />}
            </div>
          </article>
          <article className="obsidian-v3-week-panel">
            <div className="obsidian-v3-week-header"><div><span className="obsidian-v3-eyebrow">YOUR MOMENTUM</span><h2>Din uke.</h2></div><Link href="/stats">Se statistikk <Arrow /></Link></div>
            <p>Et lite ritual kan bli en stor vane. Se hvilke dager du har fullført.</p>
            <WeekStrip />
            <div className="obsidian-v3-week-footer"><span><b aria-hidden="true">◈</b> {streak} dagers rekke akkurat nå</span><Link href="/play/daily">Fortsett reisen <Arrow /></Link></div>
          </article>
        </motion.section>
      </motion.div>
      <footer className="obsidian-v3-footer"><Brand /><span>DESIGNED FOR THE ART OF FOCUS</span><Link href="/profile">Din profil <Arrow diagonal /></Link></footer>
    </div>
  </main>;
}

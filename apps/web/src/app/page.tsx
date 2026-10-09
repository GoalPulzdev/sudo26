"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useDailyStore } from "@/store/dailyStore";
import { useGameStore } from "@/store/gameStore";
import { useHydrated } from "@/lib/useHydrated";
import { formatClock } from "@/lib/dailyFormat";
import { RANK_TITLES, dailyDifficulty, levelName, todayString } from "@sudoku-2026/core";
import NextDailyCountdown from "@/components/daily/NextDailyCountdown";
import WeekStrip from "@/components/daily/WeekStrip";

// A visual brand motif, never presented as the actual daily puzzle.
const PREVIEW = [
  "800100007", "004005030", "010020006",
  "006004020", "100060009", "090800500",
  "500010060", "030600100", "700003008",
];

const MODES = [
  { no: "01", name: "Klassisk", desc: "Den tidløse utfordringen", href: "/play/classic/medium", tag: "9 × 9", style: "classic" },
  { no: "02", name: "Killer", desc: "Når logikk møter summer", href: "/play/killer", tag: "CAGES", style: "killer" },
  { no: "03", name: "Samurai", desc: "Fem brett. Én utfordring.", href: "/play/samurai", tag: "5 GRID", style: "samurai" },
  { no: "04", name: "Mini", desc: "En kort, skarp pause", href: "/play/mini", tag: "6 × 6", style: "mini" },
] as const;

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {diagonal ? <path d="M5 19 19 5M8 5h11v11" /> : <path d="M4 12h16m-7-7 7 7-7 7" />}
  </svg>;
}

function GridMark() {
  return <span className="obsidian-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>;
}

function PreviewBoard() {
  return <div className="obsidian-preview-frame" aria-hidden="true">
    <div className="obsidian-preview-top"><span>THE ART OF LOGIC</span><span>№ 026</span></div>
    <div className="obsidian-preview">
      {PREVIEW.flatMap((row, r) => row.split("").map((n, c) =>
        <span key={r + "-" + c} className={["obsidian-preview-cell", (c === 2 || c === 5) ? "end-col" : "", (r === 2 || r === 5) ? "end-row" : "", n !== "0" ? "is-given" : "", r === 4 && c === 4 ? "is-focus" : ""].filter(Boolean).join(" ")}>
          {n !== "0" ? n : ""}
        </span>
      ))}
    </div>
    <div className="obsidian-preview-bottom"><span>PRECISION IN EVERY MOVE</span><span>◈</span></div>
  </div>;
}

export default function HomePage(): React.JSX.Element {
  const hydrated = useHydrated();
  const stats = useGameStore((s) => s.stats);
  const profile = useAuthStore((s) => s.profile);
  const dailyResults = useDailyStore((s) => s.results);
  const today = todayString();
  const completed = hydrated ? dailyResults[today] : undefined;
  const streak = hydrated ? stats.currentStreak : 0;
  const totalSolved = hydrated ? Object.values(stats.byDifficulty).reduce((sum, d) => sum + d.won, 0) : 0;
  const bestStreak = hydrated ? stats.bestStreak : 0;
  const todayLabel = new Date().toLocaleDateString("no-NO", { weekday: "long", day: "numeric", month: "long" });

  return <main className="obsidian-arena">
    <div className="obsidian-grain" aria-hidden="true" />
    <div className="obsidian-shell">
      <header className="obsidian-nav">
        <Link href="/" className="obsidian-brand" aria-label="Sudoku 26 — Hjem">
          <GridMark />
          <span>SUDOKU<span className="obsidian-brand-number">26</span></span>
        </Link>
        <nav className="obsidian-nav-links" aria-label="Hovedmeny">
          <a href="#spillmodi">Spillmodi</a>
          <Link href="/leaderboard">Rekorder</Link>
          <Link href="/stats">Min progresjon</Link>
        </nav>
        <Link href="/profile" className="obsidian-profile" aria-label="Min profil">
          <span className="obsidian-profile-label">{profile?.username || "Min profil"}</span>
          <span className="obsidian-avatar">{profile?.username?.charAt(0).toUpperCase() || "◈"}</span>
        </Link>
      </header>

      <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.09 }} className="obsidian-stage">
        <motion.section variants={reveal} className="obsidian-hero" aria-labelledby="arena-title">
          <div className="obsidian-hero-copy">
            <div className="obsidian-eyebrow"><span className="obsidian-status-dot" /> THE DAILY RITUAL <span className="obsidian-eyebrow-rule" /> EDITION 2026</div>
            <h1 id="arena-title">Stillhet.<br /><em>Skjerpet</em><br />fokus.</h1>
            <p className="obsidian-lead">Ni tall. Uendelige muligheter. Et øyeblikk der alt annet forsvinner.</p>
            <div className="obsidian-today">
              <span className="obsidian-today-overline">DAGENS UTFORDRING <span aria-hidden="true">/</span> {todayLabel}</span>
              <p className="obsidian-today-title">{completed ? "Dagens brett er løst." : "Ditt neste trekk venter."}</p>
              <p className="obsidian-today-meta">
                {completed ? (
                  <>Fullført på {formatClock(completed.result.elapsed)} · {RANK_TITLES[completed.result.titleId]?.name ?? "Fullført"}</>
                ) : (
                  <>Nivå {levelName(dailyDifficulty(today))} · Samme utfordring for alle, hver dag</>
                )}
              </p>
              {completed && <NextDailyCountdown onDark className="obsidian-countdown" />}
            </div>
            <div className="obsidian-hero-actions">
              <Link className="obsidian-cta" href="/play/daily">
                <span>{completed ? "Se dagens resultat" : "Spill dagens brett"}</span><Arrow />
              </Link>
              <Link className="obsidian-secondary" href="/play/classic/medium">Utforsk klassisk <Arrow diagonal /></Link>
            </div>
            <div className="obsidian-hero-footnote"><span className="obsidian-footnote-line" /> EN PAUSE MED MENING</div>
          </div>
          <div className="obsidian-hero-art">
            <div className="obsidian-halo" aria-hidden="true" />
            <span className="obsidian-art-label obsidian-art-label-top">BUILT FOR THE MIND <span>— 001</span></span>
            <PreviewBoard />
            <span className="obsidian-art-label obsidian-art-label-bottom">STRATEGY <span>·</span> CALM <span>·</span> CLARITY</span>
          </div>
        </motion.section>

        <motion.section variants={reveal} className="obsidian-ritual" aria-label="Din spillprogresjon">
          <div className="obsidian-ritual-intro">
            <span className="obsidian-kicker">YOUR JOURNEY</span>
            <strong>Et skarpere øyeblikk,<br />hver dag.</strong>
          </div>
          <div className="obsidian-metric"><span>01 / DAGER PÅ RAD</span><strong>{streak.toString().padStart(2, "0")}</strong><small>Din nåværende rekke</small></div>
          <div className="obsidian-metric"><span>02 / LØSTE BRETT</span><strong>{totalSolved.toLocaleString("no-NO")}</strong><small>Fullførte utfordringer</small></div>
          <div className="obsidian-metric"><span>03 / BESTE REKKE</span><strong>{bestStreak.toString().padStart(2, "0")}</strong><small>Din personlige rekord</small></div>
        </motion.section>

        <motion.section variants={reveal} className="obsidian-week-panel" aria-label="Daglige utfordringer denne uken">
          <div className="obsidian-section-heading"><div><span className="obsidian-kicker">THE SEVEN-DAY RITUAL</span><h2>Denne uken</h2></div><Link href="/play/daily" className="obsidian-text-link">Dagens utfordring <Arrow /></Link></div>
          <div className="obsidian-week-inner"><WeekStrip /></div>
        </motion.section>

        <motion.section variants={reveal} id="spillmodi" className="obsidian-modes" aria-label="Velg spillmodus">
          <div className="obsidian-section-heading"><div><span className="obsidian-kicker">EXPLORE THE GRID</span><h2>Finn din utfordring.</h2></div><span className="obsidian-section-aside">FIRE MÅTER Å TENKE PÅ</span></div>
          <div className="obsidian-mode-grid">
            {MODES.map((mode) => <Link key={mode.no} href={mode.href} className={"obsidian-mode obsidian-mode-" + mode.style}>
              <span className="obsidian-mode-top"><span>{mode.no} / 04</span><Arrow diagonal /></span>
              <span className="obsidian-mode-symbol" aria-hidden="true">{mode.style === "classic" ? "▦" : mode.style === "killer" ? "∑" : mode.style === "samurai" ? "✣" : "Ⅵ"}</span>
              <span className="obsidian-mode-name">{mode.name}</span>
              <span className="obsidian-mode-bottom"><span>{mode.desc}</span><span>{mode.tag}</span></span>
            </Link>)}
          </div>
          <div className="obsidian-difficulty">
            <span className="obsidian-kicker">ELLER SPILL ET KLASSISK BRETT</span>
            <div className="obsidian-difficulty-links">
              <Link href="/play/classic/easy">Enkel <Arrow /></Link>
              <Link href="/play/classic/medium">Middels <Arrow /></Link>
              <Link href="/play/classic/hard">Vanskelig <Arrow /></Link>
            </div>
          </div>
        </motion.section>
      </motion.div>

      <footer className="obsidian-footer"><span><GridMark /> SUDOKU 26</span><span>MADE FOR MOMENTS OF CLARITY</span><Link href="/stats">Din statistikk <Arrow diagonal /></Link></footer>
    </div>
  </main>;
}

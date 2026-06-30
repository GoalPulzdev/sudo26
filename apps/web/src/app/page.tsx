"use client";

import Link from "next/link";
import type React from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";

/* ─── SVG icons ─────────────────────────────────────────────────────── */
function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconSkull() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 3.5 1.8 6.6 4.5 8.4V22h11v-1.6C20.2 18.6 22 15.5 22 12c0-5.523-4.477-10-10-10z"/>
      <line x1="9"  y1="17" x2="9"  y2="19"/>
      <line x1="15" y1="17" x2="15" y2="19"/>
      <circle cx="9"  cy="12" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14c0 2.485 1.567 4 3.5 4s3.5-1.515 3.5-4c0-4-3.5-6-3.5-6S8.5 10 8.5 14z"/>
      <path d="M12 22c4.418 0 8-3.582 8-8 0-3.5-2-7-5-9 0 0 1 4-3 6-1.5 1-3 .5-3 .5S7 9 4.5 11C3 12.5 2 14 2 15.5A6.5 6.5 0 0 0 12 22z"/>
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="8 21 12 17 16 21"/>
      <path d="M7 4H17l-1 8a5 5 0 0 1-8 0L7 4z"/>
      <path d="M4 4h3M17 4h3"/>
      <path d="M4 4c0 4.5 2 7 3 8M20 4c0 4.5-2 7-3 8"/>
      <line x1="12" y1="17" x2="12" y2="13"/>
    </svg>
  );
}

function IconMini() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

/* ─── Difficulty dots ────────────────────────────────────────────────── */
function DifficultyDots({ level, accent }: { level: 1 | 2 | 3; accent: string }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: 7, height: 7,
            background: i <= level ? accent : "var(--border-2)",
            transition: "background 0.2s",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animation variants ─────────────────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] as [number,number,number,number] } },
};

/* ─── Main component ─────────────────────────────────────────────────── */
export default function HomePage(): React.JSX.Element {
  const stats = useGameStore((s) => s.stats);
  const streak = stats.currentStreak;
  const totalSolved = Object.values(stats.byDifficulty).reduce((sum, d) => sum + d.won, 0);
  const bestStreak = stats.bestStreak;
  const profile = useAuthStore((s) => s.profile);

  const today = new Date().toLocaleDateString("no-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const todayCapitalised = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <main className="min-h-screen flex flex-col items-center gap-8 px-4 py-10 relative overflow-hidden">
      {/* Ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute top-0 left-0 w-[640px] h-[420px] rounded-full -translate-x-1/2 -translate-y-1/3"
        style={{ background: "radial-gradient(ellipse, rgba(191,156,69,0.16) 0%, transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 w-[520px] h-[420px] rounded-full translate-x-1/3 translate-y-1/3"
        style={{ background: "radial-gradient(ellipse, rgba(58,74,102,0.12) 0%, transparent 70%)" }} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative flex flex-col items-center gap-8 w-full max-w-lg"
      >
        {/* ── Logo row ── */}
        <motion.div variants={item} className="w-full flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--text-dim)" }}>
              Sudoku 2026
            </p>
            <h1
              className="text-3xl font-black tracking-tight leading-none mt-0.5"
              style={{
                background: "linear-gradient(120deg, #2c3a4f 0%, #3a4a66 52%, #bf9c45 112%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}
            >
              Tren hjernen.
            </h1>
          </div>

          {/* Stats + Profile buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/stats"
              aria-label="Statistikk"
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)", boxShadow: "var(--shadow-sm)", color: "var(--text-muted)" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "var(--accent)"; el.style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "var(--text-muted)"; el.style.borderColor = "var(--border-2)"; }}
            >
              <IconBarChart />
            </Link>
            <Link
              href="/profile"
              aria-label="Profil"
              className="relative w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-200 select-none"
              style={{
                background: profile?.color ? `linear-gradient(135deg, ${profile.color}, ${profile.color}bb)` : "var(--surface)",
                border: "1.5px solid var(--border-2)",
                boxShadow: profile?.color ? `0 2px 12px ${profile.color}44, var(--shadow-sm)` : "var(--shadow-sm)",
                color: profile?.color ? "#fff" : "var(--text-muted)",
              }}
            >
              {profile?.username ? profile.username[0].toUpperCase() : "?"}
            </Link>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div variants={item} className="w-full grid grid-cols-3 gap-3">
          <StatChip emoji="🔥" value={streak} label="Streak" accent="#bf9c45" />
          <StatChip emoji="✓" value={totalSolved} label="Løste" accent="#5f8a6a" />
          <StatChip emoji="🏆" value={bestStreak} label="Rekord" accent="#3a4a66" />
        </motion.div>

        {/* ── Daily hero ── */}
        <motion.div variants={item} className="w-full">
          <Link href="/play/daily" className="group relative block w-full">
            {/* Glow on hover */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
              style={{ background: "rgba(191,156,69,0.20)" }} />
            <div
              className="relative rounded-3xl p-6 overflow-hidden transition-transform duration-200 group-hover:scale-[1.015] group-active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #3a4a66 0%, #2c3a4f 55%, #233044 100%)",
                boxShadow: "0 8px 30px rgba(44,58,79,0.34)",
              }}
            >
              {/* Dot-grid texture overlay */}
              <div className="absolute inset-0 grid-bg rounded-3xl opacity-[0.15] pointer-events-none" />

              <div className="relative flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.18)" }}>
                  <IconCalendar />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/65 mb-0.5">
                    {todayCapitalised}
                  </p>
                  <p className="text-xl font-black text-white leading-tight">Daglig utfordring</p>
                  <p className="text-sm text-white/65 mt-1">
                    {streak > 0
                      ? `${streak} dag${streak === 1 ? "" : "er"} streak \u2014 hold det g\u00e5ende!`
                      : "Nytt brett hver dag. Start streaken din."}
                  </p>
                </div>
                <span className="text-white/60 group-hover:text-white/90 group-hover:translate-x-1 transition-all flex-shrink-0">
                  <IconChevronRight size={20} />
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ── Quick play ── */}
        <motion.div variants={item} className="w-full flex flex-col gap-3">
          <SectionLabel>Hurtigspill</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <QuickCard href="/play/classic/easy"   label="Enkel"     sub="~5 min"  level={1} accent="#5f8a6a" />
            <QuickCard href="/play/classic/medium" label="Middels"   sub="~10 min" level={2} accent="#bf9c45" featured />
            <QuickCard href="/play/classic/hard"   label="Vanskelig" sub="~20 min" level={3} accent="#b4554a" />
          </div>
        </motion.div>

        {/* ── Spillmodi ── */}
        <motion.div variants={item} className="w-full flex flex-col gap-3">
          <SectionLabel>Spillmodi</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <GameModeCard href="/play/killer"  icon={<IconSkull />}  label="Killer Sudoku"  desc="Summer cellene"   accent="#b4554a" />
            <GameModeCard href="/play/samurai" icon={<IconZap />}    label="Samurai Sudoku" desc="5 brett i kors"    accent="#3a4a66" />
            <GameModeCard href="/play/mini"    icon={<IconMini />}   label="Mini Sudoku"    desc="6×6, lynrask"     accent="#5f8a6a" />
            <GameModeCard href="/leaderboard"  icon={<IconTrophy />} label="Mine rekorder"  desc="Dine beste tider" accent="#bf9c45" />
            <ComingSoonCard icon={<IconFlame />} label="Thermo Sudoku" desc="Kommer snart" />
          </div>
        </motion.div>

        <motion.p
          variants={item}
          className="text-[10px] tracking-widest uppercase"
          style={{ color: "var(--text-dim)" }}
        >
          Sudoku 2026 · Åpen beta
        </motion.p>
      </motion.div>
    </main>
  );
}

/* ─── Stat chip ──────────────────────────────────────────────────────── */
function StatChip({ emoji, value, label, accent }: {
  emoji: string; value: number; label: string; accent: string;
}) {
  return (
    <div
      className="relative flex flex-col items-center gap-0.5 py-3 rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: accent }} />
      <span className="text-base leading-none mb-0.5">{emoji}</span>
      <span className="text-lg font-black tabular-nums leading-none" style={{ color: "var(--text)" }}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>{label}</span>
    </div>
  );
}

/* ─── Section label with trailing line ─────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0" style={{ color: "var(--text-dim)" }}>
        {children}
      </p>
      <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg, var(--border-2), transparent)" }} />
    </div>
  );
}

/* ─── Quick card ─────────────────────────────────────────────────────── */
function QuickCard({ href, label, sub, level, accent, featured }: {
  href: string; label: string; sub: string; level: 1 | 2 | 3; accent: string; featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative min-w-0 flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl
                 transition-all duration-150 active:scale-[0.97]"
      style={{
        background: featured ? accent + "14" : "var(--surface)",
        border: `1.5px solid ${featured ? accent + "55" : "var(--border-2)"}`,
        boxShadow: featured ? `0 4px 20px ${accent}22, var(--key-shadow)` : "var(--key-shadow)",
      }}
    >
      {featured && (
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full
                     text-[9px] font-black uppercase tracking-widest text-white whitespace-nowrap"
          style={{ background: accent, boxShadow: `0 2px 8px ${accent}55` }}
        >
          Populær
        </span>
      )}
      <DifficultyDots level={level} accent={accent} />
      <span className="font-black text-sm leading-tight" style={{ color: "var(--text)" }}>{label}</span>
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{sub}</span>
    </Link>
  );
}

/* ─── Coming soon card ───────────────────────────────────────────────── */
function ComingSoonCard({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div
      className="relative min-w-0 flex items-center gap-3 p-4 rounded-2xl"
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        opacity: 0.58,
        cursor: "default",
      }}
    >
      {/* Lock badge */}
      <span
        className="absolute top-2 right-2 w-4 h-4 rounded flex items-center justify-center"
        style={{ background: "var(--border-2)", color: "var(--text-dim)" }}
      >
        <IconLock />
      </span>
      <span style={{ color: "var(--text-muted)" }}>{icon}</span>
      <div className="min-w-0">
        <p className="font-bold text-sm leading-tight" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
      </div>
    </div>
  );
}

/* ─── Active game mode card ──────────────────────────────────────────── */
function GameModeCard({ href, icon, label, desc, accent }: {
  href: string; icon: React.ReactNode; label: string; desc: string; accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative min-w-0 flex items-center gap-3 p-4 rounded-2xl transition-all duration-150 active:scale-[0.97]"
      style={{
        background: "var(--surface)",
        border: `1.5px solid var(--border-2)`,
        boxShadow: "var(--key-shadow)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = accent + "88";
        el.style.boxShadow = `0 4px 16px ${accent}22, var(--key-shadow)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = "var(--border-2)";
        el.style.boxShadow = "var(--key-shadow)";
      }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-150"
        style={{ background: accent + "18", color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm leading-tight" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
      </div>
      <span className="text-[var(--text-dim)] group-hover:text-[var(--text-muted)] group-hover:translate-x-0.5 transition-all flex-shrink-0">
        <IconChevronRight size={14} />
      </span>
    </Link>
  );
}
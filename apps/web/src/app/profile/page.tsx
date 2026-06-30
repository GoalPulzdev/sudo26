"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import { ACHIEVEMENT_DEFS } from "@/lib/achievements";
import type { Difficulty } from "@sudoku-2026/core";

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  "#3a4a66", "#2c3a4f", "#3a6b73", "#5f8a6a",
  "#bf9c45", "#b4554a", "#a85a78", "#3a6b66",
];

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: "Enkel", medium: "Middels", hard: "Vanskelig",
  extreme: "Ekstrem", daily: "Daglig", mini: "Mini 6×6",
};

const DIFF_ACCENTS: Record<Difficulty, string> = {
  easy: "#5f8a6a", medium: "#bf9c45", hard: "#b4554a",
  extreme: "#3a4a66", daily: "#3a6b73", mini: "#6f9a78",
};

const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "extreme", "daily", "mini"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(secs: number | null): string {
  if (secs === null) return "–";
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function fmtTotal(s: number): string {
  if (s === 0) return "0";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}t ${Math.floor((s % 3600) / 60)}m`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ username, color, size = 56 }: { username: string | null; color: string; size?: number }) {
  const initial = username ? username[0].toUpperCase() : "?";
  return (
    <div
      className="flex items-center justify-center rounded-full font-black select-none"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: "#fff",
        fontSize: size * 0.42,
        boxShadow: `0 4px 20px ${color}44`,
      }}
    >
      {initial}
    </div>
  );
}

// ─── Profile Setup Modal ──────────────────────────────────────────────────────

function ProfileSetupModal({ onSave }: { onSave: (name: string, color: string) => Promise<void> }) {
  const existingProfile = useAuthStore((s) => s.profile);
  const [name, setName] = useState(existingProfile?.username ?? "");
  const [color, setColor] = useState(existingProfile?.color ?? PALETTE[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) { setError("Minimum 2 tegn"); return; }
    if (trimmed.length > 20) { setError("Maks 20 tegn"); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed, color);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Prøv igjen";
      setError(msg.includes("unique") ? "Brukernavnet er opptatt" : msg);
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="rounded-3xl max-w-sm w-full flex flex-col gap-6 p-7"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1.5px solid var(--border-2)" }}
      >
        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-3">
          <Avatar username={name || null} color={color} size={72} />
          <h2 className="text-xl font-black" style={{ color: "var(--text)" }}>Sett opp profil</h2>
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            Velg et brukernavn og en farge. Ingen passord nødvendig.
          </p>
        </div>

        {/* Username input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
            Brukernavn
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            maxLength={20}
            placeholder="f.eks. sudokukongen"
            autoFocus
            className="rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"
            style={{
              background: "var(--surface-2)",
              border: `1.5px solid ${error ? "var(--error)" : "var(--border-2)"}`,
              color: "var(--text)",
            }}
          />
          {error && <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>}
        </div>

        {/* Color palette */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
            Farge
          </label>
          <div className="grid grid-cols-8 gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-transform"
                style={{
                  background: c,
                  transform: color === c ? "scale(1.2)" : "scale(1)",
                  boxShadow: color === c ? `0 0 0 2.5px var(--surface), 0 0 0 4.5px ${c}` : "none",
                }}
                aria-label={`Velg farge ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Save button */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}bb)`,
            color: "#fff",
            opacity: saving ? 0.7 : 1,
            boxShadow: `0 4px 20px ${color}44`,
          }}
        >
          {saving ? "Lagrer…" : "Lagre profil"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage(): React.JSX.Element {
  const { profile, isLoading, updateProfile } = useAuthStore();
  const stats = useGameStore((s) => s.stats);
  const earnedAchievements = useGameStore((s) => s.earnedAchievements);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Auto-open setup if user has no username yet
    if (!isLoading && profile && !profile.username) {
      setShowSetup(true);
    }
  }, [isLoading, profile]);

  const handleSave = async (username: string, color: string) => {
    await updateProfile(username, color);
    setShowSetup(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const totalPlayed = ALL_DIFFICULTIES.reduce((a, d) => a + stats.byDifficulty[d].played, 0);
  const totalWon    = ALL_DIFFICULTIES.reduce((a, d) => a + stats.byDifficulty[d].won,    0);
  const totalTime   = ALL_DIFFICULTIES.reduce((a, d) => a + stats.byDifficulty[d].totalTime, 0);

  const displayName = profile?.username ?? "Anonym spiller";
  const displayColor = profile?.color ?? "#3a4a66";

  return (
    <main className="min-h-screen flex flex-col items-center gap-6 px-4 py-6">
      <div className="flex flex-col gap-6 w-full" style={{ maxWidth: 420 }}>

        {/* Back nav */}
        <Link href="/" className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
          ← Hjem
        </Link>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 flex items-center gap-5"
          style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)", boxShadow: "var(--shadow)" }}
        >
          <Avatar username={profile?.username ?? null} color={displayColor} size={64} />
          <div className="flex-1 min-w-0">
            <p className="text-xl font-black truncate" style={{ color: "var(--text)" }}>{displayName}</p>
            {profile?.username ? (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {totalPlayed} brett spilt · {stats.currentStreak > 0 ? `${stats.currentStreak} dagers streak` : "Ingen aktiv streak"}
              </p>
            ) : (
              <p className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>Legg til brukernavn →</p>
            )}
          </div>
          <motion.button
            onClick={() => setShowSetup(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
            style={{
              background: `${displayColor}18`,
              color: displayColor,
              border: `1.5px solid ${displayColor}44`,
            }}
          >
            Rediger
          </motion.button>
        </motion.div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: "Spilt",     value: totalPlayed.toString() },
            { label: "Vunnet",    value: totalWon.toString() },
            { label: "Total tid", value: fmtTotal(totalTime) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl py-4 flex flex-col items-center gap-0.5"
              style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)", boxShadow: "var(--shadow-sm)" }}>
              <span className="text-xl font-black tabular-nums" style={{ color: "var(--text)" }}>{value}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Per-difficulty stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)", boxShadow: "var(--shadow-sm)" }}
        >
          {/* Header */}
          <div className="grid grid-cols-4 px-4 py-2"
            style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border-2)" }}>
            {["Nivå", "Spilt", "Vunnet", "Beste tid"].map((h) => (
              <span key={h} className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: "var(--text-dim)" }}>{h}</span>
            ))}
          </div>

          {ALL_DIFFICULTIES.map((d) => {
            const ds = stats.byDifficulty[d];
            return (
              <div key={d} className="grid grid-cols-4 px-4 py-3 items-center"
                style={{
                  borderBottom: "1px solid var(--border)",
                  borderLeft: `3px solid ${DIFF_ACCENTS[d]}`,
                }}>
                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{DIFF_LABELS[d]}</span>
                <span className="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>{ds.played}</span>
                <span className="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>{ds.won}</span>
                <span className="text-sm tabular-nums font-medium" style={{ color: "var(--text)" }}>{fmt(ds.bestTime)}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Achievements grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-3"
        >
          <p className="text-xs font-black uppercase tracking-widest px-1" style={{ color: "var(--text-dim)" }}>
            Achievements
          </p>
          <AchievementsGrid earnedKeys={earnedAchievements} />
        </motion.div>

      </div>

      <AnimatePresence>
        {showSetup && <ProfileSetupModal onSave={handleSave} />}
      </AnimatePresence>
    </main>
  );
}

// ─── Achievements grid ───────────────────────────────────────────────────────

function AchievementsGrid({ earnedKeys }: { earnedKeys: Set<string> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ACHIEVEMENT_DEFS.map(({ key, emoji, name, desc }) => {
        const earned = earnedKeys.has(key);
        return (
          <div key={key}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: earned ? "var(--surface)" : "var(--surface-2)",
              border: `1.5px solid ${earned ? "var(--border-2)" : "var(--border)"}`,
              opacity: earned ? 1 : 0.55,
            }}
          >
            <span className="text-2xl flex-shrink-0" style={{ filter: earned ? "none" : "grayscale(1)" }}>
              {emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{name}</p>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--text-dim)" }}>{desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

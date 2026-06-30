"use client";

import { useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import type { Puzzle } from "@sudoku-2026/core";
import { createChallenge } from "@/lib/challenges";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export default function ChallengeButton({
  puzzle,
  elapsed,
}: {
  puzzle: Puzzle;
  elapsed: number;
}): React.JSX.Element | null {
  const profile = useAuthStore((s) => s.profile);
  const [link, setLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Challenges require a Supabase backend; hide the action in mock/demo mode.
  if (!isSupabaseConfigured()) return null;

  const handleCreate = async () => {
    if (link) {
      void navigator.clipboard.writeText(window.location.origin + link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    setCreating(true);
    try {
      const id = await createChallenge(puzzle, profile?.userId ?? "anon", elapsed);
      const l = `/challenge/${id}`;
      setLink(l);
      void navigator.clipboard.writeText(window.location.origin + l);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.button
      onClick={() => void handleCreate()}
      whileTap={{ scale: 0.96 }}
      className="w-full py-3 rounded-2xl font-bold text-sm tracking-wide cursor-pointer"
      style={{
        background: copied ? "#5f8a6a" : "var(--surface-2)",
        color: copied ? "#fff" : "var(--text)",
        border: "1.5px solid var(--border-2)",
      }}
    >
      {creating ? "Oppretter…" : copied ? "✓ Lenke kopiert!" : link ? "Kopier lenke" : "🤝 Utfordre en venn"}
    </motion.button>
  );
}

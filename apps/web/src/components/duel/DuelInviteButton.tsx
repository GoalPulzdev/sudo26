"use client";

import { useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { useOwnReplayCode } from "@/lib/replayLink";

/**
 * "Challenge a friend": shares `/duel/<code>` — they play the same board against
 * your recorded game. No backend: the whole game travels in the link.
 */
export default function DuelInviteButton({
  label = "Utfordre en venn",
  forPuzzleId,
}: {
  label?: string;
  /** Only offer the invite when the finished game is this puzzle. */
  forPuzzleId?: string;
}): React.ReactElement | null {
  const code = useOwnReplayCode(forPuzzleId);
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");
  if (!code) return null;

  async function invite() {
    const url = `${window.location.origin}/duel/${code}`;
    const text = "Klarer du å slå meg på samme Sudoku-brett? Du spiller mot spøkelset mitt.";
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text, url });
        setStatus("shared");
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setStatus("copied");
      }
      setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("idle"); // share sheet closed
    }
  }

  return (
    <motion.button
      onClick={() => void invite()}
      whileTap={{ scale: 0.97 }}
      className="w-full py-3 rounded-2xl text-sm font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2"
      style={{ background: "var(--surface-2)", color: "var(--text)", border: "1.5px solid var(--border-2)" }}
    >
      <span aria-hidden="true">👻</span>
      {status === "copied" ? "✓ Duell-lenke kopiert" : status === "shared" ? "✓ Delt" : label}
    </motion.button>
  );
}

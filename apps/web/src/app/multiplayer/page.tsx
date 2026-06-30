"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import type { MultiplayerRoom, Puzzle } from "@sudoku-2026/core";

export default function MultiplayerPage(): React.ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    if (!username.trim()) { setError("Skriv inn brukernavn"); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) { setError("Kunne ikke opprette rom"); setLoading(false); return; }
    const { room } = (await res.json()) as { room: MultiplayerRoom; puzzle: Puzzle };
    router.push(`/play/multiplayer/${room.id}?username=${encodeURIComponent(username.trim())}&host=1`);
  }

  async function joinRoom() {
    if (!roomCode.trim()) { setError("Skriv inn romkode"); return; }
    setLoading(true);
    setError(null);
    const code = roomCode.trim().toUpperCase();
    const res = await fetch(`/api/rooms?id=${code}`);
    if (!res.ok) { setError("Rom ikke funnet"); setLoading(false); return; }
    router.push(`/play/multiplayer/${code}?username=${encodeURIComponent(username.trim() || "Gjest")}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white">🏆 Multiplayer</h1>
        <p className="text-slate-400">Duel mot venner i sanntid</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Brukernavn"
          className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={createRoom}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold transition-colors"
        >
          {loading ? "Oppretter..." : "Opprett nytt rom"}
        </motion.button>

        <div className="relative flex items-center gap-3">
          <hr className="flex-1 border-[var(--border)]" />
          <span className="text-slate-600 text-sm">eller</span>
          <hr className="flex-1 border-[var(--border)]" />
        </div>

        <div className="flex gap-2">
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Romkode (f.eks. ABC123)"
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none uppercase"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={joinRoom}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            Bli med
          </motion.button>
        </div>
      </div>

      <Link href="/" className="text-slate-600 hover:text-slate-300 text-sm transition-colors">
        ← Tilbake
      </Link>
    </main>
  );
}

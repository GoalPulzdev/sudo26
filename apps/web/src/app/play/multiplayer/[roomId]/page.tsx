"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type React from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { CellValue, Hint, Puzzle } from "@sudoku-2026/core";
import { getHint, boardToString } from "@sudoku-2026/core";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import SudokuBoard from "@/components/SudokuBoard";
import NumberPad from "@/components/NumberPad";
import GameHeader from "@/components/GameHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

type OpponentState = {
  username: string;
  progress: number;
  mistakes: number;
  finished: boolean;
  elapsed?: number;
};

type GamePhase = "loading" | "lobby" | "playing" | "finished";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MultiplayerGamePage(): React.JSX.Element {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = (params?.roomId as string ?? "").toUpperCase();
  const username = searchParams?.get("username") ?? "Spiller";
  const isHost = searchParams?.get("host") === "1";

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [opponents, setOpponents] = useState<Map<string, OpponentState>>(new Map());
  const [firstWinner, setFirstWinner] = useState<{ username: string; elapsed: number } | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  const { game, loadPuzzle, dispatch } = useGameStore();
  const [hint, setHint] = useState<Hint | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const playerIdRef = useRef(`player-${Math.random().toString(36).slice(2, 8)}`);
  const lastProgressRef = useRef(-1);
  const firstWinnerRef = useRef<{ username: string; elapsed: number } | null>(null);

  // ─── Load room + puzzle from API ────────────────────────────────────────────
  useEffect(() => {
    async function loadRoom() {
      const res = await fetch(`/api/rooms?id=${roomId}`);
      if (!res.ok) { setLoadError("Rom ikke funnet"); return; }
      const { puzzle } = (await res.json()) as { puzzle: Puzzle | null };
      if (!puzzle) { setLoadError("Puslespillet ble ikke funnet"); return; }
      loadPuzzle(puzzle);
      setPhase("lobby");
    }
    if (roomId) loadRoom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ─── Supabase Realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "loading") return;
    const supabase = getSupabase();
    if (!supabase) return; // multiplayer requires Supabase Realtime
    const channel = supabase.channel(`multiplayer:${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: playerIdRef.current },
      },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "game_start" }, () => {
        setPhase("playing");
      })
      .on("broadcast", { event: "progress_update" }, ({ payload }) => {
        const p = payload as { playerId: string; username: string; progress: number; mistakes: number };
        if (p.playerId === playerIdRef.current) return;
        setOpponents(prev => {
          const next = new Map(prev);
          const existing = next.get(p.playerId);
          next.set(p.playerId, {
            username: p.username,
            progress: p.progress,
            mistakes: p.mistakes,
            finished: existing?.finished ?? false,
            elapsed: existing?.elapsed,
          });
          return next;
        });
      })
      .on("broadcast", { event: "player_won" }, ({ payload }) => {
        const p = payload as { playerId: string; username: string; elapsed: number; mistakes: number };
        if (p.playerId === playerIdRef.current) return;
        setOpponents(prev => {
          const next = new Map(prev);
          const existing = next.get(p.playerId);
          next.set(p.playerId, {
            username: p.username,
            progress: 100,
            mistakes: p.mistakes,
            finished: true,
            elapsed: p.elapsed,
          });
          return next;
        });
        if (!firstWinnerRef.current) {
          const winner = { username: p.username, elapsed: p.elapsed };
          firstWinnerRef.current = winner;
          setFirstWinner(winner);
        }
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        for (const presence of newPresences as unknown as Array<{ username: string; playerId: string }>) {
          if (presence.playerId === playerIdRef.current) continue;
          setOpponents(prev => {
            if (prev.has(presence.playerId)) return prev;
            return new Map(prev).set(presence.playerId, {
              username: presence.username,
              progress: 0,
              mistakes: 0,
              finished: false,
            });
          });
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        for (const presence of leftPresences as unknown as Array<{ playerId: string }>) {
          setOpponents(prev => {
            const next = new Map(prev);
            next.delete(presence.playerId);
            return next;
          });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ username, playerId: playerIdRef.current });
          channel.send({
            type: "broadcast",
            event: "player_joined",
            payload: { playerId: playerIdRef.current, username },
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "loading"]);

  // ─── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (game?.status === "playing" && phase === "playing") {
      tickRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [game?.status, phase, dispatch]);

  // ─── Board progress ─────────────────────────────────────────────────────────
  const { filledCount, totalCells, progressPct } = useMemo(() => {
    if (!game) return { filledCount: 0, totalCells: 81, progressPct: 0 };
    let filled = 0;
    let total = 0;
    for (const row of game.board) {
      for (const cell of row) {
        if (!cell.given) {
          total++;
          if (cell.value !== 0 && !cell.error) filled++;
        }
      }
    }
    return { filledCount: filled, totalCells: total, progressPct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  }, [game?.board]);

  // ─── Broadcast progress ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || !channelRef.current) return;
    if (progressPct === lastProgressRef.current) return;
    lastProgressRef.current = progressPct;
    channelRef.current.send({
      type: "broadcast",
      event: "progress_update",
      payload: {
        playerId: playerIdRef.current,
        username,
        progress: progressPct,
        mistakes: game?.mistakes ?? 0,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPct, phase]);

  // ─── Detect own win ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (game?.status !== "won" || phase === "finished") return;
    setPhase("finished");
    channelRef.current?.send({
      type: "broadcast",
      event: "player_won",
      payload: {
        playerId: playerIdRef.current,
        username,
        elapsed: game.elapsed,
        mistakes: game.mistakes,
      },
    });
    if (!firstWinnerRef.current) {
      const winner = { username, elapsed: game.elapsed };
      firstWinnerRef.current = winner;
      setFirstWinner(winner);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  // ─── Hint ───────────────────────────────────────────────────────────────────
  const handleHint = useCallback(() => {
    if (!game) return;
    const h = getHint(boardToString(game.board), game.puzzle.solution);
    setHint(h);
    if (h) dispatch({ type: "APPLY_HINT", row: h.row, col: h.col, value: h.value });
  }, [game, dispatch]);

  // ─── Start game (host) ──────────────────────────────────────────────────────
  function startGame() {
    setPhase("playing");
    channelRef.current?.send({
      type: "broadcast",
      event: "game_start",
      payload: {},
    });
  }

  // ─── Copy invite link ────────────────────────────────────────────────────────
  async function copyInviteLink() {
    const url = `${window.location.origin}/play/multiplayer/${roomId}?username=spiller`;
    await navigator.clipboard.writeText(url);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 2000);
  }

  // ─── Render: error ──────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">❌</div>
          <p className="font-bold" style={{ color: "var(--text)" }}>{loadError}</p>
          <a href="/multiplayer" style={{ color: "var(--accent)" }} className="text-sm hover:underline">
            Tilbake til lobby
          </a>
        </div>
      </main>
    );
  }

  // ─── Render: loading ─────────────────────────────────────────────────────────
  if (phase === "loading" || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // ─── Render: lobby ───────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl p-8 w-full max-w-sm text-center space-y-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
        >
          <div className="text-4xl">🏆</div>

          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-dim)" }}>
              Romkode
            </p>
            <div
              className="text-4xl font-mono font-black tracking-widest bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              {roomId}
            </div>
          </div>

          <button
            onClick={copyInviteLink}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{
              background: copyState === "copied" ? "rgba(95,138,106,0.10)" : "var(--accent-light)",
              border: `1px solid ${copyState === "copied" ? "rgba(95,138,106,0.40)" : "var(--border-2)"}`,
              color: copyState === "copied" ? "#5f8a6a" : "var(--accent)",
            }}
          >
            {copyState === "copied" ? "✓ Lenke kopiert!" : "📋 Kopier invitasjonslenke"}
          </button>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Spillere ({1 + opponents.size})
            </p>
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{username}</span>
              {isHost && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                  Vert
                </span>
              )}
            </div>
            {Array.from(opponents.entries()).map(([pid, op]) => (
              <div
                key={pid}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm" style={{ color: "var(--text)" }}>{op.username}</span>
              </div>
            ))}
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-sm text-white"
              style={{
                background: "linear-gradient(135deg, #3a4a66, #2c3a4f)",
                boxShadow: "0 4px 20px rgba(58,74,102,0.40)",
              }}
            >
              Start spillet!
            </button>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              Venter på at verten starter spillet...
            </p>
          )}

          <a href="/multiplayer" className="block text-xs font-bold" style={{ color: "var(--text-muted)" }}>
            Avbryt
          </a>
        </motion.div>
      </main>
    );
  }

  // ─── Render: playing / finished ──────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center gap-4 px-4 py-4">
      {/* Progress panel */}
      <div style={{ width: "min(92vw, 480px)" }} className="space-y-1.5">
        <PlayerProgressBar
          username={username}
          progress={progressPct}
          mistakes={game.mistakes}
          isSelf
          finished={phase === "finished"}
          elapsed={phase === "finished" ? game.elapsed : undefined}
        />
        {Array.from(opponents.entries()).map(([pid, op]) => (
          <PlayerProgressBar
            key={pid}
            username={op.username}
            progress={op.progress}
            mistakes={op.mistakes}
            finished={op.finished}
            elapsed={op.elapsed}
          />
        ))}
      </div>

      <GameHeader
        title={`Multiplayer · ${roomId}`}
        elapsed={game.elapsed}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        isPlaying={game.status === "playing"}
        hint={hint}
        onDismissHint={() => setHint(null)}
        onPause={() => dispatch({ type: game.status === "playing" ? "PAUSE" : "RESUME" })}
        filledCount={filledCount}
        totalCells={totalCells}
      />

      <SudokuBoard
        board={game.board}
        selectedCell={game.selectedCell}
        onCellClick={(row, col) => dispatch({ type: "SELECT_CELL", row, col })}
        hintCell={hint ? [hint.row, hint.col] : null}
      />

      <NumberPad
        noteMode={game.noteMode}
        onNumber={(v: CellValue) =>
          dispatch(game.noteMode ? { type: "TOGGLE_NOTE", value: v } : { type: "INPUT_VALUE", value: v })
        }
        onErase={() => dispatch({ type: "ERASE" })}
        onNote={() => dispatch({ type: "TOGGLE_NOTE_MODE" })}
        onHint={handleHint}
      />

      <AnimatePresence>
        {phase === "finished" && (
          <MultiplayerWinOverlay
            myUsername={username}
            myElapsed={game.elapsed}
            myMistakes={game.mistakes}
            firstWinner={firstWinner}
            opponents={opponents}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── PlayerProgressBar ────────────────────────────────────────────────────────

function PlayerProgressBar({
  username,
  progress,
  mistakes,
  isSelf,
  finished,
  elapsed,
}: {
  username: string;
  progress: number;
  mistakes: number;
  isSelf?: boolean;
  finished?: boolean;
  elapsed?: number;
}) {
  const m = elapsed !== undefined ? Math.floor(elapsed / 60).toString().padStart(2, "0") : null;
  const s = elapsed !== undefined ? (elapsed % 60).toString().padStart(2, "0") : null;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2"
      style={{
        background: "var(--surface)",
        border: `1px solid ${isSelf ? "rgba(58,74,102,0.30)" : "var(--border)"}`,
      }}
    >
      <div className="flex items-center gap-2 shrink-0" style={{ width: "5rem" }}>
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${finished ? "" : "animate-pulse"}`}
          style={{
            background: finished ? "#5f8a6a" : isSelf ? "var(--accent)" : "#3a6b73",
          }}
        />
        <span
          className="text-xs font-bold truncate"
          style={{ color: isSelf ? "var(--accent)" : "var(--text)" }}
        >
          {username}
        </span>
      </div>

      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: finished
              ? "#5f8a6a"
              : isSelf
              ? "linear-gradient(90deg, #3a4a66, #2c3a4f)"
              : "linear-gradient(90deg, #3a6b73, #2f5560)",
          }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>

      <div className="text-right shrink-0" style={{ width: "4.5rem" }}>
        {finished && m !== null ? (
          <span className="text-xs font-bold tabular-nums" style={{ color: "#5f8a6a" }}>
            {m}:{s}
          </span>
        ) : (
          <span className="text-xs tabular-nums" style={{ color: "var(--text-dim)" }}>
            {progress}% · {mistakes}✗
          </span>
        )}
      </div>
    </div>
  );
}

// ─── MultiplayerWinOverlay ────────────────────────────────────────────────────

function MultiplayerWinOverlay({
  myUsername,
  myElapsed,
  myMistakes,
  firstWinner,
  opponents,
}: {
  myUsername: string;
  myElapsed: number;
  myMistakes: number;
  firstWinner: { username: string; elapsed: number } | null;
  opponents: Map<string, OpponentState>;
}) {
  const m = Math.floor(myElapsed / 60).toString().padStart(2, "0");
  const s = (myElapsed % 60).toString().padStart(2, "0");
  const iWon = firstWinner?.username === myUsername;

  const allFinished = [
    { username: myUsername, elapsed: myElapsed, mistakes: myMistakes, isSelf: true },
    ...Array.from(opponents.values())
      .filter((o) => o.finished)
      .map((o) => ({
        username: o.username,
        elapsed: o.elapsed ?? 0,
        mistakes: o.mistakes,
        isSelf: false,
      })),
  ].sort((a, b) => a.elapsed - b.elapsed);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      style={{ background: "rgba(90,70,150,0.22)" }}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="rounded-3xl max-w-sm w-full mx-4 flex flex-col overflow-hidden text-center"
        style={{
          background: "var(--surface)",
          boxShadow: "0 24px 80px rgba(58,74,102,0.28), 0 0 0 1.5px rgba(58,74,102,0.20)",
        }}
      >
        {/* Header */}
        <div
          className="px-7 pt-8 pb-5"
          style={{
            background: iWon
              ? "linear-gradient(135deg, #3a4a66 0%, #2c3a4f 100%)"
              : "linear-gradient(135deg, #3a6b73 0%, #2f5560 100%)",
          }}
        >
          <div className="text-5xl mb-2">{iWon ? "🏆" : "🥈"}</div>
          <h2 className="text-2xl font-black text-white">
            {iWon ? "Du vant!" : `${firstWinner?.username ?? "?"} vant!`}
          </h2>
          <p className="text-sm text-white/75 mt-1">
            {m}:{s} · {myMistakes} feil
          </p>
        </div>

        {/* Rankings */}
        {allFinished.length > 1 && (
          <div className="px-5 py-4 space-y-2">
            {allFinished.map((p, i) => {
              const pm = Math.floor(p.elapsed / 60).toString().padStart(2, "0");
              const ps = (p.elapsed % 60).toString().padStart(2, "0");
              return (
                <div
                  key={p.username}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{
                    background: p.isSelf ? "rgba(58,74,102,0.08)" : "var(--surface-2)",
                    border: `1px solid ${p.isSelf ? "rgba(58,74,102,0.25)" : "var(--border)"}`,
                  }}
                >
                  <span className="text-sm font-black w-5">{medals[i] ?? `${i + 1}.`}</span>
                  <span
                    className="flex-1 text-sm font-bold text-left"
                    style={{ color: p.isSelf ? "var(--accent)" : "var(--text)" }}
                  >
                    {p.username}
                    {p.isSelf && (
                      <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                        deg
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-dim)" }}>
                    {pm}:{ps}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {p.mistakes}✗
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-7 flex flex-col gap-3">
          <a
            href="/multiplayer"
            className="block w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest text-center text-white"
            style={{
              background: "linear-gradient(135deg, #3a4a66, #2c3a4f)",
              boxShadow: "0 4px 20px rgba(58,74,102,0.35)",
            }}
          >
            Ny duel
          </a>
          <Link
            href="/"
            className="block text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-dim)" }}
          >
            Tilbake til meny
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

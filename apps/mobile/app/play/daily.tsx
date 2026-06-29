import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CellValue, Hint } from "@sudoku-2026/core";
import {
  createDailyPuzzle, getHint, boardToString, todayString,
  recordCompletion, createEmptyStreak,
} from "@sudoku-2026/core";
import { useGameStore } from "../../store/gameStore";
import SudokuBoard from "../../components/SudokuBoard";
import NumberPad from "../../components/NumberPad";
import GameHeader from "../../components/GameHeader";
import WinModal from "../../components/WinModal";

const STREAK_KEY = "sudoku-streak";

export default function DailyScreen() {
  const today = todayString();
  const { game, loadPuzzle, dispatch } = useGameStore();
  const [hint, setHint] = useState<Hint | null>(null);
  const [streak, setStreak] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const puzzle = createDailyPuzzle(today);
    if (game?.puzzle.id !== puzzle.id) loadPuzzle(puzzle);
    AsyncStorage.getItem(STREAK_KEY).then((raw) => {
      const s = raw ? JSON.parse(raw) : createEmptyStreak("local");
      setStreak(s.currentStreak ?? 0);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  useEffect(() => {
    if (game?.status === "won" && (game.puzzle as any).date === today) {
      AsyncStorage.getItem(STREAK_KEY).then((raw) => {
        const s = raw ? JSON.parse(raw) : createEmptyStreak("local");
        const updated = recordCompletion(s, today);
        AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
        setStreak(updated.currentStreak);
      });
    }
  }, [game?.status, today]);

  useEffect(() => {
    if (game?.status === "playing") {
      tickRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [game?.status, dispatch]);

  const handleCellClick = useCallback(
    (row: number, col: number) => dispatch({ type: "SELECT_CELL", row, col }),
    [dispatch]
  );

  const handleNumber = useCallback(
    (value: CellValue) => {
      if (game?.noteMode) dispatch({ type: "TOGGLE_NOTE", value });
      else dispatch({ type: "INPUT_VALUE", value });
    },
    [dispatch, game?.noteMode]
  );

  const handleHint = useCallback(() => {
    if (!game) return;
    const h = getHint(boardToString(game.board), game.puzzle.solution);
    setHint(h);
    if (h) dispatch({ type: "APPLY_HINT", row: h.row, col: h.col, value: h.value });
  }, [game, dispatch]);

  const { filledCount, totalCells } = useMemo(() => {
    if (!game) return { filledCount: 0, totalCells: 81 };
    let filled = 0, total = 0;
    for (const row of game.board) for (const cell of row) {
      if (!cell.given) { total++; if (cell.value !== 0) filled++; }
    }
    return { filledCount: filled, totalCells: total };
  }, [game]);

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.streakBanner}>
          <Text style={styles.streakText}>🔥 {streak} dagers rekke</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        <GameHeader
          title="Daglig Sudoku"
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
          onCellClick={handleCellClick}
          hintCell={hint ? [hint.row, hint.col] : null}
        />

        <NumberPad
          onNumber={handleNumber}
          onErase={() => dispatch({ type: "ERASE" })}
          onNote={() => dispatch({ type: "TOGGLE_NOTE_MODE" })}
          onHint={handleHint}
          onUndo={() => dispatch({ type: "UNDO" })}
          noteMode={game.noteMode}
          canUndo={(game.history?.length ?? 0) > 0}
        />
      </ScrollView>

      <WinModal
        visible={game.status === "won"}
        title="Daglig Sudoku"
        emoji="📅"
        elapsed={game.elapsed}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        streak={streak}
        onPlayAgain={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  scroll: { alignItems: "center", gap: 14, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 30 },
  streakBanner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    width: "100%", backgroundColor: "rgba(27,127,160,0.07)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(27,127,160,0.30)", paddingHorizontal: 14, paddingVertical: 10,
  },
  streakText: { fontSize: 15, fontWeight: "700", color: "#1B7FA0" },
  dateText: { fontSize: 12, color: "#9C8D7C" },
  wonBanner: {
    backgroundColor: "rgba(46,125,82,0.08)", borderRadius: 14, borderWidth: 1.5,
    borderColor: "rgba(46,125,82,0.35)", padding: 20, alignItems: "center", gap: 8, width: "100%",
  },
  wonTitle: { fontSize: 20, fontWeight: "800", color: "#2E7D52" },
  wonStreak: { fontSize: 16, color: "#C8A44A" },
});

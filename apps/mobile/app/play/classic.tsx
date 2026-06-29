import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import type { Difficulty, CellValue, Hint } from "@sudoku-2026/core";
import { createPuzzle, getHint, boardToString } from "@sudoku-2026/core";
import { useGameStore } from "../../store/gameStore";
import SudokuBoard from "../../components/SudokuBoard";
import NumberPad from "../../components/NumberPad";
import GameHeader from "../../components/GameHeader";
import WinModal from "../../components/WinModal";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Enkel", medium: "Middels", hard: "Vanskelig", extreme: "Ekstrem", daily: "Daglig", mini: "Mini 6×6",
};
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "extreme"];
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#2E7D52", medium: "#C8A44A", hard: "#B91C1C", extreme: "#6B4DA4",
  daily: "#1B7FA0", mini: "#2E7D52",
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ClassicScreen() {
  const router = useRouter();
  const { game, loadPuzzle, dispatch } = useGameStore();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [hint, setHint] = useState<Hint | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    const puzzle = createPuzzle(diff, `${diff}-${randomId()}`, randomId());
    loadPuzzle(puzzle);
  }, [loadPuzzle]);

  useEffect(() => {
    if (!game || game.puzzle.difficulty !== difficulty) {
      startGame(difficulty);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8A44A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Difficulty selector */}
        <View style={styles.diffRow}>
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d}
              onPress={() => startGame(d)}
              style={[styles.diffBtn, difficulty === d && { borderColor: DIFFICULTY_COLORS[d], backgroundColor: `${DIFFICULTY_COLORS[d]}22` }]}
            >
              <Text style={[styles.diffText, difficulty === d && { color: DIFFICULTY_COLORS[d] }]}>
                {DIFFICULTY_LABELS[d]}
              </Text>
            </Pressable>
          ))}
        </View>

        <GameHeader
          title={`Klassisk · ${DIFFICULTY_LABELS[difficulty]}`}
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
        title={`Klassisk · ${DIFFICULTY_LABELS[difficulty]}`}
        emoji="🧩"
        elapsed={game.elapsed}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        onPlayAgain={() => startGame(difficulty)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  loadingContainer: { flex: 1, backgroundColor: "#F2EDE3", alignItems: "center", justifyContent: "center" },
  scroll: { alignItems: "center", gap: 14, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 30 },
  diffRow: { flexDirection: "row", gap: 6, width: "100%" },
  diffBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5,
    borderColor: "#DED8CA", alignItems: "center",
  },
  diffText: { fontSize: 11, fontWeight: "700", color: "#9C8D7C" },
  wonBanner: {
    backgroundColor: "rgba(46,125,82,0.08)", borderRadius: 14, borderWidth: 1.5,
    borderColor: "rgba(46,125,82,0.35)", padding: 20, alignItems: "center", gap: 12, width: "100%",
  },
  wonTitle: { fontSize: 20, fontWeight: "800", color: "#2E7D52" },
  wonBtn: {
    backgroundColor: "#C8A44A", paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 10,
  },
  wonBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

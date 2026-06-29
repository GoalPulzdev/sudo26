import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, ActivityIndicator,
} from "react-native";
import type { Board, CellValue, Hint } from "@sudoku-2026/core";
import { createSamuraiPuzzle, boardFromPuzzle, cloneBoard, getCellSolution, getHint, boardToString } from "@sudoku-2026/core";
import SudokuBoard from "../../components/SudokuBoard";
import NumberPad from "../../components/NumberPad";
import WinModal from "../../components/WinModal";

const GRID_LABELS = ["Nord-vest", "Nord-øst", "Senter", "Sør-vest", "Sør-øst"];

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function isBoardSolved(board: Board, solution: string): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c].value !== Number(solution[r * 9 + c])) return false;
  return true;
}

export default function SamuraiScreen() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [solutions, setSolutions] = useState<string[]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [activeGrid, setActiveGrid] = useState(2); // center first
  const [noteMode, setNoteMode] = useState(false);
  const [hint, setHint] = useState<Hint | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wonGrids, setWonGrids] = useState<boolean[]>([false, false, false, false, false]);
  const [undoHistory, setUndoHistory] = useState<Board[][]>([[], [], [], [], []]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const puzzle = createSamuraiPuzzle(`samurai-${randomId()}`, randomId());
    const newBoards = puzzle.subGridClues.map((clues, i) =>
      boardFromPuzzle(clues, puzzle.subGridSolutions[i])
    );
    setBoards(newBoards);
    setSolutions([...puzzle.subGridSolutions]);
    tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const handleSelect = useCallback((r: number, c: number) => {
    setSelected([r, c]);
    setHint(null);
  }, []);

  const handleNumber = useCallback((value: CellValue) => {
    if (!selected || boards.length === 0) return;
    const [r, c] = selected;
    const board = boards[activeGrid];
    if (board[r][c].given) return;
    const newBoards = boards.map((b, i) => i === activeGrid ? cloneBoard(b) : b);
    const cell = newBoards[activeGrid][r][c];
    if (noteMode) {
      const notes = cell.notes;
      if (notes.has(value)) notes.delete(value); else notes.add(value);
    } else {
      // Block if value already exists in same row, column, or 3×3 box
      if (value !== 0) {
        const b = boards[activeGrid];
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let i = 0; i < 9; i++) {
          if (i !== c && b[r][i].value === value) return;
          if (i !== r && b[i][c].value === value) return;
        }
        for (let sr = br; sr < br + 3; sr++)
          for (let sc = bc; sc < bc + 3; sc++)
            if ((sr !== r || sc !== c) && b[sr][sc].value === value) return;
      }
      cell.value = value;
      cell.notes = new Set();
      const correct = getCellSolution(cell) === value;
      cell.error = value !== 0 && !correct;
      if (cell.error) setMistakes((m) => m + 1);
      // Save current board to undo history
      const newHistory = undoHistory.map((h, i) => i === activeGrid ? [...h.slice(-19), cloneBoard(boards[activeGrid])] : h);
      setUndoHistory(newHistory);
      if (isBoardSolved(newBoards[activeGrid], solutions[activeGrid])) {
        const newWon = [...wonGrids];
        newWon[activeGrid] = true;
        setWonGrids(newWon);
        if (newWon.every(Boolean) && tickRef.current) clearInterval(tickRef.current);
      }
    }
    setBoards(newBoards);
  }, [selected, boards, activeGrid, noteMode, solutions, wonGrids]);

  const handleErase = useCallback(() => {
    if (!selected || boards.length === 0) return;
    const [r, c] = selected;
    const board = boards[activeGrid];
    if (board[r][c].given) return;
    const newBoards = boards.map((b, i) => i === activeGrid ? cloneBoard(b) : b);
    const cell = newBoards[activeGrid][r][c];
    cell.value = 0;
    cell.error = false;
    cell.notes = new Set();
    setBoards(newBoards);
  }, [selected, boards, activeGrid]);

  const handleUndo = useCallback(() => {
    const history = undoHistory[activeGrid];
    if (!history || history.length === 0) return;
    const prev = history[history.length - 1];
    const newBoards = boards.map((b, i) => i === activeGrid ? cloneBoard(prev) : b);
    const newHistory = undoHistory.map((h, i) => i === activeGrid ? h.slice(0, -1) : h);
    setBoards(newBoards);
    setUndoHistory(newHistory);
  }, [boards, activeGrid, undoHistory]);

  const handleHint = useCallback(() => {
    if (boards.length === 0) return;
    const board = boards[activeGrid];
    const h = getHint(boardToString(board), solutions[activeGrid]);
    setHint(h);
    if (h) {
      const newBoards = boards.map((b, i) => i === activeGrid ? cloneBoard(b) : b);
      const cell = newBoards[activeGrid][h.row][h.col];
      cell.value = h.value;
      cell.notes = new Set();
      cell.error = false;
      setBoards(newBoards);
    }
  }, [boards, activeGrid, solutions]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const allWon = wonGrids.every(Boolean);

  if (boards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#C8A44A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HUD */}
        <View style={styles.hud}>
          <Text style={styles.hudTitle}>Samurai Sudoku</Text>
          <View style={styles.hudRight}>
            <Text style={styles.hudTime}>{fmt(elapsed)}</Text>
            {mistakes > 0 && <Text style={styles.hudMistakes}>Feil: {mistakes}</Text>}
          </View>
        </View>

        {/* Grids completed indicator */}
        <View style={styles.progressRow}>
          {wonGrids.map((w, i) => (
            <View key={i} style={[styles.progressDot, w && styles.progressDotDone]} />
          ))}
          <Text style={styles.progressText}>{wonGrids.filter(Boolean).length}/5 fullført</Text>
        </View>

        {/* Grid selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
          {GRID_LABELS.map((label, i) => (
            <Pressable
              key={i}
              onPress={() => { setActiveGrid(i); setSelected(null); setHint(null); }}
              style={[styles.tab, activeGrid === i && styles.tabActive, wonGrids[i] && styles.tabDone]}
            >
              <Text style={[styles.tabText, activeGrid === i && styles.tabTextActive]}>
                {wonGrids[i] ? "✓ " : ""}{label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <SudokuBoard
          board={boards[activeGrid]}
          selectedCell={selected}
          onCellClick={handleSelect}
          hintCell={hint ? [hint.row, hint.col] : null}
        />

        <NumberPad
          onNumber={handleNumber}
          onErase={handleErase}
          onNote={() => setNoteMode((n) => !n)}
          onHint={handleHint}
          onUndo={handleUndo}
          noteMode={noteMode}
          canUndo={undoHistory[activeGrid]?.length > 0}
        />
      </ScrollView>

      <WinModal
        visible={allWon}
        title="Samurai Sudoku"
        emoji="🥷"
        elapsed={elapsed}
        mistakes={mistakes}
        hintsUsed={0}
        onPlayAgain={() => {
          const puzzle = createSamuraiPuzzle(`samurai-${randomId()}`, randomId());
          const newBoards = puzzle.subGridClues.map((clues, i) =>
            boardFromPuzzle(clues, puzzle.subGridSolutions[i])
          );
          setBoards(newBoards);
          setSolutions([...puzzle.subGridSolutions]);
          setWonGrids([false, false, false, false, false]);
          setUndoHistory([[], [], [], [], []]);
          setElapsed(0);
          setMistakes(0);
          setActiveGrid(2);
          if (tickRef.current) clearInterval(tickRef.current);
          tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  scroll: { alignItems: "center", gap: 14, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 30 },
  hud: {
    width: "100%", backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1.5,
    borderColor: "#EBE4D5", paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  hudTitle: { fontSize: 13, fontWeight: "700", color: "#8A6A10" },
  hudRight: { flexDirection: "row", gap: 10, alignItems: "center" },
  hudTime: { fontSize: 16, fontWeight: "800", color: "#C8A44A" },
  hudMistakes: { fontSize: 13, color: "#B91C1C" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6, width: "100%" },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#DED8CA" },
  progressDotDone: { backgroundColor: "#C8A44A" },
  progressText: { marginLeft: 4, fontSize: 12, color: "#B0A090" },
  tabsScroll: { width: "100%" },
  tabsRow: { gap: 8, paddingHorizontal: 4 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
    borderColor: "#DED8CA", backgroundColor: "#FFFFFF",
  },
  tabActive: { borderColor: "#C8A44A", backgroundColor: "rgba(200,164,74,0.12)" },
  tabDone: { borderColor: "#C8A44A" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#9C8D7C" },
  tabTextActive: { color: "#8A6A10" },
  wonBanner: {
    backgroundColor: "rgba(200,164,74,0.10)", borderRadius: 14, borderWidth: 1.5,
    borderColor: "rgba(200,164,74,0.45)", padding: 20, alignItems: "center", gap: 8, width: "100%",
  },
  wonTitle: { fontSize: 20, fontWeight: "800", color: "#8A6A10" },
  wonSub: { fontSize: 14, color: "#9C8D7C" },
});

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, ActivityIndicator, useWindowDimensions,
} from "react-native";
import { createMiniPuzzle } from "@sudoku-2026/core";
import { useGameStore } from "../../store/gameStore";
import WinModal from "../../components/WinModal";

type MiniDifficulty = "easy" | "medium" | "hard";
type Val = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface MCell {
  value: Val;
  given: boolean;
  error: boolean;
  notes: Set<Val>;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function parseMiniBoard(clues: string, solution: string): MCell[][] {
  return Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 6 }, (_, c) => {
      const i = r * 6 + c;
      const raw = Number(clues[i]);
      const val = (raw >= 1 && raw <= 6 ? raw : 0) as Val;
      return { value: val, given: val !== 0, error: false, notes: new Set<Val>() };
    })
  );
}

function isMiniCellValid(board: MCell[][], row: number, col: number): boolean {
  const v = board[row][col].value;
  if (v === 0) return true;
  const boxRow = Math.floor(row / 2) * 2;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 6; i++) {
    if (i !== col && board[row][i].value === v) return false;
    if (i !== row && board[i][col].value === v) return false;
  }
  for (let br = boxRow; br < boxRow + 2; br++) {
    for (let bc = boxCol; bc < boxCol + 3; bc++) {
      if ((br !== row || bc !== col) && board[br][bc].value === v) return false;
    }
  }
  return true;
}

function isMiniSolved(board: MCell[][], solution: string): boolean {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (board[r][c].value !== Number(solution[r * 6 + c])) return false;
    }
  }
  return true;
}

const DIFF_LABELS: Record<MiniDifficulty, string> = { easy: "Enkel", medium: "Middels", hard: "Vanskelig" };
const DIFF_COLORS: Record<MiniDifficulty, string> = { easy: "#2E7D52", medium: "#C8A44A", hard: "#B91C1C" };

export default function MiniScreen() {
  const recordWin = useGameStore((s) => s.recordWin);
  const [difficulty, setDifficulty] = useState<MiniDifficulty>("easy");
  const [board, setBoard] = useState<MCell[][]>([]);
  const [solution, setSolution] = useState("");
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [won, setWon] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [history, setHistory] = useState<MCell[][][]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback((diff: MiniDifficulty) => {
    const puzzle = createMiniPuzzle(diff, `mini-${diff}-${randomId()}`, randomId());
    const b = parseMiniBoard(puzzle.clues, puzzle.solution);
    setBoard(b);
    setSolution(puzzle.solution);
    setSelected(null);
    setElapsed(0);
    setWon(false);
    setMistakes(0);
    setHistory([]);
    setDifficulty(diff);
  }, []);

  useEffect(() => { startGame("easy"); }, [startGame]);

  useEffect(() => {
    if (!won) {
      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [won]);

  const handleInput = useCallback((val: Val) => {
    if (!selected || !board.length) return;
    const [r, c] = selected;
    if (board[r][c].given) return;
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) })));
    if (noteMode) {
      const notes = newBoard[r][c].notes;
      if (notes.has(val)) notes.delete(val); else notes.add(val);
    } else {
      // Block if value already exists in same row, column, or 2×3 box
      const br = Math.floor(r / 2) * 2;
      const bc = Math.floor(c / 3) * 3;
      for (let i = 0; i < 6; i++) {
        if (i !== c && board[r][i].value === val) return;
        if (i !== r && board[i][c].value === val) return;
      }
      for (let mr = br; mr < br + 2; mr++)
        for (let mc = bc; mc < bc + 3; mc++)
          if ((mr !== r || mc !== c) && board[mr][mc].value === val) return;

      newBoard[r][c].value = val;
      newBoard[r][c].notes = new Set();
      // Validate
      const valid = isMiniCellValid(newBoard, r, c);
      newBoard[r][c].error = !valid;
      if (!valid) setMistakes((m) => m + 1);
      // Save to undo history
      setHistory((h) => [...h.slice(-19), board.map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) })))]);
      if (isMiniSolved(newBoard, solution)) {
        setWon(true);
        if (tickRef.current) clearInterval(tickRef.current);
        recordWin("mini", elapsed, mistakes);
      }
    }
    setBoard(newBoard);
  }, [selected, board, noteMode, solution]);

  const handleErase = useCallback(() => {
    if (!selected || !board.length) return;
    const [r, c] = selected;
    if (board[r][c].given) return;
    if (board[r][c].value === 0 && board[r][c].notes.size === 0) return;
    setHistory((h) => [...h.slice(-19), board.map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) })))]);
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) })));
    newBoard[r][c].value = 0;
    newBoard[r][c].error = false;
    newBoard[r][c].notes = new Set();
    setBoard(newBoard);
  }, [selected, board]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    setBoard(history[history.length - 1].map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) }))));
    setHistory((h) => h.slice(0, -1));
  }, [history]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const { width: screenWidth } = useWindowDimensions();
  const boardSize = Math.min(screenWidth - 32, 300);
  const cellSize = boardSize / 6;

  if (!board.length) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#C8A44A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Difficulty */}
        <View style={styles.diffRow}>
          {(["easy", "medium", "hard"] as MiniDifficulty[]).map((d) => (
            <Pressable
              key={d}
              onPress={() => startGame(d)}
              style={[styles.diffBtn, difficulty === d && { borderColor: DIFF_COLORS[d], backgroundColor: `${DIFF_COLORS[d]}22` }]}
            >
              <Text style={[styles.diffText, difficulty === d && { color: DIFF_COLORS[d] }]}>{DIFF_LABELS[d]}</Text>
            </Pressable>
          ))}
        </View>

        {/* HUD */}
        <View style={styles.hud}>
          <Text style={styles.hudTitle}>Mini 6×6</Text>
          <View style={styles.hudStats}>
            <Text style={styles.hudTime}>{fmt(elapsed)}</Text>
            <Text style={styles.hudMistakes}>Feil: {mistakes}</Text>
          </View>
        </View>

        {/* Board */}
        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const selVal = selected ? board[selected[0]][selected[1]].value : 0;
              const isSame = !isSelected && selVal !== 0 && cell.value === selVal;
              const borderRightWidth = c === 2 ? 2.5 : c === 5 ? 0 : 0.5;
              const borderBottomWidth = r === 1 || r === 3 ? 2.5 : r === 5 ? 0 : 0.5;

              let bg = "transparent";
              if (isSelected) bg = "rgba(200,164,74,0.22)";
              else if (isSame) bg = "rgba(180,155,80,0.10)";

              let textColor = "#19170F";
              if (cell.error) textColor = "#B91C1C";
              else if (cell.given) textColor = "#19170F";
              else textColor = "#8A6A10";

              return (
                <Pressable
                  key={`${r}-${c}`}
                  onPress={() => setSelected([r, c])}
                  style={[
                    styles.cell,
                    {
                      width: cellSize, height: cellSize,
                      left: c * cellSize, top: r * cellSize,
                      backgroundColor: bg,
                      borderRightWidth,
                      borderBottomWidth,
                      borderRightColor: c === 2 ? "#C8A44A" : "#EBE4D5",
                      borderBottomColor: r === 1 || r === 3 ? "#C8A44A" : "#EBE4D5",
                    },
                  ]}
                >
                  {cell.value !== 0 ? (
                    <Text style={{ fontSize: cellSize * 0.52, color: textColor, fontWeight: cell.given ? "900" : "700" }}>
                      {cell.value}
                    </Text>
                  ) : cell.notes.size > 0 ? (
                    <View style={{ flex: 1, width: "100%", flexDirection: "row", flexWrap: "wrap", padding: 1 }}>
                      {([1,2,3,4,5,6] as Val[]).map((n) => (
                        <Text key={n} style={{ width: "33.33%", fontSize: cellSize * 0.26, textAlign: "center", color: cell.notes.has(n) ? "#B0A090" : "transparent" }}>
                          {n}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>

        {/* Number pad for 1-6 */}
        <View style={styles.numRow}>
          {([1,2,3,4,5,6] as Val[]).map((n) => (
            <Pressable key={n} onPress={() => handleInput(n)}
              style={styles.numBtn}>
              <Text style={styles.numText}>{n}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleUndo}
            disabled={history.length === 0}
            style={[styles.actionBtn, history.length === 0 && { opacity: 0.35 }]}
          >
            <Text style={styles.actionLabel}>↩️ Angre</Text>
          </Pressable>
          <Pressable onPress={handleErase} style={styles.actionBtn}>
            <Text style={styles.actionLabel}>⌫ Slett</Text>
          </Pressable>
          <Pressable
            onPress={() => setNoteMode((n) => !n)}
            style={[styles.actionBtn, noteMode && styles.actionBtnActive]}
          >
            <Text style={[styles.actionLabel, noteMode && { color: "#8A6A10" }]}>✏️ Notat</Text>
          </Pressable>
        </View>
      </ScrollView>

      <WinModal
        visible={won}
        title="Mini Sudoku"
        emoji="🔗"
        elapsed={elapsed}
        mistakes={mistakes}
        hintsUsed={0}
        onPlayAgain={() => startGame(difficulty)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  scroll: { alignItems: "center", gap: 14, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 30 },
  diffRow: { flexDirection: "row", gap: 6, width: "100%" },
  diffBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: "#DED8CA", alignItems: "center" },
  diffText: { fontSize: 11, fontWeight: "700", color: "#9C8D7C" },
  hud: {
    width: "100%", backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1.5,
    borderColor: "#EBE4D5", paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  hudTitle: { fontSize: 13, fontWeight: "700", color: "#8A6A10" },
  hudStats: { flexDirection: "row", gap: 12 },
  hudTime: { fontSize: 16, fontWeight: "800", color: "#C8A44A" },
  hudMistakes: { fontSize: 14, color: "#B91C1C" },
  board: { position: "relative", backgroundColor: "#FDFAF2", borderRadius: 12, borderWidth: 2, borderColor: "#C8A44A", overflow: "hidden" },
  cell: { position: "absolute", alignItems: "center", justifyContent: "center" },
  numRow: { flexDirection: "row", gap: 6, width: "100%" },
  numBtn: {
    flex: 1, aspectRatio: 3 / 4, backgroundColor: "#FFFFFF", borderRadius: 10,
    borderWidth: 1.5, borderColor: "#DED8CA", alignItems: "center", justifyContent: "center",
  },
  numText: { fontSize: 20, fontWeight: "900", color: "#19170F" },
  actionRow: { flexDirection: "row", gap: 10, width: "100%" },
  actionBtn: {
    flex: 1, paddingVertical: 12, backgroundColor: "#FFFFFF", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#DED8CA", alignItems: "center",
  },
  actionBtnActive: { backgroundColor: "rgba(200,164,74,0.15)", borderColor: "#C8A44A" },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#B0A090" },
  wonBanner: {
    backgroundColor: "rgba(46,125,82,0.08)", borderRadius: 14, borderWidth: 1.5,
    borderColor: "rgba(46,125,82,0.35)", padding: 20, alignItems: "center", gap: 12, width: "100%",
  },
  wonTitle: { fontSize: 20, fontWeight: "800", color: "#2E7D52" },
  wonBtn: { backgroundColor: "#C8A44A", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  wonBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

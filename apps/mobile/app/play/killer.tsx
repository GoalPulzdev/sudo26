import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, ActivityIndicator, useWindowDimensions,
} from "react-native";
import type { CellValue, Hint, KillerCage } from "@sudoku-2026/core";
import { createKillerPuzzle, getHint, boardToString } from "@sudoku-2026/core";
import { useGameStore } from "../../store/gameStore";
import NumberPad from "../../components/NumberPad";
import GameHeader from "../../components/GameHeader";
import WinModal from "../../components/WinModal";

const CAGE_COLORS = [
  "rgba(200,164,74,0.12)",  "rgba(27,127,160,0.10)",  "rgba(185,28,28,0.09)",
  "rgba(46,125,82,0.10)",   "rgba(200,100,50,0.10)",  "rgba(107,77,164,0.10)",
  "rgba(185,50,110,0.09)",  "rgba(20,148,136,0.10)",  "rgba(160,140,40,0.10)",
];

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function KillerScreen() {
  const { game, loadPuzzle, dispatch } = useGameStore();
  const [hint, setHint] = useState<Hint | null>(null);
  const [cages, setCages] = useState<KillerCage[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const puzzle = createKillerPuzzle(`killer-${randomId()}`, randomId());
    loadPuzzle(puzzle);
    setCages(puzzle.killerCages ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (game?.status === "playing") {
      tickRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [game?.status, dispatch]);

  const handleHint = useCallback(() => {
    if (!game) return;
    const h = getHint(boardToString(game.board), game.puzzle.solution);
    setHint(h);
    if (h) dispatch({ type: "APPLY_HINT", row: h.row, col: h.col, value: h.value });
  }, [game, dispatch]);

  const handleNumber = useCallback(
    (value: CellValue) => {
      if (game?.noteMode) dispatch({ type: "TOGGLE_NOTE", value });
      else dispatch({ type: "INPUT_VALUE", value });
    },
    [dispatch, game?.noteMode]
  );

  // Build cell→cage lookup
  const cellToCage = useMemo(() => {
    const m = new Map<string, { cage: KillerCage; idx: number }>();
    cages.forEach((cage, idx) => cage.cells.forEach(([r, c]) => m.set(`${r}-${c}`, { cage, idx })));
    return m;
  }, [cages]);

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
        <ActivityIndicator size="large" color="#C8A44A" />
      </SafeAreaView>
    );
  }

  const { width: screenWidth } = useWindowDimensions();
  const boardSize = Math.min(screenWidth - 32, 340);
  const cellSize = boardSize / 9;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <GameHeader
          title="Killer Sudoku"
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

        {/* Killer board with cage overlays */}
        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
          {game.board.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r}-${c}`;
              const cageInfo = cellToCage.get(key);
              const cageColor = cageInfo ? CAGE_COLORS[cageInfo.idx % CAGE_COLORS.length] : "transparent";
              const isSelected = game.selectedCell?.[0] === r && game.selectedCell?.[1] === c;
              const borderRightWidth = c === 2 || c === 5 ? 2.5 : c === 8 ? 0 : 0.5;
              const borderBottomWidth = r === 2 || r === 5 ? 2.5 : r === 8 ? 0 : 0.5;

              // Is this cell top-left of cage?
              const isTopLeftOfCage = cageInfo
                ? [...cageInfo.cage.cells].sort(([ar, ac], [br, bc]) => ar !== br ? ar - br : ac - bc)[0][0] === r &&
                  [...cageInfo.cage.cells].sort(([ar, ac], [br, bc]) => ar !== br ? ar - br : ac - bc)[0][1] === c
                : false;

              let textColor = "#19170F";
              if (cell.error) textColor = "#B91C1C";
              else if (cell.given) textColor = "#19170F";
              else textColor = "#8A6A10";

              return (
                <Pressable
                  key={key}
                  onPress={() => dispatch({ type: "SELECT_CELL", row: r, col: c })}
                  style={[
                    styles.cell,
                    {
                      width: cellSize, height: cellSize,
                      left: c * cellSize, top: r * cellSize,
                      backgroundColor: isSelected ? "rgba(200,164,74,0.22)" : cageColor,
                      borderRightWidth,
                      borderBottomWidth,
                      borderRightColor: c === 2 || c === 5 ? "#C8A44A" : "#EBE4D5",
                      borderBottomColor: r === 2 || r === 5 ? "#C8A44A" : "#EBE4D5",
                    },
                  ]}
                >
                  {isTopLeftOfCage && cageInfo && (
                    <Text style={[styles.cageSum, { fontSize: cellSize * 0.24 }]}>
                      {cageInfo.cage.sum}
                    </Text>
                  )}
                  {cell.value !== 0 && (
                    <Text style={[styles.cellText, { fontSize: cellSize * 0.5, color: textColor, fontWeight: cell.given ? "900" : "700" }]}>
                      {cell.value}
                    </Text>
                  )}
                </Pressable>
              );
            })
          )}
        </View>

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
        title="Killer Sudoku"
        emoji="🔪"
        elapsed={game.elapsed}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        onPlayAgain={() => {
          const puzzle = createKillerPuzzle(`killer-${randomId()}`, randomId());
          loadPuzzle(puzzle);
          setCages(puzzle.killerCages ?? []);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  scroll: { alignItems: "center", gap: 14, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 30 },
  board: {
    position: "relative",
    backgroundColor: "#FDFAF2",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C8A44A",
    overflow: "hidden",
  },
  cell: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  cageSum: {
    position: "absolute",
    top: 2,
    left: 3,
    color: "#8A6A10",
    fontWeight: "700",
    lineHeight: 12,
  },
  cellText: {
    textAlign: "center",
    includeFontPadding: false,
  },
  wonBanner: {
    backgroundColor: "rgba(185,28,28,0.07)", borderRadius: 14, borderWidth: 1.5,
    borderColor: "rgba(185,28,28,0.30)", padding: 20, alignItems: "center", gap: 12, width: "100%",
  },
  wonTitle: { fontSize: 20, fontWeight: "800", color: "#B91C1C" },
  wonBtn: { backgroundColor: "#C8A44A", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  wonBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

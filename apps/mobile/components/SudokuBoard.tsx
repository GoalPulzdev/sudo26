import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import type { Board, CellValue } from "@sudoku-2026/core";

interface SudokuBoardProps {
  board: Board;
  selectedCell: [number, number] | null;
  onCellClick: (row: number, col: number) => void;
  hintCell?: [number, number] | null;
  size?: number;
}

export default function SudokuBoard({ board, selectedCell, onCellClick, hintCell, size }: SudokuBoardProps) {
  const { width } = useWindowDimensions();
  const boardSize = size ?? Math.min(width - 32, 340);
  const cellSize = boardSize / 9;
  const selVal = selectedCell ? board[selectedCell[0]][selectedCell[1]].value : 0;

  return (
    <View style={[styles.container, { width: boardSize, height: boardSize }]}>
      {board.map((row, r) =>
        row.map((cell, c) => {
          const isSelected  = selectedCell?.[0] === r && selectedCell?.[1] === c;
          const isHint      = hintCell?.[0] === r && hintCell?.[1] === c;
          const isSameValue = !isSelected && selVal !== 0 && cell.value === selVal;
          const isPeer      = !isSelected && cell.highlighted;

          const borderRightWidth = c === 2 || c === 5 ? 2.5 : c === 8 ? 0 : 0.5;
          const borderBottomWidth = r === 2 || r === 5 ? 2.5 : r === 8 ? 0 : 0.5;
          const borderColor = c === 2 || c === 5 || r === 2 || r === 5 ? "#C8A44A" : "#EBE4D5";

          let bg = "transparent";
          if (isSelected) bg = "rgba(200,164,74,0.22)";
          else if (isHint) bg = "rgba(200,164,74,0.35)";
          else if (isSameValue) bg = "rgba(180,155,80,0.10)";
          else if (isPeer) bg = "rgba(180,155,80,0.05)";

          let textColor = "#19170F";
          if (cell.error) textColor = "#B91C1C";
          else if (cell.given) textColor = "#19170F";
          else textColor = "#8A6A10";

          return (
            <Pressable
              key={`${r}-${c}`}
              onPress={() => onCellClick(r, c)}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  left: c * cellSize,
                  top: r * cellSize,
                  backgroundColor: bg,
                  borderRightWidth,
                  borderBottomWidth,
                  borderRightColor: borderColor,
                  borderBottomColor: borderColor,
                },
                isSelected && styles.selectedBorder,
                isHint && styles.hintBorder,
              ]}
            >
              {cell.value !== 0 ? (
                <Text style={[
                  styles.cellText,
                  { fontSize: cellSize * 0.52, color: textColor, fontWeight: cell.given ? "900" : "700" },
                ]}>
                  {cell.value}
                </Text>
              ) : cell.notes.size > 0 ? (
                <NoteGrid notes={cell.notes} cellSize={cellSize} />
              ) : null}
            </Pressable>
          );
        })
      )}
    </View>
  );
}

function NoteGrid({ notes, cellSize }: { notes: Set<CellValue>; cellSize: number }) {
  const fontSize = cellSize * 0.26;
  return (
    <View style={styles.noteGrid}>
      {([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellValue[]).map((n) => (
        <Text key={n} style={[styles.noteText, { fontSize, color: notes.has(n) ? "#B0A090" : "transparent" }]}>
          {n}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  selectedBorder: {
    borderWidth: 2,
    borderColor: "rgba(200,164,74,0.90)",
  },
  hintBorder: {
    borderWidth: 2,
    borderColor: "#C8A44A",
  },
  cellText: {
    textAlign: "center",
    includeFontPadding: false,
  },
  noteGrid: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 1,
  },
  noteText: {
    width: "33.33%",
    textAlign: "center",
    includeFontPadding: false,
  },
});

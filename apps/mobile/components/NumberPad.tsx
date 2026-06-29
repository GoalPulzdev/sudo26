import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { CellValue } from "@sudoku-2026/core";

interface NumberPadProps {
  onNumber: (value: CellValue) => void;
  onErase: () => void;
  onNote: () => void;
  onHint: () => void;
  onUndo: () => void;
  noteMode: boolean;
  canUndo?: boolean;
}

const NUMBERS: CellValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function NumberPad({ onNumber, onErase, onNote, onHint, onUndo, noteMode, canUndo }: NumberPadProps) {
  return (
    <View style={styles.container}>
      <View style={styles.numRow}>
        {NUMBERS.map((n) => (
          <Pressable
            key={n}
            onPress={() => onNumber(n)}
            style={({ pressed }) => [styles.numBtn, pressed && styles.numBtnPressed]}
          >
            <Text style={styles.numText}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.actionRow}>
        <Pressable
          onPress={onUndo}
          disabled={!canUndo}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed, !canUndo && styles.actionBtnDisabled]}
        >
          <Text style={[styles.actionIcon, !canUndo && styles.actionIconDisabled]}>↩️</Text>
          <Text style={[styles.actionLabel, !canUndo && styles.actionLabelDisabled]}>Angre</Text>
        </Pressable>
        <Pressable
          onPress={onErase}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
        >
          <Text style={styles.actionIcon}>⌫</Text>
          <Text style={styles.actionLabel}>Slett</Text>
        </Pressable>
        <Pressable
          onPress={onNote}
          style={({ pressed }) => [styles.actionBtn, noteMode && styles.actionBtnActive, pressed && styles.actionBtnPressed]}
        >
          <Text style={[styles.actionIcon, noteMode && styles.actionIconActive]}>✏️</Text>
          <Text style={[styles.actionLabel, noteMode && styles.actionLabelActive]}>Notat</Text>
        </Pressable>
        <Pressable
          onPress={onHint}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
        >
          <Text style={styles.actionIcon}>💡</Text>
          <Text style={styles.actionLabel}>Hint</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: "100%",
    paddingHorizontal: 4,
  },
  numRow: {
    flexDirection: "row",
    gap: 6,
  },
  numBtn: {
    flex: 1,
    aspectRatio: 3 / 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#DED8CA",
    alignItems: "center",
    justifyContent: "center",
  },
  numBtnPressed: {
    backgroundColor: "rgba(200,164,74,0.15)",
    borderColor: "#C8A44A",
  },
  numText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#19170F",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#DED8CA",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionBtnPressed: {
    backgroundColor: "rgba(200,164,74,0.12)",
    borderColor: "#C8A44A",
  },
  actionBtnActive: {
    backgroundColor: "rgba(200,164,74,0.15)",
    borderColor: "#C8A44A",
  },
  actionIcon: {
    fontSize: 18,
  },
  actionIconActive: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B0A090",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionLabelActive: {
    color: "#8A6A10",
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  actionIconDisabled: {
    fontSize: 18,
  },
  actionLabelDisabled: {
    color: "#C0B8AE",
  },
});

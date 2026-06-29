import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { Hint } from "@sudoku-2026/core";

interface GameHeaderProps {
  title: string;
  elapsed: number;
  mistakes: number;
  hintsUsed: number;
  isPlaying: boolean;
  hint: Hint | null;
  onDismissHint: () => void;
  onPause: () => void;
  filledCount: number;
  totalCells: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function GameHeader({
  title,
  elapsed,
  mistakes,
  hintsUsed,
  isPlaying,
  hint,
  onDismissHint,
  onPause,
  filledCount,
  totalCells,
}: GameHeaderProps) {
  const pct = totalCells > 0 ? filledCount / totalCells : 0;

  return (
    <View style={styles.container}>
      <View style={styles.hudRow}>
        <Text style={styles.titleText}>{title}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>TID</Text>
            <Text style={[styles.statValue, { color: "#C8A44A" }]}>{formatTime(elapsed)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>FEIL</Text>
            <Text style={[styles.statValue, { color: mistakes > 0 ? "#B91C1C" : "#B0A090" }]}>{mistakes}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>HINT</Text>
            <Text style={[styles.statValue, { color: "#C8A44A" }]}>{hintsUsed}</Text>
          </View>
          <Pressable
            onPress={onPause}
            style={[styles.pauseBtn, { borderColor: isPlaying ? "rgba(200,164,74,0.55)" : "rgba(46,125,82,0.45)", backgroundColor: isPlaying ? "rgba(200,164,74,0.10)" : "rgba(46,125,82,0.08)" }]}
          >
            <Text style={{ color: isPlaying ? "#8A6A10" : "#2E7D52", fontSize: 14 }}>
              {isPlaying ? "⏸" : "▶"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>

      {/* Hint banner */}
      {hint && (
        <Pressable onPress={onDismissHint} style={styles.hintBanner}>
          <Text style={styles.hintText}>
            💡 Hint: ({hint.row + 1},{hint.col + 1}) → {hint.value}
          </Text>
          <Text style={styles.hintDismiss}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 8,
  },
  hudRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EBE4D5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B0A090",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flexShrink: 1,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#B0A090",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#EBE4D5",
  },
  pauseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  progressTrack: {
    height: 5,
    backgroundColor: "#EBE4D5",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#C8A44A",
    borderRadius: 3,
  },
  hintBanner: {
    backgroundColor: "rgba(200,164,74,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(200,164,74,0.38)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hintText: {
    color: "#8A6A10",
    fontSize: 13,
    fontWeight: "600",
  },
  hintDismiss: {
    color: "#8A6A10",
    fontSize: 14,
    fontWeight: "700",
  },
});

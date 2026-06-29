import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useGameStore } from "../store/gameStore";

type Diff = "easy" | "medium" | "hard" | "extreme" | "daily" | "mini";

const DIFF_LABELS: Record<Diff, string> = {
  easy: "Classic Enkel",
  medium: "Classic Middels",
  hard: "Classic Vanskelig",
  extreme: "Classic Ekstrem",
  daily: "Daglig utfordring",
  mini: "Mini 6×6",
};

const DIFF_EMOJI: Record<Diff, string> = {
  easy: "🟢", medium: "🟡", hard: "🔴", extreme: "🟣", daily: "📅", mini: "🔷",
};

const DIFF_COLORS: Record<Diff, string> = {
  easy: "#2E7D52",
  medium: "#C8A44A",
  hard: "#B91C1C",
  extreme: "#6B4DA4",
  daily: "#1B7FA0",
  mini: "#2E7D52",
};

const MEDAL = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#C8A44A", "#9C9C9C", "#C0845A"];

function fmt(s: number | null): string {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function LeaderboardScreen() {
  const stats = useGameStore((s) => s.stats);
  const diffKeys: Diff[] = ["easy", "medium", "hard", "extreme", "daily", "mini"];

  // Records sorted by best time ascending (only played modes)
  const records = diffKeys
    .map((d) => ({
      diff: d,
      bestTime: stats.byDifficulty[d].bestTime,
      won: stats.byDifficulty[d].won,
      played: stats.byDifficulty[d].played,
    }))
    .filter((r) => r.bestTime !== null)
    .sort((a, b) => (a.bestTime ?? Infinity) - (b.bestTime ?? Infinity));

  const hasAny = records.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Rekorder</Text>
          <Text style={styles.subHeading}>Dine personlige beste tider</Text>
        </View>

        {/* Empty state */}
        {!hasAny && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>Ingen rekorder ennå</Text>
            <Text style={styles.emptyText}>Fullfør et brett for å sette din første rekord!</Text>
          </View>
        )}

        {/* Top 3 podium */}
        {records.length >= 1 && (
          <View style={styles.podiumSection}>
            <Text style={styles.sectionTitle}>Pallplass</Text>
            {records.slice(0, 3).map((r, i) => (
              <View
                key={r.diff}
                style={[
                  styles.podiumRow,
                  i === 0 && styles.podiumRowGold,
                  i > 0 && { borderTopWidth: 1, borderTopColor: "#EBE4D5" },
                ]}
              >
                <Text style={styles.medalEmoji}>{MEDAL[i]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.podiumName, i === 0 && { fontSize: 16 }]}>{DIFF_LABELS[r.diff]}</Text>
                  <Text style={styles.podiumWon}>{r.won} brett vunnet</Text>
                </View>
                <View style={styles.podiumTimeBox}>
                  <Text style={[styles.podiumTime, { color: MEDAL_COLORS[i] }]}>{fmt(r.bestTime)}</Text>
                  <Text style={styles.podiumTimeLabel}>beste tid</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Full list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alle moduser</Text>
          {diffKeys.map((d, i) => {
            const s = stats.byDifficulty[d];
            const untouched = s.played === 0;
            const rankIdx = records.findIndex((r) => r.diff === d);
            return (
              <View
                key={d}
                style={[
                  styles.rowItem,
                  i > 0 && { borderTopWidth: 1, borderTopColor: "#EBE4D5" },
                  untouched && { opacity: 0.45 },
                ]}
              >
                <Text style={styles.rowEmoji}>{DIFF_EMOJI[d]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{DIFF_LABELS[d]}</Text>
                  <Text style={styles.rowSub}>
                    {s.played > 0 ? `${s.won}/${s.played} vunnet` : "Ikke spilt"}
                  </Text>
                </View>
                {rankIdx >= 0 && rankIdx <= 2 && (
                  <Text style={styles.rowMedal}>{MEDAL[rankIdx]}</Text>
                )}
                <View style={styles.rowTimeBox}>
                  <Text style={[
                    styles.rowTime,
                    { color: s.bestTime ? DIFF_COLORS[d] : "#B0A090" },
                  ]}>{fmt(s.bestTime)}</Text>
                  {s.bestTime && <Text style={styles.rowTimeLabel}>beste</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36, gap: 16 },
  header: { gap: 2 },
  heading: { fontSize: 28, fontWeight: "900", color: "#19170F" },
  subHeading: { fontSize: 13, color: "#9C8D7C" },

  emptyCard: {
    backgroundColor: "#FDFAF2", borderRadius: 20, borderWidth: 1.5, borderColor: "#EBE4D5",
    padding: 40, alignItems: "center", gap: 10,
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#19170F" },
  emptyText: { fontSize: 13, color: "#9C8D7C", textAlign: "center", lineHeight: 18 },

  podiumSection: {
    backgroundColor: "#FDFAF2", borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(200,164,74,0.45)",
    overflow: "hidden", paddingTop: 12,
  },
  podiumRowGold: { backgroundColor: "rgba(200,164,74,0.06)" },
  podiumRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  medalEmoji: { fontSize: 28, width: 36, textAlign: "center" },
  podiumName: { fontSize: 14, fontWeight: "800", color: "#19170F" },
  podiumWon: { fontSize: 11, color: "#9C8D7C", marginTop: 2 },
  podiumTimeBox: { alignItems: "flex-end" },
  podiumTime: { fontSize: 22, fontWeight: "900" },
  podiumTimeLabel: { fontSize: 10, color: "#9C8D7C" },

  section: {
    backgroundColor: "#FDFAF2", borderRadius: 16, borderWidth: 1.5,
    borderColor: "#EBE4D5", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#9C8D7C", letterSpacing: 0.3, marginBottom: 8 },

  rowItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  rowEmoji: { fontSize: 20, width: 28, textAlign: "center" },
  rowName: { fontSize: 14, fontWeight: "700", color: "#19170F" },
  rowSub: { fontSize: 11, color: "#9C8D7C", marginTop: 1 },
  rowMedal: { fontSize: 18 },
  rowTimeBox: { alignItems: "flex-end", minWidth: 52 },
  rowTime: { fontSize: 17, fontWeight: "900" },
  rowTimeLabel: { fontSize: 10, color: "#9C8D7C" },
});

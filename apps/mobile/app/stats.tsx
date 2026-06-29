import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useGameStore } from "../store/gameStore";

type Diff = "easy" | "medium" | "hard" | "extreme" | "daily" | "mini";

const DIFF_LABELS: Record<Diff, string> = {
  easy: "Enkel",
  medium: "Middels",
  hard: "Vanskelig",
  extreme: "Ekstrem",
  daily: "Daglig",
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

function fmt(s: number | null): string {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function fmtTotal(s: number): string {
  if (s === 0) return "0m";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}t ${m}m`;
  return `${m}m`;
}

export default function StatsScreen() {
  const stats = useGameStore((s) => s.stats);

  const diffKeys: Diff[] = ["easy", "medium", "hard", "extreme", "daily", "mini"];
  const totalPlayed = diffKeys.reduce((sum, d) => sum + stats.byDifficulty[d].played, 0);
  const totalWon = diffKeys.reduce((sum, d) => sum + stats.byDifficulty[d].won, 0);
  const totalTime = diffKeys.reduce((sum, d) => sum + stats.byDifficulty[d].totalTime, 0);
  const overallWinPct = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Statistikk</Text>
          <Text style={styles.subHeading}>Din spillhistorikk</Text>
        </View>

        {/* Hero summary */}
        <View style={styles.heroCard}>
          <View style={styles.heroMain}>
            <Text style={styles.heroNum}>{totalWon}</Text>
            <Text style={styles.heroLabel}>brett vunnet</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroSide}>
            <View style={styles.heroStat}>
              <Text style={styles.heroSideNum}>{totalPlayed}</Text>
              <Text style={styles.heroSideLabel}>Spilt</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroSideNum, { color: overallWinPct >= 70 ? "#2E7D52" : "#C8A44A" }]}>
                {overallWinPct}%
              </Text>
              <Text style={styles.heroSideLabel}>Vinnrate</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroSideNum}>{fmtTotal(totalTime)}</Text>
              <Text style={styles.heroSideLabel}>Totaltid</Text>
            </View>
          </View>
        </View>

        {/* Streak */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Daglig streak</Text>
          <View style={styles.streakRow}>
            <View style={[styles.streakCard, { borderColor: "rgba(200,164,74,0.4)" }]}>
              <Text style={styles.streakFlame}>🔥</Text>
              <Text style={[styles.streakNum, { color: "#C8A44A" }]}>{stats.currentStreak}</Text>
              <Text style={styles.streakLabel}>Nåværende</Text>
            </View>
            <View style={[styles.streakCard, { borderColor: "rgba(138,106,16,0.25)" }]}>
              <Text style={styles.streakFlame}>🏅</Text>
              <Text style={[styles.streakNum, { color: "#8A6A10" }]}>{stats.bestStreak}</Text>
              <Text style={styles.streakLabel}>Rekord</Text>
            </View>
          </View>
        </View>

        {/* Per-difficulty cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per vanskelighetsgrad</Text>
          {diffKeys.map((d, i) => {
            const s = stats.byDifficulty[d];
            const winPct = s.played > 0 ? Math.round((s.won / s.played) * 100) : 0;
            const color = DIFF_COLORS[d];
            const untouched = s.played === 0;
            return (
              <View key={d} style={[
                styles.diffCard,
                i > 0 && { borderTopWidth: 1, borderTopColor: "#EBE4D5" },
                untouched && { opacity: 0.5 },
              ]}>
                <View style={styles.diffCardLeft}>
                  <Text style={styles.diffEmoji}>{DIFF_EMOJI[d]}</Text>
                  <View>
                    <Text style={styles.diffName}>{DIFF_LABELS[d]}</Text>
                    <Text style={styles.diffSub}>
                      {s.played > 0 ? `${s.won}/${s.played} vunnet · ${fmtTotal(s.totalTime)}` : "Ikke spilt ennå"}
                    </Text>
                  </View>
                </View>
                <View style={styles.diffCardRight}>
                  {s.bestTime ? (
                    <>
                      <Text style={[styles.diffBest, { color }]}>{fmt(s.bestTime)}</Text>
                      <Text style={styles.diffBestLabel}>beste</Text>
                    </>
                  ) : (
                    <Text style={styles.diffBestLabel}>—</Text>
                  )}
                </View>
                {/* Win rate bar */}
                {s.played > 0 && (
                  <View style={styles.winBarOuter}>
                    <View style={[styles.winBarInner, { width: `${winPct}%` as any, backgroundColor: color }]} />
                  </View>
                )}
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

  heroCard: {
    backgroundColor: "#FDFAF2", borderRadius: 20, borderWidth: 1.5, borderColor: "#EBE4D5",
    flexDirection: "row", overflow: "hidden",
  },
  heroMain: {
    flex: 1.1, backgroundColor: "#C8A44A", alignItems: "center", justifyContent: "center",
    paddingVertical: 28,
  },
  heroNum: { fontSize: 52, fontWeight: "900", color: "#fff" },
  heroLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "700", letterSpacing: 0.5 },
  heroDivider: { width: 1.5, backgroundColor: "#EBE4D5" },
  heroSide: { flex: 1, justifyContent: "center", gap: 0 },
  heroStat: {
    flex: 1, alignItems: "center", justifyContent: "center",
    borderBottomWidth: 1, borderBottomColor: "#EBE4D5",
  },
  heroSideNum: { fontSize: 20, fontWeight: "900", color: "#19170F" },
  heroSideLabel: { fontSize: 10, color: "#9C8D7C", marginTop: 1 },

  section: {
    backgroundColor: "#FDFAF2", borderRadius: 16, borderWidth: 1.5,
    borderColor: "#EBE4D5", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, gap: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#9C8D7C", letterSpacing: 0.3, marginBottom: 2 },

  streakRow: { flexDirection: "row", gap: 12, paddingBottom: 10 },
  streakCard: {
    flex: 1, backgroundColor: "#F2EDE3", borderRadius: 14, borderWidth: 1.5,
    padding: 14, alignItems: "center", gap: 2,
  },
  streakFlame: { fontSize: 24 },
  streakNum: { fontSize: 36, fontWeight: "900", lineHeight: 42 },
  streakLabel: { fontSize: 11, color: "#9C8D7C" },

  diffCard: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10, position: "relative" },
  diffCardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  diffEmoji: { fontSize: 20, width: 28, textAlign: "center" },
  diffName: { fontSize: 14, fontWeight: "700", color: "#19170F" },
  diffSub: { fontSize: 11, color: "#9C8D7C", marginTop: 1 },
  diffCardRight: { alignItems: "flex-end", minWidth: 50 },
  diffBest: { fontSize: 17, fontWeight: "900" },
  diffBestLabel: { fontSize: 10, color: "#9C8D7C" },
  winBarOuter: {
    position: "absolute", bottom: 0, left: 38, right: 0, height: 2, backgroundColor: "#EBE4D5", borderRadius: 1,
  },
  winBarInner: { height: 2, borderRadius: 1 },
});

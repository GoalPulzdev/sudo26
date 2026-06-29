import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "../store/gameStore";

const MODES = [
  {
    key: "play/classic",
    title: "Classic Sudoku",
    description: "Velg vanskelighetsgrad og løs 9×9",
    emoji: "🧩",
    color: "#6B4DA4",
    subtitle: "Easy · Medium · Hard · Extreme",
  },
  {
    key: "play/daily",
    title: "Daglig puzzle",
    description: "Nytt brett hver dag — hold streaken oppe!",
    emoji: "📅",
    color: "#1B7FA0",
    subtitle: "Daglig utfordring",
  },
  {
    key: "play/killer",
    title: "Killer Sudoku",
    description: "Regn ut bur-summer og løs mysteriet",
    emoji: "🔪",
    color: "#B91C1C",
    subtitle: "Med summer-bur",
  },
  {
    key: "play/mini",
    title: "Mini 6×6",
    description: "Kompakt brett — perfekt for en rask runde",
    emoji: "🔋",
    color: "#2E7D52",
    subtitle: "6×6 · 1–6",
  },
  {
    key: "play/samurai",
    title: "Samurai Sudoku",
    description: "Fem overlappende brett i ett storslått puslespill",
    emoji: "🥷",
    color: "#C8A44A",
    subtitle: "5 brett koblet",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const stats = useGameStore((s) => s.stats);
  const streak = stats.currentStreak;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>SUDOKU</Text>
        <Text style={styles.logoSub}>2026</Text>
      </View>

      {/* Streak banner */}
      {streak > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakTitle}>{streak} dagers streak!</Text>
            <Text style={styles.streakSub}>Spill daily for å holde den i gang</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>Velg spillmodus</Text>

      {/* Mode cards */}
      {MODES.map((m) => (
        <Pressable
          key={m.key}
          onPress={() => router.push(`/${m.key}` as never)}
          style={({ pressed }) => [styles.card, { borderColor: m.color + "55" }, pressed && { opacity: 0.8 }]}
        >
          <View style={[styles.cardIcon, { backgroundColor: m.color + "22" }]}>
            <Text style={styles.cardEmoji}>{m.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{m.title}</Text>
            <Text style={styles.cardDesc}>{m.description}</Text>
            <Text style={[styles.cardBadge, { color: m.color }]}>{m.subtitle}</Text>
          </View>
          <Text style={[styles.cardArrow, { color: m.color }]}>›</Text>
        </Pressable>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, gap: 10 },
  header: { alignItems: "center", marginBottom: 8 },
  logo: { fontSize: 36, fontWeight: "900", color: "#C8A44A", letterSpacing: 6 },
  logoSub: { fontSize: 14, color: "#9C8D7C", letterSpacing: 4, marginTop: -4 },
  streakBanner: {
    backgroundColor: "rgba(200,130,20,0.08)", borderRadius: 14, borderWidth: 1.5,
    borderColor: "rgba(200,130,20,0.32)", padding: 12, flexDirection: "row", alignItems: "center", gap: 10,
    marginBottom: 4,
  },
  streakEmoji: { fontSize: 28 },
  streakTitle: { fontSize: 14, fontWeight: "800", color: "#B87020" },
  streakSub: { fontSize: 11, color: "#9C7040", marginTop: 1 },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: "#B0A090", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 4 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1.5, borderColor: "#EBE4D5",
    padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardEmoji: { fontSize: 24 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#19170F" },
  cardDesc: { fontSize: 12, color: "#9C8D7C", marginTop: 2 },
  cardBadge: { fontSize: 10, fontWeight: "700", marginTop: 4 },
  cardArrow: { fontSize: 24, fontWeight: "300" },
});


import React, { useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable,
  TextInput, Modal, ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { useGameStore } from "../store/gameStore";
import { ACHIEVEMENT_DEFS } from "../lib/achievements";
import type { Difficulty } from "@sudoku-2026/core";

const PALETTE = [
  "#6B4DA4", "#1B7FA0", "#2E7D52", "#C8A44A",
  "#B91C1C", "#B8720A", "#7A5230", "#8A6A10",
];

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: "Enkel", medium: "Middels", hard: "Vanskelig",
  extreme: "Ekstrem", daily: "Daglig", mini: "Mini 6×6",
};

const DIFF_EMOJI: Record<Difficulty, string> = {
  easy: "🟢", medium: "🟡", hard: "🔴", extreme: "🟣", daily: "📅", mini: "🔷",
};

const DIFF_ACCENTS: Record<Difficulty, string> = {
  easy: "#2E7D52", medium: "#C8A44A", hard: "#B91C1C",
  extreme: "#6B4DA4", daily: "#1B7FA0", mini: "#2E7D52",
};

const ALL_DIFFS: Difficulty[] = ["easy", "medium", "hard", "extreme", "daily", "mini"];

function fmt(s: number | null) {
  if (!s) return "—";
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function Avatar({ username, color, size = 60 }: { username: string | null; color: string; size?: number }) {
  const initial = username ? username[0].toUpperCase() : "?";
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, updateProfile, isLoading } = useAuthStore();
  const { stats, earnedAchievements } = useGameStore();
  const [showModal, setShowModal] = useState(false);
  const [editName, setEditName] = useState(profile?.username ?? "");
  const [editColor, setEditColor] = useState(profile?.color ?? PALETTE[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentColor = profile?.color ?? PALETTE[0];

  const totalWon = ALL_DIFFS.reduce((s, d) => s + stats.byDifficulty[d].won, 0);
  const totalPlayed = ALL_DIFFS.reduce((s, d) => s + stats.byDifficulty[d].played, 0);

  const handleSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed.length < 2) { setError("Minimum 2 tegn"); return; }
    if (trimmed.length > 20) { setError("Maks 20 tegn"); return; }
    setSaving(true);
    setError(null);
    try {
      await updateProfile(trimmed, editColor);
      setShowModal(false);
    } catch {
      setError("Noe gikk galt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Hero profile banner */}
        <View style={[styles.heroBanner, { borderColor: currentColor + "55" }]}>
          <View style={[styles.heroBannerBg, { backgroundColor: currentColor + "18" }]} />
          <View style={styles.heroInner}>
            <Avatar username={profile?.username ?? null} color={currentColor} size={80} />
            <View style={styles.heroText}>
              {isLoading ? (
                <ActivityIndicator color="#C8A44A" />
              ) : profile?.username ? (
                <>
                  <Text style={styles.heroName}>{profile.username}</Text>
                  <Text style={styles.heroSub}>Sudoku-spiller</Text>
                </>
              ) : (
                <Text style={styles.heroNoName}>Ingen profil opprettet</Text>
              )}
              <View style={styles.heroBadgeRow}>
                {stats.currentStreak > 0 && (
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>🔥 {stats.currentStreak} dager</Text>
                  </View>
                )}
                {earnedAchievements.length > 0 && (
                  <View style={[styles.heroBadge, { backgroundColor: "rgba(200,164,74,0.15)", borderColor: "rgba(200,164,74,0.4)" }]}>
                    <Text style={[styles.heroBadgeText, { color: "#8A6A10" }]}>🏅 {earnedAchievements.length} achievements</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          {/* Quick stats strip */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{totalWon}</Text>
              <Text style={styles.heroStatLabel}>Vunnet</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{totalPlayed}</Text>
              <Text style={styles.heroStatLabel}>Spilt</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{stats.bestStreak}</Text>
              <Text style={styles.heroStatLabel}>Beste rekke</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              setEditName(profile?.username ?? "");
              setEditColor(profile?.color ?? PALETTE[0]);
              setError(null);
              setShowModal(true);
            }}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnText}>✏️  Rediger profil</Text>
          </Pressable>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>{earnedAchievements.length}/{ACHIEVEMENT_DEFS.length}</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={styles.achProgressBar}>
            <View style={[
              styles.achProgressFill,
              { width: `${Math.round((earnedAchievements.length / ACHIEVEMENT_DEFS.length) * 100)}%` as any },
            ]} />
          </View>
          <View style={styles.achievementGrid}>
            {ACHIEVEMENT_DEFS.map((a) => {
              const earned = earnedAchievements.includes(a.key);
              return (
                <View key={a.key} style={[styles.achievementCard, earned && styles.achievementEarned]}>
                  <Text style={[styles.achievementEmoji, !earned && { opacity: 0.2 }]}>{a.emoji}</Text>
                  <Text style={[styles.achievementName, !earned && { color: "#B0A090" }]}>{a.name}</Text>
                  <Text style={[styles.achievementDesc, !earned && { color: "#C8C0B0" }]}>{a.desc}</Text>
                  {earned && <View style={styles.earnedDot} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats per mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modus-oversikt</Text>
          {ALL_DIFFS.map((d, i) => {
            const s = stats.byDifficulty[d];
            const pct = s.played > 0 ? Math.round((s.won / s.played) * 100) : 0;
            const color = DIFF_ACCENTS[d];
            return (
              <View key={d} style={[
                styles.modeRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: "#EBE4D5" },
                s.played === 0 && { opacity: 0.45 },
              ]}>
                <Text style={styles.modeEmoji}>{DIFF_EMOJI[d]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeName}>{DIFF_LABELS[d]}</Text>
                  {s.played > 0 && (
                    <View style={styles.modeBarOuter}>
                      <View style={[styles.modeBarInner, { width: `${pct}%` as any, backgroundColor: color }]} />
                    </View>
                  )}
                </View>
                <View style={styles.modeRight}>
                  {s.bestTime ? (
                    <Text style={[styles.modeBest, { color }]}>{fmt(s.bestTime)}</Text>
                  ) : (
                    <Text style={styles.modeEmpty}>—</Text>
                  )}
                  <Text style={styles.modeWon}>{s.won} vunnet</Text>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rediger profil</Text>

            <Avatar username={editName || null} color={editColor} size={72} />

            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Brukernavn (2-20 tegn)"
              placeholderTextColor="#B0A090"
              maxLength={20}
              autoCapitalize="none"
            />

            <Text style={styles.paletteLabel}>Velg farge</Text>
            <View style={styles.paletteRow}>
              {PALETTE.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setEditColor(c)}
                  style={[styles.paletteDot, { backgroundColor: c }, editColor === c && styles.paletteDotSelected]}
                />
              ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalBtns}>
              <Pressable onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Avbryt</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Lagre</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36, gap: 16 },

  // Hero banner
  heroBanner: {
    borderRadius: 20, borderWidth: 1.5, borderColor: "#EBE4D5",
    overflow: "hidden", backgroundColor: "#FDFAF2",
  },
  heroBannerBg: {
    position: "absolute", top: 0, left: 0, right: 0, height: 70,
  },
  heroInner: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
  },
  heroText: { flex: 1, paddingTop: 4, gap: 4 },
  heroName: { fontSize: 22, fontWeight: "900", color: "#19170F" },
  heroNoName: { fontSize: 14, color: "#9C8D7C" },
  heroSub: { fontSize: 12, color: "#9C8D7C" },
  heroBadgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
  heroBadge: {
    backgroundColor: "rgba(185,28,28,0.08)", borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(185,28,28,0.25)", paddingHorizontal: 8, paddingVertical: 3,
  },
  heroBadgeText: { fontSize: 11, fontWeight: "700", color: "#B91C1C" },
  heroStats: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: "#EBE4D5",
    marginHorizontal: 0,
  },
  heroStat: { flex: 1, alignItems: "center", paddingVertical: 12 },
  heroStatNum: { fontSize: 20, fontWeight: "900", color: "#19170F" },
  heroStatLabel: { fontSize: 10, color: "#9C8D7C", marginTop: 1 },
  heroStatDivider: { width: 1, backgroundColor: "#EBE4D5" },
  editBtn: {
    marginHorizontal: 16, marginBottom: 14, paddingVertical: 11, borderRadius: 12,
    backgroundColor: "rgba(200,164,74,0.10)", borderWidth: 1.5, borderColor: "rgba(200,164,74,0.4)",
    alignItems: "center",
  },
  editBtnText: { fontSize: 13, fontWeight: "800", color: "#8A6A10" },

  // Section
  section: {
    backgroundColor: "#FDFAF2", borderRadius: 16, borderWidth: 1.5,
    borderColor: "#EBE4D5", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, gap: 10,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#9C8D7C", letterSpacing: 0.3, flex: 1 },
  progressPill: {
    backgroundColor: "rgba(200,164,74,0.15)", borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(200,164,74,0.35)", paddingHorizontal: 8, paddingVertical: 2,
  },
  progressPillText: { fontSize: 11, fontWeight: "800", color: "#8A6A10" },
  achProgressBar: {
    height: 4, backgroundColor: "#EBE4D5", borderRadius: 2, marginBottom: 4,
  },
  achProgressFill: { height: 4, backgroundColor: "#C8A44A", borderRadius: 2 },

  // Achievement grid
  achievementGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  achievementCard: {
    width: "47%", backgroundColor: "#F2EDE3", borderRadius: 12, borderWidth: 1.5,
    borderColor: "#EBE4D5", padding: 10, gap: 3, position: "relative",
  },
  achievementEarned: {
    backgroundColor: "#FDFAF2", borderColor: "#C8A44A",
  },
  achievementEmoji: { fontSize: 24 },
  achievementName: { fontSize: 12, fontWeight: "800", color: "#19170F" },
  achievementDesc: { fontSize: 10, color: "#9C8D7C", lineHeight: 14 },
  earnedDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#C8A44A",
  },

  // Mode rows
  modeRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  modeEmoji: { fontSize: 18, width: 26, textAlign: "center" },
  modeName: { fontSize: 13, fontWeight: "700", color: "#19170F", marginBottom: 4 },
  modeBarOuter: { height: 3, backgroundColor: "#EBE4D5", borderRadius: 2, overflow: "hidden" },
  modeBarInner: { height: 3, borderRadius: 2 },
  modeRight: { alignItems: "flex-end", minWidth: 52 },
  modeBest: { fontSize: 16, fontWeight: "900" },
  modeEmpty: { fontSize: 16, fontWeight: "900", color: "#B0A090" },
  modeWon: { fontSize: 10, color: "#9C8D7C", marginTop: 1 },

  // Avatar
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "900" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: {
    backgroundColor: "#FDFAF2", borderRadius: 24, borderWidth: 1.5, borderColor: "#EBE4D5",
    padding: 24, width: "100%", alignItems: "center", gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#19170F" },
  input: {
    width: "100%", backgroundColor: "#F2EDE3", borderRadius: 10, borderWidth: 1.5,
    borderColor: "#DED8CA", paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: "#19170F",
  },
  paletteLabel: { fontSize: 12, color: "#9C8D7C", alignSelf: "flex-start" },
  paletteRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  paletteDot: { width: 34, height: 34, borderRadius: 17 },
  paletteDotSelected: { borderWidth: 3, borderColor: "#19170F" },
  errorText: { fontSize: 13, color: "#B91C1C" },
  modalBtns: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#F2EDE3", alignItems: "center" },
  cancelText: { color: "#9C8D7C", fontWeight: "700" },
  saveBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#C8A44A", alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "800" },
});

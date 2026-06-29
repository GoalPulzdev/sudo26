import React, { useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable, Share, Animated,
} from "react-native";

interface WinModalProps {
  visible: boolean;
  title: string;
  emoji: string;
  elapsed: number;
  mistakes: number;
  hintsUsed: number;
  onPlayAgain: () => void;
  onClose?: () => void;
  streak?: number;
}

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function grade(mistakes: number, elapsed: number): { label: string; color: string } {
  if (mistakes === 0 && elapsed < 120) return { label: "S", color: "#C8A44A" };
  if (mistakes === 0) return { label: "A", color: "#2E7D52" };
  if (mistakes <= 2) return { label: "B", color: "#1B7FA0" };
  if (mistakes <= 4) return { label: "C", color: "#6B4DA4" };
  return { label: "D", color: "#B91C1C" };
}

export default function WinModal({
  visible, title, emoji, elapsed, mistakes, hintsUsed, onPlayAgain, onClose, streak,
}: WinModalProps) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.7);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  const { label: g, color: gc } = grade(mistakes, elapsed);

  const handleShare = async () => {
    const mistakeStr = mistakes === 0 ? "uten feil" : `${mistakes} feil`;
    const msg = `${emoji} Løste ${title} på ${fmt(elapsed)} (${mistakeStr})! Prøv Sudoku 2026 🧩`;
    await Share.share({ message: msg });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <Text style={styles.celebEmoji}>{emoji}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.subtitle}>Gratulerer!</Text>

          {/* Grade badge */}
          <View style={[styles.gradeBadge, { backgroundColor: gc + "22", borderColor: gc }]}>
            <Text style={[styles.gradeText, { color: gc }]}>{g}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{fmt(elapsed)}</Text>
              <Text style={styles.statLabel}>Tid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: mistakes === 0 ? "#2E7D52" : "#B91C1C" }]}>{mistakes}</Text>
              <Text style={styles.statLabel}>Feil</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{hintsUsed}</Text>
              <Text style={styles.statLabel}>Hint</Text>
            </View>
          </View>

          {streak !== undefined && streak > 0 && (
            <View style={styles.streakBanner}>
              <Text style={styles.streakText}>🔥 {streak} dagers streak!</Text>
            </View>
          )}

          <View style={styles.buttons}>
            <Pressable onPress={handleShare} style={styles.shareBtn}>
              <Text style={styles.shareBtnText}>Del resultat</Text>
            </Pressable>
            <Pressable onPress={onPlayAgain} style={styles.playAgainBtn}>
              <Text style={styles.playAgainBtnText}>Spill igjen</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(25,23,15,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FDFAF2",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#EBE4D5",
    padding: 28,
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  celebEmoji: { fontSize: 52 },
  cardTitle: { fontSize: 20, fontWeight: "900", color: "#19170F" },
  subtitle: { fontSize: 14, color: "#9C8D7C", marginTop: -8 },
  gradeBadge: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  gradeText: { fontSize: 28, fontWeight: "900" },
  statsRow: {
    flexDirection: "row", backgroundColor: "#F2EDE3",
    borderRadius: 14, padding: 14, gap: 0, width: "100%",
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statNum: { fontSize: 20, fontWeight: "900", color: "#19170F" },
  statLabel: { fontSize: 11, color: "#9C8D7C" },
  statDivider: { width: 1, backgroundColor: "#DED8CA" },
  streakBanner: {
    backgroundColor: "rgba(200,130,20,0.08)", borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(200,130,20,0.3)",
    paddingHorizontal: 14, paddingVertical: 8,
  },
  streakText: { fontSize: 13, fontWeight: "700", color: "#B87020" },
  buttons: { flexDirection: "row", gap: 10, width: "100%" },
  shareBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#F2EDE3", borderWidth: 1.5, borderColor: "#DED8CA",
    alignItems: "center",
  },
  shareBtnText: { fontSize: 13, fontWeight: "700", color: "#9C8D7C" },
  playAgainBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#C8A44A", alignItems: "center",
  },
  playAgainBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});

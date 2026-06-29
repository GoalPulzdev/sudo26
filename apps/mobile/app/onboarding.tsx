import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Dimensions,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export const ONBOARDING_KEY = "sudoku-onboarded";

const { width: SCREEN_W } = Dimensions.get("window");

const PAGES = [
  {
    emoji: "🧩",
    title: "Velkommen til Sudoku 2026",
    body: "Fyll brettet med tall 1–9 slik at hvert tall forekommer nøyaktig én gang i hver rad, kolonne og 3×3-boks.",
  },
  {
    emoji: "🎯",
    title: "Klassisk Sudoku",
    body: "Velg mellom Enkel, Middels, Vanskelig og Ekstrem. Bruk hint og notatmodus når du sitter fast.",
  },
  {
    emoji: "🔗",
    title: "Mini & Samurai",
    body: "Mini bruker et 6×6-brett — perfekt for en rask runde. Samurai setter sammen fem overlappende brett til én kjempeutfordring.",
  },
  {
    emoji: "🔪",
    title: "Killer Sudoku",
    body: "Summene i hvert bur gir ekstra ledetråder – men vær forsiktig, hvert tall kan bare brukes én gang per bur!",
  },
  {
    emoji: "📅",
    title: "Daglig & Rekorder",
    body: "Løs det daglige puslespillet for å holde din rekke i gang. Sjekk statistikk og rekordlisten for å se hvor god du er!",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const goTo = (p: number) => {
    scrollRef.current?.scrollTo({ x: p * SCREEN_W, animated: true });
    setPage(p);
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    router.replace("/");
  };

  const handleScroll = (e: any) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (p !== page) setPage(p);
  };

  const last = page === PAGES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
      >
        {PAGES.map((p, i) => (
          <View key={i} style={styles.page}>
            <Text style={styles.pageEmoji}>{p.emoji}</Text>
            <Text style={styles.pageTitle}>{p.title}</Text>
            <Text style={styles.pageBody}>{p.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <Pressable key={i} onPress={() => goTo(i)}>
            <View style={[styles.dot, i === page && styles.dotActive]} />
          </Pressable>
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        {!last && (
          <Pressable style={styles.skipBtn} onPress={finish}>
            <Text style={styles.skipText}>Hopp over</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.nextBtn, last && { flex: 1 }]}
          onPress={last ? finish : () => goTo(page + 1)}
        >
          <Text style={styles.nextText}>{last ? "Begynn å spille!" : "Neste"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  pager: { flex: 1 },
  page: {
    width: SCREEN_W,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 18,
  },
  pageEmoji: { fontSize: 80 },
  pageTitle: { fontSize: 24, fontWeight: "900", color: "#19170F", textAlign: "center" },
  pageBody: { fontSize: 15, color: "#6B5C4A", lineHeight: 22, textAlign: "center" },
  dots: { flexDirection: "row", gap: 8, justifyContent: "center", paddingBottom: 18 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#DED8CA",
  },
  dotActive: { backgroundColor: "#C8A44A", width: 22, borderRadius: 4 },
  btnRow: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 24, paddingBottom: 24,
  },
  skipBtn: {
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14,
    backgroundColor: "#EBE4D5", alignItems: "center", justifyContent: "center",
  },
  skipText: { fontSize: 14, fontWeight: "700", color: "#9C8D7C" },
  nextBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: "#C8A44A", alignItems: "center",
  },
  nextText: { fontSize: 15, fontWeight: "900", color: "#fff" },
});

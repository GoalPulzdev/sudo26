import React, { useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "sudoku-settings";

interface Settings {
  haptics: boolean;
  highlightPeers: boolean;
  highlightSameValue: boolean;
  autoRemoveNotes: boolean;
  showMistakes: boolean;
}

const DEFAULTS: Settings = {
  haptics: true,
  highlightPeers: true,
  highlightSameValue: true,
  autoRemoveNotes: true,
  showMistakes: true,
};

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(s: Settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function Row({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#DED8CA", true: "#C8A44A" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    loadSettings().then((s) => { setSettings(s); setLoaded(true); });
  }, []);

  const update = (key: keyof Settings, val: boolean) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
  };

  if (!loaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Innstillinger</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spill</Text>
          <Row
            label="Marker peers"
            description="Merk celler i samme rad, kolonne og boks"
            value={settings.highlightPeers}
            onToggle={(v) => update("highlightPeers", v)}
          />
          <View style={styles.divider} />
          <Row
            label="Marker like tall"
            description="Merk alle celler med samme tall"
            value={settings.highlightSameValue}
            onToggle={(v) => update("highlightSameValue", v)}
          />
          <View style={styles.divider} />
          <Row
            label="Fjern notater automatisk"
            description="Slett notatene som ikke lenger er mulige"
            value={settings.autoRemoveNotes}
            onToggle={(v) => update("autoRemoveNotes", v)}
          />
          <View style={styles.divider} />
          <Row
            label="Vis feil"
            description="Vis røde celler ved feil tall"
            value={settings.showMistakes}
            onToggle={(v) => update("showMistakes", v)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lyd & Haptikk</Text>
          <Row
            label="Haptisk tilbakemelding"
            description="Vibrasjon ved input og feil"
            value={settings.haptics}
            onToggle={(v) => update("haptics", v)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Om appen</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versjon</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2EDE3" },
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, gap: 16 },
  heading: { fontSize: 26, fontWeight: "900", color: "#19170F" },
  section: {
    backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1.5,
    borderColor: "#EBE4D5", paddingHorizontal: 14, paddingVertical: 4,
  },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: "#B0A090", textTransform: "uppercase", letterSpacing: 1.5, paddingVertical: 10 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: "#19170F" },
  rowDesc: { fontSize: 11, color: "#9C8D7C", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F2EDE3" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  infoLabel: { fontSize: 14, color: "#19170F" },
  infoValue: { fontSize: 14, color: "#9C8D7C" },
});

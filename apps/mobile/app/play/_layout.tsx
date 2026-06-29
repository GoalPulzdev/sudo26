import { Stack } from "expo-router";

export default function PlayLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#F2EDE3" },
        headerTintColor: "#19170F",
        headerTitleStyle: { fontWeight: "800", color: "#8A6A10" },
        headerBackTitle: "Hjem",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#F2EDE3" },
      }}
    >
      <Stack.Screen name="classic" options={{ title: "Classic Sudoku" }} />
      <Stack.Screen name="daily" options={{ title: "Daglig utfordring" }} />
      <Stack.Screen name="killer" options={{ title: "Killer Sudoku" }} />
      <Stack.Screen name="mini" options={{ title: "Mini 6×6" }} />
      <Stack.Screen name="samurai" options={{ title: "Samurai Sudoku" }} />
    </Stack>
  );
}

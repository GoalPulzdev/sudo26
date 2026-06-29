import React from "react";
import { Tabs, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/authStore";
import { ONBOARDING_KEY } from "./onboarding";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function RootLayout() {
  const router = useRouter();
  // Initialize auth on first render
  const init = useAuthStore((s) => s.init);
  React.useEffect(() => {
    init();
    AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
      if (!done) router.replace("/onboarding");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#F2EDE3" },
          headerTintColor: "#19170F",
          headerTitleStyle: { fontWeight: "800" },
          tabBarStyle: { backgroundColor: "#FAF8F2", borderTopColor: "#EBE4D5" },
          tabBarActiveTintColor: "#8A6A10",
          tabBarInactiveTintColor: "#B0A090",
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hjem",
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Statistikk",
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: "Rekorder",
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Innstillinger",
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
          }}
        />
        {/* Hide play screens from tabs — they're navigated to from Home */}
        <Tabs.Screen name="play" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="play/classic" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="play/daily" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="play/killer" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="play/mini" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="play/samurai" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="onboarding" options={{ href: null, headerShown: false }} />
      </Tabs>
    </>
  );
}


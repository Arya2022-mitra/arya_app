import { Stack } from "expo-router";
import { colors } from "../constants/theme";
import HamburgerButton from "./components/nav/HamburgerButton";
import DrawerSidebar from "./components/nav/DrawerSidebar";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n.config";

export default function RootLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors["neo-dark"],
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => <HamburgerButton onPress={toggleSidebar} />,
        }}>
        <Stack.Screen name="index" options={{ title: "Home" }} />
        <Stack.Screen name="auth" options={{ title: "Auth" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen name="chat" options={{ title: "Chat" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="business" options={{ title: "Business" }} />
        <Stack.Screen name="career" options={{ title: "Career" }} />
        <Stack.Screen name="daily-alerts" options={{ title: "Daily Alerts" }} />
        <Stack.Screen
          name="daily-panchang"
          options={{ title: "Daily Panchang" }}
        />
        <Stack.Screen name="daily-prediction" options={{ title: "Daily Prediction" }} />
        <Stack.Screen name="education" options={{ title: "Education" }} />
        <Stack.Screen name="spirituality" options={{ title: "Spirituality" }} />
      </Stack>
      <DrawerSidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
    </I18nextProvider>
  );
}

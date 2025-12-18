import { Stack } from "expo-router";
import { colors } from "../constants/theme";
import "./i18n";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors["neo-dark"],
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="auth" options={{ title: "Auth" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="chat" options={{ title: "Chat" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}

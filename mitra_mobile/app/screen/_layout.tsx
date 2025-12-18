import { Stack } from "expo-router";
import { colors } from "../styles/theme";

export default function ScreenLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors["neo-dark"] },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "bold" },
      }}>
      {/* In the nested layout the child "auth" is resolved relative to app/screen/auth.tsx */}
      <Stack.Screen name="auth" options={{ title: "Auth" }} />
      {/* Add other screen/* entries here if you need to explicitly declare them */}
    </Stack>
  );
}

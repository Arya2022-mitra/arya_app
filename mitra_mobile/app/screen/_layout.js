"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ScreenLayout;
var expo_router_1 = require("expo-router");
var theme_1 = require("../../constants/theme");
function ScreenLayout() {
    return (<expo_router_1.Stack screenOptions={{
            headerStyle: { backgroundColor: theme_1.colors["neo-dark"] },
            headerTintColor: theme_1.colors.text,
            headerTitleStyle: { fontWeight: "bold" },
        }}>
      {/* In the nested layout the child "auth" is resolved relative to app/screen/auth.tsx */}
      <expo_router_1.Stack.Screen name="auth" options={{ title: "Auth" }}/>
      {/* Add other screen/* entries here if you need to explicitly declare them */}
    </expo_router_1.Stack>);
}

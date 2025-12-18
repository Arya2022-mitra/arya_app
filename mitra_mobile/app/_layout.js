"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootLayout;
var expo_router_1 = require("expo-router");
var theme_1 = require("../constants/theme");
require("./i18n");
var HamburgerButton_1 = __importDefault(require("./components/nav/HamburgerButton"));
var DrawerSidebar_1 = __importDefault(require("./components/nav/DrawerSidebar"));
var react_1 = require("react");
function RootLayout() {
    var _a = (0, react_1.useState)(false), isSidebarOpen = _a[0], setSidebarOpen = _a[1];
    var toggleSidebar = function () {
        setSidebarOpen(!isSidebarOpen);
    };
    return (<>
      <expo_router_1.Stack screenOptions={{
            headerStyle: {
                backgroundColor: theme_1.colors["neo-dark"],
            },
            headerTintColor: theme_1.colors.text,
            headerTitleStyle: {
                fontWeight: "bold",
            },
            headerLeft: function () { return <HamburgerButton_1.default onPress={toggleSidebar}/>; },
        }}>
        <expo_router_1.Stack.Screen name="index" options={{ title: "Home" }}/>
        <expo_router_1.Stack.Screen name="auth" options={{ title: "Auth" }}/>
        <expo_router_1.Stack.Screen name="profile" options={{ title: "Profile" }}/>
        <expo_router_1.Stack.Screen name="chat" options={{ title: "Chat" }}/>
        <expo_router_1.Stack.Screen name="settings" options={{ title: "Settings" }}/>
        <expo_router_1.Stack.Screen name="business" options={{ title: "Business" }}/>
        <expo_router_1.Stack.Screen name="career" options={{ title: "Career" }}/>
        <expo_router_1.Stack.Screen name="daily-alerts" options={{ title: "Daily Alerts" }}/>
        <expo_router_1.Stack.Screen name="daily-panchang" options={{ title: "Daily Panchang" }}/>
        <expo_router_1.Stack.Screen name="education" options={{ title: "Education" }}/>
        <expo_router_1.Stack.Screen name="spirituality" options={{ title: "Spirituality" }}/>
      </expo_router_1.Stack>
      <DrawerSidebar_1.default isOpen={isSidebarOpen} onClose={toggleSidebar}/>
    </>);
}

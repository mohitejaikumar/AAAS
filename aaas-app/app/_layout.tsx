import React, { useEffect } from "react";
import { Stack, Tabs, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, View, useWindowDimensions, Platform } from "react-native";

import { WalletProvider, useWallet } from "./contexts/WalletContext";
import Ionicons from "@expo/vector-icons/Ionicons";

const AppTabs = () => {
  const { isConnected } = useWallet();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  console.log("Wallet connection state:", isConnected); // Debug line
  console.log(
    "Is mobile:",
    isMobile,
    "Width:",
    width,
    "Platform:",
    Platform.OS
  ); // Debug platform info

  useEffect(() => {
    console.log("App tabs rendered, create tab should be visible");
  }, []);

  // If wallet is not connected, don't render tabs
  if (!isConnected) {
    return <Slot />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          height: 60,
          paddingBottom: 10,
          display: "flex", // Ensure tab bar is always displayed
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          display: "flex", // Ensure labels are always displayed
        },
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTitleStyle: {
          fontWeight: "600",
          color: "#1f2937",
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="(tabs)/challenges"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
          title: "Challenges",
        }}
      />
      <Tabs.Screen
        name="(tabs)/create"
        options={{
          tabBarIcon: ({ color, size }) => {
            return <Ionicons name="add-circle" size={size} color={color} />;
          },
          title: "Create",
        }}
      />
      <Tabs.Screen
        name="(tabs)/profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="(tabs)/voting"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle" size={size} color={color} />
          ),
          title: "Voting",
        }}
      />

      <Tabs.Screen
        name="(stack)"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <StatusBar style="auto" />
        <AppTabs />
      </WalletProvider>
    </SafeAreaProvider>
  );
}

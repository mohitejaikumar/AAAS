import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router/stack";
import { WalletProvider } from "./contexts/WalletContext";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(stack)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </WalletProvider>
    </SafeAreaProvider>
  );
}

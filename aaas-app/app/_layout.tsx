import React from 'react';
import { Stack, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// This serves as a placeholder for the actual wallet provider implementation
// that will be created later
const WalletContextProvider = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flex: 1 }}>{children}</View>
);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WalletContextProvider>
        <StatusBar style="auto" />
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#6366f1',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#f3f4f6',
              height: 60,
              paddingBottom: 10,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTitleStyle: {
              fontWeight: '600',
              color: '#1f2937',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="challenges"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="trophy-outline" size={size} color={color} />
              ),
              title: 'Challenges',
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
              title: 'Profile',
            }}
          />
          <Tabs.Screen
            name="voting"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="checkmark-circle-outline" size={size} color={color} />
              ),
              title: 'Voting',
            }}
          />
          <Tabs.Screen
            name="create-challenge"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="add-circle-outline" size={size} color={color} />
              ),
              title: 'Create',
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
      </WalletContextProvider>
    </SafeAreaProvider>
  );
}

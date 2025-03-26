import React from 'react';
import { Stack } from 'expo-router';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#1f2937',
        },
        headerTintColor: '#6366f1',
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: '#f9fafb',
        },
      }}
    >
      <Stack.Screen
        name="challenge-details/[id]"
        options={{ 
          title: 'Challenge Details',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="join-challenge/[id]"
        options={{ 
          title: 'Join Challenge',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="voting-challenge/[id]"
        options={{ 
          title: 'Vote',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
} 
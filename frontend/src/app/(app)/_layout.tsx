import React from 'react';
import { Stack } from 'expo-router';
import Protected from '../../components/Protected';

export default function AppLayout() {
  return (
    <Protected>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="library/index" />
        <Stack.Screen name="library/[id]" />
        <Stack.Screen name="setlists/index" />
        <Stack.Screen name="setlists/[id]" />
        <Stack.Screen name="team" />
        <Stack.Screen name="billing" />
        <Stack.Screen name="pricing" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="onboard" />
      </Stack>
    </Protected>
  );
}

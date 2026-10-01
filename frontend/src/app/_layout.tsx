import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Auth0Provider, useAuth0 } from 'react-native-auth0';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE } from '../config';
import { setTokenProvider } from '../utils/api';
import '../global.css';

function AuthTokenProviderSetup() {
  const { getCredentials } = useAuth0();

  useEffect(() => {
    setTokenProvider(async () => {
      try {
        const creds = await getCredentials(undefined, undefined, { audience: AUTH0_AUDIENCE });
        return creds?.accessToken || null;
      } catch {
        return null;
      }
    });
  }, [getCredentials]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {React.createElement(
        Auth0Provider as any,
        {
          domain: AUTH0_DOMAIN,
          clientId: AUTH0_CLIENT_ID,
          audience: AUTH0_AUDIENCE,
          useDPoP: false,
        },
        <AuthTokenProviderSetup />,
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="share/[id]" />
          <Stack.Screen name="privacy-policy" />
          <Stack.Screen name="terms-and-conditions" />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}

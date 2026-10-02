import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Auth0Provider, useAuth0 } from 'react-native-auth0';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
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
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {React.createElement(
        Auth0Provider as any,
        {
          domain: AUTH0_DOMAIN,
          clientId: AUTH0_CLIENT_ID,
          audience: AUTH0_AUDIENCE,
          useDPoP: false,
          cacheLocation: 'localstorage',
          useRefreshTokens: true,
        },
        <AuthTokenProviderSetup />,
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colorScheme === 'dark' ? '#030712' : '#F9FAFB',
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="share/[id]" />
          <Stack.Screen name="privacy-policy" />
          <Stack.Screen name="terms-and-conditions" />
        </Stack>
      )}
      <Toast />
    </SafeAreaProvider>
  );
}

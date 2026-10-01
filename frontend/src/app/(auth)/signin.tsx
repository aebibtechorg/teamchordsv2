import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { useProfileStore } from '../../store/useProfileStore';
import { getProfile } from '../../utils/common';
import { router } from 'expo-router';
import MainLogo from '../../components/MainLogo';
import { AUTH0_AUDIENCE } from '../../config';

export default function Signin() {
  const { authorize, user, isLoading, clearSession } = useAuth0();
  const { setUserProfile, clearUserProfile } = useProfileStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (user) {
      const syncProfile = async () => {
        try {
          const id = user.sub;
          const d = await getProfile(id);
          if (d) {
            setUserProfile(d);
            const hasOrg = d.organizations && d.organizations.length > 0;
            router.replace(hasOrg ? '/(app)/library' : ('/(app)/onboard' as any));
          } else {
            clearUserProfile();
            router.replace('/(app)/onboard' as any);
          }
        } catch (err: any) {
          if (err.message === 'Unauthorized') {
            console.warn('API returned 401 in signin sync. Clearing session.');
            clearUserProfile();
            await clearSession();
          }
        }
      };
      syncProfile();
    }
  }, [user]);

  const handleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      await authorize({ audience: AUTH0_AUDIENCE });
    } catch (e) {
      console.error('Login error', e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-700 items-center justify-center p-6">
      <View className="w-full max-w-sm bg-white rounded-2xl p-8 items-center shadow-xl">
        <MainLogo size={72} />
        <Text className="text-2xl font-bold text-gray-900 mt-4">Welcome to Team Chords</Text>
        <Text className="text-sm text-gray-500 mt-1 text-center mb-6">
          Sign in to access your shared band chord sheets and set lists.
        </Text>

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={isLoading || isLoggingIn}
          className="w-full bg-blue-600 py-3.5 rounded-xl items-center active:bg-blue-700"
        >
          {isLoading || isLoggingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Sign In with Auth0</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup' as any)}
          className="mt-4 py-2"
        >
          <Text className="text-sm text-gray-600">
            Don't have an account? <Text className="text-blue-600 font-semibold">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

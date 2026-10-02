import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { router } from 'expo-router';
import Spinner from '../components/Spinner';

export default function Index() {
  const { user, isLoading } = useAuth0();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(app)/library' as any);
      } else {
        router.replace('/(auth)/signin' as any);
      }
    }
  }, [user, isLoading]);

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Spinner />
    </View>
  );
}

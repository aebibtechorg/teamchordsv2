import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Spinner from '../../components/Spinner';
import { apiFetch } from '../../utils/api';

export default function AcceptInvitePage() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const [status, setStatus] = useState('Processing invite...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!inviteId) return;

    let isMounted = true;

    const handleInvite = async () => {
      try {
        const res = await apiFetch(`/api/invites/${inviteId}/accept`);

        if (res.status === 401) {
          // User is not signed in yet. Store invite ID for automatic acceptance after sign-in.
          await AsyncStorage.setItem('pending_invite_id', inviteId);
          if (!isMounted) return;
          setStatus('Please sign in or create an account to join the team...');
          setTimeout(() => {
            if (isMounted) {
              router.replace('/(auth)/signin' as any);
            }
          }, 800);
          return;
        }

        const result = await res.json().catch(() => ({}));

        if (!isMounted) return;

        if (!res.ok) {
          setIsError(true);
          setStatus(result.message || 'Failed to accept invite.');
          return;
        }

        setStatus('Invite accepted! Redirecting to your team...');
        setTimeout(() => {
          if (isMounted) {
            router.replace('/(app)/team' as any);
          }
        }, 500);
      } catch (error: any) {
        if (!isMounted) return;
        setIsError(true);
        setStatus(`Failed to accept invite: ${error.message || 'An error occurred.'}`);
      }
    };

    handleInvite();

    return () => {
      isMounted = false;
    };
  }, [inviteId]);

  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      {!isError ? (
        <View className="items-center">
          <Spinner />
          <Text className="mt-4 text-base text-muted-foreground text-center">{status}</Text>
        </View>
      ) : (
        <View className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 items-center shadow-lg">
          <Text className="text-xl font-bold text-foreground mb-2">Invitation Status</Text>
          <Text className="text-sm text-destructive text-center mb-6">{status}</Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/signin' as any)}
            className="w-full bg-primary py-3 rounded-xl items-center active:opacity-90"
          >
            <Text className="text-primary-foreground font-semibold text-sm">Return to Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

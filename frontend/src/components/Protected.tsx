import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { useProfileStore } from '../store/useProfileStore';
import { getProfile } from '../utils/common';
import SidebarLayout from './SidebarLayout';
import Spinner from './Spinner';
import { router, usePathname } from 'expo-router';

interface ProtectedProps {
  children: React.ReactNode;
}

export default function Protected({ children }: ProtectedProps) {
  const { user, getCredentials, clearSession } = useAuth0();
  const { setUserProfile, clearUserProfile, loadInitialProfile, profile } = useProfileStore();
  const [isSyncing, setIsSyncing] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let isCancelled = false;

    const sync = async () => {
      await loadInitialProfile();

      if (!user) {
        // Not authenticated
        if (!isCancelled) {
          setIsSyncing(false);
          router.replace('/(auth)/signin' as any);
        }
        return;
      }

      try {
        const p = await getProfile(user.sub);
        if (!isCancelled) {
          if (p) {
            setUserProfile(p);
            
            // Check if user lacks an organization and route them to onboarding if needed
            const hasOrg = p.organizations && p.organizations.length > 0;
            if (!hasOrg && pathname !== '/onboard') {
              router.replace('/(app)/onboard' as any);
            }
          } else {
            clearUserProfile();
          }
          setIsSyncing(false);
        }
      } catch (err: any) {
        if (err.message === 'Unauthorized') {
          console.warn('API returned 401. Likely an invalid or opaque token. Forcing logout...');
          await clearSession();
          if (!isCancelled) {
            clearUserProfile();
            setIsSyncing(false);
            router.replace('/(auth)/signin' as any);
          }
        } else {
          if (!isCancelled) setIsSyncing(false);
        }
      }
    };

    sync();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  if (isSyncing) {
    return <Spinner />;
  }

  if (!user && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 p-4">
        <Text className="text-gray-600 font-medium">Redirecting to sign in...</Text>
      </View>
    );
  }

  return <SidebarLayout>{children}</SidebarLayout>;
}

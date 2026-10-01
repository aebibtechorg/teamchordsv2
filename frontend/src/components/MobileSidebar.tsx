import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Library, BookAudio, Users, CreditCard, User, Power } from 'lucide-react-native';
import { useAuth0 } from 'react-native-auth0';
import { useProfileStore } from '../store/useProfileStore';
import OrgSelector from './OrgSelector';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MobileSidebar() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { clearSession } = useAuth0();
  const { clearUserProfile } = useProfileStore();
  const pathname = usePathname();

  const isDesktop = width >= 768;
  if (isDesktop) return null;

  const handleSignOut = async () => {
    try {
      clearUserProfile();
      await clearSession();
      router.replace('/(auth)/signin' as any);
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Library', path: '/(app)/library', icon: Library },
    { label: 'Set Lists', path: '/(app)/setlists', icon: BookAudio },
    { label: 'Team', path: '/(app)/team', icon: Users },
    { label: 'Profile', path: '/(app)/profile', icon: User },
    { label: 'Billing', path: '/(app)/billing', icon: CreditCard },
  ];

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      className="bg-gray-700 w-full border-t border-gray-800 px-3 pt-2"
    >
      <View className="mb-2 w-full">
        <OrgSelector />
      </View>

      <View className="flex-row justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.path);
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => router.push(item.path as any)}
              className="items-center justify-center flex-1 py-1"
            >
              <Icon size={20} color={isActive ? '#60A5FA' : '#9CA3AF'} />
              <Text className={`text-[10px] mt-1 font-medium ${isActive ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          onPress={handleSignOut}
          className="items-center justify-center flex-1 py-1"
        >
          <Power size={20} color="#EF4444" />
          <Text className="text-[10px] mt-1 font-medium text-red-400">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

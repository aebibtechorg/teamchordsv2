import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Library, BookAudio, Users, CreditCard, User, Power } from 'lucide-react-native';
import { useAuth0 } from 'react-native-auth0';
import { useProfileStore } from '../store/useProfileStore';
import OrgSelector from './OrgSelector';
import MainLogo from './MainLogo';
import { router, usePathname } from 'expo-router';
import { useIconColor } from '../hooks/use-icon-color';

export default function Sidebar() {
  const { width } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(true);
  const { clearSession, user } = useAuth0();
  const { clearUserProfile, profile } = useProfileStore();
  const pathname = usePathname();
  const ic = useIconColor();

  const isDesktop = width >= 768;
  if (!isDesktop) return null;

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
    { label: 'Billing', path: '/(app)/billing', icon: CreditCard },
  ];

  return (
    <View className={`${isOpen ? 'w-64' : 'w-20'} bg-gray-800 dark:bg-gray-900 h-full p-4 justify-between border-r border-gray-700 dark:border-gray-800`}>
      <View>
        <TouchableOpacity
          onPress={() => setIsOpen(!isOpen)}
          className="flex-row items-center space-x-3 p-2 rounded-lg active:bg-gray-700 dark:active:bg-gray-800"
        >
          <MainLogo size={32} />
          {isOpen && <Text className="font-bold text-white text-lg ml-3">Team Chords</Text>}
        </TouchableOpacity>

        <View className="h-px bg-gray-700 dark:bg-gray-800 my-4" />

        <View className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.path);
            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => router.push(item.path as any)}
                className={`flex-row items-center p-2.5 rounded-lg my-1 ${
                  isActive ? 'bg-gray-700 dark:bg-gray-800' : 'active:bg-gray-700/60 dark:active:bg-gray-800/60'
                }`}
              >
                <Icon size={22} color={isActive ? '#FFFFFF' : '#D1D5DB'} />
                {isOpen && (
                  <Text className={`ml-3 font-medium ${isActive ? 'text-white font-semibold' : 'text-gray-300'}`}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="space-y-2">
        <View className="h-px bg-gray-700 dark:bg-gray-800 my-2" />

        <TouchableOpacity
          onPress={() => router.push('/(app)/profile' as any)}
          className="flex-row items-center p-2 rounded-lg active:bg-gray-700 dark:active:bg-gray-800"
        >
          <User size={22} color="#D1D5DB" />
          {isOpen && (
            <Text className="ml-3 text-sm text-gray-200 truncate flex-1" numberOfLines={1}>
              {profile?.name || user?.name || user?.email || 'Profile'}
            </Text>
          )}
        </TouchableOpacity>

        {isOpen && (
          <View className="my-2">
            <OrgSelector />
          </View>
        )}

        <TouchableOpacity
          onPress={handleSignOut}
          className="flex-row items-center p-2 rounded-lg active:bg-gray-700 dark:active:bg-gray-800"
        >
          <Power size={22} color={ic.danger} />
          {isOpen && <Text className="ml-3 text-sm font-medium text-red-400">Sign out</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}


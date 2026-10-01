import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/useProfileStore';
import { createOrganization, getProfile } from '../../utils/common';
import MainLogo from '../../components/MainLogo';

export default function Onboarding() {
  const { profile, setUserProfile } = useProfileStore();
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const profileId = profile?.id;
  const organizations = profile?.organizations || [];
  const ownsOrganization = organizations.some((o) => o.ownerUserId === profileId);

  const handleCreate = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    try {
      const dataOrg = await createOrganization({ name: orgName.trim() });
      if (!dataOrg) {
        Alert.alert('Error', 'Failed to create organization.');
        setLoading(false);
        return;
      }

      const updated = await getProfile();
      if (updated) {
        setUserProfile(updated);
      }
      router.replace('/(app)/library' as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error creating organization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-6 items-center justify-center">
      <View className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <View className="items-center mb-6">
          <MainLogo size={64} />
          <Text className="text-2xl font-bold text-gray-900 mt-3">Create Organization</Text>
          <Text className="text-xs text-gray-500 mt-1 text-center">
            Set up an organization for your band, church, or music team.
          </Text>
        </View>

        {ownsOrganization ? (
          <View className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
            <Text className="text-xs text-blue-800 leading-5">
              You already own an organization. You can still join additional organizations through invites.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(app)/library' as any)}
              className="mt-4 bg-blue-600 py-2.5 rounded-lg items-center"
            >
              <Text className="text-white font-bold text-sm">Go to Library</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            <View>
              <Text className="text-xs font-semibold text-gray-700 mb-1.5">Organization Name</Text>
              <TextInput
                value={orgName}
                onChangeText={setOrgName}
                placeholder="e.g. Sunday Worship Team"
                className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50"
              />
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading || !orgName.trim()}
              className={`w-full bg-blue-600 py-3.5 rounded-xl items-center active:bg-blue-700 mt-2 ${
                loading || !orgName.trim() ? 'opacity-50' : ''
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Create Organization</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { Save, User } from 'lucide-react-native';
import { useProfileStore } from '../../store/useProfileStore';
import { updateMe, upsertProfile, getProfile } from '../../utils/common';
import { keys, INSTRUMENTS, MUSICAL_ROLES } from '../../constants';

export default function Profile() {
  const { profile, setUserProfile } = useProfileStore();
  const [givenName, setGivenName] = useState(profile?.givenName || '');
  const [familyName, setFamilyName] = useState(profile?.familyName || '');
  const [musicalRole, setMusicalRole] = useState(profile?.profile?.musicalRole || '');
  const [instruments, setInstruments] = useState<string[]>(() => {
    const raw = profile?.profile?.instruments;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return Array.isArray(raw) ? raw : [];
  });
  const [preferredKey, setPreferredKey] = useState(profile?.profile?.preferredKey || '');
  const [bio, setBio] = useState(profile?.profile?.bio || '');
  const [website, setWebsite] = useState(profile?.profile?.website || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setGivenName(profile.givenName || '');
      setFamilyName(profile.familyName || '');
      if (profile.profile) {
        setMusicalRole(profile.profile.musicalRole || '');
        setPreferredKey(profile.profile.preferredKey || '');
        setBio(profile.profile.bio || '');
        setWebsite(profile.profile.website || '');
        const raw = profile.profile.instruments;
        if (typeof raw === 'string') {
          try {
            setInstruments(JSON.parse(raw));
          } catch {}
        }
      }
    }
  }, [profile]);

  const toggleInstrument = (inst: string) => {
    if (instruments.includes(inst)) {
      setInstruments(instruments.filter((i) => i !== inst));
    } else {
      setInstruments([...instruments, inst]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (givenName || familyName) {
        await updateMe({ givenName, familyName });
      }

      if (profile?.id && profile?.orgId) {
        await upsertProfile(profile.profile?.id, profile.id, profile.orgId, {
          bio,
          musicalRole,
          instruments: JSON.stringify(instruments) as any,
          preferredKey,
          website,
        });
      }

      const fresh = await getProfile();
      if (fresh) setUserProfile(fresh);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile saved successfully.',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to save profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4 md:p-8">
      <View className="max-w-3xl mx-auto w-full mb-12">
        {/* Header Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6 flex-row items-center">
          <Image
            source={
              profile?.picture
                ? { uri: profile.picture }
                : require('../../../assets/images/icon.png')
            }
            className="w-16 h-16 rounded-full bg-gray-100"
          />
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-gray-900">{profile?.name || 'Musician Profile'}</Text>
            <Text className="text-xs text-gray-500">{profile?.email}</Text>
          </View>
        </View>

        {/* Basic Info */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <Text className="text-base font-bold text-gray-900 mb-4">Personal Details</Text>
          <View className="flex-col md:flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-700 mb-1">Given Name</Text>
              <TextInput
                value={givenName}
                onChangeText={setGivenName}
                placeholder="Given Name"
                className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-gray-50"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-700 mb-1">Family Name</Text>
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Family Name"
                className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-gray-50"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-gray-700 mb-1">Website</Text>
            <TextInput
              value={website}
              onChangeText={setWebsite}
              placeholder="https://yourwebsite.com"
              keyboardType="url"
              autoCapitalize="none"
              className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-gray-50"
            />
          </View>

          <View className="mb-2">
            <Text className="text-xs font-semibold text-gray-700 mb-1">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              placeholder="A short musician bio..."
              className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-gray-50 min-h-[80px]"
            />
          </View>
        </View>

        {/* Musician Info */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <Text className="text-base font-bold text-gray-900 mb-4">Musical Profile</Text>

          {/* Primary Role */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-gray-700 mb-2">Primary Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
              {MUSICAL_ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setMusicalRole(role)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    musicalRole === role
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 bg-white active:bg-gray-50'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${musicalRole === role ? 'text-white' : 'text-gray-700'}`}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Preferred Key */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-gray-700 mb-2">Preferred Key</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
              {keys.map((k) => (
                <TouchableOpacity
                  key={k}
                  onPress={() => setPreferredKey(k)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    preferredKey === k
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 bg-white active:bg-gray-50'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${preferredKey === k ? 'text-white' : 'text-gray-700'}`}>
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Instruments */}
          <View>
            <Text className="text-xs font-semibold text-gray-700 mb-2">Instruments Played</Text>
            <View className="flex-row flex-wrap gap-2">
              {INSTRUMENTS.map((inst) => {
                const isSelected = instruments.includes(inst);
                return (
                  <TouchableOpacity
                    key={inst}
                    onPress={() => toggleInstrument(inst)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      isSelected ? 'bg-blue-100 border-blue-400' : 'border-gray-200 bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <Text className={`text-xs font-medium ${isSelected ? 'text-blue-900 font-bold' : 'text-gray-700'}`}>
                      {inst}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="w-full bg-blue-600 py-3.5 rounded-xl items-center shadow-sm active:bg-blue-700"
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center">
              <Save size={18} color="#fff" />
              <Text className="text-white font-bold text-base ml-2">Save Profile</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

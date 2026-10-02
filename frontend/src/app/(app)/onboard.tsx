import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { useProfileStore } from '../../store/useProfileStore';
import { createOrganization, getProfile, updateMe } from '../../utils/common';
import MainLogo from '../../components/MainLogo';
import { useIconColor } from '../../hooks/use-icon-color';

export default function Onboarding() {
  const { profile, setUserProfile } = useProfileStore();
  const [orgName, setOrgName] = useState('');
  const isNameMissing = !profile?.givenName?.trim() || !profile?.familyName?.trim();
  const [givenName, setGivenName] = useState(profile?.givenName || '');
  const [familyName, setFamilyName] = useState(profile?.familyName || '');
  const [loading, setLoading] = useState(false);
  const ic = useIconColor();

  const profileId = profile?.id;
  const organizations = profile?.organizations || [];
  const ownsOrganization = organizations.some((o) => o.ownerUserId === profileId);

  const handleCreate = async () => {
    if (!orgName.trim()) return;
    if (isNameMissing && (!givenName.trim() || !familyName.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter both your first and last name.',
      });
      return;
    }
    setLoading(true);
    try {
      if (isNameMissing) {
        const updateResult = await updateMe({
          givenName: givenName.trim(),
          familyName: familyName.trim(),
        });
        if (!updateResult) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to update user profile.',
          });
          setLoading(false);
          return;
        }
      }

      const dataOrg = await createOrganization({ name: orgName.trim() });
      if (!dataOrg) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to create organization.',
        });
        setLoading(false);
        return;
      }

      const updated = await getProfile();
      if (updated) {
        setUserProfile(updated);
      }
      router.replace('/(app)/library' as any);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Error creating organization.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = orgName.trim() && (!isNameMissing || (givenName.trim() && familyName.trim()));

  return (
    <View className="flex-1 bg-background p-6 items-center justify-center">
      <View className="w-full max-w-md bg-card rounded-2xl p-8 shadow-sm border border-border">
        <View className="items-center mb-6">
          <MainLogo size={64} />
          <Text className="text-2xl font-bold text-foreground mt-3">Welcome Aboard</Text>
          <Text className="text-xs text-muted-foreground mt-1 text-center">
            {isNameMissing
              ? "Let's set up your profile and your first organization."
              : 'Set up an organization for your band, church, or music team.'}
          </Text>
        </View>

        {ownsOrganization ? (
          <View className="p-4 bg-primary/10 border border-primary/30 rounded-xl mb-4">
            <Text className="text-xs text-primary leading-5">
              You already own an organization. You can still join additional organizations through invites.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(app)/library' as any)}
              className="mt-4 bg-primary py-2.5 rounded-lg items-center"
            >
              <Text className="text-primary-foreground font-bold text-sm">Go to Library</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            {isNameMissing && (
              <View className="flex-row gap-2 mb-1">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-foreground mb-1.5">First Name</Text>
                  <TextInput
                    value={givenName}
                    onChangeText={setGivenName}
                    placeholder="John"
                    placeholderTextColor={ic.placeholder}
                    className="border border-border rounded-xl px-3.5 py-2.5 text-sm bg-muted text-foreground"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-foreground mb-1.5">Last Name</Text>
                  <TextInput
                    value={familyName}
                    onChangeText={setFamilyName}
                    placeholder="Doe"
                    placeholderTextColor={ic.placeholder}
                    className="border border-border rounded-xl px-3.5 py-2.5 text-sm bg-muted text-foreground"
                  />
                </View>
              </View>
            )}

            <View>
              <Text className="text-xs font-semibold text-foreground mb-1.5">Organization Name</Text>
              <TextInput
                value={orgName}
                onChangeText={setOrgName}
                placeholder="e.g. Sunday Worship Team"
                placeholderTextColor={ic.placeholder}
                className="border border-border rounded-xl px-3.5 py-2.5 text-sm bg-muted text-foreground"
              />
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading || !isFormValid}
              className={`w-full bg-primary py-3.5 rounded-xl items-center active:opacity-90 mt-2 ${
                loading || !isFormValid ? 'opacity-50' : ''
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-bold text-base">
                  {isNameMissing ? 'Complete Setup' : 'Create Organization'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

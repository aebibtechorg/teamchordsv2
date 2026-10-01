import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MainLogo from '../../components/MainLogo';
import { apiFetch } from '../../utils/api';
import { UserDto } from '../../types/api';

export default function Signup() {
  const params = useLocalSearchParams<{ e?: string; orgId?: string }>();
  const [email, setEmail] = useState(params.e ? decodeURIComponent(params.e) : '');
  const [orgId] = useState(params.orgId ? decodeURIComponent(params.orgId) : '');
  const [password, setPassword] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleSignUp = async () => {
    if (!agree) {
      setError('You must agree to the Privacy Policy and Terms before signing up.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const payload: Partial<UserDto> = {
        email: email || undefined,
        emailVerified: false,
        givenName: givenName || undefined,
        familyName: familyName || undefined,
        password: password || undefined,
        inviteOrganizationId: orgId || undefined,
      };

      const resp = await apiFetch(`/api/users`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        Alert.alert('Account Created', 'Please sign in with your credentials.');
        router.replace('/(auth)/signin' as any);
      } else {
        let text = await resp.text();
        try {
          const json = JSON.parse(text);
          text = json.message || json.detail || JSON.stringify(json);
        } catch {}
        setError(text || 'Signup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-100 p-6 justify-center">
      <View className="w-full max-w-md mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <View className="items-center mb-6">
          <MainLogo size={72} />
          <Text className="text-2xl font-bold text-gray-900 mt-3">Sign up today!</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signin' as any)} className="mt-1">
            <Text className="text-sm text-gray-500">
              Already have an account? <Text className="text-blue-600 font-semibold">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-3">
          <View>
            <Text className="text-xs font-semibold text-gray-700 mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50"
            />
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-700 mb-1">Given Name</Text>
              <TextInput
                value={givenName}
                onChangeText={setGivenName}
                placeholder="John"
                className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-700 mb-1">Family Name</Text>
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Doe"
                className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-semibold text-gray-700 mb-1">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50"
            />
          </View>

          <TouchableOpacity
            onPress={() => setAgree(!agree)}
            className="flex-row items-center mt-2 py-1"
          >
            <View
              className={`w-4 h-4 rounded border mr-2 items-center justify-center ${
                agree ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
              }`}
            >
              {agree && <Text className="text-white text-[10px] font-bold">✓</Text>}
            </View>
            <Text className="text-xs text-gray-600 flex-1">
              I agree to the Privacy Policy and Terms and Conditions.
            </Text>
          </TouchableOpacity>

          {Boolean(error) && (
            <Text className="text-xs text-red-600 font-semibold text-center my-1">{error}</Text>
          )}

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading || !agree}
            className={`w-full bg-blue-600 py-3.5 rounded-xl items-center active:bg-blue-700 mt-3 ${
              loading || !agree ? 'opacity-50' : ''
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

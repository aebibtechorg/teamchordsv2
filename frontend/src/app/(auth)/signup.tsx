import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { router, useLocalSearchParams } from 'expo-router';
import MainLogo from '../../components/MainLogo';
import { apiFetch } from '../../utils/api';
import { UserDto } from '../../types/api';
import { useIconColor } from '../../hooks/use-icon-color';

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
  const ic = useIconColor();

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
        Toast.show({
          type: 'success',
          text1: 'Account Created',
          text2: 'Please sign in with your credentials.',
        });
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
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-background p-6 justify-center">
      <View className="w-full max-w-md mx-auto bg-card rounded-2xl p-8 shadow-sm border border-border">
        <View className="items-center mb-6">
          <MainLogo size={72} />
          <Text className="text-2xl font-bold text-foreground mt-3">Sign up today!</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signin' as any)} className="mt-1">
            <Text className="text-sm text-muted-foreground">
              Already have an account? <Text className="text-primary font-semibold">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-3">
          <View>
            <Text className="text-xs font-semibold text-foreground mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={ic.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-border rounded-xl px-3.5 py-2.5 text-sm bg-muted text-foreground"
            />
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-1">Given Name</Text>
              <TextInput
                value={givenName}
                onChangeText={setGivenName}
                placeholder="John"
                placeholderTextColor={ic.placeholder}
                className="border border-border rounded-xl px-3.5 py-2.5 text-sm bg-muted text-foreground"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-1">Family Name</Text>
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Doe"
                placeholderTextColor={ic.placeholder}
                className="border border-border rounded-xl px-3.5 py-2.5 text-sm bg-muted text-foreground"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-semibold text-foreground mb-1">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={ic.placeholder}
              secureTextEntry
              className="border border-border rounded-xl px-3.5 py-2.5 text-sm bg-muted text-foreground"
            />
          </View>

          <TouchableOpacity
            onPress={() => setAgree(!agree)}
            className="flex-row items-center mt-2 py-1"
          >
            <View
              className={`w-4 h-4 rounded border mr-2 items-center justify-center ${
                agree ? 'bg-primary border-primary' : 'border-border'
              }`}
            >
              {agree && <Text className="text-primary-foreground text-[10px] font-bold">✓</Text>}
            </View>
            <Text className="text-xs text-muted-foreground flex-1">
              I agree to the Privacy Policy and Terms and Conditions.
            </Text>
          </TouchableOpacity>

          {Boolean(error) && (
            <Text className="text-xs text-red-500 font-semibold text-center my-1">{error}</Text>
          )}

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading || !agree}
            className={`w-full bg-primary py-3.5 rounded-xl items-center active:opacity-90 mt-3 ${
              loading || !agree ? 'opacity-50' : ''
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-bold text-base">Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

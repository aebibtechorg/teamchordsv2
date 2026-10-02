import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useIconColor } from '../hooks/use-icon-color';

export default function PrivacyPolicy() {
  const ic = useIconColor();

  return (
    <ScrollView className="flex-1 bg-background p-4 md:p-8">
      <View className="max-w-4xl mx-auto w-full bg-card rounded-2xl p-6 md:p-10 shadow-sm border border-border mb-12">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center self-start mb-6 p-2 rounded-lg active:bg-muted"
        >
          <ArrowLeft size={18} color={ic.primary} />
          <Text className="text-sm font-semibold text-muted-foreground ml-1.5">Back</Text>
        </TouchableOpacity>

        <Text className="text-2xl md:text-3xl font-bold text-foreground mb-2">Privacy Policy</Text>
        <Text className="text-xs text-muted-foreground mb-6">Effective Date: October 2026</Text>

        <Text className="text-sm text-foreground leading-6 mb-4">
          Welcome to Team Chords ("we", "our", or "us"). We are committed to protecting your privacy. This Privacy Policy explains how your information is collected, used, and disclosed by Team Chords.
        </Text>

        <Text className="text-base font-bold text-foreground mt-4 mb-2">1. Information We Collect</Text>
        <Text className="text-sm text-muted-foreground leading-6 mb-4">
          We collect information you provide directly to us when creating an account, saving chord charts, creating set lists, and communicating with team members. This includes email addresses, names, and user-generated musical charts.
        </Text>

        <Text className="text-base font-bold text-foreground mt-4 mb-2">2. How We Use Information</Text>
        <Text className="text-sm text-muted-foreground leading-6 mb-4">
          We use the information we collect to operate, maintain, enhance, and provide all features of our services, including real-time set list synchronization and offline capabilities.
        </Text>

        <Text className="text-base font-bold text-foreground mt-4 mb-2">3. Contact Us</Text>
        <Text className="text-sm text-muted-foreground leading-6 mb-4">
          If you have questions about this policy, please contact us at support@teamchords.com.
        </Text>
      </View>
    </ScrollView>
  );
}

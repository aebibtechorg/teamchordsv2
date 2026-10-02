import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useIconColor } from '../hooks/use-icon-color';

export default function TermsAndConditions() {
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

        <Text className="text-2xl md:text-3xl font-bold text-foreground mb-2">Terms and Conditions</Text>
        <Text className="text-xs text-muted-foreground mb-6">Effective Date: October 2026</Text>

        <Text className="text-sm text-foreground leading-6 mb-4">
          Please read these Terms and Conditions carefully before using the Team Chords application and services operated by us.
        </Text>

        <Text className="text-base font-bold text-foreground mt-4 mb-2">1. Subscriptions & Billing</Text>
        <Text className="text-sm text-muted-foreground leading-6 mb-4">
          All paid plans are billed monthly. You can cancel anytime, and your access will remain active until the end of the current billing period. Subscriptions are non-refundable except where required by law.
        </Text>

        <Text className="text-base font-bold text-foreground mt-4 mb-2">2. Acceptable Use</Text>
        <Text className="text-sm text-muted-foreground leading-6 mb-4">
          You agree not to misuse the Service or assist anyone else in doing so. You retain ownership of all chord sheet content and set lists you upload.
        </Text>

        <Text className="text-base font-bold text-foreground mt-4 mb-2">3. Contact</Text>
        <Text className="text-sm text-muted-foreground leading-6 mb-4">
          Questions regarding these terms should be sent to support@teamchords.com.
        </Text>
      </View>
    </ScrollView>
  );
}

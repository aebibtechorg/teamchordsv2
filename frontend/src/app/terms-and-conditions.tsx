import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsAndConditions() {
  return (
    <ScrollView className="flex-1 bg-gray-100 p-4 md:p-8">
      <View className="max-w-4xl mx-auto w-full bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200 mb-12">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center self-start mb-6 p-2 rounded-lg active:bg-gray-100"
        >
          <ArrowLeft size={18} color="#374151" />
          <Text className="text-sm font-semibold text-gray-700 ml-1.5">Back</Text>
        </TouchableOpacity>

        <Text className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</Text>
        <Text className="text-xs text-gray-500 mb-6">Effective Date: October 2026</Text>

        <Text className="text-sm text-gray-700 leading-6 mb-4">
          Please read these Terms and Conditions carefully before using the Team Chords application and services operated by us.
        </Text>

        <Text className="text-base font-bold text-gray-900 mt-4 mb-2">1. Subscriptions & Billing</Text>
        <Text className="text-sm text-gray-700 leading-6 mb-4">
          All paid plans are billed monthly. You can cancel anytime, and your access will remain active until the end of the current billing period. Subscriptions are non-refundable except where required by law.
        </Text>

        <Text className="text-base font-bold text-gray-900 mt-4 mb-2">2. Acceptable Use</Text>
        <Text className="text-sm text-gray-700 leading-6 mb-4">
          You agree not to misuse the Service or assist anyone else in doing so. You retain ownership of all chord sheet content and set lists you upload.
        </Text>

        <Text className="text-base font-bold text-gray-900 mt-4 mb-2">3. Contact</Text>
        <Text className="text-sm text-gray-700 leading-6 mb-4">
          Questions regarding these terms should be sent to support@teamchords.com.
        </Text>
      </View>
    </ScrollView>
  );
}

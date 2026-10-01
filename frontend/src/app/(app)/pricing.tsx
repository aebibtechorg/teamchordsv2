import React from 'react';
import { View } from 'react-native';
import PricingCards from '../../components/PricingCards';

export default function Pricing() {
  return (
    <View className="flex-1 bg-gray-100">
      <PricingCards isAuthenticated={true} />
    </View>
  );
}

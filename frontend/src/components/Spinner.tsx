import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import MainLogo from './MainLogo';

export default function Spinner() {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-transparent">
      <View className="items-center justify-center p-6 bg-white/90 rounded-full shadow-lg border border-gray-200">
        <MainLogo size={64} />
      </View>
    </View>
  );
}

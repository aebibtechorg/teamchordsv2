import React from 'react';
import { View } from 'react-native';
import MainLogo from './MainLogo';

export default function Spinner() {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-background">
      <View className="items-center justify-center p-6 bg-card/90 rounded-full shadow-lg border border-border">
        <MainLogo size={64} />
      </View>
    </View>
  );
}

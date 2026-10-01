import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface MainLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  className?: string;
}

export default function MainLogo({ size = 28, style, className }: MainLogoProps) {
  return (
    <Image
      source={require('../../assets/images/teamchords-logo.png')}
      style={[{ width: size, height: size }, style]}
      className={className}
      accessibilityLabel="Team Chords Logo"
    />
  );
}

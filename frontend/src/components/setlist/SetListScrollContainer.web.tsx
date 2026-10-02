import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

export function SetListScrollContainer({ children, ...props }: ScrollViewProps) {
  return <ScrollView {...props}>{children}</ScrollView>;
}

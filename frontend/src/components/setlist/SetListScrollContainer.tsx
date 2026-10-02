import React from 'react';
import { ScrollViewProps } from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';

export function SetListScrollContainer({ children, ...props }: ScrollViewProps) {
  return <NestableScrollContainer {...props}>{children}</NestableScrollContainer>;
}

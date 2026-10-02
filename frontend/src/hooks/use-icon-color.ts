import { useColorScheme } from 'react-native';

const lightColors = {
  primary: '#111827',    // foreground
  secondary: '#6B7280',  // muted-foreground
  active: '#2563EB',     // primary
  inactive: '#9CA3AF',   // gray-400
  danger: '#EF4444',     // red-500
  white: '#FFFFFF',
  placeholder: '#9CA3AF',
  text: '#111827',
  mutedText: '#6B7280',
  border: '#E5E7EB',
  borderDark: '#D1D5DB',
  background: '#F9FAFB',
  card: '#FFFFFF',
};

const darkColors = {
  primary: '#F9FAFB',    // foreground
  secondary: '#9CA3AF',  // muted-foreground
  active: '#3B82F6',     // primary
  inactive: '#6B7280',   // gray-500
  danger: '#F87171',     // red-400
  white: '#FFFFFF',
  placeholder: '#6B7280',
  text: '#F9FAFB',
  mutedText: '#9CA3AF',
  border: '#1F2937',
  borderDark: '#374151',
  background: '#030712',
  card: '#111827',
};

export function useIconColor() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

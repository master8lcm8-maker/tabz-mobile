import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  // FORCE SOLID BACKGROUNDS FOR VISIBILITY
  const backgroundColor = useThemeColor(
    {
      light: lightColor ?? '#FFFFFF',
      dark: darkColor ?? '#121212',   // Clean dark mode background
    },
    'background'
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

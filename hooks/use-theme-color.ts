import { Colors } from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

type ThemeProps = {
  light?: string;
  dark?: string;
};

/**
 * Hook that picks a color based on the current theme.
 * If you pass light/dark overrides, it uses those,
 * otherwise it falls back to Colors[theme][colorName].
 */
export function useThemeColor(
  props: ThemeProps,
  colorName: keyof (typeof Colors)['light'] & keyof (typeof Colors)['dark'],
) {
  const theme = useColorScheme(); // 'light' | 'dark'
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}

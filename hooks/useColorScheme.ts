import { useColorScheme as _useColorScheme } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export function useColorScheme(): ColorScheme {
  const scheme = _useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

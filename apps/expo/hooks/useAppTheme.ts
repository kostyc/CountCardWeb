import { useColorScheme } from '@/components/useColorScheme';
import { AppTheme, getTheme } from '@/constants/theme';

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return getTheme(scheme ?? 'light');
}

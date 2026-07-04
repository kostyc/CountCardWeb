import { DefaultTheme, Theme } from '@react-navigation/native';
import { palette, lightTheme, darkTheme } from './theme';

export function getNavigationTheme(scheme: 'light' | 'dark' | null | undefined): Theme {
  const app = scheme === 'dark' ? darkTheme : lightTheme;

  return {
    ...DefaultTheme,
    dark: scheme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: app.colors.primary,
      background: app.colors.background,
      card: app.colors.header,
      text: app.colors.headerText,
      border: app.colors.border,
      notification: palette.marineRed,
    },
  };
}

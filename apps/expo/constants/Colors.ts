import { palette, lightTheme, darkTheme } from './theme';

const tintColorLight = palette.marineRed;
const tintColorDark = palette.marineRedLight;

export default {
  light: {
    text: lightTheme.colors.text,
    background: lightTheme.colors.background,
    tint: tintColorLight,
    tabIconDefault: lightTheme.colors.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: darkTheme.colors.text,
    background: darkTheme.colors.background,
    tint: tintColorDark,
    tabIconDefault: darkTheme.colors.textMuted,
    tabIconSelected: tintColorDark,
  },
};

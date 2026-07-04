import { ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle, PressableProps } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius } from '@/constants/theme';

interface CardProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, style, elevated = true, ...pressableProps }: CardProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderSubtle,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        elevated && cardShadow(theme.scheme),
        style,
      ]}
      {...pressableProps}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});

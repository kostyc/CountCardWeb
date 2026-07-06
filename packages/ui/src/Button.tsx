import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from './tokens';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const { palette } = colors;

export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
  const bg =
    variant === 'danger'
      ? palette.error
      : variant === 'secondary'
        ? palette.navy
        : palette.marineRed;

  return (
    <Pressable
      style={[styles.base, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minHeight: 48,
  },
  text: {
    color: palette.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

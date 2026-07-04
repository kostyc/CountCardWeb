import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const palette = {
  primary: '#1a365d',
  surface: '#64748b',
  error: '#dc2626',
};

export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
  const bg =
    variant === 'danger' ? palette.error : variant === 'secondary' ? palette.surface : palette.primary;

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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

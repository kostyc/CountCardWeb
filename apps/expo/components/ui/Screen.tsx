import { ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollProps?: ScrollViewProps;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentContainerStyle,
  scrollProps,
  edges = ['bottom'],
}: ScreenProps) {
  const theme = useAppTheme();
  const padding = padded ? { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 } : undefined;

  StatusBar.setBarStyle(theme.scheme === 'dark' ? 'light-content' : 'dark-content');

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[padding, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padding, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.fill, { backgroundColor: theme.colors.background }, style]}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

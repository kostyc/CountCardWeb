import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

type HeaderBackButtonProps = {
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function HeaderBackButton({
  onPress,
  accessibilityLabel = 'Back',
}: HeaderBackButtonProps) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      hitSlop={8}
      style={styles.headerBack}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.headerBackLabel, { color: theme.colors.headerText }]}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBack: {
    marginLeft: Platform.OS === 'ios' ? -8 : 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBackLabel: {
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '300',
  },
});

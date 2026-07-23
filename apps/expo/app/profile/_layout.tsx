import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ProfileLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.header },
        headerTintColor: theme.colors.headerText,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        headerBackVisible: true,
        headerLeft: () => <HeaderBackButton />,
        ...(Platform.OS === 'ios'
          ? {
              headerBackTitleVisible: false,
              headerBackTitle: '',
              headerBackButtonDisplayMode: 'minimal',
            }
          : {}),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Profile & Security' }} />
      <Stack.Screen name="create" options={{ title: 'Profile' }} />
      <Stack.Screen name="account-linking" options={{ title: 'Linked sign-in methods' }} />
      <Stack.Screen name="encryption" options={{ title: 'Encryption & backup' }} />
    </Stack>
  );
}

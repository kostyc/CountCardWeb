import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function CompanyLayout() {
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
      <Stack.Screen name="training-day" options={{ title: 'Training Day' }} />
      <Stack.Screen name="incoming-recruits" options={{ title: 'Incoming Recruits' }} />
    </Stack>
  );
}

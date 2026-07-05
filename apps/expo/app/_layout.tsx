import '../lib/firebase';
import { initAppCheck } from '@/lib/appCheck';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider } from '@react-navigation/native';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { getNavigationTheme } from '@/constants/navigationTheme';
import { useAppTheme } from '@/hooks/useAppTheme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, loading, segments, router]);

  return <>{children}</>;
}

function RootNavigator() {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.header },
        headerTintColor: theme.colors.headerText,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="recruits/[id]" options={{ title: 'Recruit Profile', headerShown: true }} />
      <Stack.Screen name="count-cards/[id]" options={{ title: 'Count Card', headerShown: true }} />
      <Stack.Screen name="conversations/[id]" options={{ title: 'Conversation', headerShown: true }} />
      <Stack.Screen name="admin" options={{ title: 'Administration', headerShown: true }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="terms-of-service" options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="share" options={{ title: 'Share App' }} />
      <Stack.Screen name="recruits/create" options={{ title: 'Add Recruit' }} />
      <Stack.Screen name="recruits/import" options={{ title: 'Import Roster' }} />
      <Stack.Screen name="recruits/[id]/edit" options={{ title: 'Modify Recruit' }} />
      <Stack.Screen name="recruits/[id]/transfer" options={{ title: 'Transfer Recruit' }} />
      <Stack.Screen name="count-cards/new" options={{ title: 'New Count Card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const colorScheme = useColorScheme();

  useEffect(() => {
    initAppCheck();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={getNavigationTheme(colorScheme)}>
        <AuthGate>
          <RootNavigator />
        </AuthGate>
      </ThemeProvider>
    </AuthProvider>
  );
}

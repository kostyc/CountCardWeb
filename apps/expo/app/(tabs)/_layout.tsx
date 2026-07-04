import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { tabBarShadow, typography } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useAppTheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          ...typography.headline,
          color: theme.colors.text,
        },
        headerShadowVisible: false,
        headerLargeTitle: Platform.OS === 'ios',
        headerLargeTitleStyle: {
          color: theme.colors.text,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: Platform.OS === 'ios' ? 0 : 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          height: Platform.OS === 'ios' ? 88 : 68,
          ...tabBarShadow(theme.scheme),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          headerLargeTitle: true,
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{ ios: focused ? 'house.fill' : 'house', android: 'home', web: 'home' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recruits"
        options={{
          title: 'Recruits',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{ ios: focused ? 'person.3.fill' : 'person.3', android: 'group', web: 'group' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="count-cards"
        options={{
          title: 'Counts',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{ ios: focused ? 'checklist.checked' : 'checklist', android: 'list', web: 'list' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{ ios: focused ? 'bubble.left.and.bubble.right.fill' : 'bubble.left.and.bubble.right', android: 'chat', web: 'chat' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{ ios: focused ? 'gearshape.fill' : 'gearshape', android: 'settings', web: 'settings' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}

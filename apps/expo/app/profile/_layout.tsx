import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Profile & Security' }} />
      <Stack.Screen name="create" options={{ title: 'Profile' }} />
      <Stack.Screen name="encryption" options={{ title: 'Encryption & backup' }} />
    </Stack>
  );
}

import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useConversations } from '@countcard/firebase';
import { createOrgChannelConversation } from '@countcard/firebase/services/conversations';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, EmptyState, SectionHeader, Button, Select } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

type ChannelType = 'platoon_channel' | 'company_channel' | 'battalion_broadcast';

const CHANNEL_OPTIONS = [
  { value: 'platoon_channel' as const, label: 'Platoon channel' },
  { value: 'company_channel' as const, label: 'Company channel' },
  { value: 'battalion_broadcast' as const, label: 'Battalion broadcast' },
];

export default function MessagesScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const router = useRouter();
  const theme = useAppTheme();
  const { conversations, loading, error } = useConversations(user?.uid);
  const [channelType, setChannelType] = useState<ChannelType>('company_channel');
  const [creating, setCreating] = useState(false);

  const org =
    appUser?.customClaims?.organizationalAssignment ??
    appUser?.profile?.organizationalAssignment;

  async function handleCreateChannel() {
    if (!user || !org?.regiment) {
      Alert.alert('Organization required', 'Complete your profile with an organizational assignment first.');
      return;
    }
    setCreating(true);
    try {
      const conversationId = await createOrgChannelConversation({
        conversationType: channelType,
        organizationalScope: {
          regiment: org.regiment,
          battalion: org.battalion,
          company: org.company,
          platoon: org.platoon,
          series: org.series,
        },
        createdBy: user.uid,
        title: `${channelType} channel`,
      });
      router.push(`/conversations/${conversationId}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create channel');
    } finally {
      setCreating(false);
    }
  }

  const createChannelCard = (
    <View style={[styles.createCard, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
      <Text style={[styles.createTitle, { color: theme.colors.text }]}>Create org channel</Text>
      <Select
        label="Channel type"
        value={channelType}
        onChange={setChannelType}
        options={CHANNEL_OPTIONS}
      />
      <Button title="Create channel" onPress={() => void handleCreateChannel()} loading={creating} />
    </View>
  );

  if (loading) {
    return (
      <Screen padded={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen scroll>
        <EmptyState title="Could not load messages" message={error.message} />
      </Screen>
    );
  }

  if (!conversations.length) {
    return (
      <Screen scroll>
        <SectionHeader title="Messages" subtitle="Team conversations and org channels" />
        {createChannelCard}
        <EmptyState
          title="No conversations yet"
          message="Create an org channel above or join a thread to get started."
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.conversationId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <SectionHeader title="Messages" subtitle="Team conversations and org channels" />
            {createChannelCard}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/conversations/${item.conversationId}`)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: theme.colors.surface, opacity: pressed ? 0.85 : 1 },
              cardShadow(theme.scheme),
            ]}
          >
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {item.metadata?.title?.toString() ?? `Conversation ${item.conversationId.slice(0, 8)}`}
            </Text>
            <Text style={[styles.preview, { color: theme.colors.textMuted }]} numberOfLines={2}>
              {item.lastMessageContent ?? 'No messages yet'}
            </Text>
            {item.lastMessageAt ? (
              <Text style={[styles.time, { color: theme.colors.textMuted }]}>
                {item.lastMessageAt instanceof Date
                  ? item.lastMessageAt.toLocaleDateString()
                  : ''}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: spacing.sm },
  createCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 12,
    marginBottom: spacing.base,
  },
  createTitle: { ...typography.subtitle, fontWeight: '600' },
  list: { padding: spacing.base, paddingTop: 0, gap: 12 },
  row: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
    marginBottom: 12,
  },
  title: { ...typography.headline },
  preview: { ...typography.body, lineHeight: 20 },
  time: { ...typography.caption },
});

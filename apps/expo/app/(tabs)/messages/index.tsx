import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useConversations } from '@countcard/firebase';
import { useAuth } from '@/context/AuthContext';
import { Screen, EmptyState } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const { conversations, loading, error } = useConversations(user?.uid);

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
        <EmptyState
          title="No conversations yet"
          message="When you join a thread, it will appear here."
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
  list: { padding: spacing.base, gap: 12 },
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

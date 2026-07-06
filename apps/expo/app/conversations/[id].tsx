import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMessages } from '@countcard/firebase';
import { sendMessage } from '@countcard/firebase/services/conversations';
import { useAuth } from '@/context/AuthContext';
import { Screen } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius, palette } from '@/constants/theme';

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const theme = useAppTheme();
  const { messages, loading } = useMessages(id);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!user || !id || !draft.trim()) return;
    setSending(true);
    try {
      const messageId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      await sendMessage(
        id,
        messageId,
        {
          messageId,
          conversationId: id,
          senderId: user.uid,
          content: draft.trim(),
        },
        user.uid
      );
      setDraft('');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <Screen padded={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.messageId}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.uid;
            return (
              <View
                style={[
                  styles.bubble,
                  mine ? styles.mine : styles.theirs,
                  {
                    backgroundColor: mine ? theme.colors.primary : theme.colors.surface,
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                <Text style={{ color: mine ? theme.colors.onPrimary : theme.colors.text }}>{item.content}</Text>
              </View>
            );
          }}
        />
        <View style={[styles.composer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border },
            ]}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !draft.trim()}
            style={[styles.send, { backgroundColor: theme.colors.primary, opacity: sending ? 0.6 : 1 }]}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messages: { padding: spacing.base, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    marginBottom: 8,
  },
  mine: {},
  theirs: {},
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  send: {
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendLabel: { color: palette.onPrimary, fontWeight: '600' },
});

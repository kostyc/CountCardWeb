import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import {
  createDILeadershipCard,
  appendDIRecommendation,
  signDILeadershipCard,
} from '@countcard/firebase/services/diLeadershipCards';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, SectionHeader, Button, Input, Select } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

type AuthorRole = 'sdi' | 'chief_di' | 'first_sgt';

const AUTHOR_ROLE_OPTIONS = [
  { value: 'sdi', label: 'Senior DI' },
  { value: 'chief_di', label: 'Chief DI' },
  { value: 'first_sgt', label: 'Company 1stSgt' },
];

export default function DILeadershipCardsScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();

  const [subjectUserId, setSubjectUserId] = useState('');
  const [authorRole, setAuthorRole] = useState<AuthorRole | ''>('sdi');
  const [summary, setSummary] = useState('');
  const [cardId, setCardId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);

  const org =
    appUser?.customClaims?.organizationalAssignment ??
    appUser?.profile?.organizationalAssignment;

  async function handleCreate() {
    if (!user) return;
    setLoading(true);
    try {
      const newCardId = `dic-${Date.now()}`;
      await createDILeadershipCard(
        newCardId,
        {
          cardId: newCardId,
          subjectUserId,
          authorRole: authorRole || 'sdi',
          cardType: 'digital_form',
          summary,
          workflowState: 'draft',
          organizationalAssignment: {
            regiment: org?.regiment,
            battalion: org?.battalion,
            company: org?.company,
            series: org?.series,
            platoon: org?.platoon,
          },
          createdBy: user.uid,
        },
        user.uid
      );
      setCardId(newCardId);
      Alert.alert('Created', `Card ${newCardId}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create card');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppendRecommendation() {
    if (!cardId || !user) return;
    setLoading(true);
    try {
      await appendDIRecommendation(cardId, user.uid, recommendation, user.uid);
      setRecommendation('');
      Alert.alert('Added', 'Recommendation appended');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to append recommendation');
    } finally {
      setLoading(false);
    }
  }

  async function handleSign(which: 'di' | 'senior') {
    if (!cardId || !user) return;
    setLoading(true);
    try {
      await signDILeadershipCard(
        cardId,
        which,
        {
          userId: user.uid,
          signedAt: Timestamp.now(),
          attestationHash: `attest-${Date.now()}`,
        },
        user.uid
      );
      Alert.alert('Signed', `${which === 'di' ? 'DI' : 'Senior'} signature recorded`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to sign card');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <SectionHeader
        title="DI Leadership Cards"
        subtitle="3x5 digital forms — create, recommend, sign"
      />

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input
          label="Subject DI user ID"
          value={subjectUserId}
          onChangeText={setSubjectUserId}
          autoCapitalize="none"
        />
        <Select
          label="Author role"
          value={authorRole}
          onChange={(v) => setAuthorRole(v as AuthorRole)}
          options={AUTHOR_ROLE_OPTIONS}
        />
        <Input label="Summary" value={summary} onChangeText={setSummary} multiline />
        <Button title="Create card" onPress={() => void handleCreate()} loading={loading} />

        {cardId ? (
          <View style={styles.cardSection}>
            <Text style={[styles.cardId, { color: theme.colors.textMuted }]}>Card ID: {cardId}</Text>
            <Input
              label="Append recommendation"
              value={recommendation}
              onChangeText={setRecommendation}
              multiline
            />
            <Button
              title="Append recommendation"
              variant="secondary"
              onPress={() => void handleAppendRecommendation()}
              loading={loading}
            />
            <View style={styles.signRow}>
              <Button
                title="DI sign"
                variant="secondary"
                onPress={() => void handleSign('di')}
                loading={loading}
              />
              <Button
                title="Senior sign"
                variant="secondary"
                onPress={() => void handleSign('senior')}
                loading={loading}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 12,
  },
  cardSection: { gap: 12, marginTop: spacing.sm },
  cardId: { ...typography.caption },
  signRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
